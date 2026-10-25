import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    // Prevent spamming identical toasts
    if (get().toasts.some((t) => t.message === toast.message)) {
      return;
    }

    const id = `${Date.now()}-${Math.random()}`;
    const newToast: Toast = { ...toast, id };
    
    // Cap at maximum 3 visible toasts simultaneously
    set((state) => ({
      toasts: [...state.toasts.slice(-2), newToast],
    }));

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, toast.duration || 3500);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  success: (message) => {
    useToastStore.getState().addToast({ message, type: 'success' });
  },

  error: (message) => {
    useToastStore.getState().addToast({ message, type: 'error' });
  },

  info: (message) => {
    useToastStore.getState().addToast({ message, type: 'info' });
  },
}));

// Stable singleton helper that never causes re-renders when toasts update
export const toast = {
  success: (message: string) => useToastStore.getState().success(message),
  error: (message: string) => useToastStore.getState().error(message),
  info: (message: string) => useToastStore.getState().info(message),
};
