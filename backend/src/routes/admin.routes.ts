import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(requireAdmin);

router.get('/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getUsers);
router.patch('/users/:id', adminController.updateUser);

// Shop management
router.get('/shops', adminController.getShops);
router.patch('/shops/:id/approve', adminController.approveShop);

// Order monitoring
router.get('/orders', adminController.getAllOrders);

export default router;
