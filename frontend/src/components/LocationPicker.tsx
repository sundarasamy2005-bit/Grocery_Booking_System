import { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import * as L from 'leaflet';
import { MapPin, Navigation, CheckCircle, Loader2 } from 'lucide-react';

// Ensure standard Leaflet marker icons load cleanly without 404s
const defaultMarkerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  onLocationConfirm: (location: LocationData) => void;
  initialLocation?: LocationData | null;
}

function MapController({ position }: { position: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 16);
    }
  }, [position, map]);

  return null;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      onLocationSelect(lat, lng);
    },
  });

  return null;
}

export default function LocationPicker({ onLocationConfirm, initialLocation }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.latitude, initialLocation.longitude] : null
  );
  const [address, setAddress] = useState<string>(initialLocation?.address || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [geoLoading, setGeoLoading] = useState<boolean>(false);

  // Reverse geocoding using OpenStreetMap Nominatim
  const getAddress = async (lat: number, lng: number) => {
    try {
      setLoading(true);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }

      const data = await response.json();
      setAddress(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch (error) {
      console.error('Nominatim reverse geocode error:', error);
      setAddress(`Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (lat: number, lng: number) => {
    const newPosition: [number, number] = [lat, lng];
    setPosition(newPosition);
    getAddress(lat, lng);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Your browser does not support geolocation.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (location) => {
        setGeoLoading(false);
        const lat = location.coords.latitude;
        const lng = location.coords.longitude;
        selectLocation(lat, lng);
      },
      (error) => {
        setGeoLoading(false);
        console.error('Geolocation error:', error);
        alert('Location permission denied or unavailable. Please click your location on the map.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const confirmLocation = () => {
    if (!position || !address) {
      alert('Please select your delivery location first.');
      return;
    }

    onLocationConfirm({
      address,
      latitude: position[0],
      longitude: position[1],
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={geoLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2.5 text-sm font-bold text-white transition-all shadow-xs disabled:opacity-60 cursor-pointer"
        >
          {geoLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Detecting GPS Location...</span>
            </>
          ) : (
            <>
              <Navigation size={16} />
              <span>📍 Use My Location</span>
            </>
          )}
        </button>

        <p className="text-xs text-slate-500 font-medium">
          💡 Click on the map or drag the marker to adjust your delivery pin
        </p>
      </div>

      {/* Interactive Map */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
        <MapContainer
          center={position || [10.6629, 76.887]} // Pollachi default center
          zoom={13}
          scrollWheelZoom={true}
          style={{
            height: '380px',
            width: '100%',
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onLocationSelect={selectLocation} />

          {position && (
            <Marker
              position={position}
              draggable={true}
              icon={defaultMarkerIcon}
              eventHandlers={{
                dragend: (event) => {
                  const marker = event.target;
                  const location = marker.getLatLng();
                  selectLocation(location.lat, location.lng);
                },
              }}
            />
          )}

          <MapController position={position} />
        </MapContainer>
      </div>

      {/* Address & Coordinates Display */}
      {loading && (
        <div className="flex items-center gap-2 p-3 text-xs text-slate-500 font-medium bg-slate-50 rounded-xl border border-slate-100">
          <Loader2 size={14} className="animate-spin text-sky-600" />
          <span>Finding address from OpenStreetMap...</span>
        </div>
      )}

      {address && !loading && (
        <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4 space-y-1.5 animate-scale-in">
          <div className="flex items-center gap-2 text-sky-950 font-bold text-sm">
            <MapPin size={16} className="text-sky-600" />
            <span>Delivery Address</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {address}
          </p>

          {position && (
            <div className="pt-2 border-t border-sky-100 flex items-center gap-4 text-[11px] text-slate-500 font-mono">
              <span>Lat: {position[0].toFixed(6)}</span>
              <span>Lng: {position[1].toFixed(6)}</span>
            </div>
          )}
        </div>
      )}

      {/* Confirm Button */}
      <button
        type="button"
        onClick={confirmLocation}
        disabled={!position || !address || loading}
        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
      >
        <CheckCircle size={17} />
        <span>Confirm Delivery Location</span>
      </button>
    </div>
  );
}
