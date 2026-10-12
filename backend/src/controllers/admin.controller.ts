import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Shop } from '../models/Shop';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { AuthenticatedRequest } from '../types';

export const adminController = {
  // GET /api/admin/stats
  async getDashboardStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const [
        totalUsers,
        totalShops,
        approvedShops,
        pendingShops,
        totalProducts,
        totalOrders,
        completedOrders,
        cancelledOrders,
        revenueResult,
      ] = await Promise.all([
        User.countDocuments(),
        Shop.countDocuments(),
        Shop.countDocuments({ isApproved: true }),
        Shop.countDocuments({ isApproved: false }),
        Product.countDocuments(),
        Order.countDocuments(),
        Order.countDocuments({ orderStatus: 'delivered' }),
        Order.countDocuments({ orderStatus: { $in: ['cancelled', 'rejected'] } }),
        Order.aggregate([
          { $match: { orderStatus: 'delivered' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
      ]);

      const revenue = revenueResult[0]?.total || 0;

      res.json({
        success: true,
        data: {
          totalUsers,
          totalShops,
          approvedShops,
          pendingShops,
          totalProducts,
          totalOrders,
          completedOrders,
          cancelledOrders,
          revenue,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/admin/users
  async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '20', role, search } = req.query as Record<string, string>;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, unknown> = {};
      if (role) filter.role = role;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const [users, total] = await Promise.all([
        User.find(filter).select('-__v').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        User.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/admin/users/:id
  async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isActive, role } = req.body as { isActive?: boolean; role?: string };
      const update: Record<string, unknown> = {};

      if (isActive !== undefined) update.isActive = isActive;
      // Admin can change role but not to admin via this endpoint for safety
      if (role && ['customer', 'shopOwner'].includes(role)) update.role = role;

      const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.json({ success: true, data: user, message: 'User updated' });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/admin/shops
  async getShops(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '20', approved, search } = req.query as Record<string, string>;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, unknown> = {};
      if (approved !== undefined) filter.isApproved = approved === 'true';
      if (search) {
        filter.$or = [
          { shopName: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
        ];
      }

      const [shops, total] = await Promise.all([
        Shop.find(filter)
          .select('-__v')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Shop.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: shops,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/admin/shops/:id/approve
  async approveShop(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isApproved, isActive } = req.body as { isApproved?: boolean; isActive?: boolean };
      const update: Record<string, unknown> = {};
      if (isApproved !== undefined) update.isApproved = isApproved;
      if (isActive !== undefined) update.isActive = isActive;

      const shop = await Shop.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!shop) {
        res.status(404).json({ success: false, message: 'Shop not found' });
        return;
      }

      res.json({ success: true, data: shop, message: 'Shop status updated' });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/admin/orders
  async getAllOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '20', status } = req.query as Record<string, string>;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, unknown> = {};
      if (status) filter.orderStatus = status;

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .populate('shopId', 'shopName')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Order.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
