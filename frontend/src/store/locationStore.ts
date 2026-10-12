import { create } from 'zustand';

export interface LocationState {
  locationName: string;
  city: string;
  lat: number | null;
  lng: number | null;
  orderPreference: 'delivery' | 'pickup';
  isModalOpen: boolean;
  isDetecting: boolean;
  
  openModal: () => void;
  closeModal: () => void;
  setLocation: (loc: { locationName: string; city: string; lat: number | null; lng: number | null }) => void;
  setOrderPreference: (pref: 'delivery' | 'pickup') => void;
  detectCurrentLocation: () => Promise<boolean>;
}

const STORAGE_KEY = 'localgrocery_location';
const PREF_KEY = 'localgrocery_order_pref';

const loadStoredLocation = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return {
    locationName: 'Pollachi, Tamil Nadu',
    city: 'Pollachi',
    lat: 10.6609,
    lng: 77.0048,
  };
};

const loadStoredPref = (): 'delivery' | 'pickup' => {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw === 'pickup' || raw === 'delivery') return raw;
  } catch (e) {
    console.error(e);
  }
  return 'delivery';
};

const initialLoc = loadStoredLocation();

export const useLocationStore = create<LocationState>((set) => ({
  locationName: initialLoc.locationName,
  city: initialLoc.city,
  lat: initialLoc.lat,
  lng: initialLoc.lng,
  orderPreference: loadStoredPref(),
  isModalOpen: false,
  isDetecting: false,

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  setLocation: (loc) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    set({
      locationName: loc.locationName,
      city: loc.city,
      lat: loc.lat,
      lng: loc.lng,
      isModalOpen: false,
    });
  },

  setOrderPreference: (pref) => {
    localStorage.setItem(PREF_KEY, pref);
    set({ orderPreference: pref });
  },

  detectCurrentLocation: async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return false;
    }

    set({ isDetecting: true });

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          let locationName = `GPS: ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
          let city = 'Current Location';

          try {
            // Optional reverse geocoding via OpenStreetMap Nominatim
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            );
            if (res.ok) {
              const data = await res.json();
              city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || 'My Area';
              const state = data.address?.state || '';
              locationName = `${city}${state ? ', ' + state : ''}`;
            }
          } catch (err) {
            console.warn('Reverse geocoding failed, using coordinates', err);
          }

          const loc = { locationName, city, lat, lng };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
          set({
            locationName,
            city,
            lat,
            lng,
            isDetecting: false,
            isModalOpen: false,
          });
          resolve(true);
        },
        (error) => {
          console.error('Geolocation error:', error);
          set({ isDetecting: false });
          alert('Unable to retrieve your location. Please select your city manually.');
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  },
}));
