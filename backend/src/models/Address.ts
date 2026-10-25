import mongoose from 'mongoose';
import { IAddress } from '../types';

const addressSchema = new mongoose.Schema<IAddress>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    label: {
      type: String,
      enum: ['Home', 'Work', 'Other'],
      default: 'Home',
      trim: true,
    },
    houseStreet: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    areaCity: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    pinCode: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{6}$/, 'PIN code must be exactly 6 numeric digits'],
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: 150,
      default: '',
    },
    // Backwards compatibility fields
    fullName: {
      type: String,
      default: 'Customer',
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    addressLine1: {
      type: String,
      trim: true,
      default: function (this: any) {
        return this.houseStreet || '';
      },
    },
    addressLine2: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: function (this: any) {
        return this.areaCity || '';
      },
    },
    state: {
      type: String,
      trim: true,
      default: 'Tamil Nadu',
    },
    postalCode: {
      type: String,
      trim: true,
      default: function (this: any) {
        return this.pinCode || '';
      },
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Pre-save hook to synchronize compatibility fields
addressSchema.pre('save', function () {
  if (this.houseStreet && !this.addressLine1) {
    this.addressLine1 = this.houseStreet;
  }
  if (this.areaCity && !this.city) {
    this.city = this.areaCity;
  }
  if (this.pinCode && !this.postalCode) {
    this.postalCode = this.pinCode;
  }
});

export const Address = mongoose.model<IAddress>('Address', addressSchema);
