import { Request, Response, NextFunction } from 'express';
import { Category } from '../models/Category';
import { AuthenticatedRequest } from '../types';
import { uploadService } from '../services/upload.service';

import { ensureDefaultCategories } from '../services/category.service';

export const categoryController = {
  // GET /api/categories — public
  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let categories = await Category.find({ isActive: true })
        .select('-__v')
        .sort({ name: 1 })
        .lean();

      if (categories.length < 15) {
        await ensureDefaultCategories();
        categories = await Category.find({ isActive: true })
          .select('-__v')
          .sort({ name: 1 })
          .lean();
      }

      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/categories/:id
  async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await Category.findById(req.params.id).lean();
      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/categories — admin only
  async createCategory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const categoryData: Record<string, unknown> = { ...req.body };
      if (req.file) {
        const result = await uploadService.uploadCategoryImage(req.file.buffer);
        categoryData.image = result.url;
      }
      const category = await Category.create(categoryData);
      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created',
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/categories/:id — admin only
  async updateCategory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const updateData: Record<string, unknown> = { ...req.body };
      if (req.file) {
        const result = await uploadService.uploadCategoryImage(req.file.buffer);
        updateData.image = result.url;
      }
      const category = await Category.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }
      res.json({ success: true, data: category, message: 'Category updated' });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/categories/:id — admin only
  async deleteCategory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const category = await Category.findByIdAndDelete(req.params.id);
      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }
      res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
      next(error);
    }
  },
};
