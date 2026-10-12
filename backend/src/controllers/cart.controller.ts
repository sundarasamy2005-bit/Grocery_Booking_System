import { Response, NextFunction } from 'express';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { Shop } from '../models/Shop';
import { AuthenticatedRequest } from '../types';

export const cartController = {
  // GET /api/cart
  async getCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const cart = await Cart.findOne({ userId })
        .populate({
          path: 'items.productId',
          select: 'name price imageUrl unit isAvailable stock',
        })
        .populate('shopId', 'shopName city minimumOrderAmount deliveryAvailable pickupAvailable')
        .lean();

      if (!cart) {
        res.json({ success: true, data: { items: [], subtotal: 0, shopId: null } });
        return;
      }

      res.json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/cart/items — add item to cart
  async addToCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { productId, quantity = 1, forceClear = false } = req.body as {
        productId: string;
        quantity: number;
        forceClear?: boolean;
      };

      // Validate product
      const product = await Product.findById(productId).lean();
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      if (!product.isAvailable) {
        res.status(400).json({ success: false, message: 'Product is not available' });
        return;
      }
      if (product.stock < quantity) {
        res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available in stock`,
        });
        return;
      }

      // Validate shop
      const shop = await Shop.findById(product.shopId).lean();
      if (!shop || !shop.isApproved || !shop.isActive) {
        res.status(400).json({ success: false, message: 'Shop is not available' });
        return;
      }

      let cart = await Cart.findOne({ userId });

      // If forceClear requested, or no cart exists, or cart is currently empty:
      if (forceClear || !cart || cart.items.length === 0) {
        if (!cart) {
          cart = new Cart({ userId });
        }
        cart.shopId = product.shopId.toString();
        cart.items = [{ productId, quantity }];
        cart.subtotal = product.price * quantity;
      } else if (cart.shopId && cart.shopId.toString() !== product.shopId.toString()) {
        // Different shop with active items
        const currentShop = await Shop.findById(cart.shopId).select('shopName').lean();
        res.status(409).json({
          success: false,
          message: `Your cart contains items from ${currentShop?.shopName || 'another store'}. Clear cart to add this item.`,
          code: 'DIFFERENT_SHOP',
          currentShopId: cart.shopId.toString(),
          currentShopName: currentShop?.shopName || 'Another Store',
          newShopId: product.shopId.toString(),
          newShopName: shop.shopName,
        });
        return;
      } else {
        // Same shop — update or add item
        cart.shopId = product.shopId.toString();
        const existingItem = cart.items.find(
          (item) => item.productId.toString() === productId
        );
        if (existingItem) {
          const newQty = existingItem.quantity + quantity;
          if (newQty > product.stock) {
            res.status(400).json({
              success: false,
              message: `Only ${product.stock} items available. You already have ${existingItem.quantity} in cart.`,
            });
            return;
          }
          existingItem.quantity = newQty;
        } else {
          cart.items.push({ productId, quantity });
        }

        // Recalculate subtotal
        const productIds = cart.items.map((i) => i.productId.toString());
        const products = await Product.find({ _id: { $in: productIds } }).lean();
        const priceMap = Object.fromEntries(products.map((p) => [p._id.toString(), p.price]));
        cart.subtotal = cart.items.reduce(
          (sum, item) => sum + (priceMap[item.productId.toString()] || 0) * item.quantity,
          0
        );
      }

      await cart.save();

      const populatedCart = await Cart.findById(cart._id)
        .populate({ path: 'items.productId', select: 'name price imageUrl unit isAvailable stock' })
        .populate('shopId', 'shopName city minimumOrderAmount deliveryAvailable pickupAvailable')
        .lean();

      res.json({ success: true, data: populatedCart, message: 'Item added to cart' });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/cart/items/:productId
  async updateCartItem(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { productId } = req.params;
      const { quantity } = req.body as { quantity: number };

      if (!quantity || quantity < 1) {
        res.status(400).json({ success: false, message: 'Invalid quantity' });
        return;
      }

      const product = await Product.findById(productId).lean();
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      if (quantity > product.stock) {
        res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available`,
        });
        return;
      }

      const cart = await Cart.findOne({ userId });
      if (!cart) {
        res.status(404).json({ success: false, message: 'Cart not found' });
        return;
      }

      const item = cart.items.find((i) => i.productId.toString() === productId);
      if (!item) {
        res.status(404).json({ success: false, message: 'Item not in cart' });
        return;
      }

      item.quantity = quantity;

      // Recalculate subtotal
      const productIds = cart.items.map((i) => i.productId.toString());
      const products = await Product.find({ _id: { $in: productIds } }).lean();
      const priceMap = Object.fromEntries(products.map((p) => [p._id.toString(), p.price]));
      cart.subtotal = cart.items.reduce(
        (sum, i) => sum + (priceMap[i.productId.toString()] || 0) * i.quantity,
        0
      );

      await cart.save();

      const populatedCart = await Cart.findById(cart._id)
        .populate({ path: 'items.productId', select: 'name price imageUrl unit isAvailable stock' })
        .populate('shopId', 'shopName city minimumOrderAmount deliveryAvailable pickupAvailable')
        .lean();

      res.json({ success: true, data: populatedCart });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/cart/items/:productId
  async removeCartItem(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { productId } = req.params;

      const cart = await Cart.findOne({ userId });
      if (!cart) {
        res.status(404).json({ success: false, message: 'Cart not found' });
        return;
      }

      cart.items = cart.items.filter((i) => i.productId.toString() !== productId);

      if (cart.items.length === 0) {
        await Cart.deleteOne({ userId });
        res.json({ success: true, data: null, message: 'Item removed, cart is now empty' });
        return;
      } else {
        const productIds = cart.items.map((i) => i.productId.toString());
        const products = await Product.find({ _id: { $in: productIds } }).lean();
        const priceMap = Object.fromEntries(products.map((p) => [p._id.toString(), p.price]));
        cart.subtotal = cart.items.reduce(
          (sum, i) => sum + (priceMap[i.productId.toString()] || 0) * i.quantity,
          0
        );
        await cart.save();
        res.json({ success: true, data: cart, message: 'Item removed from cart' });
      }
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/cart — clear entire cart
  async clearCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      await Cart.deleteOne({ userId });
      res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
      next(error);
    }
  },
};
