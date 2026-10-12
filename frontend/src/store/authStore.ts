import { create } from 'zustand';
import { User } from '../types';
import { api } from '../services/api';
import { auth, googleProvider } from '../config/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  syncUser: (extraData?: { name?: string; role?: string }) => Promise<User | null>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  syncUser: async (extraData?: { name?: string; role?: string }): Promise<User | null> => {
    try {
      set({ isLoading: true, error: null });
      const pendingRole = sessionStorage.getItem('pending_registration_role');
      const pendingName = sessionStorage.getItem('pending_registration_name');

      const payload = {
        name: extraData?.name || pendingName || undefined,
        role: extraData?.role || pendingRole || undefined,
      };

      // The API interceptor will automatically attach the Firebase token
      const response = await api.post('/auth/sync', payload);
      
      if (response.data.success) {
        const syncedUser = response.data.data as User;
        sessionStorage.removeItem('pending_registration_role');
        sessionStorage.removeItem('pending_registration_name');
        set({ user: syncedUser, isAuthenticated: true });
        return syncedUser;
      }
      return null;
    } catch (err: any) {
      console.error('User sync error:', err);
      set({ error: err.response?.data?.message || 'Authentication failed' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      localStorage.removeItem('localgrocery_token');
      await firebaseSignOut(auth);
      set({ user: null, isAuthenticated: false, error: null });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
