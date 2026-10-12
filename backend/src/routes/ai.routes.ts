import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin, requireRole } from '../middleware/role.middleware';

const router = Router();

// Public / Customer Product Recommendations
router.get('/recommendations', aiController.getRecommendations);

// Shop Owner AI Insights
router.get('/shop/insights', authMiddleware, requireRole('shopOwner', 'admin'), aiController.getShopInsights);

// Admin AI Endpoints
router.get('/admin/analytics', authMiddleware, requireAdmin, aiController.getBusinessAnalytics);
router.get('/admin/demand', authMiddleware, requireAdmin, aiController.getDemandPrediction);
router.get('/admin/forecast', authMiddleware, requireAdmin, aiController.getSalesForecast);
router.get('/admin/anomalies', authMiddleware, requireAdmin, aiController.getOrderAnomalies);
router.get('/admin/daily-report', authMiddleware, requireAdmin, aiController.getDailyReportSummary);
router.post('/admin/trigger-email', authMiddleware, requireAdmin, aiController.triggerDailyEmail);

export default router;
