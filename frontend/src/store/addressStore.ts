import { create } from 'zustand';
import { Address, AddressFormData } from '../types';
import { addressApi } from '../services/api';
import { useToastStore } from './toastStore';

const STORAGE_ACTIVE_ID = 'localgrocery_active_address_id';

interface AddressState {
  addresses: Address[];
  activeAddress: Address | null;
  isLoading: boolean;
  error: string | null;
  isModalOpen: boolean;
  editingAddress: Address | null;

  openModal: (editAddr?: Address) => void;
  closeModal: () => void;
  fetchAddresses: () => Promise<void>;
  selectActiveAddress: (address: Address) => void;
  addAddress: (data: AddressFormData) => Promise<Address | null>;
  updateAddress: (id: string, data: Partial<AddressFormData>) => Promise<boolean>;
  deleteAddress: (id: string) => Promise<boolean>;
  setDefaultAddress: (id: string) => Promise<boolean>;
}

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  activeAddress: null,
  isLoading: false,
  error: null,
  isModalOpen: false,
  editingAddress: null,

  openModal: (editAddr) => {
    set({ isModalOpen: true, editingAddress: editAddr || null });
  },

  closeModal: () => {
    set({ isModalOpen: false, editingAddress: null });
  },

  fetchAddresses: async () => {
    try {
      set({ isLoading: true, error: null });
      const list = await addressApi.getAddresses();
      const storedActiveId = localStorage.getItem(STORAGE_ACTIVE_ID);

      let chosen: Address | null = null;
      if (storedActiveId) {
        chosen = list.find((a) => a._id === storedActiveId) || null;
      }
      if (!chosen) {
        // Fall back to default address or first address
        chosen = list.find((a) => a.isDefault) || list[0] || null;
      }

      set({ addresses: list, activeAddress: chosen, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to load delivery addresses',
        isLoading: false,
      });
    }
  },

  selectActiveAddress: (address) => {
    localStorage.setItem(STORAGE_ACTIVE_ID, address._id);
    set({ activeAddress: address });
  },

  addAddress: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const newAddr = await addressApi.createAddress(data);
      const updatedList = await addressApi.getAddresses();

      localStorage.setItem(STORAGE_ACTIVE_ID, newAddr._id);
      set({
        addresses: updatedList,
        activeAddress: newAddr,
        isLoading: false,
        isModalOpen: false,
        editingAddress: null,
      });
      useToastStore.getState().success('Delivery address saved!');
      return newAddr;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save address';
      set({ error: msg, isLoading: false });
      useToastStore.getState().error(msg);
      return null;
    }
  },

  updateAddress: async (id, data) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await addressApi.updateAddress(id, data);
      const list = await addressApi.getAddresses();

      const currentActive = get().activeAddress;
      const newActive = currentActive?._id === id ? updated : currentActive;

      set({
        addresses: list,
        activeAddress: newActive,
        isLoading: false,
        isModalOpen: false,
        editingAddress: null,
      });
      useToastStore.getState().success('Address updated successfully');
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update address';
      set({ error: msg, isLoading: false });
      useToastStore.getState().error(msg);
      return false;
    }
  },

  deleteAddress: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await addressApi.deleteAddress(id);
      const list = await addressApi.getAddresses();

      const currentActive = get().activeAddress;
      let nextActive: Address | null = null;
      if (currentActive?._id === id) {
        nextActive = list.find((a) => a.isDefault) || list[0] || null;
        if (nextActive) {
          localStorage.setItem(STORAGE_ACTIVE_ID, nextActive._id);
        } else {
          localStorage.removeItem(STORAGE_ACTIVE_ID);
        }
      } else {
        nextActive = currentActive;
      }

      set({
        addresses: list,
        activeAddress: nextActive,
        isLoading: false,
      });
      useToastStore.getState().success('Address deleted');
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete address';
      set({ error: msg, isLoading: false });
      useToastStore.getState().error(msg);
      return false;
    }
  },

  setDefaultAddress: async (id) => {
    try {
      set({ isLoading: true });
      const updated = await addressApi.setDefault(id);
      const list = await addressApi.getAddresses();

      set({
        addresses: list,
        activeAddress: updated,
        isLoading: false,
      });
      localStorage.setItem(STORAGE_ACTIVE_ID, id);
      useToastStore.getState().success('Default address updated');
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to set default address';
      set({ error: msg, isLoading: false });
      useToastStore.getState().error(msg);
      return false;
    }
  },
}));
