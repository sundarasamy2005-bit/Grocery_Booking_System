import { create } from 'zustand';
import { Product } from '../types';
import { favoriteApi } from '../services/api';

interface FavoriteState {
  favorites: Product[];
  favoriteIds: Set<string>;
  isLoading: boolean;
  error: string | null;

  fetchFavorites: () => Promise<void>;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product | { _id: string }) => Promise<boolean>;
  removeFavorite: (productId: string) => Promise<void>;
  clearFavorites: () => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],
  favoriteIds: new Set<string>(),
  isLoading: false,
  error: null,

  fetchFavorites: async () => {
    try {
      set({ isLoading: true, error: null });
      const items = await favoriteApi.getFavorites();
      const ids = new Set(items.map((item) => item._id));
      set({ favorites: items, favoriteIds: ids });
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
      set({ error: err.response?.data?.message || 'Failed to load favorites' });
    } finally {
      set({ isLoading: false });
    }
  },

  isFavorite: (productId: string) => {
    return get().favoriteIds.has(productId);
  },

  toggleFavorite: async (product: Product | { _id: string }) => {
    const id = product._id;
    const currentIds = new Set(get().favoriteIds);
    const wasFavorite = currentIds.has(id);

    // Optimistic update
    if (wasFavorite) {
      currentIds.delete(id);
      set({
        favoriteIds: new Set(currentIds),
        favorites: get().favorites.filter((p) => p._id !== id),
      });
    } else {
      currentIds.add(id);
      const isFullProduct = 'name' in product && 'price' in product;
      set({
        favoriteIds: new Set(currentIds),
        favorites: isFullProduct
          ? [product as Product, ...get().favorites]
          : get().favorites,
      });
    }

    try {
      const res = await favoriteApi.toggleFavorite(id);
      const serverIds = new Set(res.favorites || []);
      set({ favoriteIds: serverIds });
      return res.isFavorite;
    } catch (err: any) {
      // Rollback on failure
      console.error('Failed to toggle favorite:', err);
      if (wasFavorite) {
        currentIds.add(id);
      } else {
        currentIds.delete(id);
      }
      set({
        favoriteIds: new Set(currentIds),
        error: err.response?.data?.message || 'Failed to update favorite',
      });
      return wasFavorite;
    }
  },

  removeFavorite: async (productId: string) => {
    const currentIds = new Set(get().favoriteIds);
    currentIds.delete(productId);
    const prevFavorites = get().favorites;
    set({
      favoriteIds: new Set(currentIds),
      favorites: prevFavorites.filter((p) => p._id !== productId),
    });

    try {
      await favoriteApi.removeFavorite(productId);
    } catch (err: any) {
      console.error('Failed to remove favorite:', err);
      currentIds.add(productId);
      set({
        favoriteIds: new Set(currentIds),
        favorites: prevFavorites,
      });
    }
  },

  clearFavorites: () => {
    set({ favorites: [], favoriteIds: new Set<string>(), error: null });
  },
}));
