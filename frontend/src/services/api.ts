import axios from 'axios';
import { auth } from '../config/firebase';
import { onIdTokenChanged } from 'firebase/auth';
import { env } from '../config/env';
import { ProductReviewsResponse, Review, Address, AddressFormData, User, Product } from '../types';

export const api = axios.create({
  baseURL: env.apiUrl,
});

// Cache token in memory and localStorage immediately upon token changes
let inMemoryToken: string | null = localStorage.getItem('localgrocery_token');

onIdTokenChanged(auth, async (user) => {
  if (user) {
    try {
      const token = await user.getIdToken();
      inMemoryToken = token;
      localStorage.setItem('localgrocery_token', token);
    } catch (e) {
      console.warn('Could not refresh ID token in memory:', e);
    }
  } else {
    inMemoryToken = null;
    localStorage.removeItem('localgrocery_token');
  }
});

// Helper to reliably get the current Firebase ID token with multi-layered fallbacks
export const getActiveAuthToken = async (): Promise<string | null> => {
  try {
    // 1. If auth is not ready yet, wait for Firebase to restore session from IndexedDB
    if (!auth.currentUser) {
      await auth.authStateReady();
    }

    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        inMemoryToken = token;
        localStorage.setItem('localgrocery_token', token);
        return token;
      }
    }
  } catch (err) {
    console.warn('Error fetching active Firebase auth token:', err);
  }

  // 2. Return memory or cached storage token if available
  return inMemoryToken || localStorage.getItem('localgrocery_token');
};

api.interceptors.request.use(
  async (config) => {
    const token = await getActiveAuthToken();
    if (token) {
      if (config.headers && typeof (config.headers as any).set === 'function') {
        (config.headers as any).set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Auto-retry once on 401 by force-refreshing Firebase token
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        if (!auth.currentUser) {
          await auth.authStateReady();
        }
        if (auth.currentUser) {
          const freshToken = await auth.currentUser.getIdToken(true);
          if (freshToken) {
            inMemoryToken = freshToken;
            localStorage.setItem('localgrocery_token', freshToken);
            if (originalRequest.headers && typeof (originalRequest.headers as any).set === 'function') {
              (originalRequest.headers as any).set('Authorization', `Bearer ${freshToken}`);
            } else {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers['Authorization'] = `Bearer ${freshToken}`;
            }
            return api(originalRequest);
          }
        }
      } catch (refreshErr) {
        console.warn('Failed to force refresh Firebase token on 401:', refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export const reviewApi = {
  getReviews: async (
    productId: string,
    params?: {
      page?: number;
      limit?: number;
      sort?: string;
      rating?: number;
      withPhotos?: boolean;
    }
  ): Promise<ProductReviewsResponse> => {
    const res = await api.get<ProductReviewsResponse>(`/reviews/product/${productId}`, { params });
    return res.data;
  },

  submitReview: async (
    productId: string,
    formData: FormData
  ): Promise<{ success: boolean; message: string; data: Review }> => {
    const res = await api.post<{ success: boolean; message: string; data: Review }>(
      `/reviews/product/${productId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  },

  voteHelpful: async (
    reviewId: string
  ): Promise<{ success: boolean; data: { helpfulVotes: number; voted: boolean } }> => {
    const res = await api.post<{ success: boolean; data: { helpfulVotes: number; voted: boolean } }>(
      `/reviews/${reviewId}/helpful`
    );
    return res.data;
  },

  deleteReview: async (
    reviewId: string
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<{ success: boolean; message: string }>(`/reviews/${reviewId}`);
    return res.data;
  },
};

export const addressApi = {
  getAddresses: async (): Promise<Address[]> => {
    const res = await api.get<{ success: boolean; data: Address[] }>('/addresses');
    return res.data.data || [];
  },

  createAddress: async (data: AddressFormData): Promise<Address> => {
    const res = await api.post<{ success: boolean; data: Address; message: string }>('/addresses', data);
    return res.data.data;
  },

  updateAddress: async (id: string, data: Partial<AddressFormData>): Promise<Address> => {
    const res = await api.put<{ success: boolean; data: Address; message: string }>(`/addresses/${id}`, data);
    return res.data.data;
  },

  deleteAddress: async (id: string): Promise<void> => {
    await api.delete(`/addresses/${id}`);
  },

  setDefault: async (id: string): Promise<Address> => {
    const res = await api.patch<{ success: boolean; data: Address; message: string }>(`/addresses/${id}/default`);
    return res.data.data;
  },
};

export const favoriteApi = {
  getFavorites: async (): Promise<Product[]> => {
    const res = await api.get<{ success: boolean; data: Product[] }>('/users/favorites');
    return res.data.data || [];
  },

  toggleFavorite: async (productId: string): Promise<{ isFavorite: boolean; favorites: string[] }> => {
    const res = await api.post<{ success: boolean; data: { isFavorite: boolean; favorites: string[] }; message: string }>(
      `/users/favorites/${productId}`
    );
    return res.data.data;
  },

  removeFavorite: async (productId: string): Promise<{ favorites: string[] }> => {
    const res = await api.delete<{ success: boolean; data: { favorites: string[] }; message: string }>(
      `/users/favorites/${productId}`
    );
    return res.data.data;
  },
};

export const userApi = {
  getProfile: async (): Promise<User> => {
    const res = await api.get<{ success: boolean; data: User }>('/users/profile');
    return res.data.data;
  },

  updateProfile: async (data: { name?: string; phone?: string }): Promise<User> => {
    const res = await api.put<{ success: boolean; data: User; message: string }>('/users/profile', data);
    return res.data.data;
  },

  uploadProfileImage: async (formData: FormData): Promise<User> => {
    const res = await api.post<{ success: boolean; data: User; message: string }>('/users/profile/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  updateSettings: async (settings: { notificationsEnabled?: boolean }): Promise<{ notificationsEnabled?: boolean }> => {
    const res = await api.put<{ success: boolean; data: { notificationsEnabled?: boolean }; message: string }>(
      '/users/settings',
      settings
    );
    return res.data.data;
  },

  deleteAccount: async (): Promise<{ message: string }> => {
    const res = await api.delete<{ success: boolean; message: string }>('/users/account');
    return res.data;
  },
};


