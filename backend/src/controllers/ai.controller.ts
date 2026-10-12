import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { AuthenticatedRequest } from '../types';

export const aiController = {
  // GET /api/admin/ai/analytics
  async getBusinessAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await aiService.getBusinessAnalytics(days);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/admin/ai/demand
  async getDemandPrediction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, shopId } = req.query as Record<string, string>;
      const data = await aiService.getDemandPrediction(productId, shopId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/admin/ai/forecast
  async getSalesForecast(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const data = await aiService.getSalesForecast(days);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/admin/ai/anomalies
  async getOrderAnomalies(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const threshold = parseFloat(req.query.threshold as string) || 3.0;
      const data = await aiService.getOrderAnomalies(threshold);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/admin/ai/daily-report
  async getDailyReportSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await aiService.getDailyReportSummary();
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  // POST /api/admin/ai/trigger-email
  async triggerDailyEmail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const recipient = req.body?.recipient || (req.user?.email);
      const data = await aiService.triggerDailyReportEmail(recipient);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/shop/ai/insights — for shop owner dashboard
  async getShopInsights(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const shopId = req.query.shopId as string;
      const [analyticsData, demandData] = await Promise.all([
        aiService.getShopAnalytics(shopId),
        aiService.getDemandPrediction(undefined, shopId),
      ]);
      res.json({
        success: true,
        data: {
          analytics: analyticsData.data || null,
          demand: demandData.data || null,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/ai/recommendations — public or customer
  async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthenticatedRequest).user?._id?.toString() || (req.query.userId as string);
      const limit = parseInt(req.query.limit as string) || 6;
      const data = await aiService.getRecommendations(userId, limit);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
};
