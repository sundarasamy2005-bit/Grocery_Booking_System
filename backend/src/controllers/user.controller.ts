import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { AuthenticatedRequest } from '../types';
import { uploadService } from '../services/upload.service';

export const userController = {
  // GET /api/users/profile
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.json({ success: true, data: req.user });
  },

  // PUT /api/users/profile
  async updateProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const { name, phone } = req.body as { name?: string; phone?: string };

      if (name && typeof name === 'string') user.name = name.trim();
      if (phone !== undefined) user.phone = typeof phone === 'string' ? phone.trim() : '';

      await user.save();

      res.json({ success: true, data: user, message: 'Profile updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/users/profile/image
  async uploadProfileImage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No image file provided' });
        return;
      }

      const user = req.user!;
      const result = await uploadService.uploadProfileImage(req.file.buffer);
      user.profileImage = result.url;
      await user.save();

      res.json({
        success: true,
        data: { profileImage: result.url },
        message: 'Profile image updated',
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/users/favorites — Get user's saved favorite products
  async getFavorites(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const favIds = user.favorites || [];

      const products = await Product.find({
        _id: { $in: favIds },
      })
        .populate('shopId', 'shopName city isApproved isActive')
        .populate('categoryId', 'name slug')
        .lean();

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/users/favorites/:productId — Toggle product in user's favorites
  async toggleFavorite(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const productId = req.params.productId as string;

      if (!productId) {
        res.status(400).json({ success: false, message: 'Product ID is required' });
        return;
      }

      const currentFavs: string[] = user.favorites || [];
      const isFav = currentFavs.includes(productId);

      if (isFav) {
        user.favorites = currentFavs.filter((id) => id !== productId);
      } else {
        user.favorites = [...currentFavs, productId];
      }

      await user.save();

      res.json({
        success: true,
        data: {
          isFavorite: !isFav,
          favorites: user.favorites,
        },
        message: !isFav ? 'Added to favorites' : 'Removed from favorites',
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/users/favorites/:productId — Remove product from favorites
  async removeFavorite(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const productId = req.params.productId as string;

      user.favorites = (user.favorites || []).filter((id) => id !== productId);
      await user.save();

      res.json({
        success: true,
        data: { favorites: user.favorites },
        message: 'Removed from favorites',
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/users/settings — Update user settings / preferences
  async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { notificationsEnabled } = req.body;

      if (notificationsEnabled !== undefined) {
        user.notificationsEnabled = Boolean(notificationsEnabled);
      }

      await user.save();

      res.json({
        success: true,
        data: { notificationsEnabled: user.notificationsEnabled },
        message: 'Settings updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/users/account — Secure account deactivation / deletion flow
  async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;

      // Mark account inactive (soft delete ensures historical orders/bookkeeping remain valid)
      user.isActive = false;
      user.name = 'Deactivated User';
      user.phone = '';
      user.favorites = [];
      await user.save();

      res.json({
        success: true,
        message: 'Your account has been deactivated. Historical order records are preserved for business compliance.',
      });
    } catch (error) {
      next(error);
    }
  },
};
