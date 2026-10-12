import mongoose from 'mongoose';
import { ICart, ICartItem } from '../types';

const cartItemSchema = new mongoose.Schema<ICartItem>(
  {
    productId: {
      type: String,
      required: true,
      ref: 'Product',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema<ICart>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
      unique: true,
    },
    shopId: {
      type: String,
      ref: 'Shop',
    },
    items: [cartItemSchema],
    subtotal: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Cart = mongoose.model<ICart>('Cart', cartSchema);
