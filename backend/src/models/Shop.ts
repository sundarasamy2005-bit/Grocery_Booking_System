import mongoose from 'mongoose';
import { IShop } from '../types';

const shopSchema = new mongoose.Schema<IShop>(
  {
    ownerId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    shopName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    shopImage: {
      type: String,
    },
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deliveryAvailable: {
      type: Boolean,
      default: true,
    },
    pickupAvailable: {
      type: Boolean,
      default: true,
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
    },
    openingTime: {
      type: String,
      default: '08:00',
    },
    closingTime: {
      type: String,
      default: '21:00',
    },
    operatingDays: {
      type: [String],
      default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    announcement: {
      type: String,
      default: '',
      maxlength: 300,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 500,
    },
    estimatedDeliveryTime: {
      type: Number,
      default: 30, // in minutes
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Geospatial index for nearby shop queries
shopSchema.index({ latitude: 1, longitude: 1 });
shopSchema.index({ shopName: 'text', city: 'text' });

export const Shop = mongoose.model<IShop>('Shop', shopSchema);
