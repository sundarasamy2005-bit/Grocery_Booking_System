import { Response, NextFunction } from 'express';
import { Review } from '../models/Review';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { AuthenticatedRequest } from '../types';
import { uploadService } from '../services/upload.service';

export const reviewController = {
  // GET /api/reviews/product/:productId
  async getProductReviews(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const {
        page = '1',
        limit = '10',
        sort = 'recent',
        rating,
        withPhotos,
      } = req.query as Record<string, string>;

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      // Base query filter
      const filter: Record<string, any> = { productId };

      if (rating && !isNaN(Number(rating))) {
        filter.rating = Number(rating);
      }

      if (withPhotos === 'true') {
        filter['photos.0'] = { $exists: true };
      }

      // Sorting strategy
      let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
      if (sort === 'helpful') {
        sortQuery = { helpfulVotes: -1, createdAt: -1 };
      } else if (sort === 'highest') {
        sortQuery = { rating: -1, createdAt: -1 };
      } else if (sort === 'lowest') {
        sortQuery = { rating: 1, createdAt: -1 };
      }

      // Fetch reviews, total count, rating breakdown, and real order purchase stats in parallel
      const [reviews, totalCount, ratingGroups, orderStats, photoReviews] = await Promise.all([
        Review.find(filter)
          .populate('userId', 'name profileImage')
          .sort(sortQuery)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Review.countDocuments(filter),
        Review.aggregate([
          { $match: { productId } },
          { $group: { _id: '$rating', count: { $sum: 1 } } },
        ]),
        Order.aggregate([
          {
            $match: {
              orderStatus: { $nin: ['cancelled', 'rejected'] },
              'items.productId': productId,
            },
          },
          { $unwind: '$items' },
          { $match: { 'items.productId': productId } },
          {
            $group: {
              _id: null,
              totalUnitsSold: { $sum: '$items.quantity' },
              distinctBuyers: { $addToSet: '$userId' },
            },
          },
        ]),
        Review.find({ productId, 'photos.0': { $exists: true } })
          .select('photos rating title')
          .limit(12)
          .lean(),
      ]);

      // Calculate rating distribution
      let totalAllReviews = 0;
      let sumRating = 0;
      const breakdown: Record<number, { count: number; percentage: number }> = {
        5: { count: 0, percentage: 0 },
        4: { count: 0, percentage: 0 },
        3: { count: 0, percentage: 0 },
        2: { count: 0, percentage: 0 },
        1: { count: 0, percentage: 0 },
      };

      for (const group of ratingGroups) {
        const star = Number(group._id);
        const count = group.count;
        if (breakdown[star]) {
          breakdown[star].count = count;
        }
        totalAllReviews += count;
        sumRating += star * count;
      }

      if (totalAllReviews > 0) {
        for (let star = 1; star <= 5; star++) {
          breakdown[star].percentage = Math.round((breakdown[star].count / totalAllReviews) * 100);
        }
      }

      const averageRating = totalAllReviews > 0 ? Number((sumRating / totalAllReviews).toFixed(1)) : 0;

      // Extract all uploaded photos for customer gallery
      const customerPhotos = photoReviews.flatMap((r) =>
        (r.photos || []).map((p) => ({
          url: p.url,
          rating: r.rating,
          title: r.title,
        }))
      );

      // Distinct buyers and units sold from real Order data
      const totalUnitsSold = orderStats[0]?.totalUnitsSold || 0;
      const distinctBuyersCount = orderStats[0]?.distinctBuyers?.length || 0;

      // Check current user's review status if authenticated
      let userReview = null;
      let userHasPurchased = false;
      let userDeliveredOrder = false;

      if (req.user) {
        const userId = req.user._id.toString();
        const [existing, userOrder] = await Promise.all([
          Review.findOne({ productId, userId }).lean(),
          Order.findOne({
            userId,
            'items.productId': productId,
            orderStatus: { $nin: ['cancelled', 'rejected'] },
          }).lean(),
        ]);

        userReview = existing;
        if (userOrder) {
          userHasPurchased = true;
          userDeliveredOrder = userOrder.orderStatus === 'delivered';
        }
      }

      res.json({
        success: true,
        data: reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
        },
        stats: {
          averageRating,
          totalReviews: totalAllReviews,
          breakdown,
          photosCount: customerPhotos.length,
          customerPhotos,
          purchaseStats: {
            distinctBuyers: distinctBuyersCount,
            totalUnitsSold,
          },
        },
        userState: {
          hasReviewed: !!userReview,
          userReview,
          hasPurchased: userHasPurchased,
          isDelivered: userDeliveredOrder,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/reviews/product/:productId — Customer submits review
  async createReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { productId } = req.params;
      const { rating, title, comment } = req.body;

      if (!rating || Number(rating) < 1 || Number(rating) > 5) {
        res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars' });
        return;
      }

      if (!comment || !comment.trim()) {
        res.status(400).json({ success: false, message: 'Please write a brief review comment' });
        return;
      }

      // Verify product exists
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }

      // Check if user purchased this product from orders
      const userOrder = await Order.findOne({
        userId: user._id.toString(),
        'items.productId': productId,
        orderStatus: { $nin: ['cancelled', 'rejected'] },
      }).sort({ createdAt: -1 });

      const isVerifiedPurchase = !!userOrder && userOrder.orderStatus === 'delivered';
      const orderId = userOrder?._id?.toString();

      // Process uploaded review photos if any
      const photos: Array<{ url: string; publicId?: string }> = [];
      const files = req.files as Express.Multer.File[];

      if (files && Array.isArray(files) && files.length > 0) {
        for (const file of files) {
          try {
            const uploadResult = await uploadService.uploadWithFallback(
              file.buffer,
              'grocery/reviews',
              file.mimetype
            );
            photos.push({
              url: uploadResult.url,
              publicId: uploadResult.publicId,
            });
          } catch (uploadErr) {
            console.error('Failed to upload review photo:', uploadErr);
          }
        }
      }

      // Create or update review (one review per user per product)
      const review = await Review.findOneAndUpdate(
        { productId, userId: user._id.toString() },
        {
          rating: Number(rating),
          title: title ? title.trim() : '',
          comment: comment.trim(),
          orderId,
          isVerifiedPurchase,
          ...(photos.length > 0 ? { $push: { photos: { $each: photos } } } : {}),
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      // Recalculate average rating & total reviews on Product
      const stats = await Review.aggregate([
        { $match: { productId } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);

      if (stats.length > 0) {
        await Product.findByIdAndUpdate(productId, {
          averageRating: Math.round(stats[0].avgRating * 10) / 10,
          totalReviews: stats[0].count,
        });
      }

      const populatedReview = await Review.findById(review._id).populate('userId', 'name profileImage').lean();

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        data: populatedReview,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/reviews/:reviewId/helpful — Vote review as helpful
  async voteHelpful(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { reviewId } = req.params;
      const userId = user._id.toString();

      const review = await Review.findById(reviewId);
      if (!review) {
        res.status(404).json({ success: false, message: 'Review not found' });
        return;
      }

      const alreadyVoted = review.helpfulUsers.includes(userId);

      if (alreadyVoted) {
        // Un-vote
        review.helpfulUsers = review.helpfulUsers.filter((id) => id !== userId);
        review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
      } else {
        // Vote helpful
        review.helpfulUsers.push(userId);
        review.helpfulVotes += 1;
      }

      await review.save();

      res.json({
        success: true,
        data: {
          helpfulVotes: review.helpfulVotes,
          voted: !alreadyVoted,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/reviews/:reviewId — Delete own review or admin
  async deleteReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { reviewId } = req.params;

      const review = await Review.findById(reviewId);
      if (!review) {
        res.status(404).json({ success: false, message: 'Review not found' });
        return;
      }

      if (review.userId !== user._id.toString() && user.role !== 'admin') {
        res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
        return;
      }

      const productId = review.productId;
      await Review.findByIdAndDelete(reviewId);

      // Recalculate average rating on Product
      const stats = await Review.aggregate([
        { $match: { productId } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);

      await Product.findByIdAndUpdate(productId, {
        averageRating: stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0,
        totalReviews: stats.length > 0 ? stats[0].count : 0,
      });

      res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
