import mongoose from 'mongoose';
import { IReview } from '../types';

const reviewPhotoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema<IReview>(
  {
    productId: {
      type: String,
      required: true,
      ref: 'Product',
      index: true,
    },
    userId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    orderId: {
      type: String,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    photos: [reviewPhotoSchema],
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
      index: true,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulUsers: [
      {
        type: String,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, rating: -1 });

export const Review = mongoose.model<IReview>('Review', reviewSchema);
