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
  favorites?: string[];
  notificationsEnabled?: boolean;
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
  sku?: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  images?: string[];
  brand?: string;
  freshnessInfo?: string;
  averageRating?: number;
  totalReviews?: number;
  unitsSold?: number;
  stock: number;
  unit: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface ProductVariant {
  id: string;
  label: string;
  shortLabel?: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  isDefault?: boolean;
}

export interface CartItem {
  _id?: string;
  productId: Product;
  quantity: number;
  variantId?: string;
  variantLabel?: string;
  variantPrice?: number;
  variantOriginalPrice?: number;
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
  variantId?: string;
  variantLabel?: string;
}

export interface DeliveryLocation {
  address: string;
  latitude: number;
  longitude: number;
}

export type AddressLabel = 'Home' | 'Work' | 'Other';

export interface Address {
  _id: string;
  userId: string;
  label: AddressLabel;
  houseStreet: string;
  areaCity: string;
  pinCode: string;
  landmark?: string;
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddressFormData {
  label: AddressLabel;
  houseStreet: string;
  areaCity: string;
  pinCode: string;
  landmark?: string;
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  isDefault?: boolean;
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

export interface ReviewPhoto {
  url: string;
  publicId?: string;
}

export interface ReviewAuthor {
  _id: string;
  name: string;
  profileImage?: string;
}

export interface Review {
  _id: string;
  productId: string;
  userId: ReviewAuthor;
  orderId?: string;
  rating: number;
  title?: string;
  comment: string;
  photos: ReviewPhoto[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  helpfulUsers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  breakdown: Record<number, { count: number; percentage: number }>;
  photosCount: number;
  customerPhotos: Array<{
    url: string;
    rating: number;
    title?: string;
  }>;
  purchaseStats: {
    distinctBuyers: number;
    totalUnitsSold: number;
  };
}

export interface UserReviewState {
  hasReviewed: boolean;
  userReview: Review | null;
  hasPurchased: boolean;
  isDelivered: boolean;
}

export interface ProductReviewsResponse {
  success: boolean;
  data: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: ReviewStats;
  userState: UserReviewState;
}
