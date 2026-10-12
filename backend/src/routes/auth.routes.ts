import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/auth/sync — sync Firebase user with MongoDB
router.post('/sync', authController.syncUser);

// GET /api/auth/me — get current user
router.get('/me', authMiddleware, authController.getMe);

export default router;
