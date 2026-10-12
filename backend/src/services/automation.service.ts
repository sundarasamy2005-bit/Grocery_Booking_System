import { Shop } from '../models/Shop';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { ShopAutomation, IShopAutomation, IShopNotification } from '../models/ShopAutomation';
import { aiService } from './ai.service';
import { emailService } from './email.service';

const generateId = (prefix: string = 'notif'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
};

export const automationService = {
  // Retrieve or initialize settings for a given shop
  async getOrCreateSettings(shopId: string): Promise<IShopAutomation> {
    let settings = await ShopAutomation.findOne({ shopId });
    if (!settings) {
      const shop = await Shop.findById(shopId).select('email').lean();
      settings = await ShopAutomation.create({
        shopId,
        notificationEmail: shop?.email || '',
        emailAlertsEnabled: true,
        lowStockThreshold: 10,
        lowStockCheck: {
          enabled: true,
          intervalHours: 6,
          emailNotification: true,
          lastStatus: 'idle',
        },
        dailySalesSummary: {
          enabled: true,
          preferredHour: 21,
          preferredMinute: 0,
          customTime: '21:00',
          emailNotification: true,
          lastStatus: 'idle',
        },
        weeklyBusinessReport: {
          enabled: true,
          dayOfWeek: 0, // Sunday
          preferredHour: 20,
          preferredMinute: 0,
          customTime: '20:00',
          emailNotification: true,
          lastStatus: 'idle',
        },
        notifications: [],
      });
    } else if (!settings.notificationEmail) {
      const shop = await Shop.findById(shopId).select('email').lean();
      if (shop?.email) {
        settings.notificationEmail = shop.email;
        await settings.save();
      }
    }
    return settings;
  },

  // Helper to append notification while enforcing a maximum limit of 50 to avoid document bloat
  async pushNotification(
    shopId: string,
    notif: Omit<IShopNotification, '_id' | 'createdAt' | 'read'>
  ): Promise<void> {
    const newNotif: IShopNotification = {
      _id: generateId('notif'),
      ...notif,
      read: false,
      createdAt: new Date(),
    };

    await ShopAutomation.updateOne(
      { shopId },
      {
        $push: {
          notifications: {
            $each: [newNotif],
            $position: 0,
            $slice: 50, // Keep latest 50 notifications
          },
        },
      }
    );
  },

  // Execute Low-Stock Analysis for a shop
  async executeLowStockCheck(shopId: string): Promise<{ success: boolean; itemsFound: number; alertSent: boolean }> {
    const settings = await this.getOrCreateSettings(shopId);
    const shop = await Shop.findById(shopId).lean();
    if (!shop) {
      return { success: false, itemsFound: 0, alertSent: false };
    }

    try {
      await ShopAutomation.updateOne({ shopId }, { $set: { 'lowStockCheck.lastStatus': 'running' } });

      let criticalItems: Array<{ name: string; current_stock: number; urgency: string; recommended_restock: number }> = [];

      // 1. Try Python AI service first
      try {
        const stockRiskResponse = await aiService.getShopStockRisk(shopId);
        const aiItems = stockRiskResponse?.data?.items || [];
        criticalItems = aiItems.filter(
          (i: any) => i.urgency === 'IMMEDIATE' || i.urgency === 'UPCOMING'
        );
      } catch (aiErr) {
        console.warn(`[AUTOMATION] AI Stock Risk offline for shop ${shopId}, falling back to MongoDB.`);
      }

      // 2. Fallback to MongoDB inventory check if AI service returned nothing
      if (criticalItems.length === 0) {
        const threshold = settings.lowStockThreshold || 10;
        const lowProducts = await Product.find({
          shopId,
          stock: { $lte: threshold },
          isAvailable: true,
        }).lean();

        criticalItems = lowProducts.map((p) => ({
          name: p.name,
          current_stock: p.stock,
          urgency: p.stock <= 3 ? 'IMMEDIATE' : 'UPCOMING',
          recommended_restock: Math.max(15, threshold * 2 - p.stock),
        }));
      }

      let alertSent = false;
      if (criticalItems.length > 0) {
        const immediateCount = criticalItems.filter((i) => i.urgency === 'IMMEDIATE').length;
        const severity = immediateCount > 0 ? 'critical' : 'warning';
        const title = immediateCount > 0
          ? `⚠️ Critical Stock Alert: ${immediateCount} item(s) depleted`
          : `⚠️ Low Stock Warning: ${criticalItems.length} item(s) running low`;

        const itemNames = criticalItems.slice(0, 3).map((i) => i.name).join(', ');
        const message = criticalItems.length > 3
          ? `Depleted or low inventory: ${itemNames} and ${criticalItems.length - 3} other items.`
          : `Depleted or low inventory: ${itemNames}.`;

        await this.pushNotification(shopId, {
          title,
          message,
          type: 'stock_alert',
          severity,
        });

        const targetEmail = (settings.notificationEmail || shop.email || '').trim();
        if (
          targetEmail &&
          settings.emailAlertsEnabled !== false &&
          settings.lowStockCheck.emailNotification !== false
        ) {
          await emailService.sendLowStockAlertEmail(
            targetEmail,
            shop.shopName,
            criticalItems.map((i) => ({
              name: i.name,
              currentStock: i.current_stock,
              recommendedRestock: i.recommended_restock,
            }))
          );
          alertSent = true;
          console.log(`📧 Low stock alert sent to owner Gmail (${targetEmail}) for shop: ${shop.shopName}`);
        }
      }

      const nextRun = new Date(Date.now() + (settings.lowStockCheck.intervalHours || 6) * 3600 * 1000);
      await ShopAutomation.updateOne(
        { shopId },
        {
          $set: {
            'lowStockCheck.lastRunAt': new Date(),
            'lowStockCheck.nextRunAt': nextRun,
            'lowStockCheck.lastStatus': 'success',
            'lowStockCheck.lastError': null,
          },
        }
      );

      return { success: true, itemsFound: criticalItems.length, alertSent };
    } catch (err: any) {
      console.error(`[AUTOMATION] Low stock check failed for shop ${shopId}:`, err);
      await ShopAutomation.updateOne(
        { shopId },
        {
          $set: {
            'lowStockCheck.lastStatus': 'failed',
            'lowStockCheck.lastError': err.message,
          },
        }
      );
      return { success: false, itemsFound: 0, alertSent: false };
    }
  },

  // Execute Daily Sales Summary for a shop
  async executeDailySalesSummary(shopId: string): Promise<{ success: boolean; totalOrders: number; totalRevenue: number }> {
    const settings = await this.getOrCreateSettings(shopId);
    const shop = await Shop.findById(shopId).lean();
    if (!shop) {
      return { success: false, totalOrders: 0, totalRevenue: 0 };
    }

    try {
      await ShopAutomation.updateOne({ shopId }, { $set: { 'dailySalesSummary.lastStatus': 'running' } });

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const orders = await Order.find({
        shopId: shop._id.toString(),
        createdAt: { $gte: startOfDay },
        orderStatus: { $nin: ['cancelled', 'rejected'] },
      }).lean();

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      // Find top product today
      const productCounts: Record<string, number> = {};
      for (const order of orders) {
        for (const item of order.items || []) {
          productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
        }
      }
      let topProduct: string | undefined;
      let maxQty = 0;
      for (const [name, qty] of Object.entries(productCounts)) {
        if (qty > maxQty) {
          maxQty = qty;
          topProduct = `${name} (${qty} units)`;
        }
      }

      await this.pushNotification(shopId, {
        title: `📊 Daily Sales Recap: ₹${totalRevenue.toFixed(2)}`,
        message: `${totalOrders} orders completed today. ${topProduct ? `Top seller: ${topProduct}.` : ''}`,
        type: 'sales_summary',
        severity: 'info',
      });

      const targetEmail = (settings.notificationEmail || shop.email || '').trim();
      if (
        targetEmail &&
        settings.emailAlertsEnabled !== false &&
        settings.dailySalesSummary.emailNotification !== false
      ) {
        await emailService.sendDailySalesSummaryEmail(targetEmail, shop.shopName, {
          totalOrders,
          totalRevenue,
          topProduct,
        });
        console.log(`📧 Daily sales summary sent to owner Gmail (${targetEmail}) for shop: ${shop.shopName}`);
      }

      const nextRun = new Date();
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(settings.dailySalesSummary.preferredHour ?? 21, settings.dailySalesSummary.preferredMinute ?? 0, 0, 0);

      await ShopAutomation.updateOne(
        { shopId },
        {
          $set: {
            'dailySalesSummary.lastRunAt': new Date(),
            'dailySalesSummary.nextRunAt': nextRun,
            'dailySalesSummary.lastStatus': 'success',
            'dailySalesSummary.lastError': null,
          },
        }
      );

      return { success: true, totalOrders, totalRevenue };
    } catch (err: any) {
      console.error(`[AUTOMATION] Daily sales summary failed for shop ${shopId}:`, err);
      await ShopAutomation.updateOne(
        { shopId },
        {
          $set: {
            'dailySalesSummary.lastStatus': 'failed',
            'dailySalesSummary.lastError': err.message,
          },
        }
      );
      return { success: false, totalOrders: 0, totalRevenue: 0 };
    }
  },

  // Execute Weekly Business Report for a shop
  async executeWeeklyBusinessReport(shopId: string): Promise<{ success: boolean; totalOrders: number; totalRevenue: number; completionRate: number }> {
    const settings = await this.getOrCreateSettings(shopId);
    const shop = await Shop.findById(shopId).lean();
    if (!shop) {
      return { success: false, totalOrders: 0, totalRevenue: 0, completionRate: 0 };
    }

    try {
      await ShopAutomation.updateOne({ shopId }, { $set: { 'weeklyBusinessReport.lastStatus': 'running' } });

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      const orders = await Order.find({
        shopId: shop._id.toString(),
        createdAt: { $gte: sevenDaysAgo },
      }).lean();

      const totalOrders = orders.length;
      const completedOrders = orders.filter(
        (o) => o.orderStatus === 'delivered' || o.orderStatus === 'ready' || o.orderStatus === 'accepted'
      );
      const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const completionRate = totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 100) : 100;

      await this.pushNotification(shopId, {
        title: `📈 Weekly Digest: ₹${totalRevenue.toFixed(2)} Revenue`,
        message: `${completedOrders.length}/${totalOrders} orders completed with a ${completionRate}% fulfillment rate over the last 7 days.`,
        type: 'sales_summary',
        severity: 'info',
      });

      const targetEmail = (settings.notificationEmail || shop.email || '').trim();
      if (
        targetEmail &&
        settings.emailAlertsEnabled !== false &&
        settings.weeklyBusinessReport.emailNotification !== false
      ) {
        await emailService.sendWeeklyBusinessReportEmail(targetEmail, shop.shopName, {
          totalOrders: completedOrders.length,
          totalRevenue,
          completionRate,
        });
        console.log(`📧 Weekly business report sent to owner Gmail (${targetEmail}) for shop: ${shop.shopName}`);
      }

      const nextRun = new Date();
      nextRun.setDate(nextRun.getDate() + 7);
      nextRun.setHours(settings.weeklyBusinessReport.preferredHour ?? 20, settings.weeklyBusinessReport.preferredMinute ?? 0, 0, 0);

      await ShopAutomation.updateOne(
        { shopId },
        {
          $set: {
            'weeklyBusinessReport.lastRunAt': new Date(),
            'weeklyBusinessReport.nextRunAt': nextRun,
            'weeklyBusinessReport.lastStatus': 'success',
            'weeklyBusinessReport.lastError': null,
          },
        }
      );

      return { success: true, totalOrders: completedOrders.length, totalRevenue, completionRate };
    } catch (err: any) {
      console.error(`[AUTOMATION] Weekly report failed for shop ${shopId}:`, err);
      await ShopAutomation.updateOne(
        { shopId },
        {
          $set: {
            'weeklyBusinessReport.lastStatus': 'failed',
            'weeklyBusinessReport.lastError': err.message,
          },
        }
      );
      return { success: false, totalOrders: 0, totalRevenue: 0, completionRate: 0 };
    }
  },

  // Send a test notification to verify owner email reception
  async sendTestEmail(shopId: string, customEmail?: string): Promise<{ success: boolean; recipient: string; message: string }> {
    const settings = await this.getOrCreateSettings(shopId);
    const shop = await Shop.findById(shopId).lean();
    if (!shop) throw new Error('Shop not found');

    const recipient = (customEmail?.trim() || settings.notificationEmail?.trim() || shop.email?.trim());
    if (!recipient) throw new Error('No recipient Gmail or shop email configured');

    const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyDay = daysMap[settings.weeklyBusinessReport?.dayOfWeek ?? 0] || 'Sunday';

    await emailService.sendTestNotificationEmail(recipient, shop.shopName, {
      lowStockFreq: settings.lowStockCheck.enabled ? `Every ${settings.lowStockCheck.intervalHours || 6} hours` : 'Disabled',
      dailyTime: settings.dailySalesSummary.enabled ? (settings.dailySalesSummary.customTime || `${settings.dailySalesSummary.preferredHour || 21}:00`) : 'Disabled',
      weeklyTime: settings.weeklyBusinessReport.enabled ? `${weeklyDay} at ${settings.weeklyBusinessReport.customTime || `${settings.weeklyBusinessReport.preferredHour || 20}:00`}` : 'Disabled',
    });

    await this.pushNotification(shopId, {
      title: '🔔 Test Notification Sent',
      message: `Verified dispatch to ${recipient}. Email notification alerts are active.`,
      type: 'system',
      severity: 'info',
    });

    return {
      success: true,
      recipient,
      message: `Test email dispatched to ${recipient}`,
    };
  },

  // Manual Trigger handler
  async triggerJobNow(shopId: string, jobType: 'lowStockCheck' | 'dailySalesSummary' | 'weeklyBusinessReport') {
    if (jobType === 'lowStockCheck') {
      return await this.executeLowStockCheck(shopId);
    } else if (jobType === 'dailySalesSummary') {
      return await this.executeDailySalesSummary(shopId);
    } else if (jobType === 'weeklyBusinessReport') {
      return await this.executeWeeklyBusinessReport(shopId);
    }
    throw new Error(`Invalid job type: ${jobType}`);
  },

  // Scheduler iteration checking all active and approved shops
  async runSchedulerTick(): Promise<void> {
    try {
      const activeShops = await Shop.find({ isActive: true, isApproved: true }).select('_id').lean();
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDay = now.getDay(); // 0 is Sunday

      for (const shop of activeShops) {
        const shopId = shop._id.toString();
        const settings = await this.getOrCreateSettings(shopId);

        // 1. Low-stock check (every intervalHours)
        if (settings.lowStockCheck.enabled && settings.lowStockCheck.lastStatus !== 'running') {
          const intervalMs = (settings.lowStockCheck.intervalHours || 6) * 3600 * 1000;
          const lastRun = settings.lowStockCheck.lastRunAt ? new Date(settings.lowStockCheck.lastRunAt).getTime() : 0;
          if (now.getTime() - lastRun >= intervalMs) {
            await this.executeLowStockCheck(shopId);
          }
        }

        // 2. Daily sales summary
        if (settings.dailySalesSummary.enabled && settings.dailySalesSummary.lastStatus !== 'running') {
          const prefHour = settings.dailySalesSummary.preferredHour ?? 21;
          const lastRun = settings.dailySalesSummary.lastRunAt ? new Date(settings.dailySalesSummary.lastRunAt) : null;
          const isSameDay = lastRun && lastRun.toDateString() === now.toDateString();

          if (currentHour >= prefHour && !isSameDay) {
            await this.executeDailySalesSummary(shopId);
          }
        }

        // 3. Weekly report
        if (settings.weeklyBusinessReport.enabled && settings.weeklyBusinessReport.lastStatus !== 'running') {
          const prefDay = settings.weeklyBusinessReport.dayOfWeek ?? 0;
          const prefHour = settings.weeklyBusinessReport.preferredHour ?? 20;
          const lastRun = settings.weeklyBusinessReport.lastRunAt ? new Date(settings.weeklyBusinessReport.lastRunAt) : null;
          const diffDays = lastRun ? (now.getTime() - lastRun.getTime()) / (1000 * 3600 * 24) : 999;

          if (currentDay === prefDay && currentHour >= prefHour && diffDays >= 6) {
            await this.executeWeeklyBusinessReport(shopId);
          }
        }
      }
    } catch (err) {
      console.error('[AUTOMATION SCHEDULER] Error in scheduler tick:', err);
    }
  },

  // Starts the scheduler timer (runs every 10 minutes)
  start(): void {
    console.log('🤖 Shop Owner Automation Scheduler started (monitoring low stock, daily summary, weekly digest)');
    setTimeout(() => {
      this.runSchedulerTick().catch((err) => console.error('[AUTOMATION SCHEDULER] Initial tick error:', err));
    }, 15000);

    setInterval(() => {
      this.runSchedulerTick().catch((err) => console.error('[AUTOMATION SCHEDULER] Periodic tick error:', err));
    }, 10 * 60 * 1000);
  },
};
