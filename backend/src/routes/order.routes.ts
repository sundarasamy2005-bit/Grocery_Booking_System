import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(authMiddleware);

// IMPORTANT: specific string routes MUST come before parameterized /:id routes

// Shop owner routes
router.get('/shop', requireRole('shopOwner', 'admin'), orderController.getShopOrders);

// Customer / order placement routes (accessible to customer, admin, and shopOwner)
router.post('/', requireRole('customer', 'admin', 'shopOwner'), orderController.createOrder);
router.get('/my', requireRole('customer', 'admin', 'shopOwner'), orderController.getMyOrders);
router.patch('/:id/cancel', requireRole('customer', 'admin', 'shopOwner'), orderController.cancelOrder);

// Shared — order by ID (this must come LAST among GET routes)
router.get('/:id', orderController.getOrderById);
router.patch(
  '/:id/status',
  requireRole('shopOwner', 'admin'),
  orderController.updateOrderStatus
);

export default router;

