import { Request } from 'express';
import { Document } from 'mongoose';

// ─── User Types ───────────────────────────────────────────────
export type UserRole = 'customer' | 'shopOwner' | 'admin';
export type PaymentMethod = 'COD';
export type PaymentStatus = 'pending' | 'confirmed';
export type DeliveryType = 'pickup' | 'delivery';
export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

export interface IUser extends Document {
  firebaseUid: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IShop extends Document {
  ownerId: string;
  shopName: string;
  description?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  shopImage?: string;
  isApproved: boolean;
  isActive: boolean;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  minimumOrderAmount: number;
  openingTime?: string;
  closingTime?: string;
  operatingDays?: string[];
  announcement?: string;
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
  estimatedDeliveryTime?: number;
  isOpen?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface IProduct extends Document {
  shopId: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  unit: string;
  imageUrl?: string;
  cloudinaryPublicId?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItem {
  productId: string;
  quantity: number;
}

export interface ICart extends Document {
  userId: string;
  shopId: string;
  items: ICartItem[];
  subtotal: number;
  updatedAt: Date;
}

export interface IAddress extends Document {
  userId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface IDeliveryAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
}

export interface IDeliveryLocation {
  address: string;
  latitude: number;
  longitude: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: string;
  shopId: string;
  items: IOrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryType: DeliveryType;
  deliveryLocation?: IDeliveryLocation;
  deliveryAddress?: IDeliveryAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  customerNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Express Extension ────────────────────────────────────────
export interface AuthenticatedRequest extends Request {
  user?: IUser;
  firebaseUid?: string;
}

// ─── API Response ─────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}
