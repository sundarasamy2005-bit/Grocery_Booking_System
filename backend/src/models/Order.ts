import mongoose from 'mongoose';
import { IOrder, IOrderItem, IDeliveryAddress } from '../types';

const orderItemSchema = new mongoose.Schema<IOrderItem>(
  {
    productId: { type: String, required: true, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    imageUrl: { type: String },
  },
  { _id: false }
);

const deliveryAddressSchema = new mongoose.Schema<IDeliveryAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { _id: false }
);

const deliveryLocationSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    shopId: {
      type: String,
      required: true,
      ref: 'Shop',
      index: true,
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
    deliveryType: {
      type: String,
      enum: ['pickup', 'delivery'],
      required: true,
    },
    deliveryLocation: deliveryLocationSchema,
    deliveryAddress: deliveryAddressSchema,
    paymentMethod: {
      type: String,
      enum: ['COD'],
      default: 'COD',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'confirmed'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: [
        'placed',
        'accepted',
        'preparing',
        'ready',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'rejected',
      ],
      default: 'placed',
      index: true,
    },
    customerNote: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ shopId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
