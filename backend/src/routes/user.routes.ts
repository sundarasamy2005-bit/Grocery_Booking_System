import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/profile/image', uploadSingle, userController.uploadProfileImage);

// Favorites endpoints
router.get('/favorites', userController.getFavorites);
router.post('/favorites/:productId', userController.toggleFavorite);
router.delete('/favorites/:productId', userController.removeFavorite);

// Settings and Account endpoints
router.put('/settings', userController.updateSettings);
router.delete('/account', userController.deleteAccount);

export default router;
