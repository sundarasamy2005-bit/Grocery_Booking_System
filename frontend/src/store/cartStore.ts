import { create } from 'zustand';
import { api, getActiveAuthToken } from '../services/api';
import { useAuthStore } from './authStore';
import { Cart, Product, Shop, ProductVariant } from '../types';

export interface CartConflictInfo {
  isOpen: boolean;
  product: Product;
  quantity: number;
  currentShopName: string;
  newShopName: string;
  variant?: ProductVariant;
}

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  conflictModal: CartConflictInfo | null;
  fetchCart: () => Promise<void>;
  addToCart: (
    product: Product,
    quantity?: number,
    forceClear?: boolean,
    variant?: ProductVariant
  ) => Promise<boolean>;
  confirmReplaceCart: () => Promise<boolean>;
  closeConflictModal: () => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartQuantity: (productId: string, variantId?: string) => number;
  getItemCount: () => number;
}

const GUEST_CART_STORAGE_KEY = 'localgrocery_guest_cart';

const loadSavedLocalCart = (): Cart | null => {
  try {
    const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Could not read saved cart from localStorage:', err);
  }
  return null;
};

const persistLocalCart = (cart: Cart | null) => {
  try {
    if (!cart || !cart.items || cart.items.length === 0) {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    } else {
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(cart));
    }
  } catch (err) {
    console.warn('Could not persist cart to localStorage:', err);
  }
};

const getShopObject = (shopId: string | Shop | undefined): Shop | null => {
  if (!shopId) return null;
  if (typeof shopId === 'object' && 'shopName' in shopId) {
    return shopId as Shop;
  }
  return {
    _id: shopId as string,
    ownerId: '',
    shopName: 'Local Store',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    latitude: 0,
    longitude: 0,
    isApproved: true,
    isActive: true,
    deliveryAvailable: true,
    pickupAvailable: true,
    minimumOrderAmount: 0,
  };
};

