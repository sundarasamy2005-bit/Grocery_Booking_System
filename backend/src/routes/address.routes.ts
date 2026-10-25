import { Router } from 'express';
import { addressController } from '../controllers/address.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All address routes require authentication
router.use(authMiddleware);

// CRUD routes for delivery addresses
router.get('/', addressController.getAddresses);
router.post('/', addressController.createAddress);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);
router.patch('/:id/default', addressController.setDefault);

export default router;
