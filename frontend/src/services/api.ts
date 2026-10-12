import axios from 'axios';
import { auth } from '../config/firebase';
import { onIdTokenChanged } from 'firebase/auth';
import { env } from '../config/env';

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
