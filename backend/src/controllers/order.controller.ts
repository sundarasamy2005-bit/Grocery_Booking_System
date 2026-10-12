import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Shop } from '../models/Shop';
import { User } from '../models/User';
import { Cart } from '../models/Cart';
import { Address } from '../models/Address';
import { AuthenticatedRequest } from '../types';
import { emailService } from '../services/email.service';

const generateOrderNumber = (): string => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ORD-${ts}-${rand}`;
};

const DELIVERY_FEE = 40; // ₹40 flat delivery fee

export const orderController = {
  // POST /api/orders
  async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = req.user!;
      const {
        shopId,
        items,          // [{ productId, quantity }]
        deliveryType,   // 'pickup' | 'delivery'
        addressId,      // optional if deliveryLocation provided
        deliveryLocation, // { address, latitude, longitude }
        customerNote,
      } = req.body as {
        shopId: string;
        items: { productId: string; quantity: number }[];
        deliveryType: 'pickup' | 'delivery';
        addressId?: string;
        deliveryLocation?: { address: string; latitude: number; longitude: number };
        customerNote?: string;
      };

      // Validate shop
      const shop = await Shop.findById(shopId).session(session).lean();
      if (!shop || !shop.isApproved || !shop.isActive) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: 'Shop is not available' });
        return;
      }

      if (deliveryType === 'delivery' && !shop.deliveryAvailable) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: 'This shop does not offer delivery' });
        return;
      }
      if (deliveryType === 'pickup' && !shop.pickupAvailable) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: 'This shop does not offer pickup' });
        return;
      }

      // Validate delivery location or saved address
      let deliveryAddress = undefined;
      let deliveryLocationData = undefined;

      if (deliveryType === 'delivery') {
        if (
          deliveryLocation?.address &&
          typeof deliveryLocation.latitude === 'number' &&
          typeof deliveryLocation.longitude === 'number'
        ) {
          deliveryLocationData = {
            address: deliveryLocation.address,
            latitude: Number(deliveryLocation.latitude),
            longitude: Number(deliveryLocation.longitude),
          };
          // Synthesize deliveryAddress for backwards compatibility
          deliveryAddress = {
            fullName: user.name || 'Customer',
            phone: user.phone || 'N/A',
            addressLine1: deliveryLocation.address,
            city: 'Local Area',
            state: 'Tamil Nadu',
            postalCode: '000000',
            latitude: deliveryLocationData.latitude,
            longitude: deliveryLocationData.longitude,
          };
        } else if (addressId) {
          const addr = await Address.findOne({
            _id: addressId,
            userId: user._id.toString(),
          })
            .session(session)
            .lean();
          if (!addr) {
            await session.abortTransaction();
            res.status(404).json({ success: false, message: 'Address not found' });
            return;
          }
          deliveryAddress = {
            fullName: addr.fullName,
            phone: addr.phone,
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2,
            city: addr.city,
            state: addr.state,
            postalCode: addr.postalCode,
            latitude: addr.latitude,
            longitude: addr.longitude,
          };
          if (addr.latitude && addr.longitude) {
            deliveryLocationData = {
              address: `${addr.addressLine1}, ${addr.city}, ${addr.postalCode}`,
              latitude: addr.latitude,
              longitude: addr.longitude,
            };
          }
        } else {
          await session.abortTransaction();
          res.status(400).json({ success: false, message: 'Delivery location or address is required' });
          return;
        }
      }

      // === BACKEND PRICE CALCULATION — never trust frontend prices ===
      const productIds = items.map((i) => i.productId);
      const products = await Product.find({ _id: { $in: productIds } })
        .session(session);

      const orderItems = [];
      let subtotal = 0;

      for (const reqItem of items) {
        const product = products.find((p) => p._id.toString() === reqItem.productId);

        if (!product) {
          await session.abortTransaction();
          res.status(404).json({
            success: false,
            message: `Product not found: ${reqItem.productId}`,
          });
          return;
        }

        if (product.shopId !== shopId && product.shopId.toString() !== shopId) {
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            message: `Product "${product.name}" does not belong to this shop`,
          });
          return;
        }

        if (!product.isAvailable) {
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            message: `Product "${product.name}" is not available`,
          });
          return;
        }

        if (product.stock < reqItem.quantity) {
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            message: `Only ${product.stock} "${product.name}" available in stock`,
          });
          return;
        }

        orderItems.push({
          productId: product._id.toString(),
          name: product.name,
          price: product.price,     // Always use DB price
          quantity: reqItem.quantity,
          imageUrl: product.imageUrl,
        });

        subtotal += product.price * reqItem.quantity;
      }

      // Check minimum order
      if (shop.minimumOrderAmount && subtotal < shop.minimumOrderAmount) {
        await session.abortTransaction();
        res.status(400).json({
          success: false,
          message: `Minimum order amount is ₹${shop.minimumOrderAmount}`,
        });
        return;
      }

      const deliveryFee = deliveryType === 'delivery' ? DELIVERY_FEE : 0;
      const totalAmount = subtotal + deliveryFee;

      // Create the order
      const [order] = await Order.create(
        [
          {
            orderNumber: generateOrderNumber(),
            userId: user._id.toString(),
            shopId,
            items: orderItems,
            subtotal,
            deliveryFee,
            totalAmount,
            deliveryType,
            deliveryLocation: deliveryLocationData,
            deliveryAddress,
            paymentMethod: 'COD',
            paymentStatus: 'pending',
            orderStatus: 'placed',
            customerNote,
          },
        ],
        { session }
      );

      // Deduct stock atomically
      for (const reqItem of items) {
        await Product.findByIdAndUpdate(
          reqItem.productId,
          { $inc: { stock: -reqItem.quantity } },
          { session }
        );
      }

      // Clear user cart
      await Cart.findOneAndUpdate(
        { userId: user._id.toString() },
        { items: [], shopId: undefined, subtotal: 0 },
        { session }
      );

      await session.commitTransaction();

      // Send emails asynchronously (don't block response)
      Promise.all([
        emailService.sendOrderPlacedEmail(user.email, user.name, order as never),
        emailService.sendNewOrderToShopEmail(
          shop.email,
          shop.shopName,
          order as never,
          user.name
        ),
      ]).catch((err) => console.error('Order email error:', err));

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order placed successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  },

  // GET /api/orders — customer order history
  async getMyOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '10', status } = req.query as Record<string, string>;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, unknown> = { userId: req.user!._id.toString() };
      if (status) filter.orderStatus = status;

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .populate('shopId', 'shopName city shopImage')
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

  // GET /api/orders/:id
  async getOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await Order.findById(req.params.id)
        .populate('shopId', 'shopName city shopImage address phone')
        .lean();

      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      const user = req.user!;
      // Customer can only see their own orders; shop owner and admin see all
      if (
        user.role === 'customer' &&
        order.userId !== user._id.toString()
      ) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
      }

      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/orders/shop — shop owner's orders
  async getShopOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const shop = await Shop.findOne({ ownerId: user._id.toString() }).lean();
      if (!shop) {
        res.json({
          success: true,
          data: [],
          message: 'No shop registered yet. Create your shop profile first.',
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        });
        return;
      }

      const { page = '1', limit = '20', status } = req.query as Record<string, string>;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, unknown> = { shopId: shop._id.toString() };
      if (status) filter.orderStatus = status;

      const [orders, total] = await Promise.all([
        Order.find(filter)
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

  // PATCH /api/orders/:id/status — shop owner updates status
  async updateOrderStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const { status } = req.body as { status: string };

      const order = await Order.findById(req.params.id);
      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      // Authorization check
      if (user.role === 'shopOwner') {
        const shop = await Shop.findOne({ ownerId: user._id.toString() }).lean();
        if (!shop || shop._id.toString() !== order.shopId.toString()) {
          res.status(403).json({ success: false, message: 'Not authorized' });
          return;
        }
      } else if (user.role !== 'admin') {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
      }

      // Valid status transitions
      const validTransitions: Record<string, string[]> = {
        placed: ['accepted', 'rejected'],
        accepted: ['preparing', 'cancelled'],
        preparing: ['ready'],
        ready: ['out_for_delivery', 'delivered'],
        out_for_delivery: ['delivered'],
        delivered: [],
        cancelled: [],
        rejected: [],
      };

      const allowed = validTransitions[order.orderStatus] || [];
      if (!allowed.includes(status)) {
        res.status(400).json({
          success: false,
          message: `Cannot transition from "${order.orderStatus}" to "${status}"`,
        });
        return;
      }

      // Restore stock if cancelling/rejecting
      if (['cancelled', 'rejected'].includes(status)) {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.quantity },
          });
        }
      }

      order.orderStatus = status as never;
      if (status === 'delivered') {
        order.paymentStatus = 'confirmed';
      }
      await order.save();

      // Send email notification
      const customer = await User.findById(order.userId).lean();
      if (customer) {
        emailService
          .sendOrderStatusEmail(customer.email, customer.name, order as never, status)
          .catch((err) => console.error('Status email error:', err));
      }

      res.json({ success: true, data: order, message: `Order status updated to "${status}"` });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/orders/:id/cancel — customer cancels their order
  async cancelOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const order = await Order.findById(req.params.id);

      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      if (order.userId !== user._id.toString()) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
      }

      const cancellableStatuses = ['placed', 'accepted'];
      if (!cancellableStatuses.includes(order.orderStatus)) {
        res.status(400).json({
          success: false,
          message: 'Order cannot be cancelled at this stage',
        });
        return;
      }

      // Restore stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
      }

      order.orderStatus = 'cancelled';
      await order.save();

      emailService
        .sendOrderStatusEmail(user.email, user.name, order as never, 'cancelled')
        .catch((err) => console.error('Cancel email error:', err));

      res.json({ success: true, data: order, message: 'Order cancelled successfully' });
    } catch (error) {
      next(error);
    }
  },
};
