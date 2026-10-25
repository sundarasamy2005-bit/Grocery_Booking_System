import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Search,
  Store,
  ShoppingBag,
  Star,
  Truck,
  Clock,
  SlidersHorizontal,
  Map as MapIcon,
  List,
  Navigation,
  X,
  Tag,
  Check,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { api } from '../../services/api';
import { Shop, Category } from '../../types';
import { useLocationStore } from '../../store/locationStore';
import { useAddressStore } from '../../store/addressStore';
import { toast } from '../../store/toastStore';
import { ShopMapView } from '../../components/common/ShopMapView';

export const ShopList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('categoryId') || '';

  const { city, locationName, lat, lng, openModal: openLocationModal, detectCurrentLocation, isDetecting } = useLocationStore();
  const { activeAddress, openModal: openAddressModal } = useAddressStore();

  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<'distance' | 'minOrder' | 'name'>('distance');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filterDelivery, setFilterDelivery] = useState(false);
  const [filterPickup, setFilterPickup] = useState(false);
  const [filterOpenNow, setFilterOpenNow] = useState(false);

  // Load Categories for filter bar
  useEffect(() => {
    api
      .get('/categories')
      .then((res) => {
        if (res.data.success) setCategories(res.data.data);
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch Shops
  const fetchShops = useCallback(async (searchQuery?: string) => {
    try {
      setLoading(true);
      const query = searchQuery !== undefined ? searchQuery : initialSearch;
      const params: Record<string, any> = {
        limit: 50,
      };
      if (query && query.trim()) {
        params.search = query.trim();
      }

      if (lat && lng) {
        params.lat = lat;
        params.lng = lng;
      }

      const res = await api.get('/shops', { params });
      if (res.data.success) {
        setShops(res.data.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch shops', error);
      toast.error(error.response?.data?.message || 'Unable to load shops right now');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, initialSearch]);

  useEffect(() => {
    fetchShops(initialSearch);
  }, [fetchShops, initialSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (searchTerm.trim()) next.set('search', searchTerm.trim());
      else next.delete('search');
      return next;
    });
    fetchShops(searchTerm);
  };

  const handleGPSDetect = async () => {
    const success = await detectCurrentLocation();
    if (success) {
      toast.success('Location updated with GPS');
      fetchShops();
    }
  };

  // Filter & Sort shops in memory
  const processedShops = shops
    .filter((shop) => {
      if (filterDelivery && !shop.deliveryAvailable) return false;
      if (filterPickup && !shop.pickupAvailable) return false;
      if (filterOpenNow && shop.isOpen === false) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'distance') {
        const distA = typeof a.distance === 'number' ? a.distance : 9999;
        const distB = typeof b.distance === 'number' ? b.distance : 9999;
        return distA - distB;
      }
      if (sortBy === 'minOrder') {
        return (a.minimumOrderAmount || 0) - (b.minimumOrderAmount || 0);
      }
      return a.shopName.localeCompare(b.shopName);
    });

  const selectedCategoryObj = categories.find((c) => c._id === selectedCategory);
  const deliveryAreaDisplay = activeAddress
    ? `${activeAddress.areaCity || activeAddress.city} · ${activeAddress.pinCode || activeAddress.postalCode}`
    : `${city || 'Pollachi'} · 642103`;

  return (
    <MainLayout>
      {/* Top Banner - Compact & Clean */}
      <div className="bg-white dark:bg-[#111827] border-b border-slate-100 dark:border-[#2D3748] py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-sky-600 dark:text-emerald-400 bg-sky-50 dark:bg-[#12352D] px-2.5 py-0.5 rounded-full">
                  Local Directory
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-600">•</span>
                <span className="text-xs font-bold text-slate-600 dark:text-[#A7B3C5]">{processedShops.length} stores nearby</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#F9FAFB] tracking-tight mt-1">
                Grocery Stores near {city || 'Pollachi'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A7B3C5] mt-1 max-w-xl">
                Browse independent neighborhood merchants, compare minimum orders, and select pickup or fast delivery.
              </p>
            </div>

            {/* Clear Delivery Area Pill */}
            <div className="flex items-center gap-3 p-2.5 px-3.5 bg-slate-50 dark:bg-[#172033] border border-slate-200/80 dark:border-[#2D3748] rounded-2xl w-full sm:w-auto shadow-2xs">
              <div className="h-9 w-9 rounded-xl bg-sky-100 dark:bg-[#12352D] text-sky-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <MapPin size={18} />
              </div>
              <div className="min-w-0 pr-1">
                <p className="text-[10px] text-slate-400 dark:text-[#A7B3C5] font-bold uppercase tracking-wider leading-none">Delivering to</p>
                <p className="text-xs font-black text-slate-900 dark:text-[#F9FAFB] truncate mt-0.5">
                  {deliveryAreaDisplay}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAddressModal()}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          {/* Compact Search Form */}
          <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col sm:flex-row gap-2 max-w-3xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#A7B3C5]" size={17} />
              <input
                type="text"
                placeholder="Search shops by name, street, or locality..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-[#172033] border border-slate-200/80 dark:border-[#2D3748] text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm rounded-xl font-medium focus:bg-white dark:focus:bg-[#111827] focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-400 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    fetchShops('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-[#F9FAFB] cursor-pointer"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGPSDetect}
                disabled={isDetecting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#172033] dark:hover:bg-[#111827] text-slate-700 dark:text-[#F9FAFB] border border-transparent dark:border-[#2D3748] font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
              >
                <Navigation size={14} className={isDetecting ? 'animate-spin' : ''} />
                <span>{isDetecting ? 'Detecting...' : 'Near Me'}</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md shadow-sky-600/20 dark:shadow-emerald-950/40 transition-all shrink-0 cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-white dark:bg-[#172033] border-b border-slate-100 dark:border-[#2D3748] py-3.5 sticky top-16 sm:top-18 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: View Mode Toggle & Active Results Count */}
            <div className="flex items-center gap-3">
              <div className="flex items-center p-1 bg-slate-100 dark:bg-[#111827] rounded-xl border border-transparent dark:border-[#2D3748]">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-[#172033] text-slate-900 dark:text-[#F9FAFB] shadow-2xs'
                      : 'text-slate-500 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB]'
                  }`}
                >
                  <List size={14} /> List View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-sky-600 dark:bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-500 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB]'
                  }`}
                >
                  <MapIcon size={14} /> OpenStreetMap
                </button>
              </div>

              <span className="text-xs font-bold text-slate-500 dark:text-[#A7B3C5]">
                <strong className="text-slate-900 dark:text-[#F9FAFB]">{processedShops.length}</strong> stores found
              </span>
            </div>

            {/* Right: Quick Filters & Sorter */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Delivery Toggle */}
              <button
                type="button"
                onClick={() => setFilterDelivery(!filterDelivery)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterDelivery
                    ? 'bg-emerald-50 dark:bg-[#12352D] border-emerald-300 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300'
                    : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-[#2D3748] text-slate-600 dark:text-[#A7B3C5] hover:bg-slate-50 dark:hover:bg-[#172033]'
                }`}
              >
                <span>🚚 Delivery</span>
                {filterDelivery && <Check size={12} />}
              </button>

              {/* Pickup Toggle */}
              <button
                type="button"
                onClick={() => setFilterPickup(!filterPickup)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterPickup
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300'
                    : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-[#2D3748] text-slate-600 dark:text-[#A7B3C5] hover:bg-slate-50 dark:hover:bg-[#172033]'
                }`}
              >
                <span>🛍 Pickup</span>
                {filterPickup && <Check size={12} />}
              </button>

              {/* Open Now Toggle */}
              <button
                type="button"
                onClick={() => setFilterOpenNow(!filterOpenNow)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterOpenNow
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                    : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-[#2D3748] text-slate-600 dark:text-[#A7B3C5] hover:bg-slate-50 dark:hover:bg-[#172033]'
                }`}
              >
                <span>⏰ Open Now</span>
                {filterOpenNow && <Check size={12} />}
              </button>

              {/* Sorter Dropdown */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-[#2D3748]">
                <span className="text-xs font-bold text-slate-400 dark:text-[#A7B3C5]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs font-bold text-slate-800 dark:text-[#F9FAFB] bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-[#2D3748] rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-400 cursor-pointer"
                >
                  <option value="distance">Nearest First</option>
                  <option value="minOrder">Min Order (Low to High)</option>
                  <option value="name">Store Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Category Filter Tag if present */}
          {selectedCategoryObj && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-[#2D3748] flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-[#A7B3C5] font-medium">Filtering by category:</span>
              <span className="badge-blue text-xs font-bold flex items-center gap-1">
                <span>{selectedCategoryObj.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('');
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.delete('categoryId');
                      return next;
                    });
                  }}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Map or List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'map' ? (
          <div className="space-y-4">
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between text-xs text-sky-900">
              <div className="flex items-center gap-2 font-bold">
                <MapPin size={16} className="text-sky-600" />
                <span>OpenStreetMap Interactive View — Click on any shop marker to view store details & directions</span>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="font-bold underline hover:text-sky-700"
              >
                Switch to List
              </button>
            </div>

            <ShopMapView
              shops={processedShops}
              userLat={lat}
              userLng={lng}
              userLocationName={locationName}
            />
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="card overflow-hidden">
                <div className="h-44 skeleton rounded-t-2xl" />
                <div className="p-4 space-y-2.5">
                  <div className="h-5 skeleton rounded-lg w-3/4" />
                  <div className="h-3.5 skeleton rounded-lg w-1/2" />
                  <div className="h-3.5 skeleton rounded-lg w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : processedShops.length === 0 ? (
          <div className="card p-12 text-center max-w-md mx-auto border-dashed border-2 border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#172033]">
            <div className="h-16 w-16 rounded-2xl bg-sky-50 dark:bg-[#12352D] text-sky-400 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <Store size={32} />
            </div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-[#F9FAFB]">No shops match your criteria</h3>
            <p className="text-xs text-slate-400 dark:text-[#A7B3C5] mt-1">
              Try adjusting your search keywords, clearing delivery/pickup filters, or changing your area location.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilterDelivery(false);
                  setFilterPickup(false);
                  fetchShops('');
                }}
                className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={openLocationModal}
                className="btn-primary px-4 py-2 rounded-xl text-xs font-bold"
              >
                Change Location
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {processedShops.map((shop, i) => (
              <Link
                key={shop._id}
                to={`/shops/${shop._id}`}
                className="card card-hover group block overflow-hidden border border-slate-100 dark:border-[#2D3748] bg-white dark:bg-[#172033] hover:border-sky-300 dark:hover:border-emerald-500/50 shadow-sm hover:shadow-xl transition-all"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Shop Banner Image */}
                <div className="relative h-44 bg-slate-100 dark:bg-[#111827] overflow-hidden">
                  {shop.shopImage ? (
                    <img
                      src={shop.shopImage}
                      alt={shop.shopName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 dark:from-[#111827] dark:to-[#172033] text-sky-700 dark:text-emerald-400">
                      <Store size={36} />
                      <span className="text-xs font-bold mt-2">{shop.shopName}</span>
                    </div>
                  )}

                  {/* Honest Distance / Locality Badge */}
                  {typeof shop.distance === 'number' && !isNaN(shop.distance) ? (
                    <div className="absolute top-3 right-3 bg-white/95 dark:bg-[#172033]/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-black text-sky-700 dark:text-emerald-400 flex items-center gap-1 shadow-xs border border-slate-100 dark:border-[#2D3748]">
                      <MapPin size={11} className="text-sky-600 dark:text-emerald-400" />
                      {shop.distance.toFixed(1)} km
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 bg-white/95 dark:bg-[#172033]/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-700 dark:text-[#F9FAFB] flex items-center gap-1 shadow-xs border border-slate-100 dark:border-[#2D3748]">
                      <MapPin size={11} className="text-slate-400 dark:text-[#A7B3C5]" />
                      {shop.city || 'Pollachi'}
                    </div>
                  )}

                  {/* Rating */}
                  <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-[#172033]/95 px-2 py-0.5 rounded-lg text-xs font-black text-slate-900 dark:text-[#F9FAFB] flex items-center gap-1 shadow-xs border border-transparent dark:border-[#2D3748]">
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                    4.8
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="font-extrabold text-slate-900 dark:text-[#F9FAFB] text-base group-hover:text-sky-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                    {shop.shopName}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-1 flex items-center gap-1 truncate">
                    <MapPin size={12} className="text-slate-400 dark:text-[#A7B3C5] shrink-0" />
                    {shop.address}, {shop.city}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#2D3748] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {shop.deliveryAvailable && (
                        <span className="badge-green text-[10px] py-0.5">🚚 Delivery</span>
                      )}
                      {shop.pickupAvailable && (
                        <span className="badge-blue text-[10px] py-0.5">🛍 Pickup</span>
                      )}
                    </div>
                    <span className="font-bold text-slate-700 dark:text-[#A7B3C5]">
                      Min. ₹{shop.minimumOrderAmount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ShopList;
