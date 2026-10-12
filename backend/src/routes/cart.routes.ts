import { Router } from 'express';
import { cartController } from '../controllers/cart.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// All cart routes require customer authentication
router.use(authMiddleware);
router.use(requireRole('customer'));

router.get('/', cartController.getCart);
router.post('/items', cartController.addToCart);
router.put('/items/:productId', cartController.updateCartItem);
router.delete('/items/:productId', cartController.removeCartItem);
router.delete('/', cartController.clearCart);

export default router;
