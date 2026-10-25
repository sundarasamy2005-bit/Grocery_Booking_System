import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as L from 'leaflet';
import { Shop } from '../../types';

interface ShopMapViewProps {
  shops: Shop[];
  userLat?: number | null;
  userLng?: number | null;
  userLocationName?: string;
}

export const ShopMapView = ({ shops, userLat, userLng, userLocationName = 'Your Location' }: ShopMapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center coordinates
    const defaultLat = userLat || (shops[0]?.latitude) || 10.6609;
    const defaultLng = userLng || (shops[0]?.longitude) || 77.0048;

    // Destroy existing map if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Map
    const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 13);
    mapInstanceRef.current = map;

    // Tile Layer: OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Custom Icon helper
    const createCustomIcon = (color: string, label: string) =>
      L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
          <div style="background-color: ${color}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white;">
            ${label}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

    // Add User Marker
    if (userLat && userLng) {
      const userMarker = L.marker([userLat, userLng], {
        icon: createCustomIcon('#0284c7', '📍'),
      }).addTo(map);
      userMarker.bindPopup(`
        <div style="font-family: inherit; padding: 4px;">
          <p style="font-size: 11px; color: #64748b; font-weight: bold; margin: 0;">YOU ARE HERE</p>
          <p style="font-size: 13px; font-weight: bold; color: #0f172a; margin: 2px 0 0 0;">${userLocationName}</p>
        </div>
      `);
    }

    // Add Shop Markers
    const bounds = L.latLngBounds([]);
    if (userLat && userLng) bounds.extend([userLat, userLng]);

    shops.forEach((shop) => {
      if (shop.latitude && shop.longitude) {
        bounds.extend([shop.latitude, shop.longitude]);
        const marker = L.marker([shop.latitude, shop.longitude], {
          icon: createCustomIcon('#16a34a', '🏪'),
        }).addTo(map);

        const popupContent = document.createElement('div');
        popupContent.style.fontFamily = 'inherit';
        popupContent.style.padding = '4px';
        popupContent.style.maxWidth = '200px';

        popupContent.innerHTML = `
          <div style="font-weight: 800; font-size: 14px; color: #0f172a;">${shop.shopName}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">📍 ${shop.address}, ${shop.city}</div>
          ${shop.distance !== undefined ? `<div style="font-size: 11px; font-weight: 700; color: #0284c7; margin-top: 4px;">🚗 ${shop.distance.toFixed(1)} km away</div>` : ''}
          <div style="font-size: 11px; margin-top: 4px; color: #15803d; font-weight: 600;">
            ${shop.deliveryAvailable ? '🚚 Delivery' : ''} ${shop.pickupAvailable ? '🛍 Pickup' : ''}
          </div>
          <button id="view-shop-${shop._id}" style="margin-top: 8px; width: 100%; background: #0284c7; color: white; border: none; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;">
            View Store →
          </button>
        `;

        // Wire button click
        marker.bindPopup(popupContent);
        marker.on('popupopen', () => {
          const btn = document.getElementById(`view-shop-${shop._id}`);
          if (btn) {
            btn.onclick = () => navigate(`/shops/${shop._id}`);
          }
        });
      }
    });

    if (bounds.isValid() && shops.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [shops, userLat, userLng, userLocationName, navigate]);

  return (
    <div className="w-full h-[450px] rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-[#2D3748] relative z-10">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default ShopMapView;
