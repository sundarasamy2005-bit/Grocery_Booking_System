import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../types';
import { uploadService } from '../services/upload.service';
import { createError } from '../middleware/error.middleware';

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

      if (name) user.name = name;
      if (phone !== undefined) user.phone = phone;

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
};
