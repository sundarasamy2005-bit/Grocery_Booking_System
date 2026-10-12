export type Role = 'customer' | 'shopOwner' | 'admin';

export interface User {
  _id: string;
  firebaseUid: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Shop {
  _id: string;
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
  distance?: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export interface Product {
  _id: string;
  shopId: string | Shop;
  categoryId: string | Category;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  unit: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface CartItem {
  productId: Product;
  quantity: number;
}

export interface Cart {
  _id: string;
  userId: string;
  shopId: Shop | null;
  items: CartItem[];
  subtotal: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface DeliveryLocation {
  address: string;
  latitude: number;
  longitude: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  shopId: Shop;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryType: 'pickup' | 'delivery';
  deliveryLocation?: DeliveryLocation;
  deliveryAddress?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  paymentMethod: 'COD';
  orderStatus: 'placed' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'rejected';
  customerNote?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
