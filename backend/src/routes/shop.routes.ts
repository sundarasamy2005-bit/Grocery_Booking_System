import { Router } from 'express';
import { shopController } from '../controllers/shop.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { uploadSingle } from '../middleware/upload.middleware';

const router = Router();

// Public routes
router.get('/', shopController.getShops);
router.get('/location/search', shopController.searchLocation);
router.get('/location/reverse', shopController.reverseGeocode);
router.get('/my', authMiddleware, requireRole('shopOwner', 'admin'), shopController.getMyShop);
router.get('/:id', shopController.getShopById);

// Protected routes
router.post(
  '/',
  authMiddleware,
  requireRole('shopOwner', 'admin'),
  uploadSingle,
  shopController.createShop
);

router.put(
  '/:id',
  authMiddleware,
  requireRole('shopOwner', 'admin'),
  uploadSingle,
  shopController.updateShop
);

export default router;
