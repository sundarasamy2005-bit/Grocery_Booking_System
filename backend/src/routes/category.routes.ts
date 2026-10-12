import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import { uploadSingle } from '../middleware/upload.middleware';

const router = Router();

// Public
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);

// Admin only
router.post('/', authMiddleware, requireAdmin, uploadSingle, categoryController.createCategory);
router.put('/:id', authMiddleware, requireAdmin, uploadSingle, categoryController.updateCategory);
router.delete('/:id', authMiddleware, requireAdmin, categoryController.deleteCategory);

export default router;
