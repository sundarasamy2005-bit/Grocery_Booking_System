import { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import * as L from 'leaflet';
import {
  MapPin,
  Navigation,
  Search,
  ExternalLink,
  Loader2,
  CheckCircle2,
  X,
  Compass,
} from 'lucide-react';
import { api } from '../../services/api';

// Custom Storefront Marker Icon
const shopMarkerIcon = L.divIcon({
  className: 'custom-shop-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      width: 36px;
      height: 36px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
    ">
      <svg style="transform: rotate(45deg); width: 18px; height: 18px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
        <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
        <path d="M2 7h20"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

export interface GeocodedAddress {
  displayName: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

interface SearchResultItem {
  placeId: number | string;
  displayName: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: any;
}

interface ShopLocationMapProps {
  latitude: number;
  longitude: number;
  onChange: (coords: { latitude: number; longitude: number }, addressData?: GeocodedAddress) => void;
  deliveryRadiusKm?: number;
}

// Controller to smoothly animate map center when coordinates change
function MapController({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    if (position && !isNaN(position[0]) && !isNaN(position[1])) {
      map.setView(position, map.getZoom() < 14 ? 15 : map.getZoom(), { animate: true });
    }
  }, [position, map]);

  return null;
}

// Map Click Handler for interactive coordinate selection
function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

export default function ShopLocationMap({
  latitude,
  longitude,
  onChange,
  deliveryRadiusKm = 5,
}: ShopLocationMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<GeocodedAddress | null>(null);
  const [syncApplied, setSyncApplied] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const safeLat = typeof latitude === 'number' && !isNaN(latitude) && latitude !== 0 ? latitude : 10.6585;
  const safeLng = typeof longitude === 'number' && !isNaN(longitude) && longitude !== 0 ? longitude : 77.0094;
  const position: [number, number] = [safeLat, safeLng];

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reverse geocode whenever marker coordinates change
  const performReverseGeocode = async (lat: number, lng: number) => {
    try {
      setReverseLoading(true);
      // Try backend proxy first
      const res = await api.get('/shops/location/reverse', {
        params: { lat: lat.toFixed(6), lng: lng.toFixed(6) },
      });

      if (res.data?.success && res.data.data) {
        const data = res.data.data;
        const addrObj: GeocodedAddress = {
          displayName: data.displayName || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          postalCode: data.postalCode || '',
        };
        setDetectedAddress(addrObj);
        return addrObj;
      }
    } catch {
      // Fallback: direct OpenStreetMap Nominatim
      try {
        const directRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
          { headers: { Accept: 'application/json' } }
        );
        if (directRes.ok) {
          const directData = await directRes.json();
          const addr = directData.address || {};
          const addrObj: GeocodedAddress = {
            displayName: directData.display_name || '',
            address: addr.road || addr.suburb || addr.neighbourhood || directData.display_name?.split(',')[0] || '',
            city: addr.city || addr.town || addr.village || addr.county || '',
            state: addr.state || '',
            postalCode: addr.postcode || '',
          };
          setDetectedAddress(addrObj);
          return addrObj;
        }
      } catch (directErr) {
        console.warn('Direct reverse geocode notice:', directErr);
      }
    } finally {
      setReverseLoading(false);
    }
    return null;
  };

  // Triggered when user selects a point via map click or drag
  const handleLocationSelect = async (lat: number, lng: number, manualAddress?: GeocodedAddress) => {
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLng = parseFloat(lng.toFixed(6));

    if (manualAddress) {
      setDetectedAddress(manualAddress);
      onChange({ latitude: roundedLat, longitude: roundedLng }, manualAddress);
    } else {
      onChange({ latitude: roundedLat, longitude: roundedLng });
      const fetchedAddr = await performReverseGeocode(roundedLat, roundedLng);
      if (fetchedAddr) {
        onChange({ latitude: roundedLat, longitude: roundedLng }, fetchedAddr);
      }
    }
  };

  // Perform search query
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query || query.length < 2) return;

    try {
      setSearching(true);
      setSearchOpen(true);

      // Backend proxy
      const res = await api.get('/shops/location/search', { params: { q: query } });
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setSearchResults(res.data.data);
      } else {
        // Fallback: direct Nominatim
        const directRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=6`,
          { headers: { Accept: 'application/json' } }
        );
        if (directRes.ok) {
          const directData = await directRes.json();
          setSearchResults(
            directData.map((item: any) => ({
              placeId: item.place_id,
              displayName: item.display_name,
              name: item.name || item.display_name.split(',')[0],
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              address: item.address,
            }))
          );
        } else {
          setSearchResults([]);
        }
      }
    } catch (err) {
      console.warn('Location search error:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Handle selecting a search suggestion
  const handleSelectSearchResult = (result: SearchResultItem) => {
    setSearchOpen(false);
    setSearchQuery(result.name || result.displayName.split(',')[0]);

    const addr = result.address || {};
    const addrObj: GeocodedAddress = {
      displayName: result.displayName,
      address: addr.road || addr.suburb || addr.neighbourhood || result.name,
      city: addr.city || addr.town || addr.village || addr.county || '',
      state: addr.state || '',
      postalCode: addr.postcode || '',
    };

    handleLocationSelect(result.latitude, result.longitude, addrObj);
  };

  // GPS "Use My Location"
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your current browser.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGeoLoading(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        await handleLocationSelect(lat, lng);
      },
      (err) => {
        setGeoLoading(false);
        console.warn('GPS location error:', err);
        alert('Could not detect GPS location. Please check your browser location permissions or click directly on the map.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Apply auto-detected address to fields
  const handleApplyAddress = () => {
    if (detectedAddress) {
      onChange({ latitude: safeLat, longitude: safeLng }, detectedAddress);
      setSyncApplied(true);
      setTimeout(() => setSyncApplied(false), 2500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Landmark / Address Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setSearchOpen(true);
              }}
              placeholder="Search area, landmark or street (e.g., Pollachi Bus Stand, Kovai Road)..."
              className="w-full pl-10 pr-20 py-2.5 bg-white border border-gray-300 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-xs"
            />
            <div className="absolute inset-y-0 right-1 flex items-center gap-1 pr-1.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setSearchOpen(false);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="submit"
                disabled={searching}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {searching ? <Loader2 size={13} className="animate-spin" /> : 'Search'}
              </button>
            </div>
          </form>

          {/* Search Results Dropdown */}
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute z-1000 mt-1.5 w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-h-72 overflow-y-auto">
              <div className="p-2 bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                <span>Matching Locations ({searchResults.length})</span>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {searchResults.map((result) => (
                  <button
                    key={result.placeId}
                    type="button"
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full text-left p-3 hover:bg-emerald-50/70 transition-colors flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors mt-0.5">
                      <MapPin size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate group-hover:text-emerald-700">
                        {result.name || result.displayName.split(',')[0]}
                      </p>
                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5 leading-tight">
                        {result.displayName}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* GPS Locate Me Button */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={geoLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-60 cursor-pointer shrink-0"
        >
          {geoLoading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Detecting GPS Location...</span>
            </>
          ) : (
            <>
              <Navigation size={15} />
              <span>📍 Use My Current Location</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-slate-100">
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={true}
          style={{ height: '390px', width: '100%', zIndex: 10 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onSelect={handleLocationSelect} />

          {/* Delivery radius circle preview */}
          <Circle
            center={position}
            radius={deliveryRadiusKm * 1000}
            pathOptions={{
              color: '#10b981',
              fillColor: '#34d399',
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '4, 4',
            }}
          />

          {/* Shop Marker (Draggable) */}
          <Marker
            position={position}
            draggable={true}
            icon={shopMarkerIcon}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const loc = marker.getLatLng();
                handleLocationSelect(loc.lat, loc.lng);
              },
            }}
          />

          <MapController position={position} />
        </MapContainer>

        {/* Interactive Map HUD Overlay */}
        <div className="absolute top-3 right-3 z-400 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-200/90 shadow-md flex items-center gap-2 text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-gray-800">Shop Location Pin</span>
          <span className="text-gray-400 font-mono text-[11px]">({deliveryRadiusKm}km service radius)</span>
        </div>

        {/* Drag Hint at bottom */}
        <div className="absolute bottom-3 left-3 right-3 z-400 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-md pointer-events-auto flex items-center gap-2">
            <Compass size={13} className="text-emerald-400" />
            <span>💡 Click anywhere on the map or drag the green store pin to set your exact storefront door.</span>
          </div>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${safeLat},${safeLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/95 backdrop-blur-md hover:bg-white text-gray-800 text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-md pointer-events-auto flex items-center gap-1.5 border border-gray-200 transition-colors"
          >
            <span>Google Maps</span>
            <ExternalLink size={12} className="text-gray-500" />
          </a>
        </div>
      </div>

      {/* Geocoding Status & Auto-Fill Banner */}
      <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-2xs">
              <MapPin size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950">
                Real-World Coordinates & Geocoded Address
              </p>
              <div className="flex items-center gap-3 text-[11px] font-mono text-emerald-800 mt-0.5">
                <span>Lat: {safeLat.toFixed(6)}</span>
                <span>•</span>
                <span>Lng: {safeLng.toFixed(6)}</span>
              </div>
            </div>
          </div>

          {detectedAddress && (
            <button
              type="button"
              onClick={handleApplyAddress}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                syncApplied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              {syncApplied ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Address Applied!</span>
                </>
              ) : (
                <>
                  <span>✨ Auto-fill Address Fields</span>
                </>
              )}
            </button>
          )}
        </div>

        {reverseLoading ? (
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium py-1">
            <Loader2 size={13} className="animate-spin text-emerald-600" />
            <span>Fetching real-world address from OpenStreetMap...</span>
          </div>
        ) : detectedAddress?.displayName ? (
          <p className="text-xs text-emerald-900/90 leading-relaxed font-medium bg-white/70 p-2.5 rounded-xl border border-emerald-200/60">
            {detectedAddress.displayName}
          </p>
        ) : null}
      </div>
    </div>
  );
}
