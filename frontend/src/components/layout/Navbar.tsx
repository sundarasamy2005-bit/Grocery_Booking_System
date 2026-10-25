import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useAddressStore } from '../../store/addressStore';
import { useLocationStore } from '../../store/locationStore';
import { useFavoriteStore } from '../../store/favoriteStore';
import { api } from '../../services/api';
import { HeaderSearch } from '../common/HeaderSearch';
import { CartDrawer } from '../common/CartDrawer';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  ShoppingBag,
  LogOut,
  User,
  Store,
  Package,
  LayoutDashboard,
  Menu,
  X,
  ShoppingCart,
  MapPin,
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles,
  Tag,
  Heart,
  HelpCircle,
  Settings,
} from 'lucide-react';

const CATEGORY_ITEMS = [
  { name: 'Vegetables', icon: '🥦' },
  { name: 'Fruits', icon: '🍎' },
  { name: 'Dairy & Eggs', icon: '🥛' },
  { name: 'Bakery', icon: '🍞' },
  { name: 'Rice & Grains', icon: '🍚' },
  { name: 'Snacks', icon: '🍿' },
  { name: 'Beverages', icon: '🧃' },
  { name: 'Household', icon: '🧴' },
  { name: 'Spices', icon: '🌶️' },
  { name: 'Personal Care', icon: '🧼' },
];

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const cartCount = useCartStore((state) => state.cart?.items?.length ?? 0);
  const favoriteCount = useFavoriteStore((state) => state.favorites?.length ?? 0);
  const fetchFavorites = useFavoriteStore((state) => state.fetchFavorites);
  const { city } = useLocationStore();
  const { activeAddress, openModal: openAddressModal, fetchAddresses } = useAddressStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
      fetchFavorites();
    }
  }, [isAuthenticated, fetchAddresses, fetchFavorites]);

  // Automatically close slide-over menu on page change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Formatted active address display
  const deliveryAddressDisplay = activeAddress
    ? `${activeAddress.houseStreet || activeAddress.addressLine1}, ${activeAddress.areaCity || activeAddress.city} - ${activeAddress.pinCode || activeAddress.postalCode}`
    : `${city || 'Pollachi, Coimbatore - 642001'}`;

  return (
    <>
      <nav className="bg-white dark:bg-[#0B1220] border-b border-slate-100 dark:border-[#2D3748] sticky top-0 z-40 shadow-xs transition-colors">
        {/* Main Header Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-all duration-200">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl text-slate-900 dark:text-[#F9FAFB] tracking-tight leading-none flex items-center gap-1">
                  Local<span className="text-emerald-600 dark:text-[#34D399]">Grocery</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-[#A7B3C5] font-semibold tracking-wide mt-0.5">
                  Fresh • Local • Together
                </span>
              </div>
            </Link>

            {/* Center: Search Bar (Laptop, PC, Monitor only) */}
            <div className="hidden lg:block flex-1 max-w-xl mx-2">
              <HeaderSearch placeholder="Search for products, categories or shops..." />
            </div>

            {/* Right: Delivering To, Theme Toggle, Cart, User Profile */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Delivering to Selector (Laptop, PC, Monitor only - hidden on android, iphone, mobile) */}
              <button
                type="button"
                onClick={() => openAddressModal()}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-[#111827] hover:bg-emerald-50 dark:hover:bg-[#172033] border border-slate-200/80 dark:border-[#2D3748] hover:border-emerald-300 dark:hover:border-emerald-500 text-left transition-all duration-200 group max-w-[200px] sm:max-w-[260px]"
                title="Change delivery address"
              >
                <div className="h-7 w-7 rounded-xl bg-emerald-100 dark:bg-[#12352D] text-emerald-700 dark:text-[#34D399] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MapPin size={15} />
                </div>
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 dark:text-[#A7B3C5] font-bold uppercase tracking-wider leading-none">
                    Delivering to
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-[#F9FAFB] leading-tight truncate flex items-center gap-0.5 mt-0.5">
                    <span className="truncate">{deliveryAddressDisplay}</span>
                    <ChevronDown size={13} className="text-slate-400 dark:text-[#A7B3C5] shrink-0 group-hover:text-emerald-600 dark:group-hover:text-[#34D399]" />
                  </p>
                </div>
              </button>

              {/* Theme Toggle (Accessible Sun / Moon Switch) */}
              <ThemeToggle variant="icon" />

              {/* Favourites Button with Count Badge */}
              <Link
                to="/favourites"
                className="relative p-2.5 text-slate-700 dark:text-[#A7B3C5] hover:text-red-500 hover:bg-red-50 dark:hover:bg-[#172033] rounded-2xl transition-all"
                title="View favourites"
              >
                <Heart className="h-6 w-6" />
                {favoriteCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] font-black text-white rounded-full bg-red-500 shadow-md animate-scale-in">
                    {favoriteCount > 9 ? '9+' : favoriteCount}
                  </span>
                )}
              </Link>

              {/* Cart Button with Count Badge */}
              <button
                type="button"
                onClick={() => setCartDrawerOpen(true)}
                className="relative p-2.5 text-slate-700 dark:text-[#A7B3C5] hover:text-emerald-600 dark:hover:text-[#34D399] hover:bg-emerald-50 dark:hover:bg-[#172033] rounded-2xl transition-all"
                title="View cart"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] font-black text-white rounded-full bg-emerald-600 dark:bg-emerald-500 shadow-md animate-scale-in">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {/* User Avatar & Menu */}
              {isAuthenticated && user ? (
                <div className="relative group">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-[#172033] transition-all cursor-pointer"
                    title="Account & Profile"
                  >
                    <img
                      className="h-9 w-9 rounded-2xl object-cover border-2 border-emerald-100 dark:border-[#2D3748] shadow-xs"
                      src={
                        user.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name
                        )}&background=059669&color=ffffff&bold=true`
                      }
                      alt={user.name}
                    />
                  </Link>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#172033] rounded-2xl shadow-2xl border border-slate-100 dark:border-[#2D3748] py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 scale-95 group-hover:scale-100 origin-top-right z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-3 border-b border-slate-100 dark:border-[#2D3748] bg-slate-50/50 dark:bg-[#111827]/50 hover:bg-slate-100/50 dark:hover:bg-[#111827] transition-colors"
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-[#F9FAFB] truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-[#A7B3C5] truncate mt-0.5">{user.email}</p>
                      <span className="inline-block mt-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-[#12352D] text-emerald-800 dark:text-[#34D399]">
                        {user.role}
                      </span>
                    </Link>

                    {/* Quick Theme Toggle Row inside Dropdown */}
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-[#2D3748] flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-[#A7B3C5]">Theme</span>
                      <ThemeToggle variant="segmented" />
                    </div>

                    <div className="py-1">
                      {user.role === 'customer' && (
                        <>
                          <Link
                            to="/profile"
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-[#A7B3C5] hover:bg-slate-50 dark:hover:bg-[#111827] hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors"
                          >
                            <User size={15} className="text-slate-400 dark:text-[#A7B3C5]" /> My Profile
                          </Link>
                          <Link
                            to="/orders"
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-[#A7B3C5] hover:bg-slate-50 dark:hover:bg-[#111827] hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors"
                          >
                            <Package size={15} className="text-slate-400 dark:text-[#A7B3C5]" /> My Orders
                          </Link>
                          <Link
                            to="/favourites"
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-[#A7B3C5] hover:bg-slate-50 dark:hover:bg-[#111827] hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors"
                          >
                            <Heart size={15} className="text-slate-400 dark:text-[#A7B3C5]" /> My Favourites
                          </Link>
                          <button
                            type="button"
                            onClick={() => openAddressModal()}
                            className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-[#A7B3C5] hover:bg-slate-50 dark:hover:bg-[#111827] hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors"
                          >
                            <MapPin size={15} className="text-slate-400 dark:text-[#A7B3C5]" /> Saved Addresses
                          </button>
                          <Link
                            to="/help"
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-[#A7B3C5] hover:bg-slate-50 dark:hover:bg-[#111827] hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors"
                          >
                            <HelpCircle size={15} className="text-slate-400 dark:text-[#A7B3C5]" /> Help & Support
                          </Link>
                          <Link
                            to="/settings"
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-[#A7B3C5] hover:bg-slate-50 dark:hover:bg-[#111827] hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors"
                          >
                            <Settings size={15} className="text-slate-400 dark:text-[#A7B3C5]" /> Settings
                          </Link>
                        </>
                      )}

                      {user.role === 'shopOwner' && (
                        <Link
                          to="/shop/dashboard"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-[#A7B3C5] hover:bg-slate-50 dark:hover:bg-[#111827] hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors"
                        >
                          <Store size={15} className="text-slate-400 dark:text-[#A7B3C5]" /> Shop Dashboard
                        </Link>
                      )}

                      {user.role === 'admin' && (
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-[#A7B3C5] hover:bg-slate-50 dark:hover:bg-[#111827] hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors"
                        >
                          <LayoutDashboard size={15} className="text-slate-400 dark:text-[#A7B3C5]" /> Admin Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 dark:border-[#2D3748] pt-1">
                      <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Sub-Navbar Row */}
        <div className="border-t border-slate-100 dark:border-[#2D3748] bg-white dark:bg-[#0B1220] transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6 h-11 text-xs font-bold overflow-x-auto whitespace-nowrap scrollbar-none">
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="text-slate-600 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB] flex items-center gap-1.5 py-2 transition-colors cursor-pointer"
                title="All Categories & Menu"
              >
                <Menu size={18} />
              </button>

              <Link
                to="/"
                className={`py-3 transition-colors relative ${
                  location.pathname === '/'
                    ? 'text-emerald-600 dark:text-[#34D399] font-extrabold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600 dark:after:bg-[#34D399]'
                    : 'text-slate-600 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB]'
                }`}
              >
                Home
              </Link>

              <Link
                to="/shops"
                className={`py-3 transition-colors relative ${
                  location.pathname === '/shops'
                    ? 'text-emerald-600 dark:text-[#34D399] font-extrabold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600 dark:after:bg-[#34D399]'
                    : 'text-slate-600 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB]'
                }`}
              >
                Shops
              </Link>

              {/* Items visible on Laptop, PC, Monitor only - Hidden on android, iphone */}
              <a
                href="#offers"
                className="hidden lg:inline-flex text-slate-600 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB] py-3 transition-colors"
              >
                Offers
              </a>

              <Link
                to="/orders"
                className={`hidden lg:inline-flex py-3 transition-colors relative ${
                  location.pathname === '/orders'
                    ? 'text-emerald-600 dark:text-[#34D399] font-extrabold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600 dark:after:bg-[#34D399]'
                    : 'text-slate-600 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB]'
                }`}
              >
                My Orders
              </Link>

              <Link
                to="/favourites"
                className={`hidden lg:inline-flex py-3 transition-colors relative ${
                  location.pathname === '/favourites' || location.pathname === '/favorites'
                    ? 'text-emerald-600 dark:text-[#34D399] font-extrabold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600 dark:after:bg-[#34D399]'
                    : 'text-slate-600 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB]'
                }`}
              >
                Favourites
              </Link>

              <Link
                to="/help"
                className={`hidden lg:inline-flex py-3 transition-colors relative ${
                  location.pathname === '/help'
                    ? 'text-emerald-600 dark:text-[#34D399] font-extrabold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600 dark:after:bg-[#34D399]'
                    : 'text-slate-600 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB]'
                }`}
              >
                Help & Support
              </Link>

              <Link
                to="/settings"
                className={`hidden lg:inline-flex py-3 transition-colors relative ${
                  location.pathname === '/settings'
                    ? 'text-emerald-600 dark:text-[#34D399] font-extrabold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600 dark:after:bg-[#34D399]'
                    : 'text-slate-600 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB]'
                }`}
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Slide-over Cart Drawer */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      {/* ─── Category & Navigation Drawer (Triggered by Hamburger Menu Icon) ─── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 transition-opacity animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-84 max-w-[85vw] bg-white dark:bg-[#0B1220] border-r border-slate-100 dark:border-[#2D3748] z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 dark:border-[#2D3748] flex items-center justify-between bg-slate-50/70 dark:bg-[#111827]/70">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 group"
          >
            <div className="flex items-center justify-center h-9 w-9 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white shadow-md shadow-emerald-600/20">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <span className="font-black text-lg text-slate-900 dark:text-[#F9FAFB] tracking-tight">
              Local<span className="text-emerald-600 dark:text-[#34D399]">Grocery</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 dark:text-[#A7B3C5] hover:text-slate-600 dark:hover:text-[#F9FAFB] hover:bg-slate-100 dark:hover:bg-[#172033] transition-colors cursor-pointer"
            title="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Quick Theme Toggle Row in Mobile Drawer */}
          <ThemeToggle variant="row" />

          {/* Delivering to Selector */}
          <div className="p-3 bg-slate-50 dark:bg-[#111827] border border-slate-200/80 dark:border-[#2D3748] rounded-2xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-400 dark:text-[#A7B3C5] font-bold uppercase tracking-wider flex items-center gap-1">
                <MapPin size={12} className="text-emerald-600 dark:text-[#34D399]" /> Delivering to
              </span>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  openAddressModal();
                }}
                className="text-[11px] font-bold text-emerald-600 dark:text-[#34D399] hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-[#F9FAFB] truncate">
              {deliveryAddressDisplay}
            </p>
          </div>

          {/* Shop by Category */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-[#A7B3C5]">
                Shop by Category
              </h4>
              <Link
                to="/shops"
                onClick={() => setMobileOpen(false)}
                className="text-[11px] font-bold text-emerald-600 dark:text-[#34D399] hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_ITEMS.map((cat) => (
                <Link
                  key={cat.name}
                  to={`/shops?search=${encodeURIComponent(cat.name)}`}
                  onClick={() => setMobileOpen(false)}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-[#2D3748] bg-white dark:bg-[#172033] hover:border-emerald-300 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-[#12352D] flex items-center gap-2 transition-all group"
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-[#F9FAFB] group-hover:text-emerald-600 dark:group-hover:text-[#34D399] truncate">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Customer Navigation Menu */}
          <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-[#2D3748]">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-[#A7B3C5] mb-2">
              Customer Menu
            </h4>

            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-[#A7B3C5] hover:bg-emerald-50 dark:hover:bg-[#172033] hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors"
            >
              <ShoppingBag size={16} className="text-slate-400 dark:text-[#A7B3C5]" /> Home
            </Link>

            <Link
              to="/shops"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-[#A7B3C5] hover:bg-emerald-50 dark:hover:bg-[#172033] hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors"
            >
              <Store size={16} className="text-slate-400 dark:text-[#A7B3C5]" /> Explore Shops
            </Link>

            <a
              href="#offers"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-[#A7B3C5] hover:bg-emerald-50 dark:hover:bg-[#172033] hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors"
            >
              <Tag size={16} className="text-slate-400 dark:text-[#A7B3C5]" /> Offers & Deals
            </a>

            <Link
              to="/orders"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-[#A7B3C5] hover:bg-emerald-50 dark:hover:bg-[#172033] hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors"
            >
              <Package size={16} className="text-slate-400 dark:text-[#A7B3C5]" /> My Orders
            </Link>

            <Link
              to="/favourites"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-[#A7B3C5] hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Heart size={16} className="text-slate-400 dark:text-[#A7B3C5]" /> My Favourites
              </div>
              {favoriteCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300">
                  {favoriteCount}
                </span>
              )}
            </Link>

            <Link
              to="/help"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-[#A7B3C5] hover:bg-emerald-50 dark:hover:bg-[#172033] hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors"
            >
              <HelpCircle size={16} className="text-slate-400 dark:text-[#A7B3C5]" /> Help & Support
            </Link>

            <Link
              to="/settings"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-[#A7B3C5] hover:bg-emerald-50 dark:hover:bg-[#172033] hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors"
            >
              <Settings size={16} className="text-slate-400 dark:text-[#A7B3C5]" /> Customer Settings
            </Link>

            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-[#A7B3C5] hover:bg-emerald-50 dark:hover:bg-[#172033] hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors"
            >
              <User size={16} className="text-slate-400 dark:text-[#A7B3C5]" /> My Profile & Addresses
            </Link>
          </div>
        </div>

        {/* Drawer Footer Account */}
        <div className="p-4 border-t border-slate-100 dark:border-[#2D3748] bg-slate-50/70 dark:bg-[#111827]/70">
          {isAuthenticated && user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img
                  className="h-10 w-10 rounded-2xl object-cover border-2 border-emerald-100 dark:border-[#2D3748]"
                  src={
                    user.profileImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name
                    )}&background=059669&color=ffffff&bold=true`
                  }
                  alt={user.name}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-900 dark:text-[#F9FAFB] truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-[#A7B3C5] truncate">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="w-full py-2 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-emerald-600/20 transition-all"
            >
              Sign In / Register
            </Link>
          )}
        </div>
      </aside>
    </>
  );
};

export default Navbar;
