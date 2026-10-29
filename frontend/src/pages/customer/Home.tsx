import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useAddressStore } from '../../store/addressStore';
import { toast } from '../../store/toastStore';
import { useFavoriteStore } from '../../store/favoriteStore';
import { api } from '../../services/api';
import { Shop, Product, Category } from '../../types';
import MainLayout from '../../components/layout/MainLayout';
import { ProductCardSkeleton } from '../../components/common/ProductCardSkeleton';
import { ShopCardSkeleton } from '../../components/common/ShopCardSkeleton';
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
  ChevronLeft,
  ArrowRight,
  Plus,
  Minus,
  Check,
  Sparkles,
  Percent,
  Copy,
  PackageCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  X,
  Flame,
  User,
  Heart,
  HelpCircle,
  Settings,
  ShoppingCart,
  ExternalLink,
  Leaf,
  Package,
  LayoutGrid,
  SlidersHorizontal,
} from 'lucide-react';

const PRODUCT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80';

// 3 Dynamic Slides for Auto-Moving Hero Banner
const HERO_SLIDES = [
  {
    tag: 'Fresh & Healthy',
    icon: Leaf,
    tagClass: 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    title: 'Fresh Groceries,',
    titleHighlight: 'Right Around the Corner',
    highlightClass: 'text-emerald-600 dark:text-emerald-400',
    subtitle: 'Discover trusted local grocery shops and order everyday essentials with ease.',
    note: 'Good Food, Better Life',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80',
    bgGradient: 'from-emerald-50/90 via-teal-50/40 to-slate-50/30 dark:from-[#172033] dark:via-[#111827] dark:to-[#172033]',
  },
  {
    tag: 'Farm Fresh Essentials',
    icon: Sparkles,
    tagClass: 'bg-emerald-100/90 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    title: 'Pure Dairy & Eggs,',
    titleHighlight: 'Crisp Seasonal Produce',
    highlightClass: 'text-emerald-600 dark:text-emerald-400',
    subtitle: 'Directly sourced farm-fresh milk, organic eggs, and orchard fruits packed with care every morning.',
    note: '100% Farm Sourced',
    image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=700&q=80',
    bgGradient: 'from-emerald-50/80 via-green-50/40 to-slate-50/30 dark:from-[#172033] dark:via-[#111827] dark:to-[#172033]',
  },
  {
    tag: 'Weekly Mega Savings',
    icon: Percent,
    tagClass: 'bg-amber-100/90 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300',
    iconClass: 'text-amber-600 dark:text-amber-400',
    title: 'Wholesale Savings on',
    titleHighlight: 'Rice, Dals & Staples',
    highlightClass: 'text-emerald-600 dark:text-emerald-400',
    subtitle: 'Best neighbourhood prices on rice, spices, lentils, and daily household needs from verified local shops.',
    note: 'Best Price Guaranteed',
    image: 'https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=700&q=80',
    bgGradient: 'from-amber-50/80 via-emerald-50/30 to-slate-50/30 dark:from-[#172033] dark:via-[#111827] dark:to-[#172033]',
  },
];

// Illustrated Categories matching Screenshot & DB
const POPULAR_CATEGORIES = [
  { name: 'Vegetables', icon: '🥦', slug: 'vegetables' },
  { name: 'Fruits', icon: '🍎', slug: 'fruits' },
  { name: 'Dairy & Eggs', icon: '🥛', slug: 'dairy' },
  { name: 'Bakery', icon: '🍞', slug: 'bakery' },
  { name: 'Rice & Grains', icon: '🍚', slug: 'rice-grains' },
  { name: 'Snacks', icon: '🍿', slug: 'snacks' },
  { name: 'Beverages', icon: '🧃', slug: 'beverages' },
  { name: 'Household', icon: '🧴', slug: 'household' },
  { name: 'Personal Care', icon: '🧼', slug: 'personal-care' },
  { name: 'Spices & Masala', icon: '🌶️', slug: 'spices-masala' },
  { name: 'Pulses & Lentils', icon: '🫘', slug: 'pulses-lentils' },
  { name: 'Cooking Oil', icon: '🫒', slug: 'cooking-oil' },
  { name: 'Meat & Seafood', icon: '🥩', slug: 'meat-seafood' },
  { name: 'Frozen Foods', icon: '🧊', slug: 'frozen-foods' },
  { name: 'Baby Products', icon: '🍼', slug: 'baby-products' },
  { name: 'Cleaning', icon: '🧹', slug: 'cleaning-supplies' },
];

