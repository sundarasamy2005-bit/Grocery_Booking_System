import { create } from 'zustand';
import { api } from '../services/api';
import { Cart, Product } from '../types';

export interface CartConflictInfo {
  isOpen: boolean;
  product: Product;
  quantity: number;
  currentShopName: string;
  newShopName: string;
}

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  conflictModal: CartConflictInfo | null;
  fetchCart: () => Promise<void>;
  addToCart: (product: Product, quantity?: number, forceClear?: boolean) => Promise<boolean>;
  confirmReplaceCart: () => Promise<boolean>;
  closeConflictModal: () => void;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  error: null,
  conflictModal: null,

  fetchCart: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get('/cart');
      if (res.data.success) {
        set({ cart: res.data.data });
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load cart' });
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (product, quantity = 1, forceClear = false) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post('/cart/items', {
        productId: product._id,
        quantity,
        forceClear,
      });

      if (res.data.success) {
        set({ cart: res.data.data, conflictModal: null, error: null });
        return true;
      }
      return false;
    } catch (err: any) {
      if (err.response?.data?.code === 'DIFFERENT_SHOP') {
        // Open custom in-app modal without ugly window.confirm
        set({
          conflictModal: {
            isOpen: true,
            product,
            quantity,
            currentShopName: err.response?.data?.currentShopName || 'Another Store',
            newShopName:
              err.response?.data?.newShopName ||
              (typeof product.shopId === 'object' && product.shopId && 'shopName' in product.shopId
                ? (product.shopId as any).shopName
                : 'This Store'),
          },
        });
        return false;
      }

      const errorMsg = err.response?.data?.message || 'Failed to add item to cart';
      set({ error: errorMsg });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  confirmReplaceCart: async () => {
    const conflict = get().conflictModal;
    if (!conflict || !conflict.product) return false;

    const { product, quantity } = conflict;
    set({ conflictModal: null, isLoading: true });

    try {
      const res = await api.post('/cart/items', {
        productId: product._id,
        quantity,
        forceClear: true,
      });

      if (res.data.success) {
        set({ cart: res.data.data, error: null });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to replace cart' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  closeConflictModal: () => {
    set({ conflictModal: null });
  },

  updateQuantity: async (productId, quantity) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.put(`/cart/items/${productId}`, { quantity });
      if (res.data.success) {
        set({ cart: res.data.data });
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to update quantity' });
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (productId) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.delete(`/cart/items/${productId}`);
      if (res.data.success) {
        set({ cart: res.data.data });
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to remove item' });
    } finally {
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    try {
      set({ isLoading: true, error: null });
      await api.delete('/cart');
      set({ cart: null });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to clear cart' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
