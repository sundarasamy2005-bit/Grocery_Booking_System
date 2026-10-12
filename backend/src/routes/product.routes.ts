import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { uploadSingle } from '../middleware/upload.middleware';

const router = Router();

// Public routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Shop owner / admin protected routes
router.post(
  '/',
  authMiddleware,
  requireRole('shopOwner', 'admin'),
  uploadSingle,
  productController.createProduct
);

router.put(
  '/:id',
  authMiddleware,
  requireRole('shopOwner', 'admin'),
  uploadSingle,
  productController.updateProduct
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('shopOwner', 'admin'),
  productController.deleteProduct
);

export default router;