export const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { cart, addToCart, updateQuantity, removeItem, fetchCart } = useCartStore();
  const { activeAddress, openModal: openAddressModal, fetchAddresses } = useAddressStore();
  const { isFavorite, toggleFavorite, fetchFavorites } = useFavoriteStore();

  const [shops, setShops] = useState<Shop[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');

  const [loadingShops, setLoadingShops] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Search state inside hero
  const [heroSearchInput, setHeroSearchInput] = useState('');

  // Hero carousel state & Auto-moving animation
  const [heroSlide, setHeroSlide] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Slider Refs for right-to-left moving products and categories
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const productScrollRef = useRef<HTMLDivElement>(null);
  const [productAnimKey, setProductAnimKey] = useState(0);
  const [productViewMode, setProductViewMode] = useState<'grid' | 'carousel'>('grid');

  // Auto-moving animation for Hero Banner: transitions automatically every 4.5 seconds
  useEffect(() => {
    if (isHeroHovered || isSearchFocused) return;
    const interval = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isHeroHovered, isSearchFocused]);

  // Load addresses, favorites & cart on mount
  useEffect(() => {
    fetchCart();
    if (isAuthenticated) {
      fetchAddresses();
      fetchFavorites();
    }
  }, [isAuthenticated, fetchAddresses, fetchFavorites, fetchCart]);

  // Load shops, products & categories from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingShops(true);
        setLoadingProducts(true);

        const [shopRes, prodRes, catRes] = await Promise.all([
          api.get('/shops', { params: { limit: 6 } }).catch(() => ({ data: { success: false, data: [] } })),
          api.get('/products', { params: { limit: 250 } }).catch(() => ({ data: { success: false, data: [] } })),
          api.get('/categories').catch(() => ({ data: { success: false, data: [] } })),
        ]);

        if (shopRes.data.success) {
          setShops(shopRes.data.data || []);
        }
        if (prodRes.data.success) {
          setPopularProducts(prodRes.data.data || []);
        }
        if (catRes.data.success) {
          setCategories(catRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load initial grocery data:', err);
      } finally {
        setLoadingShops(false);
        setLoadingProducts(false);
      }
    };

    fetchData();
  }, []);

  // Filtered products based on selected category
  const filteredProducts = useMemo(() => {
    if (selectedCategorySlug === 'all') return popularProducts;
    return popularProducts.filter((p) => {
      const cat = typeof p.categoryId === 'object' ? p.categoryId : null;
      if (!cat) return true;
      const catSlug = (cat.slug || cat.name || '').toLowerCase();
      const target = selectedCategorySlug.toLowerCase();
      return (
        catSlug.includes(target) ||
        target.includes(catSlug) ||
        (target === 'dairy' && (catSlug.includes('dairy') || catSlug.includes('milk') || catSlug.includes('egg'))) ||
        (target === 'vegetables' && catSlug.includes('veg')) ||
        (target === 'fruits' && catSlug.includes('fruit')) ||
        (target === 'household' && (catSlug.includes('house') || catSlug.includes('clean')))
      );
    });
  }, [popularProducts, selectedCategorySlug]);

  // Scroll helpers to move categories and products smoothly right to left
  const scrollCategory = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollProducts = (direction: 'left' | 'right') => {
    if (productScrollRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      productScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // When user clicks "More" in the category row:
  // 1. Moves the categories track right to left
  // 2. Moves the products track right to left
  // 3. Re-triggers right-to-left slide animation on product cards
  const handleCategoryMoreClick = () => {
    // 1. Scroll categories track
    if (categoryScrollRef.current) {
      const el = categoryScrollRef.current;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 20) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 320, behavior: 'smooth' });
      }
    }

    // 2. Scroll products track right to left
    if (productScrollRef.current) {
      const pEl = productScrollRef.current;
      const pMax = pEl.scrollWidth - pEl.clientWidth;
      if (pEl.scrollLeft >= pMax - 20) {
        pEl.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        pEl.scrollBy({ left: 360, behavior: 'smooth' });
      }
    }

    // 3. Trigger smooth right-to-left entrance animation
    setProductAnimKey((k) => k + 1);
    toast.info('Browsing more products & categories 👉');
  };

  // Category select handler with right-to-left product animation
  const handleSelectCategory = (slug: string) => {
    setSelectedCategorySlug(slug);
    setProductAnimKey((k) => k + 1);
    if (productScrollRef.current) {
      productScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  // Cart item helper
  const getCartQuantity = (productId: string) => {
    if (!cart?.items) return 0;
    const item = cart.items.find((i) => {
      const pid = typeof i.productId === 'object' ? i.productId._id : i.productId;
      return pid === productId;
    });
    return item ? item.quantity : 0;
  };

  const handleAddToCart = async (product: Product) => {
    if (product.stock <= 0 || !product.isAvailable) {
      toast.error('Item is out of stock');
      return;
    }
    const ok = await addToCart(product, 1);
    if (ok) {
      toast.success(`Added ${product.name} to cart!`);
    } else {
      const err = useCartStore.getState().error;
      if (err && !useCartStore.getState().conflictModal) {
        toast.error(err);
      }
    }
  };

  const handleIncrement = async (productId: string, currentQty: number, maxStock = 99) => {
    if (currentQty >= maxStock) {
      toast.error(`Only ${maxStock} in stock!`);
      return;
    }
    await updateQuantity(productId, currentQty + 1);
  };

  const handleDecrement = async (productId: string, currentQty: number) => {
    if (currentQty <= 1) {
      await removeItem(productId);
    } else {
      await updateQuantity(productId, currentQty - 1);
    }
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroSearchInput.trim()) return;
    navigate(`/shops?search=${encodeURIComponent(heroSearchInput.trim())}`);
  };

  // Formatted active address display
  const addressString = activeAddress
    ? `${activeAddress.houseStreet || activeAddress.addressLine1}, ${activeAddress.areaCity || activeAddress.city} - ${activeAddress.pinCode || activeAddress.postalCode}`
    : 'No. 12, Anna Nagar, Pollachi, Coimbatore - 642001';

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-8">
        {/* Main 2-Column Responsive Desktop Layout matching Screenshot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ======================================================== */}
          {/* LEFT COLUMN: Main Grocery Content (~75% on Desktop)     */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6 sm:space-y-8">
            {/* 1. HERO BANNER with Auto-Moving Animation & Dynamic Slides */}
            {(() => {
              const currentSlide = HERO_SLIDES[heroSlide];
              const TagIcon = currentSlide.icon;

              return (
                <div
                  onMouseEnter={() => setIsHeroHovered(true)}
                  onMouseLeave={() => setIsHeroHovered(false)}
                  className={`relative rounded-3xl bg-gradient-to-r ${currentSlide.bgGradient} border border-slate-200/80 dark:border-[#2D3748] p-4 sm:p-7 lg:p-10 pb-6 sm:pb-8 overflow-hidden shadow-xs transition-colors duration-700`}
                >
                  <div key={heroSlide} className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center animate-slide-in-right">
                    {/* Left Hero Content */}
                    <div className="md:col-span-7 z-10 space-y-2.5 sm:space-y-4">
                      {/* Dynamic Tag */}
                      <span className={`inline-flex items-center gap-1.5 ${currentSlide.tagClass} text-[10px] sm:text-xs font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-2xs`}>
                        <TagIcon size={13} className={currentSlide.iconClass} />
                        {currentSlide.tag}
                      </span>

                      {/* Main Headline */}
                      <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-[#F9FAFB] tracking-tight leading-snug sm:leading-tight">
                        {currentSlide.title}{' '}
                        <span className={currentSlide.highlightClass}>{currentSlide.titleHighlight}</span>
                      </h1>

                      {/* Subtitle */}
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A7B3C5] font-medium max-w-lg leading-relaxed line-clamp-2 sm:line-clamp-none">
                        {currentSlide.subtitle}
                      </p>

                      {/* Action CTAs: Side-by-side on mobile, saving vertical space */}
                      <div className="flex flex-row items-center gap-2 pt-0.5 sm:pt-1">
                        <Link
                          to="/shops"
                          className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer group text-center"
                        >
                          <span>Explore Shops</span>
                          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            categoryScrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          className="flex-1 sm:flex-none px-3.5 sm:px-4 py-2.5 rounded-xl bg-white dark:bg-[#172033] hover:bg-slate-50 dark:hover:bg-[#111827] text-slate-800 dark:text-[#F9FAFB] font-bold text-xs sm:text-sm border border-slate-200 dark:border-[#2D3748] transition-all cursor-pointer shadow-xs text-center"
                        >
                          Categories
                        </button>
                      </div>

                      {/* Hero Search Box with Clean, Non-Truncating Placeholder */}
                      <form onSubmit={handleHeroSearch} className="pt-0.5 sm:pt-1 max-w-md">
                        <div className="flex items-center bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#2D3748] p-1 sm:p-1.5 shadow-sm focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-500/20 transition-all">
                          <div className="pl-2.5 text-slate-400 dark:text-[#A7B3C5] shrink-0">
                            <Search size={15} />
                          </div>
                          <input
                            type="text"
                            value={heroSearchInput}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            onChange={(e) => setHeroSearchInput(e.target.value)}
                            placeholder="Search fresh groceries or shops..."
                            className="w-full min-w-0 px-2 sm:px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-[#F9FAFB] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none bg-transparent truncate"
                          />
                          <button
                            type="submit"
                            className="px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 dark:shadow-emerald-950/40 transition-all shrink-0 cursor-pointer"
                          >
                            Search
                          </button>
                        </div>
                      </form>

                      {/* Trust Bullets below Search - 2x2 Grid on Mobile, Balanced & Compact */}
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-4 pt-1 sm:pt-2 text-[10px] sm:text-xs font-bold text-slate-700 dark:text-[#A7B3C5]">
                        <span className="flex items-center gap-1.5 truncate">
                          <Store size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" /> Shop Local
                        </span>
                        <span className="flex items-center gap-1.5 truncate">
                          <Leaf size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" /> Fresh Essentials
                        </span>
                        <span className="flex items-center gap-1.5 truncate">
                          <Truck size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" /> Easy Ordering
                        </span>
                        <span className="flex items-center gap-1.5 truncate">
                          <CreditCard size={13} className="text-amber-600 dark:text-amber-400 shrink-0" /> Cash on Delivery
                        </span>
                      </div>
                    </div>

                    {/* Right Hero Image */}
                    <div className="md:col-span-5 relative flex items-center justify-center">
                      <div className="relative w-full max-w-sm h-36 sm:h-48 md:h-56 flex items-center justify-center">
                        {/* Handwritten Style Annotation */}
                        <div className="absolute top-2 left-2 rotate-[-8deg] bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xs px-2.5 py-0.5 rounded-xl shadow-xs border border-slate-100 dark:border-[#2D3748] z-10 hidden sm:block">
                          <p className="text-[10px] sm:text-[11px] font-black text-slate-800 dark:text-[#F9FAFB] tracking-wide font-serif italic">
                            {currentSlide.note}
                          </p>
                        </div>

                        <img
                          src={currentSlide.image}
                          alt={currentSlide.title}
                          className="w-full h-full object-cover rounded-2xl sm:rounded-3xl shadow-md border-2 border-white dark:border-[#2D3748]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Carousel Controls (Desktop) */}
                  <button
                    type="button"
                    onClick={() => setHeroSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
                    className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-[#172033]/90 hover:bg-white dark:hover:bg-[#172033] text-slate-700 dark:text-[#F9FAFB] border border-transparent dark:border-[#2D3748] shadow-md items-center justify-center transition-all cursor-pointer z-20"
                    title="Previous Slide"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                    className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-[#172033]/90 hover:bg-white dark:hover:bg-[#172033] text-slate-700 dark:text-[#F9FAFB] border border-transparent dark:border-[#2D3748] shadow-md items-center justify-center transition-all cursor-pointer z-20"
                    title="Next Slide"
                  >
                    <ChevronRight size={18} />
                  </button>

                  {/* Slide Indicators with Progress Animation */}
                  <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                    {HERO_SLIDES.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setHeroSlide(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          heroSlide === idx ? 'w-6 bg-emerald-600 dark:bg-emerald-400' : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                        }`}
                        title={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 2. SHOP BY CATEGORY - Responsive & Touch-Swipeable */}
            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-[#F9FAFB] tracking-tight">
                    Shop by Category
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#A7B3C5]">
                    Fresh farm produce & everyday essentials
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Category Rail Scroll Buttons (Desktop) */}
                  <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-[#111827] p-1 rounded-xl border border-transparent dark:border-[#2D3748]">
                    <button
                      type="button"
                      onClick={() => scrollCategory('left')}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-[#172033] hover:bg-slate-50 dark:hover:bg-[#111827] text-slate-700 dark:text-[#F9FAFB] shadow-2xs dark:shadow-none flex items-center justify-center transition-all cursor-pointer"
                      title="Scroll categories left"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCategory('right')}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-[#172033] hover:bg-slate-50 dark:hover:bg-[#111827] text-slate-700 dark:text-[#F9FAFB] shadow-2xs dark:shadow-none flex items-center justify-center transition-all cursor-pointer"
                      title="Scroll categories right"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <Link
                    to="/shops"
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 transition-colors pl-1 shrink-0"
                  >
                    View All <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Scrollable Category Rail with Snapping and "More" Action */}
              <div
                ref={categoryScrollRef}
                className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scroll-smooth scrollbar-none snap-x snap-mandatory"
              >
                {/* All Categories Option */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory('all')}
                  className={`min-w-[76px] sm:min-w-[90px] p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0 snap-start ${
                    selectedCategorySlug === 'all'
                      ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50/70 dark:bg-[#12352D] ring-2 ring-emerald-200 dark:ring-emerald-500/30 shadow-xs'
                      : 'border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] hover:border-slate-300 dark:hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-[#111827]'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl select-none">🛒</span>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-[#F9FAFB] text-center line-clamp-1">All</span>
                </button>

                {POPULAR_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategorySlug === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => handleSelectCategory(cat.slug)}
                      className={`min-w-[76px] sm:min-w-[90px] p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0 snap-start ${
                        isSelected
                          ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50/70 dark:bg-[#12352D] ring-2 ring-emerald-200 dark:ring-emerald-500/30 shadow-xs'
                          : 'border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] hover:border-slate-300 dark:hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-[#111827]'
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl select-none">{cat.icon}</span>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-[#F9FAFB] text-center line-clamp-1">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}

                {/* Dedicated "More" (⋯) Button */}
                <button
                  type="button"
                  onClick={handleCategoryMoreClick}
                  className="min-w-[76px] sm:min-w-[90px] p-2.5 sm:p-3 rounded-2xl border-2 border-emerald-400 dark:border-emerald-500/60 bg-emerald-50/60 dark:bg-[#12352D] hover:bg-emerald-100 dark:hover:bg-[#12352D]/80 text-emerald-700 dark:text-emerald-300 flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0 snap-start shadow-xs group"
                  title="Click to move categories and products right to left"
                >
                  <span className="text-2xl sm:text-3xl font-black group-hover:scale-110 transition-transform">⋯</span>
                  <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-200 text-center flex items-center gap-0.5">
                    More <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              </div>
            </div>

            {/* 3. NEARBY SHOPS matching Screenshot */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-[#F9FAFB] tracking-tight">Nearby Shops</h3>
                <Link
                  to="/shops"
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 transition-colors"
                >
                  View All <ArrowRight size={13} />
                </Link>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mb-3 sm:mb-4">Find fresh products from shops near you</p>

              {loadingShops ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <ShopCardSkeleton count={3} />
                </div>
              ) : shops.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-[#172033] rounded-3xl border border-slate-100 dark:border-[#2D3748] text-slate-400 dark:text-[#A7B3C5]">
                  <Store size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-bold text-slate-700 dark:text-[#F9FAFB]">No nearby shops available</p>
                  <p className="text-xs mt-1">Please check back soon or try another location</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {shops.slice(0, 3).map((shop, sIdx) => {
                    const fallbackImages = [
                      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
                      'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=600&q=80',
                      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=600&q=80',
                    ];
                    const shopImg = shop.shopImage || fallbackImages[sIdx % fallbackImages.length];

                    return (
                      <div
                        key={shop._id}
                        className="rounded-3xl border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] hover:border-slate-300 dark:hover:border-emerald-500/50 hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between group"
                      >
                        {/* Storefront Image */}
                        <div className="relative h-36 bg-slate-100 dark:bg-[#111827] overflow-hidden">
                          <img
                            src={shopImg}
                            alt={shop.shopName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Open Badge */}
                          <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            Open
                          </span>
                        </div>

                        {/* Shop Info */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <MapPin size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <h4 className="text-sm font-black text-slate-900 dark:text-[#F9FAFB] truncate">{shop.shopName}</h4>
                            </div>

                            {/* Ratings & Reviews */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#A7B3C5] mt-1">
                              <Star size={13} className="text-amber-500 fill-amber-500" />
                              <span className="font-bold text-slate-800 dark:text-[#F9FAFB]">4.5</span>
                              <span className="text-slate-400 dark:text-slate-500">({90 + sIdx * 34} reviews)</span>
                            </div>

                            {/* Honest Distance or City */}
                            <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-1">
                              {typeof shop.distance === 'number' && !isNaN(shop.distance)
                                ? `${shop.distance.toFixed(1)} km away`
                                : `${shop.city || 'Pollachi'}`}
                            </p>

                            {/* Service Badges */}
                            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 dark:text-[#A7B3C5] mt-2">
                              <span className="flex items-center gap-1">
                                <Truck size={12} className="text-emerald-600 dark:text-emerald-400" /> Delivery
                              </span>
                              <span className="flex items-center gap-1">
                                <ShoppingBag size={12} className="text-purple-600 dark:text-purple-400" /> Pickup
                              </span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <Link
                            to={`/shops/${shop._id}`}
                            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black text-xs text-center shadow-md shadow-emerald-600/20 dark:shadow-emerald-950/40 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            View Shop <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. ALL PRODUCTS: Responsive Grid showing the entire product catalog + Slider View Toggle */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F9FAFB] tracking-tight">
                      All Grocery Products
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-[#12352D] text-emerald-800 dark:text-emerald-300 text-[11px] font-black uppercase tracking-wider">
                      {filteredProducts.length} items
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-0.5">
                    Showing the entire product range • Farm fresh veggies, dairy, staples & daily needs
                  </p>
                </div>

                {/* View Mode Toggle (Grid View / Slider View) & Navigation */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="flex items-center bg-slate-100 dark:bg-[#111827] p-1 rounded-xl border border-slate-200/60 dark:border-[#2D3748]">
                    <button
                      type="button"
                      onClick={() => setProductViewMode('grid')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        productViewMode === 'grid'
                          ? 'bg-white dark:bg-[#172033] text-emerald-700 dark:text-emerald-400 shadow-2xs dark:shadow-none font-black'
                          : 'text-slate-600 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB]'
                      }`}
                      title="Show all products in responsive grid"
                    >
                      <LayoutGrid size={14} />
                      <span>Grid View</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProductViewMode('carousel')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        productViewMode === 'carousel'
                          ? 'bg-white dark:bg-[#172033] text-emerald-700 dark:text-emerald-400 shadow-2xs dark:shadow-none font-black'
                          : 'text-slate-600 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB]'
                      }`}
                      title="Browse products in horizontal slider"
                    >
                      <SlidersHorizontal size={14} />
                      <span>Slider View</span>
                    </button>
                  </div>

                  {/* Horizontal Scroll Arrows (Active when in Slider View) */}
                  {productViewMode === 'carousel' && (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#111827] p-1 rounded-xl border border-transparent dark:border-[#2D3748]">
                      <button
                        type="button"
                        onClick={() => scrollProducts('left')}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-[#172033] hover:bg-slate-50 dark:hover:bg-[#111827] text-slate-700 dark:text-[#F9FAFB] shadow-2xs dark:shadow-none flex items-center justify-center transition-all cursor-pointer"
                        title="Move products left to right"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollProducts('right')}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-[#172033] hover:bg-slate-50 dark:hover:bg-[#111827] text-slate-700 dark:text-[#F9FAFB] shadow-2xs dark:shadow-none flex items-center justify-center transition-all cursor-pointer"
                        title="Move products right to left"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  )}

                  <Link
                    to="/shops"
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 transition-colors pl-1"
                  >
                    View Shops <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              {loadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3.5 sm:gap-4 py-2">
                  <ProductCardSkeleton count={8} />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-[#172033] rounded-3xl border border-slate-100 dark:border-[#2D3748] text-slate-400 dark:text-[#A7B3C5]">
                  <Package size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-bold text-slate-700 dark:text-[#F9FAFB]">No products found in this category</p>
                  <button
                    onClick={() => handleSelectCategory('all')}
                    className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 underline cursor-pointer"
                  >
                    Show all products
                  </button>
                </div>
              ) : productViewMode === 'grid' ? (
                /* Responsive Grid displaying the entire products in full view */
                <div
                  key={`grid-${productAnimKey}`}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-4 pt-2 animate-slide-in-right"
                >
                  {filteredProducts.map((product, pIdx) => {
                    const originalPrice = product.originalPrice || Math.round(product.price * 1.3);
                    const discount =
                      product.discountPercentage ||
                      Math.max(8, Math.round(((originalPrice - product.price) / originalPrice) * 100));
                    const cartQty = getCartQuantity(product._id);
                    const isOutOfStock = product.stock <= 0 || !product.isAvailable;
                    const isFav = isFavorite(product._id);

                    return (
                      <div
                        key={product._id}
                        className="rounded-2xl border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-lg transition-all p-2.5 sm:p-3.5 flex flex-col justify-between group relative"
                      >
                        {/* Heart / Favourite Toggle Button */}
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isAuthenticated) {
                              toast.info('Please sign in to save favourite products');
                              navigate('/login');
                              return;
                            }
                            const isNowFav = await toggleFavorite(product);
                            toast.success(
                              isNowFav
                                ? `Added ${product.name} to favourites`
                                : `Removed ${product.name} from favourites`
                            );
                          }}
                          className="absolute top-2.5 right-2.5 z-20 h-7 w-7 rounded-full bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xs text-slate-400 dark:text-[#A7B3C5] hover:text-red-500 flex items-center justify-center shadow-xs transition-all cursor-pointer"
                          title={isFav ? 'Remove from favourites' : 'Save to favourites'}
                        >
                          <Heart size={14} className={isFav ? 'fill-red-500 text-red-500' : ''} />
                        </button>

                        {/* Image & Discount Badge */}
                        <Link to={`/products/${product._id}`} className="block">
                          <div className="relative aspect-square rounded-xl bg-slate-50 dark:bg-[#111827] p-2.5 flex items-center justify-center overflow-hidden mb-2">
                            {/* Green Discount Badge */}
                            <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-2xs z-10">
                              {discount}% OFF
                            </span>

                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = PRODUCT_FALLBACK_IMAGE;
                                }}
                              />
                            ) : (
                              <Package size={32} className="text-slate-300 dark:text-slate-600" />
                            )}
                          </div>

                          {/* Title & Weight */}
                          <h5 className="text-xs sm:text-sm font-black text-slate-900 dark:text-[#F9FAFB] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 leading-snug">
                            {product.name}
                          </h5>
                          <p className="text-[10px] text-slate-400 dark:text-[#A7B3C5] mt-0.5">
                            {product.unit} (Approx.)
                          </p>

                          {/* Rating Snippet */}
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-[#A7B3C5] mt-1">
                            <Star size={11} className="text-amber-500 fill-amber-500" />
                            <span className="font-bold text-slate-800 dark:text-[#F9FAFB]">4.5</span>
                            <span className="text-slate-400 dark:text-slate-500">({100 + pIdx * 18})</span>
                          </div>

                          {/* Price */}
                          <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-[#F9FAFB]">
                              ₹{product.price}
                            </span>
                            {originalPrice > product.price && (
                              <span className="text-[11px] text-slate-400 dark:text-[#A7B3C5]/70 line-through font-semibold">
                                ₹{originalPrice}
                              </span>
                            )}
                          </div>
                        </Link>

                        {/* Add to Cart / Stepper Button */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-[#2D3748]">
                          {isOutOfStock ? (
                            <button
                              disabled
                              className="w-full py-2 rounded-xl bg-slate-100 dark:bg-[#111827] text-slate-400 dark:text-slate-500 font-bold text-[11px] cursor-not-allowed"
                            >
                              Out of Stock
                            </button>
                          ) : cartQty > 0 ? (
                            <div className="flex items-center justify-between bg-emerald-600 dark:bg-emerald-600 text-white rounded-xl p-1 shadow-xs">
                              <button
                                type="button"
                                onClick={() => handleDecrement(product._id, cartQty)}
                                className="w-6 h-6 rounded-lg bg-emerald-700 hover:bg-emerald-800 flex items-center justify-center font-bold text-xs"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-xs font-black px-2">{cartQty}</span>
                              <button
                                type="button"
                                onClick={() => handleIncrement(product._id, cartQty, product.stock)}
                                className="w-6 h-6 rounded-lg bg-emerald-700 hover:bg-emerald-800 flex items-center justify-center font-bold text-xs"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(product)}
                              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm shadow-emerald-600/20 dark:shadow-emerald-950/40 transition-all cursor-pointer"
                            >
                              <ShoppingCart size={13} /> Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Horizontal Scroll Slider */
                <div
                  ref={productScrollRef}
                  key={`carousel-${productAnimKey}`}
                  className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 pt-2 px-1 scroll-smooth scrollbar-none snap-x snap-mandatory animate-slide-in-right"
                >
                  {filteredProducts.map((product, pIdx) => {
                    const originalPrice = product.originalPrice || Math.round(product.price * 1.3);
                    const discount =
                      product.discountPercentage ||
                      Math.max(8, Math.round(((originalPrice - product.price) / originalPrice) * 100));
                    const cartQty = getCartQuantity(product._id);
                    const isOutOfStock = product.stock <= 0 || !product.isAvailable;
                    const isFav = isFavorite(product._id);

                    return (
                      <div
                        key={product._id}
                        className="min-w-[175px] sm:min-w-[205px] max-w-[215px] shrink-0 snap-start rounded-2xl border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-lg transition-all p-2.5 sm:p-3.5 flex flex-col justify-between group relative"
                      >
                        {/* Heart / Favourite Toggle Button */}
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isAuthenticated) {
                              toast.info('Please sign in to save favourite products');
                              navigate('/login');
                              return;
                            }
                            const isNowFav = await toggleFavorite(product);
                            toast.success(
                              isNowFav
                                ? `Added ${product.name} to favourites`
                                : `Removed ${product.name} from favourites`
                            );
                          }}
                          className="absolute top-2.5 right-2.5 z-20 h-7 w-7 rounded-full bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xs text-slate-400 dark:text-[#A7B3C5] hover:text-red-500 flex items-center justify-center shadow-xs transition-all cursor-pointer"
                          title={isFav ? 'Remove from favourites' : 'Save to favourites'}
                        >
                          <Heart size={14} className={isFav ? 'fill-red-500 text-red-500' : ''} />
                        </button>

                        {/* Image & Discount Badge */}
                        <Link to={`/products/${product._id}`} className="block">
                          <div className="relative aspect-square rounded-xl bg-slate-50 dark:bg-[#111827] p-2 flex items-center justify-center overflow-hidden mb-2">
                            {/* Green Discount Badge */}
                            <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-2xs z-10">
                              {discount}% OFF
                            </span>

                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = PRODUCT_FALLBACK_IMAGE;
                                }}
                              />
                            ) : (
                              <Package size={32} className="text-slate-300 dark:text-slate-600" />
                            )}
                          </div>

                          {/* Title & Weight */}
                          <h5 className="text-xs font-black text-slate-900 dark:text-[#F9FAFB] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 leading-snug">
                            {product.name}
                          </h5>
                          <p className="text-[10px] text-slate-400 dark:text-[#A7B3C5] mt-0.5">
                            {product.unit} (Approx.)
                          </p>

                          {/* Rating Snippet */}
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-[#A7B3C5] mt-1">
                            <Star size={11} className="text-amber-500 fill-amber-500" />
                            <span className="font-bold text-slate-800 dark:text-[#F9FAFB]">4.5</span>
                            <span className="text-slate-400 dark:text-slate-500">({100 + pIdx * 18})</span>
                          </div>

                          {/* Price */}
                          <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-sm font-black text-slate-900 dark:text-[#F9FAFB]">
                              ₹{product.price}
                            </span>
                            {originalPrice > product.price && (
                              <span className="text-[11px] text-slate-400 dark:text-[#A7B3C5]/70 line-through font-semibold">
                                ₹{originalPrice}
                              </span>
                            )}
                          </div>
                        </Link>

                        {/* Add to Cart / Stepper Button */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-[#2D3748]">
                          {isOutOfStock ? (
                            <button
                              disabled
                              className="w-full py-1.5 rounded-xl bg-slate-100 dark:bg-[#111827] text-slate-400 dark:text-slate-500 font-bold text-[11px] cursor-not-allowed"
                            >
                              Out of Stock
                            </button>
                          ) : cartQty > 0 ? (
                            <div className="flex items-center justify-between bg-emerald-600 dark:bg-emerald-600 text-white rounded-xl p-1 shadow-xs">
                              <button
                                type="button"
                                onClick={() => handleDecrement(product._id, cartQty)}
                                className="w-6 h-6 rounded-lg bg-emerald-700 hover:bg-emerald-800 flex items-center justify-center font-bold text-xs"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-xs font-black px-2">{cartQty}</span>
                              <button
                                type="button"
                                onClick={() => handleIncrement(product._id, cartQty, product.stock)}
                                className="w-6 h-6 rounded-lg bg-emerald-700 hover:bg-emerald-800 flex items-center justify-center font-bold text-xs"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(product)}
                              className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm shadow-emerald-600/20 dark:shadow-emerald-950/40 transition-all cursor-pointer"
                            >
                              <ShoppingCart size={13} /> Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. PROMOTIONAL COMMUNITY BANNER */}
            <div className="rounded-3xl bg-gradient-to-r from-[#064E3B] via-[#059669] to-[#047857] text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-black uppercase tracking-wider text-emerald-200">
                    <Sparkles size={13} className="text-amber-300" />
                    Community First
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Support Your Local Community Stores
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
                    Every order directly strengthens independent grocers and local family farms across Pollachi & Coimbatore. Enjoy genuine freshness at honest neighbourhood prices.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    to="/shops"
                    className="px-5 py-3 rounded-xl bg-white text-emerald-900 font-extrabold text-xs sm:text-sm hover:bg-emerald-50 transition-all shadow-md flex items-center gap-2 cursor-pointer group"
                  >
                    <span>Explore Verified Shops</span>
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* 6. WHY SHOP LOCALLY (4 BENEFITS GRID) */}
            <div className="space-y-4 pt-1">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F9FAFB] tracking-tight">
                  Why Shop Locally?
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-0.5">
                  Direct access to your neighbourhood grocers with modern digital convenience
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] p-5 space-y-3 transition-all hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-md group">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-[#12352D] text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Store size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-[#F9FAFB]">
                      Neighbourhood Stores
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-1 leading-relaxed">
                      Discover trusted independent stores right around your street corner with authentic inventory.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] p-5 space-y-3 transition-all hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-md group">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-[#12352D] text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Leaf size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-[#F9FAFB]">
                      Farm-Fresh Essentials
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-1 leading-relaxed">
                      Daily harvested vegetables, farm dairy, eggs, and authentic regional staples packed with care.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] p-5 space-y-3 transition-all hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-md group">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-[#12352D] text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Truck size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-[#F9FAFB]">
                      Convenient Ordering
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-1 leading-relaxed">
                      Enjoy swift doorstep delivery or quick in-store counter pickup at your preferred schedule.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] p-5 space-y-3 transition-all hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-md group">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-[#F9FAFB]">
                      Cash on Delivery
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-1 leading-relaxed">
                      Zero advance payment worries. Inspect your package and pay comfortably at your doorstep.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT SIDEBAR: Desktop / Laptop / Monitor Only           */}
          {/* Hidden on tablet, android, iphone, and mobile devices    */}
          {/* ======================================================== */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-5 sticky top-24">
            {/* Widget 1: My Account Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] p-4 shadow-xs">
              <Link
                to={isAuthenticated ? '/orders' : '/login'}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-[#F9FAFB] flex items-center justify-center font-black overflow-hidden border border-slate-200 dark:border-[#2D3748]">
                    {isAuthenticated && user?.profileImage ? (
                      <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-slate-500 dark:text-[#A7B3C5]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-[#A7B3C5] uppercase tracking-wider">My Account</h4>
                    <p className="text-xs font-black text-slate-900 dark:text-[#F9FAFB] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {isAuthenticated && user ? `Welcome, ${user.name}` : 'Welcome, Guest'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Widget 2: Delivery Address Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] p-4 shadow-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-[#12352D] text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={16} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-[#F9FAFB]">Delivery Address</h4>
                  <p className="text-xs text-slate-600 dark:text-[#A7B3C5] mt-1 leading-snug line-clamp-2">
                    {addressString}
                  </p>
                  <button
                    type="button"
                    onClick={() => openAddressModal()}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mt-1.5 inline-block cursor-pointer"
                  >
                    Change Address
                  </button>
                </div>
              </div>
            </div>

            {/* Widget 3: Quick Links Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] p-4 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 dark:text-[#F9FAFB] uppercase tracking-wider">Quick Links</h4>
              <div className="space-y-2 text-xs font-bold text-slate-700 dark:text-[#A7B3C5]">
                <Link
                  to="/orders"
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#111827] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <ShoppingBag size={15} className="text-slate-400 dark:text-[#A7B3C5]" /> My Orders
                </Link>
                <Link
                  to="/favourites"
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#111827] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <Heart size={15} className="text-slate-400 dark:text-[#A7B3C5]" /> Favorites
                </Link>
                <Link
                  to="/help"
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#111827] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <HelpCircle size={15} className="text-slate-400 dark:text-[#A7B3C5]" /> Help & Support
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#111827] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <Settings size={15} className="text-slate-400 dark:text-[#A7B3C5]" /> Settings
                </Link>
              </div>
            </div>

            {/* Widget 4: Free Delivery Promotional Banner */}
            <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-[#172033] dark:to-[#111827] border border-emerald-100 dark:border-[#2D3748] p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 dark:bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 dark:shadow-emerald-950/40">
                <Truck size={20} />
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-black text-slate-900 dark:text-[#F9FAFB] flex items-center justify-between">
                  Free Delivery
                  <Leaf size={14} className="text-emerald-600 dark:text-emerald-400" />
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-[#A7B3C5] font-medium mt-0.5">
                  On orders above ₹499
                </p>
              </div>
            </div>

            {/* Widget 5: Your Cart (Interactive Mini Cart matching Screenshot) */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 dark:text-[#F9FAFB]">Your Cart</h4>
                <Link
                  to="/cart"
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-0.5"
                >
                  {cart?.items?.length || 0} items <ChevronRight size={14} />
                </Link>
              </div>

              {/* Items List in Mini Cart */}
              {!cart?.items || cart.items.length === 0 ? (
                <div className="text-center py-6 text-slate-400 dark:text-[#A7B3C5]">
                  <ShoppingCart size={28} className="mx-auto mb-1.5 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-semibold">Your cart is currently empty</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {cart.items.map((item) => {
                    const prod = typeof item.productId === 'object' ? item.productId : null;
                    if (!prod) return null;

                    return (
                      <div
                        key={prod._id}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-100 dark:border-[#2D3748]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#172033] p-1 border border-slate-200 dark:border-[#2D3748] shrink-0 flex items-center justify-center">
                            {prod.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = PRODUCT_FALLBACK_IMAGE;
                                }}
                              />
                            ) : (
                              <Package size={14} className="text-slate-300 dark:text-slate-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h6 className="text-xs font-bold text-slate-900 dark:text-[#F9FAFB] truncate leading-tight">
                              {prod.name}
                            </h6>
                            <p className="text-[10px] text-slate-400 dark:text-[#A7B3C5]">
                              ₹{prod.price}
                            </p>
                          </div>
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDecrement(prod._id, item.quantity)}
                            className="w-5 h-5 rounded-md bg-white dark:bg-[#172033] border border-slate-200 dark:border-[#2D3748] hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center font-bold text-[11px] text-slate-700 dark:text-[#F9FAFB]"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-xs font-black text-slate-800 dark:text-[#F9FAFB] w-3 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncrement(prod._id, item.quantity, prod.stock)}
                            className="w-5 h-5 rounded-md bg-white dark:bg-[#172033] border border-slate-200 dark:border-[#2D3748] hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center font-bold text-[11px] text-slate-700 dark:text-[#F9FAFB]"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total & Checkout Button */}
              {cart?.items && cart.items.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-[#2D3748] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500 dark:text-[#A7B3C5]">Total Amount</span>
                    <span className="text-sm font-black text-slate-900 dark:text-[#F9FAFB]">₹{cart.subtotal}</span>
                  </div>

                  <Link
                    to="/cart"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black text-xs text-center shadow-md shadow-emerald-600/20 dark:shadow-emerald-950/40 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    View Cart <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
