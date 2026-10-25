import { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  CheckCircle,
  Loader2,
  Search,
  X,
  AlertTriangle,
  Edit3,
} from 'lucide-react';
import { detectDeviceLocation } from '../store/locationStore';

export interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

export type Location = LocationData;

interface LocationPickerProps {
  onConfirm?: (location: LocationData) => void;
  onLocationConfirm?: (location: LocationData) => void;
  initialLocation?: LocationData | null;
  defaultCenter?: { latitude: number; longitude: number };
}

// Custom modern SVG/div marker icon with blue pulse ring (avoids external asset loading issues)
const customMarkerIcon = L.divIcon({
  className: 'custom-leaflet-pin',
  html: `
    <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:32px;height:32px;background:rgba(8,125,181,0.25);border-radius:50%;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="position:relative;background:#087DB5;width:22px;height:22px;border:3px solid white;border-radius:50%;box-shadow:0 3px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
        <div style="width:6px;height:6px;background:white;border-radius:50%;"></div>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

function MapController({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, map.getZoom() < 14 ? 15 : map.getZoom(), {
      animate: true,
    });
  }, [position, map]);

  return null;
}

function MapClick({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export default function LocationPicker({
  onConfirm,
  onLocationConfirm,
  initialLocation,
  defaultCenter = { latitude: 10.6629, longitude: 77.0065 }, // Pollachi default center
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>([
    initialLocation?.latitude ?? defaultCenter.latitude,
    initialLocation?.longitude ?? defaultCenter.longitude,
  ]);

  const [address, setAddress] = useState<string>(
    initialLocation?.address || 'Pollachi, Tamil Nadu, India'
  );
  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<
    Array<{ display_name: string; lat: string; lon: string }>
  >([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  // Status & loading states
  const [geoLoading, setGeoLoading] = useState<boolean>(false);
  const [addressLoading, setAddressLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reverse geocode lat/lng to readable address
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      setAddressLoading(true);
      setErrorMessage('');

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Could not fetch address details');
      }

      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
      }
    } catch (err) {
      console.warn('Reverse geocoding failed:', err);
      // Fallback: keep coordinates as readable location
      setAddress(`Delivery Pin (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
    } finally {
      setAddressLoading(false);
    }
  };

  // Place search via Nominatim
  const handlePlaceSearch = async (queryText: string) => {
    if (!queryText.trim() || queryText.trim().length < 2) return;

    try {
      setIsSearching(true);
      setErrorMessage('');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          queryText.trim()
        )}&countrycodes=in&limit=5`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );

      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setShowSearchResults(true);
      }
    } catch (err) {
      console.error('Nominatim place search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (res: {
    display_name: string;
    lat: string;
    lon: string;
  }) => {
    const lat = parseFloat(res.lat);
    const lng = parseFloat(res.lon);
    setPosition([lat, lng]);
    setAddress(res.display_name);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // Map pin select
  const handleMapSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    fetchAddress(lat, lng);
  };

  // GPS "Use My Location" (Auto-detects coordinates, moves map pin, and auto-fills street address)
  const handleUseMyLocation = async () => {
    try {
      setGeoLoading(true);
      setErrorMessage('');

      const detected = await detectDeviceLocation();
      setPosition([detected.lat, detected.lng]);
      setAddress(detected.locationName);

      const locData: LocationData = {
        address: detected.locationName,
        latitude: detected.lat,
        longitude: detected.lng,
      };

      if (onConfirm) onConfirm(locData);
      if (onLocationConfirm) onLocationConfirm(locData);
    } catch (err: any) {
      console.error('GPS Detection failed:', err);
      setErrorMessage('Unable to detect location. Please search your area or drag the map pin.');
    } finally {
      setGeoLoading(false);
    }
  };

  // Confirm Location Handler
  const handleConfirm = () => {
    const finalAddress = address.trim() || `Location (${position[0].toFixed(5)}, ${position[1].toFixed(5)})`;
    const locData: LocationData = {
      address: finalAddress,
      latitude: position[0],
      longitude: position[1],
    };

    if (onConfirm) onConfirm(locData);
    if (onLocationConfirm) onLocationConfirm(locData);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Use My Location GPS button + Manual Search */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={geoLoading}
          className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-all shadow-xs disabled:opacity-60 shrink-0 cursor-pointer"
        >
          {geoLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Detecting GPS Location...</span>
            </>
          ) : (
            <>
              <Navigation size={15} />
              <span>📍 Use My Location</span>
            </>
          )}
        </button>

        {/* Place Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePlaceSearch(searchQuery);
            }}
            className="relative flex items-center"
          >
            <Search
              size={15}
              className="absolute left-3.5 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim().length >= 2) {
                  handlePlaceSearch(e.target.value);
                } else {
                  setShowSearchResults(false);
                }
              }}
              placeholder="Search area, landmark, or street name..."
              className="w-full pl-9 pr-20 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-[#2D3748] text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="absolute right-12 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              {isSearching ? <Loader2 size={12} className="animate-spin" /> : 'Find'}
            </button>
          </form>

          {/* Place Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#172033] rounded-2xl shadow-xl border border-slate-200 dark:border-[#2D3748] z-50 overflow-hidden divide-y divide-slate-100 dark:divide-[#2D3748] max-h-56 overflow-y-auto animate-scale-in">
              {searchResults.map((res, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left p-3 hover:bg-sky-50/70 dark:hover:bg-[#111827] transition-colors flex items-start gap-2.5 cursor-pointer"
                >
                  <MapPin size={15} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-800 dark:text-[#F9FAFB] font-medium line-clamp-2">
                    {res.display_name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Alert Message (GPS Denied or Failure) */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 animate-fade-in"
        >
          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
              You can search your area or drag the pin on the map to choose your exact delivery point.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Interactive Leaflet Map */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-[#2D3748] shadow-sm relative">
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={true}
          style={{ height: '360px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController position={position} />

          <MapClick onSelect={handleMapSelect} />

          <Marker
            position={position}
            icon={customMarkerIcon}
            draggable={true}
            eventHandlers={{
              dragend(event) {
                const point = event.target.getLatLng();
                handleMapSelect(point.lat, point.lng);
              },
            }}
          />
        </MapContainer>

        {/* Map overlay hint */}
        <div className="absolute top-3 right-3 bg-white/95 dark:bg-[#172033]/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-slate-700 dark:text-[#F9FAFB] shadow-sm pointer-events-none z-[1000] border border-slate-200 dark:border-[#2D3748]">
          📍 Drag marker or click anywhere
        </div>
      </div>

      {/* Address Details & Manual Address Entry Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#2D3748] bg-slate-50 dark:bg-[#111827] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 dark:text-[#F9FAFB] font-extrabold text-xs sm:text-sm">
            <MapPin size={16} className="text-sky-600 dark:text-sky-400" />
            <span>Selected Delivery Address</span>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingAddress(!isEditingAddress)}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
          >
            <Edit3 size={13} />
            <span>{isEditingAddress ? 'Done Editing' : 'Edit Manually'}</span>
          </button>
        </div>

        {addressLoading ? (
          <div className="flex items-center gap-2 p-2.5 text-xs text-slate-500 dark:text-[#A7B3C5] font-medium bg-white dark:bg-[#172033] rounded-xl border border-slate-200 dark:border-[#2D3748]">
            <Loader2 size={14} className="animate-spin text-sky-600 dark:text-sky-400" />
            <span>Finding street address from OpenStreetMap...</span>
          </div>
        ) : isEditingAddress ? (
          <div className="space-y-1.5 animate-scale-in">
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter building, apartment number, street or nearby landmark..."
              rows={3}
              className="w-full p-2.5 bg-white dark:bg-[#172033] border border-sky-300 dark:border-sky-600 rounded-xl text-xs font-medium text-slate-800 dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
            />
            <p className="text-[10px] text-slate-500 dark:text-[#A7B3C5]">
              💡 Add your door number or apartment name to help the delivery agent find you quickly.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-800 dark:text-[#F9FAFB] leading-relaxed font-semibold bg-white dark:bg-[#172033] p-3 rounded-xl border border-slate-200/80 dark:border-[#2D3748]">
            {address}
          </p>
        )}

        {/* Coordinates Preview */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#2D3748] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-[#A7B3C5] font-mono">
          <div className="flex items-center gap-3">
            <span>
              <strong>Lat:</strong> {position[0].toFixed(6)}
            </span>
            <span>
              <strong>Lng:</strong> {position[1].toFixed(6)}
            </span>
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-sans font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-md">
            GPS Synchronized ✓
          </span>
        </div>
      </div>

      {/* Confirm Location Button */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={addressLoading || !address.trim()}
        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-3 text-sm font-black text-white transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
      >
        <CheckCircle size={18} />
        <span>Confirm Delivery Location</span>
      </button>
    </div>
  );
}
