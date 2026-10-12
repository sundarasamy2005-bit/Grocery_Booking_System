import axios from 'axios';

const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SECRET = process.env.AI_SERVICE_SECRET || 'local_grocery_ai_secret_key_2026';

const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 10000,
  headers: {
    'X-Internal-Secret': AI_SECRET,
  },
});

export const aiService = {
  // 1. Health check
  async checkHealth() {
    try {
      const res = await aiClient.get('/health');
      return res.data;
    } catch (err: any) {
      return { status: 'offline', error: err.message };
    }
  },

  // 2. Business Analytics (Platform)
  async getBusinessAnalytics(days: number = 30) {
    try {
      const res = await aiClient.get('/analytics/business', { params: { days } });
      return res.data;
    } catch (err: any) {
      console.warn('AI Service /analytics/business unavailable:', err.message);
      return { success: false, error: 'AI Analytics service currently unavailable' };
    }
  },

  // 3. Shop-scoped Sales Analytics
  async getShopSalesAnalytics(shopId: string, days: number = 30) {
    try {
      const res = await aiClient.get('/analytics/sales', { params: { shop_id: shopId, days } });
      return res.data;
    } catch (err: any) {
      console.warn(`AI Service /analytics/sales for shop ${shopId} unavailable:`, err.message);
      return {
        success: false,
        error: 'AI Sales Analytics currently unavailable',
        data: null,
      };
    }
  },

  // 4. Shop-scoped 7-Day Demand Prediction
  async getShopDemand(shopId: string, days: number = 7) {
    try {
      const res = await aiClient.get('/predictions/demand', { params: { shop_id: shopId, days } });
      return res.data;
    } catch (err: any) {
      console.warn(`AI Service /predictions/demand for shop ${shopId} unavailable:`, err.message);
      return {
        success: false,
        error: 'AI Demand Prediction currently unavailable',
        data: null,
      };
    }
  },

  // 5. Shop-scoped Sales Forecast (Tomorrow & Next 7 Days)
  async getShopSalesForecast(shopId: string, days: number = 7) {
    try {
      const res = await aiClient.get('/predictions/sales', { params: { shop_id: shopId, days } });
      return res.data;
    } catch (err: any) {
      console.warn(`AI Service /predictions/sales for shop ${shopId} unavailable:`, err.message);
      return {
        success: false,
        error: 'AI Sales Forecast currently unavailable',
        data: null,
      };
    }
  },

  // 6. Products at Risk of Running Out of Stock + Recommended Restocks
  async getShopStockRisk(shopId: string) {
    try {
      const res = await aiClient.get('/predictions/stock-risk', { params: { shop_id: shopId } });
      return res.data;
    } catch (err: any) {
      console.warn(`AI Service /predictions/stock-risk for shop ${shopId} unavailable:`, err.message);
      return {
        success: false,
        error: 'AI Stock Risk service currently unavailable',
        data: null,
      };
    }
  },

  // 7. Full Shop Insights & Performance Summaries + Anomalies
  async getShopFullInsights(shopId: string) {
    try {
      const res = await aiClient.get('/insights/shop', { params: { shop_id: shopId } });
      return res.data;
    } catch (err: any) {
      console.warn(`AI Service /insights/shop for shop ${shopId} unavailable:`, err.message);
      return {
        success: false,
        error: 'AI Shop Insights currently unavailable',
        data: null,
      };
    }
  },

  // Legacy shop analytics
  async getShopAnalytics(shopId: string) {
    try {
      const res = await aiClient.get(`/analytics/shop/${shopId}`);
      return res.data;
    } catch (err: any) {
      console.warn(`AI Service /analytics/shop/${shopId} unavailable:`, err.message);
      return { success: false, error: 'AI Shop Analytics currently unavailable' };
    }
  },

  async getDemandPrediction(productId?: string, shopId?: string) {
    try {
      const res = await aiClient.get('/predictions/demand', { params: { product_id: productId, shop_id: shopId } });
      return res.data;
    } catch (err: any) {
      return { success: false, error: 'AI Demand Prediction currently unavailable' };
    }
  },

  async getSalesForecast(days: number = 7) {
    try {
      const res = await aiClient.get('/predictions/forecast', { params: { days } });
      return res.data;
    } catch (err: any) {
      return { success: false, error: 'AI Sales Forecast currently unavailable' };
    }
  },

  async getOrderAnomalies(thresholdFactor: number = 3.0) {
    try {
      const res = await aiClient.get('/predictions/anomalies', { params: { threshold_factor: thresholdFactor } });
      return res.data;
    } catch (err: any) {
      return { success: false, error: 'AI Anomaly Detection currently unavailable' };
    }
  },

  async getRecommendations(userId?: string, limit: number = 6) {
    try {
      const res = await aiClient.get('/recommendations', { params: { user_id: userId, limit } });
      return res.data;
    } catch (err: any) {
      return { success: false, error: 'AI Recommendations currently unavailable' };
    }
  },

  async getDailyReportSummary() {
    try {
      const res = await aiClient.get('/automation/daily-report-summary');
      return res.data;
    } catch (err: any) {
      return { success: false, error: 'Daily report unavailable' };
    }
  },

  async triggerDailyReportEmail(recipient?: string) {
    try {
      const res = await aiClient.post('/automation/trigger-daily-email', null, { params: { recipient } });
      return res.data;
    } catch (err: any) {
      return { success: false, error: 'Trigger email unavailable' };
    }
  },
};
