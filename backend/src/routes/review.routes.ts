import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { authMiddleware, optionalAuth } from '../middleware/auth.middleware';
import { uploadReviewPhotos } from '../middleware/upload.middleware';

const router = Router();

// GET reviews for a product (with optional authentication so logged-in users get their review status)
router.get('/product/:productId', optionalAuth, reviewController.getProductReviews);

// POST create/upsert a review (authenticated, supports up to 5 photos)
router.post(
  '/product/:productId',
  authMiddleware,
  uploadReviewPhotos,
  reviewController.createReview
);

// POST toggle helpful vote
router.post('/:reviewId/helpful', authMiddleware, reviewController.voteHelpful);

// DELETE review (author or admin)
router.delete('/:reviewId', authMiddleware, reviewController.deleteReview);

export default router;
