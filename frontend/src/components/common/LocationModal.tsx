import { useState } from 'react';
import { useLocationStore } from '../../store/locationStore';
import { useToastStore } from '../../store/toastStore';
import { MapPin, Navigation, X, Search, Check } from 'lucide-react';

const POPULAR_LOCATIONS = [
  { city: 'Pollachi', locationName: 'Pollachi, Tamil Nadu', lat: 10.6609, lng: 77.0048 },
  { city: 'Coimbatore', locationName: 'Coimbatore, Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  { city: 'Udumalaipettai', locationName: 'Udumalaipettai, Tamil Nadu', lat: 10.5843, lng: 77.2476 },
  { city: 'Tiruppur', locationName: 'Tiruppur, Tamil Nadu', lat: 11.1085, lng: 77.3411 },
  { city: 'Chennai', locationName: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { city: 'Madurai', locationName: 'Madurai, Tamil Nadu', lat: 9.9252, lng: 78.1198 },
  { city: 'Bengaluru', locationName: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946 },
];

export const LocationModal = () => {
  const { isModalOpen, closeModal, setLocation, detectCurrentLocation, isDetecting, city: currentCity } = useLocationStore();
  const [query, setQuery] = useState('');
  const toast = useToastStore();

  if (!isModalOpen) return null;

  const handleSelect = (loc: { city: string; locationName: string; lat: number | null; lng: number | null }) => {
    setLocation(loc);
    toast.success(`Location set to ${loc.city}`);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const clean = query.trim();
    handleSelect({
      city: clean,
      locationName: `${clean}, India`,
      lat: null,
      lng: null,
    });
  };

  const handleGPS = async () => {
    const ok = await detectCurrentLocation();
    if (ok) {
      toast.success('Location detected using GPS');
    }
  };

  const filtered = POPULAR_LOCATIONS.filter((l) =>
    l.locationName.toLowerCase().includes(query.toLowerCase()) ||
    l.city.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center text-white shadow-md">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Select Delivery Location</h3>
              <p className="text-xs text-slate-500">Find grocery shops nearest to you</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* GPS Button */}
          <button
            onClick={handleGPS}
            disabled={isDetecting}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/70 hover:bg-sky-100/70 text-sky-800 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Navigation size={18} className={isDetecting ? 'animate-spin' : ''} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-sky-950">
                  {isDetecting ? 'Detecting your location...' : 'Use Current Location'}
                </p>
                <p className="text-xs text-sky-700">Using device GPS</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-white text-sky-700 rounded-full shadow-sm">
              Auto Detect
            </span>
          </button>

          {/* Search Input */}
          <form onSubmit={handleCustomSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search or enter city/area..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-medium"
            />
            {query.trim() && (
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Set
              </button>
            )}
          </form>

          {/* Popular Locations */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Popular Cities
            </p>
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {filtered.map((loc) => {
                const isSelected = currentCity.toLowerCase() === loc.city.toLowerCase();
                return (
                  <button
                    key={loc.city}
                    onClick={() => handleSelect(loc)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-150 ${
                      isSelected
                        ? 'bg-sky-50 text-sky-900 border border-sky-200 font-bold'
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin size={15} className={isSelected ? 'text-sky-600' : 'text-slate-400'} />
                      <span className="text-sm">{loc.locationName}</span>
                    </div>
                    {isSelected && <Check size={16} className="text-sky-600" />}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Press "Set" above to use "<strong className="text-slate-600">{query}</strong>"
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
