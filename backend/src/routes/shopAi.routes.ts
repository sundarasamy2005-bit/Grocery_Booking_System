import { Router } from 'express';
import { shopAiController } from '../controllers/shopAi.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// All shop AI and automation endpoints require shopOwner or admin role
router.use(authMiddleware, requireRole('shopOwner', 'admin'));

// ─── Shop AI Insights Endpoints ──────────────────────────────
router.get('/ai/analytics', shopAiController.getSalesAnalytics);
router.get('/ai/demand', shopAiController.getDemand);
router.get('/ai/forecast', shopAiController.getSalesForecast);
router.get('/ai/stock-risk', shopAiController.getStockRisk);
router.get('/ai/insights', shopAiController.getInsights);

// ─── Automation Center Endpoints ─────────────────────────────
router.get('/automation/settings', shopAiController.getAutomationSettings);
router.put('/automation/settings', shopAiController.updateAutomationSettings);
router.post('/automation/test-email', shopAiController.testNotificationEmail);
router.post('/automation/run/:jobType', shopAiController.triggerJobNow);
router.patch('/automation/notifications/:id/read', shopAiController.markNotificationRead);
router.post('/automation/notifications/mark-all-read', shopAiController.markAllNotificationsRead);

export default router;
