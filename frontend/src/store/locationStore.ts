import { create } from 'zustand';

export interface AddressDetails {
  road?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  fullAddress?: string;
}

export interface DetectedLocationResult {
  lat: number;
  lng: number;
  city: string;
  locationName: string;
  addressDetails?: AddressDetails;
}

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
  setLocation: (loc: {
    locationName: string;
    city: string;
    lat: number | null;
    lng: number | null;
  }) => void;
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

/**
 * Resilient multi-tier geolocation detector:
 * Tier 1: Browser Geolocation (low-accuracy standard query for laptops/phones)
 * Tier 2: IP-based Geolocation fallback (works on PCs without GPS chips or when permission is restricted)
 * Tier 3: OpenStreetMap Nominatim reverse geocoding to auto-fill street address, city, and postal code
 */
export const detectDeviceLocation = async (): Promise<DetectedLocationResult> => {
  let lat: number | null = null;
  let lng: number | null = null;
  let detectedCity = 'Local Area';

  // Tier 1: Try browser geolocation (4-second timeout, standard accuracy to avoid Windows GPS chip timeouts)
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 4000,
          maximumAge: 60000,
        });
      });
      lat = position.coords.latitude;
      lng = position.coords.longitude;
    } catch (geoErr) {
      console.warn('Browser geolocation timed out/denied, falling back to network IP geolocation:', geoErr);
    }
  }

  // Tier 2: Network IP Geolocation Fallback (Fast, reliable, zero permission prompts required)
  if (lat === null || lng === null) {
    try {
      const ipRes = await fetch('https://ipwho.is/');
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        if (ipData && ipData.success && typeof ipData.latitude === 'number') {
          lat = ipData.latitude;
          lng = ipData.longitude;
          detectedCity = ipData.city || ipData.region || 'Local Area';
        }
      }
    } catch (ipErr) {
      console.warn('IP geolocation service unreachable, checking secondary source:', ipErr);
      try {
        const altRes = await fetch('https://ipapi.co/json/');
        if (altRes.ok) {
          const altData = await altRes.json();
          if (typeof altData.latitude === 'number') {
            lat = altData.latitude;
            lng = altData.longitude;
            detectedCity = altData.city || altData.region || 'Local Area';
          }
        }
      } catch (altErr) {
        console.warn('Secondary IP geolocation failed:', altErr);
      }
    }
  }

  // Absolute fallback default if offline or unreachable
  if (lat === null || lng === null) {
    lat = 10.6629;
    lng = 77.0065;
    detectedCity = 'Pollachi';
  }

  // Tier 3: Reverse Geocoding with OpenStreetMap Nominatim to auto-fill exact street address
  let locationName = `${detectedCity}, Tamil Nadu, India`;
  let finalCity = detectedCity;
  let addressDetails: AddressDetails = {
    city: finalCity,
    fullAddress: locationName,
  };

  try {
    const revRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en' },
      }
    );

    if (revRes.ok) {
      const data = await revRes.json();
      if (data && data.display_name) {
        locationName = data.display_name;
        const addr = data.address || {};
        finalCity =
          addr.city ||
          addr.town ||
          addr.state_district ||
          addr.county ||
          addr.suburb ||
          addr.village ||
          detectedCity;

        addressDetails = {
          road: addr.road || '',
          suburb: addr.suburb || '',
          city: finalCity,
          state: addr.state || 'Tamil Nadu',
          postalCode: addr.postcode || '',
          fullAddress: locationName,
        };
      }
    }
  } catch (revErr) {
    console.warn('Reverse geocoding error:', revErr);
  }

  return {
    lat,
    lng,
    city: finalCity,
    locationName,
    addressDetails,
  };
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
    set({ isDetecting: true });

    try {
      const detected = await detectDeviceLocation();
      const loc = {
        locationName: detected.locationName,
        city: detected.city,
        lat: detected.lat,
        lng: detected.lng,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
      set({
        locationName: loc.locationName,
        city: loc.city,
        lat: loc.lat,
        lng: loc.lng,
        isDetecting: false,
        isModalOpen: false,
      });

      return true;
    } catch (err) {
      console.error('Location detection failed:', err);
      set({ isDetecting: false });
      return false;
    }
  },
}));
