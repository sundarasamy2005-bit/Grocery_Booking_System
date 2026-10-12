import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useLocationStore } from '../../store/locationStore';
import { useToastStore } from '../../store/toastStore';
import { api } from '../../services/api';
import { Shop, Product, Category } from '../../types';
import MainLayout from '../../components/layout/MainLayout';
import {
  ShoppingBag,
  MapPin,
  Search,
  Truck,
  Store,
  Clock,
  ShieldCheck,
  Star,
  ChevronRight,
  ArrowRight,
  Plus,
  Check,
  Tag,
  Sparkles,
  Percent,
  Copy,
  PackageCheck,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';

const CATEGORY_EMOJIS: Record<string, string> = {
  Vegetables: '🥦',
  'Cooking Oil': '🌻',
  'Pulses & Lentils': '🫘',
  'Spices & Masala': '🌶️',
  'Frozen Foods': '🧊',
  'Cleaning Supplies': '🧹',
  'Baby Products': '👶',
  'Meat & Seafood': '🍗',
  'Personal Hygiene': '🧼',
  Eggs: '🥚',
  Fruits: '🍎',
  Dairy: '🥛',
  'Rice & Grains': '🌾',
  Snacks: '🍪',
  Beverages: '🧃',
  Bakery: '🍞',
  'Personal Care': '🧴',
  Household: '🏠',
};

const OFFERS = [
  {
    code: 'FIRST50',
    title: 'Flat ₹50 OFF',
    desc: 'On your first order above ₹299',
    badge: 'NEW USER',
    bg: 'from-amber-500 to-orange-500',
  },
  {
    code: 'FRESH20',
    title: '20% OFF Veggies',
    desc: 'Fresh farm vegetables & fruits',
    badge: 'DAILY DEAL',
    bg: 'from-emerald-600 to-teal-600',
  },
  {
    code: 'CODZERO',
    title: 'Free Delivery',
    desc: 'On orders from shops within 2km',
    badge: 'LOCAL PERK',
    bg: 'from-sky-600 to-blue-700',
  },
];

const STEPS = [
  {
    step: '1',
    title: 'Choose Nearby Shop',
    desc: 'Browse verified grocery stores in your neighborhood',
    icon: <Store className="h-6 w-6 text-sky-600" />,
  },
  {
    step: '2',
    title: 'Select Fresh Items',
    desc: 'Add milk, vegetables, rice, and daily necessities to your cart',
    icon: <ShoppingBag className="h-6 w-6 text-emerald-600" />,
  },
  {
    step: '3',
    title: 'Delivery or Pickup',
    desc: 'Choose doorstep delivery or self-pickup on your way home',
    icon: <Truck className="h-6 w-6 text-amber-600" />,
  },
  {
    step: '4',
    title: 'Pay with Cash on Delivery',
    desc: 'Zero online card hassle. Pay directly when receiving groceries',
    icon: <CreditCard className="h-6 w-6 text-indigo-600" />,
  },
  {
    step: '5',
    title: 'Track Live Order',
    desc: 'Watch the store accept, prepare, and deliver your order',
    icon: <PackageCheck className="h-6 w-6 text-purple-600" />,
  },
];

export const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addToCart } = useCartStore();
  const { city, locationName, openModal: openLocationModal, orderPreference, setOrderPreference, lat, lng } = useLocationStore();
  const toast = useToastStore();

  const [shops, setShops] = useState<Shop[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [heroSearch, setHeroSearch] = useState('');
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // 1. Fetch Categories
    api
      .get('/categories')
      .then((res) => {
        if (res.data.success) setCategories(res.data.data);
      })
      .catch((err) => console.error('Failed to load categories', err));

    // 2. Fetch Nearby Shops (using coordinates if set)
    const fetchShops = async () => {
      try {
        setLoadingShops(true);
        const params: Record<string, any> = { limit: 6 };
        if (lat && lng) {
          params.lat = lat;
          params.lng = lng;
        }
        const res = await api.get('/shops', { params });
        if (res.data.success) {
          setShops(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load shops', err);
      } finally {
        setLoadingShops(false);
      }
    };
    fetchShops();

    // 3. Fetch Popular Products
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await api.get('/products', { params: { limit: 8 } });
        if (res.data.success) {
          setPopularProducts(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [lat, lng]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroSearch.trim()) return;
    navigate(`/shops?search=${encodeURIComponent(heroSearch.trim())}`);
  };

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      toast.info('Please log in to add groceries to your cart');
      navigate('/login');
      return;
    }

    const success = await addToCart(product, 1);
    if (success) {
      setAddedItemIds((prev) => ({ ...prev, [product._id]: true }));
      toast.success(`Added ${product.name} to cart!`);
      setTimeout(() => {
        setAddedItemIds((prev) => ({ ...prev, [product._id]: false }));
      }, 1500);
    }
  };

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code ${code} copied!`);
  };

  return (
    <MainLayout>
      {/* ──────────────────────────────────────────────────────────
          1. HERO SECTION WITH LOCATION, LIVE SEARCH & QUICK ACTIONS
         ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden gradient-hero text-white py-12 md:py-20">
        {/* Glow Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-4 py-1.5 mb-5 shadow-sm animate-fade-in">
              <Sparkles size={14} className="text-yellow-300" />
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-white">
                Local Grocery Marketplace • Fast Delivery in {city}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight animate-fade-in-up">
              Your favourite groceries,{' '}
              <span className="text-yellow-300 underline decoration-yellow-400/40 decoration-wavy underline-offset-4">
                delivered fresh
              </span>
            </h1>

            <p className="mt-4 text-sm sm:text-lg text-sky-100 max-w-2xl leading-relaxed animate-fade-in-up delay-100">
              Discover trusted local shops near you, order fresh milk, vegetables, grains, and snacks. Choose doorstep delivery or quick store pickup with Cash on Delivery.
            </p>

            {/* Location & Search Bar in Hero */}
            <div className="mt-8 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-3xl shadow-2xl border border-white/40 max-w-2xl animate-fade-in-up delay-200">
              <form onSubmit={handleHeroSearch} className="flex flex-col sm:flex-row gap-2">
                {/* Location Pill */}
                <button
                  type="button"
                  onClick={openLocationModal}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-sky-50/80 hover:bg-sky-100/80 text-left text-slate-800 transition-colors border border-sky-100 shrink-0"
                >
                  <MapPin size={16} className="text-sky-600 shrink-0" />
                  <div className="min-w-0 pr-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Deliver to</p>
                    <p className="text-xs font-extrabold text-slate-900 truncate max-w-[130px]">{city}</p>
                  </div>
                  <span className="text-[10px] text-sky-700 font-bold bg-white px-1.5 py-0.5 rounded-md shadow-2xs">
                    Change
                  </span>
                </button>

                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Search vegetables, milk, rice, biscuits..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-slate-900 text-xs sm:text-sm rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500 font-medium placeholder-slate-400 border border-transparent"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="btn-primary py-2.5 px-6 rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-sky-600/30 whitespace-nowrap"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3 animate-fade-in-up delay-300">
              <Link
                to="/shops"
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 text-xs sm:text-sm"
              >
                <Store size={17} /> Find Nearby Shops
              </Link>
              <Link
                to="/shops"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl backdrop-blur-md border border-white/25 transition-all text-xs sm:text-sm"
              >
                Browse All Products <ArrowRight size={15} />
              </Link>
            </div>

            {/* Trust Stats */}
            <div className="mt-10 pt-6 border-t border-white/15 grid grid-cols-3 gap-4 max-w-lg animate-fade-in-up delay-400">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">500+</p>
                <p className="text-[11px] sm:text-xs text-sky-200 mt-0.5 font-medium">Local Shops</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">10K+</p>
                <p className="text-[11px] sm:text-xs text-sky-200 mt-0.5 font-medium">Grocery Items</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-yellow-300">2 hrs</p>
                <p className="text-[11px] sm:text-xs text-sky-200 mt-0.5 font-medium">Avg. Delivery</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          2. DELIVERY VS PICKUP QUICK SELECTOR
         ────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-600">FLEXIBLE FULFILLMENT</p>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                How would you like to receive your order?
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setOrderPreference('delivery');
                  toast.success('Preference set to Home Delivery');
                }}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
                  orderPreference === 'delivery'
                    ? 'border-sky-500 bg-sky-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    orderPreference === 'delivery' ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Truck size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    Home Delivery
                    {orderPreference === 'delivery' && <CheckCircle2 size={14} className="text-sky-600" />}
                  </p>
                  <p className="text-[11px] text-slate-500">Delivered to your doorstep</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOrderPreference('pickup');
                  toast.success('Preference set to Store Pickup');
                }}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
                  orderPreference === 'pickup'
                    ? 'border-sky-500 bg-sky-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    orderPreference === 'pickup' ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Store size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    Store Pickup
                    {orderPreference === 'pickup' && <CheckCircle2 size={14} className="text-sky-600" />}
                  </p>
                  <p className="text-[11px] text-slate-500">Zero wait, pickup at shop</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          3. TODAY'S OFFERS & PROMOTIONS
         ────────────────────────────────────────────────────────── */}
      <section className="py-8 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Percent size={15} />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Today's Deals & Offers</h2>
            </div>
            <span className="text-xs font-bold text-slate-400">Cash on Delivery Applicable</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {OFFERS.map((offer) => (
              <div
                key={offer.code}
                className={`relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br ${offer.bg} text-white shadow-md flex items-center justify-between gap-4`}
              >
                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full">
                    {offer.badge}
                  </span>
                  <h3 className="text-xl font-black mt-2 leading-tight">{offer.title}</h3>
                  <p className="text-xs text-white/90 mt-1">{offer.desc}</p>

                  <button
                    onClick={() => copyCoupon(offer.code)}
                    className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-black hover:bg-slate-100 transition-colors shadow-xs"
                  >
                    <span>Use: {offer.code}</span>
                    <Copy size={12} className="text-slate-400" />
                  </button>
                </div>

                <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                  <Tag size={28} className="text-white/80" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          4. NEARBY GROCERY SHOPS (REAL MONGODB DATA)
         ────────────────────────────────────────────────────────── */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-sky-600" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Nearby Grocery Shops
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Verified stores near <span className="font-bold text-slate-700">{city}</span> with fresh stock
              </p>
            </div>

            <Link
              to="/shops"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-sky-600 hover:text-sky-700 hover:underline group"
            >
              <span>View All ({shops.length})</span>
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {loadingShops ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="card overflow-hidden">
                  <div className="h-44 skeleton rounded-t-2xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-5 skeleton rounded-lg w-3/4" />
                    <div className="h-3 skeleton rounded-lg w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div className="card p-10 text-center border-dashed border-2 border-slate-200">
              <Store className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-extrabold text-slate-800">No shops registered in this area</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Try switching your delivery location or register as a shop owner to open a store here!
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button onClick={openLocationModal} className="btn-secondary py-2 px-4 rounded-xl text-xs font-bold">
                  Change Location
                </button>
                <Link to="/register" className="btn-primary py-2 px-4 rounded-xl text-xs font-bold">
                  Open a Shop
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {shops.map((shop, i) => (
                <Link
                  key={shop._id}
                  to={`/shops/${shop._id}`}
                  className="card card-hover group block overflow-hidden border border-slate-100 hover:border-sky-200 shadow-sm hover:shadow-xl transition-all"
                >
                  {/* Shop Banner Image */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    {shop.shopImage ? (
                      <img
                        src={shop.shopImage}
                        alt={shop.shopName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 text-sky-700">
                        <Store size={36} />
                        <span className="text-xs font-bold mt-2">{shop.shopName}</span>
                      </div>
                    )}

                    {/* Distance Badge */}
                    {shop.distance !== undefined ? (
                      <div className="absolute top-3 right-3 glass px-2.5 py-1 rounded-full text-xs font-extrabold text-sky-800 flex items-center gap-1 shadow-sm">
                        <MapPin size={11} className="text-sky-600" />
                        {shop.distance.toFixed(1)} km
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 glass px-2.5 py-1 rounded-full text-xs font-extrabold text-slate-700 flex items-center gap-1 shadow-sm">
                        <Clock size={11} className="text-slate-500" />
                        25-35 min
                      </div>
                    )}

                    {/* Rating Badge */}
                    <div className="absolute bottom-3 left-3 bg-white/95 px-2 py-0.5 rounded-lg text-xs font-black text-slate-900 flex items-center gap-1 shadow-xs">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      4.8
                    </div>
                  </div>

                  {/* Shop Details */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base group-hover:text-sky-600 transition-colors truncate">
                        {shop.shopName}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      {shop.address}, {shop.city}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {shop.deliveryAvailable && (
                          <span className="badge-green text-[10px] py-0.5">🚚 Delivery</span>
                        )}
                        {shop.pickupAvailable && (
                          <span className="badge-blue text-[10px] py-0.5">🛍 Pickup</span>
                        )}
                      </div>
                      <span className="font-bold text-slate-700">
                        Min. ₹{shop.minimumOrderAmount}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          5. SHOP CATEGORIES (CLICKABLE & FILTERABLE)
         ────────────────────────────────────────────────────────── */}
      <section className="py-12 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-600">BROWSE AISLES</p>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Shop by Category
              </h2>
            </div>
            <Link to="/shops" className="text-xs sm:text-sm font-bold text-sky-600 hover:underline">
              All Aisles →
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/shops?categoryId=${cat._id}`}
                className="card p-3 sm:p-4 text-center hover:border-sky-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group flex flex-col items-center justify-center"
              >
                <div className="text-3xl sm:text-4xl mb-1.5 group-hover:scale-110 transition-transform">
                  {CATEGORY_EMOJIS[cat.name] || '🛒'}
                </div>
                <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-sky-600 transition-colors">
                  {cat.name}
                </p>
                <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Explore</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          6. POPULAR PRODUCTS (REAL MONGODB DATA WITH ADD TO CART)
         ────────────────────────────────────────────────────────── */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-emerald-600" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Popular Products Near You
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Fast selling daily groceries from verified local shops
              </p>
            </div>

            <Link
              to="/shops"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-sky-600 hover:underline"
            >
              <span>View All</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="card p-3 space-y-3">
                  <div className="h-32 skeleton rounded-xl" />
                  <div className="h-4 skeleton rounded-lg w-3/4" />
                  <div className="h-4 skeleton rounded-lg w-1/2" />
                </div>
              ))}
            </div>
          ) : popularProducts.length === 0 ? (
            <div className="card p-10 text-center border-dashed border-2 border-slate-200">
              <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No products available right now</p>
              <p className="text-xs text-slate-400 mt-1">Check back soon or browse shops</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
              {popularProducts.map((product) => {
                const shopName =
                  typeof product.shopId === 'object' && product.shopId
                    ? (product.shopId as Shop).shopName
                    : 'Local Store';
                const isAdded = addedItemIds[product._id];

                return (
                  <div
                    key={product._id}
                    className="card p-3.5 hover:shadow-xl hover:border-sky-200 transition-all flex flex-col justify-between group"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-36 bg-slate-50 rounded-2xl p-2 flex items-center justify-center overflow-hidden border border-slate-100">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <ShoppingBag size={32} className="text-slate-300" />
                      )}

                      {/* Low Stock Badge */}
                      {product.stock <= 5 && product.stock > 0 && (
                        <span className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-2xs">
                          {product.stock} left
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="mt-3">
                      <p className="text-[11px] font-bold text-sky-700 truncate flex items-center gap-1">
                        <Store size={11} /> {shopName}
                      </p>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1 line-clamp-2 leading-tight">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{product.unit}</p>
                    </div>

                    {/* Price and Add button */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm sm:text-base font-black text-slate-900">
                        ₹{product.price}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.isAvailable || product.stock <= 0}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'btn-primary'
                        } disabled:opacity-50`}
                      >
                        {isAdded ? (
                          <>
                            <Check size={13} /> Added
                          </>
                        ) : (
                          <>
                            <Plus size={13} /> Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          7. HOW LOCALGROCERY WORKS (5-STEP WORKFLOW)
         ────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
              SIMPLE & HASSLE-FREE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
              How LocalGrocery Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Order fresh groceries from your nearby neighborhood shop in 5 easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {STEPS.map((step) => (
              <div
                key={step.step}
                className="relative card p-5 text-center flex flex-col items-center hover:shadow-xl transition-all border border-slate-100"
              >
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 h-7 w-7 rounded-full gradient-primary text-white font-black text-xs flex items-center justify-center shadow-md">
                  {step.step}
                </div>

                <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center mt-3 mb-3 border border-slate-100">
                  {step.icon}
                </div>

                <h3 className="font-extrabold text-sm text-slate-900 leading-tight">{step.title}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          8. WHY LOCALGROCERY? (TRUST PROPOSITIONS)
         ────────────────────────────────────────────────────────── */}
      <section className="py-12 bg-sky-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <Truck className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base">Fast 2-Hour Delivery</h4>
                <p className="text-xs text-sky-200 mt-1">Get groceries delivered from shops in your immediate locality</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base">Verified Local Shops</h4>
                <p className="text-xs text-sky-200 mt-1">Every store is verified & reviewed by our local community team</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <CreditCard className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base">100% Cash on Delivery</h4>
                <p className="text-xs text-sky-200 mt-1">Inspect your items at the door and pay directly with cash</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <Clock className="h-6 w-6 text-sky-300" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base">Live Status Tracking</h4>
                <p className="text-xs text-sky-200 mt-1">Real-time status updates from store preparation to delivery</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          9. FOOTER
         ────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center text-white font-bold">
                  <ShoppingBag size={16} />
                </div>
                <span className="font-black text-white text-lg tracking-tight">
                  Local<span className="text-sky-500">Grocery</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Empowering neighborhood grocery stores by connecting them directly with local households. Fresh, fast, and community-driven.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Quick Links</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/shops" className="hover:text-white transition-colors">Find Nearby Shops</Link></li>
                <li><Link to="/orders" className="hover:text-white transition-colors">My Orders</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Register as Shop Owner</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Account Login</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Top Categories</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/shops" className="hover:text-white transition-colors">Fresh Vegetables & Fruits</Link></li>
                <li><Link to="/shops" className="hover:text-white transition-colors">Dairy, Milk & Curd</Link></li>
                <li><Link to="/shops" className="hover:text-white transition-colors">Rice, Dal & Grains</Link></li>
                <li><Link to="/shops" className="hover:text-white transition-colors">Snacks & Beverages</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Delivery Locations</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Currently serving Pollachi, Coimbatore, Tiruppur, Udumalaipettai, and expanding across Tamil Nadu.
              </p>
              <span className="badge-blue text-[10px] font-bold">📍 Active: {city}</span>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>© {new Date().getFullYear()} LocalGrocery Booking System. All rights reserved.</p>
            <p className="text-slate-500">Built with React, Node.js, Express, MongoDB Atlas & Tailwind CSS</p>
          </div>
        </div>
      </footer>
    </MainLayout>
  );
};

export default Home;
