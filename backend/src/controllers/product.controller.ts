import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { Shop } from '../models/Shop';
import { Category } from '../models/Category';
import { AuthenticatedRequest } from '../types';
import { uploadService } from '../services/upload.service';

export const productController = {
  // GET /api/products
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        search = '',
        shopId,
        categoryId,
        minPrice,
        maxPrice,
        available,
      } = req.query as Record<string, string>;

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, unknown> = {};

      if (shopId) filter.shopId = shopId;
      if (categoryId) filter.categoryId = categoryId;
      if (available !== undefined) filter.isAvailable = available === 'true';
      if (search) {
        filter.$text = { $search: search };
      }
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) (filter.price as Record<string, number>).$gte = parseFloat(minPrice);
        if (maxPrice) (filter.price as Record<string, number>).$lte = parseFloat(maxPrice);
      }

      const [products, total] = await Promise.all([
        Product.find(filter)
          .select('-__v')
          .populate('categoryId', 'name slug')
          .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Product.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/products/:id
  async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await Product.findById(req.params.id)
        .select('-__v')
        .populate('categoryId', 'name slug')
        .populate('shopId', 'shopName city isApproved isActive')
        .lean();

      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/products — shop owner adds product
  async createProduct(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;

      // Find owner's shop
      const shop = await Shop.findOne({ ownerId: user._id.toString() });
      if (!shop) {
        res.status(404).json({ success: false, message: 'Shop not found. Create a shop first.' });
        return;
      }

      if (!shop.isApproved) {
        res
          .status(403)
          .json({ success: false, message: 'Shop is not approved yet. Wait for admin approval.' });
        return;
      }

      // Validate category
      const category = await Category.findById(req.body.categoryId);
      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }

      const productData: Record<string, unknown> = {
        ...req.body,
        shopId: shop._id.toString(),
        price: parseFloat(req.body.price),
        stock: parseInt(req.body.stock),
      };

      if (req.file) {
        try {
          const result = await uploadService.uploadProductImage(
            req.file.buffer,
            req.file.mimetype
          );
          productData.imageUrl = result.url;
          productData.cloudinaryPublicId = result.publicId;
        } catch (uploadErr) {
          console.warn('Image upload failed, using fallback:', uploadErr);
          productData.imageUrl = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400';
        }
      }

      const product = await Product.create(productData);

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/products/:id
  async updateProduct(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const product = await Product.findById(req.params.id);

      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }

      // Verify ownership
      const shop = await Shop.findOne({ ownerId: user._id.toString(), _id: product.shopId });
      if (!shop && user.role !== 'admin') {
        res.status(403).json({ success: false, message: 'Not authorized to update this product' });
        return;
      }

      const updateData: Record<string, unknown> = { ...req.body };
      if (updateData.price) updateData.price = parseFloat(updateData.price as string);
      if (updateData.stock) updateData.stock = parseInt(updateData.stock as string);

      if (req.file) {
        try {
          if (product.cloudinaryPublicId) {
            await uploadService.deleteImage(product.cloudinaryPublicId);
          }
          const result = await uploadService.uploadProductImage(
            req.file.buffer,
            req.file.mimetype,
            product.cloudinaryPublicId
          );
          updateData.imageUrl = result.url;
          updateData.cloudinaryPublicId = result.publicId;
        } catch (uploadErr) {
          console.warn('Failed to update product image:', uploadErr);
        }
      }

      Object.assign(product, updateData);
      await product.save();

      res.json({ success: true, data: product, message: 'Product updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/products/:id
  async deleteProduct(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const product = await Product.findById(req.params.id);

      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }

      const shop = await Shop.findOne({ ownerId: user._id.toString(), _id: product.shopId });
      if (!shop && user.role !== 'admin') {
        res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
        return;
      }

      // Delete Cloudinary image
      if (product.cloudinaryPublicId) {
        await uploadService.deleteImage(product.cloudinaryPublicId);
      }

      await product.deleteOne();

      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