export const useCartStore = create<CartState>((set, get) => ({
  cart: loadSavedLocalCart(),
  isLoading: false,
  error: null,
  conflictModal: null,

  getCartQuantity: (productId: string, variantId?: string) => {
    const cart = get().cart;
    if (!cart?.items) return 0;
    const item = cart.items.find((i) => {
      const pid = typeof i.productId === 'object' && i.productId ? i.productId._id : (i.productId as any);
      if (pid !== productId) return false;
      if (variantId !== undefined) {
        return (i.variantId || '') === (variantId || '');
      }
      return true;
    });
    return item ? item.quantity : 0;
  },

  getItemCount: () => {
    const cart = get().cart;
    if (!cart?.items) return 0;
    return cart.items.reduce((total, i) => total + (i.quantity || 0), 0);
  },

  fetchCart: async () => {
    try {
      const cached = loadSavedLocalCart();
      if (cached && (!get().cart || get().cart?.items?.length === 0)) {
        set({ cart: cached });
      }

      const token = await getActiveAuthToken();
      const isAuth = !!token || useAuthStore.getState().isAuthenticated;

      if (!isAuth) {
        return;
      }

      set({ isLoading: true, error: null });
      const res = await api.get('/cart');
      if (res.data.success) {
        const serverCart = res.data.data;
        if (serverCart && serverCart.items && serverCart.items.length > 0) {
          set({ cart: serverCart, error: null });
          persistLocalCart(serverCart);
        } else if (cached && cached.items && cached.items.length > 0) {
          // Sync offline/guest cart items to the server
          for (const item of cached.items) {
            const pid = typeof item.productId === 'object' && item.productId ? item.productId._id : (item.productId as any);
            if (pid) {
              await api.post('/cart/items', {
                productId: pid,
                quantity: item.quantity,
                variantId: item.variantId,
                variantLabel: item.variantLabel,
                variantPrice: item.variantPrice,
                variantOriginalPrice: item.variantOriginalPrice,
              }).catch(() => {});
            }
          }
          const syncedRes = await api.get('/cart');
          if (syncedRes.data.success && syncedRes.data.data) {
            set({ cart: syncedRes.data.data, error: null });
            persistLocalCart(syncedRes.data.data);
          }
        } else {
          set({ cart: null, error: null });
          persistLocalCart(null);
        }
      }
    } catch (err: any) {
      console.warn('Could not fetch server cart:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (
    product: Product,
    quantity = 1,
    forceClear = false,
    variant?: ProductVariant
  ): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });

      if (product.stock <= 0 || !product.isAvailable) {
        set({ error: 'This item is currently out of stock.' });
        return false;
      }

      const variantId = variant?.id || '';
      const variantLabel = variant?.label || '';
      const unitPrice = variant?.price && variant.price > 0 ? variant.price : product.price;
      const unitOriginalPrice = variant?.originalPrice || product.originalPrice;

      const incomingShopId =
        typeof product.shopId === 'object' && product.shopId
          ? product.shopId._id
          : (product.shopId as string);

      const incomingShop = getShopObject(product.shopId);

      const token = await getActiveAuthToken();
      const isAuth = !!token || useAuthStore.getState().isAuthenticated;

      if (isAuth) {
        try {
          const res = await api.post('/cart/items', {
            productId: product._id,
            quantity,
            forceClear,
            variantId,
            variantLabel,
            variantPrice: unitPrice,
            variantOriginalPrice: unitOriginalPrice,
          });

          if (res.data.success && res.data.data) {
            set({ cart: res.data.data, conflictModal: null, error: null });
            persistLocalCart(res.data.data);
            return true;
          }
        } catch (err: any) {
          if (err.response?.data?.code === 'DIFFERENT_SHOP') {
            set({
              conflictModal: {
                isOpen: true,
                product,
                quantity,
                variant,
                currentShopName: err.response?.data?.currentShopName || 'Another Store',
                newShopName:
                  err.response?.data?.newShopName || incomingShop?.shopName || 'This Store',
              },
            });
            return false;
          }

          if (err.response?.status === 400) {
            set({ error: err.response.data?.message || 'Cannot add this item' });
            return false;
          }

          console.warn('Backend cart add failed, using local cart persistence:', err);
        }
      }

      // Guest / Offline fallback cart
      const currentCart = get().cart;
      if (currentCart && currentCart.items && currentCart.items.length > 0) {
        const currentShopId =
          typeof currentCart.shopId === 'object' && currentCart.shopId
            ? currentCart.shopId._id
            : (currentCart.shopId as any);

        if (currentShopId && incomingShopId && currentShopId !== incomingShopId && !forceClear) {
          const currentShopName =
            (typeof currentCart.shopId === 'object' && currentCart.shopId?.shopName) ||
            'Another Store';
          set({
            conflictModal: {
              isOpen: true,
              product,
              quantity,
              variant,
              currentShopName,
              newShopName: incomingShop?.shopName || 'This Store',
            },
          });
          return false;
        }
      }

      // Merge into local cart matching both productId AND variantId
      const newItems = forceClear || !currentCart || !currentCart.items ? [] : [...currentCart.items];
      const existingIdx = newItems.findIndex((item) => {
        const pid = typeof item.productId === 'object' && item.productId ? item.productId._id : (item.productId as any);
        const vid = item.variantId || '';
        return pid === product._id && vid === variantId;
      });

      if (existingIdx >= 0) {
        const curQty = newItems[existingIdx].quantity;
        const newQty = curQty + quantity;
        if (newQty > product.stock) {
          set({ error: `Only ${product.stock} items available in stock.` });
          return false;
        }
        newItems[existingIdx] = {
          ...newItems[existingIdx],
          quantity: newQty,
          variantPrice: unitPrice,
          variantOriginalPrice: unitOriginalPrice,
        };
      } else {
        if (quantity > product.stock) {
          set({ error: `Only ${product.stock} items available in stock.` });
          return false;
        }
        newItems.push({
          productId: product,
          quantity,
          variantId,
          variantLabel,
          variantPrice: unitPrice,
          variantOriginalPrice: unitOriginalPrice,
        });
      }

      const subtotal = newItems.reduce((sum, item) => {
        const price = item.variantPrice || (typeof item.productId === 'object' ? item.productId.price : product.price);
        return sum + (price || 0) * item.quantity;
      }, 0);

      const updatedCart: Cart = {
        _id: currentCart?._id || 'local_cart',
        userId: currentCart?.userId || 'guest',
        shopId: incomingShop,
        items: newItems,
        subtotal,
      };

      set({ cart: updatedCart, conflictModal: null, error: null });
      persistLocalCart(updatedCart);
      return true;
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to add item to cart';
      set({ error: errorMsg });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  confirmReplaceCart: async () => {
    const conflict = get().conflictModal;
    if (!conflict || !conflict.product) return false;

    const { product, quantity, variant } = conflict;
    set({ conflictModal: null });
    return get().addToCart(product, quantity, true, variant);
  },

  closeConflictModal: () => {
    set({ conflictModal: null });
  },

  updateQuantity: async (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      return get().removeItem(productId, variantId);
    }

    try {
      set({ isLoading: true, error: null });

      const cleanVariantId = variantId || '';
      const token = await getActiveAuthToken();
      const isAuth = !!token || useAuthStore.getState().isAuthenticated;

      if (isAuth) {
        try {
          const res = await api.put(`/cart/items/${productId}`, { quantity, variantId: cleanVariantId });
          if (res.data.success && res.data.data) {
            set({ cart: res.data.data, error: null });
            persistLocalCart(res.data.data);
            return;
          }
        } catch (err: any) {
          if (err.response?.status === 400) {
            set({ error: err.response.data?.message || 'Cannot update quantity' });
            return;
          }
          console.warn('Backend update quantity failed, falling back to local update:', err);
        }
      }

      // Local update
      const currentCart = get().cart;
      if (!currentCart || !currentCart.items) return;

      const newItems = currentCart.items.map((item) => {
        const pid = typeof item.productId === 'object' && item.productId ? item.productId._id : (item.productId as any);
        const vid = item.variantId || '';
        if (pid === productId && (variantId === undefined || vid === cleanVariantId)) {
          return { ...item, quantity };
        }
        return item;
      });

      const subtotal = newItems.reduce((sum, item) => {
        const price = item.variantPrice || (typeof item.productId === 'object' ? item.productId.price : 0);
        return sum + (price || 0) * item.quantity;
      }, 0);

      const updatedCart: Cart = {
        ...currentCart,
        items: newItems,
        subtotal,
      };

      set({ cart: updatedCart, error: null });
      persistLocalCart(updatedCart);
    } catch (err: any) {
      set({ error: err?.message || 'Failed to update quantity' });
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (productId: string, variantId?: string) => {
    try {
      set({ isLoading: true, error: null });

      const cleanVariantId = variantId || '';
      const token = await getActiveAuthToken();
      const isAuth = !!token || useAuthStore.getState().isAuthenticated;

      if (isAuth) {
        try {
          const res = await api.delete(`/cart/items/${productId}`, {
            params: variantId ? { variantId } : undefined,
          });
          if (res.data.success) {
            const nextCart = res.data.data || null;
            set({ cart: nextCart, error: null });
            persistLocalCart(nextCart);
            return;
          }
        } catch (err: any) {
          console.warn('Backend remove item failed, falling back to local update:', err);
        }
      }

      // Local update
      const currentCart = get().cart;
      if (!currentCart || !currentCart.items) return;

      const newItems = currentCart.items.filter((item) => {
        const pid = typeof item.productId === 'object' && item.productId ? item.productId._id : (item.productId as any);
        const vid = item.variantId || '';
        return !(pid === productId && (variantId === undefined || vid === cleanVariantId));
      });

      if (newItems.length === 0) {
        set({ cart: null, error: null });
        persistLocalCart(null);
        return;
      }

      const subtotal = newItems.reduce((sum, item) => {
        const price = item.variantPrice || (typeof item.productId === 'object' ? item.productId.price : 0);
        return sum + (price || 0) * item.quantity;
      }, 0);

      const updatedCart: Cart = {
        ...currentCart,
        items: newItems,
        subtotal,
      };

      set({ cart: updatedCart, error: null });
      persistLocalCart(updatedCart);
    } catch (err: any) {
      set({ error: err?.message || 'Failed to remove item' });
    } finally {
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    try {
      set({ isLoading: true, error: null });

      const token = await getActiveAuthToken();
      const isAuth = !!token || useAuthStore.getState().isAuthenticated;

      if (isAuth) {
        try {
          await api.delete('/cart');
        } catch (err: any) {
          console.warn('Backend clear cart failed:', err);
        }
      }

      set({ cart: null, error: null });
      persistLocalCart(null);
    } catch (err: any) {
      set({ error: err?.message || 'Failed to clear cart' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
