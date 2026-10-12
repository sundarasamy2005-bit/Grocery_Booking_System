import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useLocationStore } from '../../store/locationStore';
import { HeaderSearch } from '../common/HeaderSearch';
import { CartDrawer } from '../common/CartDrawer';
import { LocationModal } from '../common/LocationModal';
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
  Search,
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const cartCount = useCartStore((state) => state.cart?.items?.length ?? 0);
  const { city, openModal: openLocationModal } = useLocationStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4">
            {/* Left: Logo & Location Button */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="flex items-center justify-center h-9 w-9 rounded-xl gradient-primary shadow-md group-hover:scale-105 transition-all duration-200">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">
                  Local<span className="text-sky-600">Grocery</span>
                </span>
              </Link>

              {/* Location Picker Pill */}
              <button
                type="button"
                onClick={openLocationModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200/80 hover:border-sky-200 text-left transition-all duration-200 group shrink-0"
                title="Change delivery location"
              >
                <div className="h-6 w-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin size={13} />
                </div>
                <div className="hidden sm:block">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">
                    Deliver to
                  </p>
                  <p className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-0.5 mt-0.5">
                    <span className="max-w-[110px] truncate">{city}</span>
                    <ChevronDown size={12} className="text-slate-400 group-hover:text-sky-600" />
                  </p>
                </div>
                <ChevronDown size={13} className="text-slate-400 sm:hidden" />
              </button>
            </div>

            {/* Center: Live Grocery Search Bar (Desktop) */}
            <div className="hidden lg:block flex-1 max-w-lg mx-2">
              <HeaderSearch />
            </div>

            {/* Right: Navigation Links, Cart, User Dropdown */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Search Icon Toggle */}
              <button
                type="button"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="lg:hidden p-2 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-xl transition-colors"
                title="Search groceries"
              >
                <Search size={19} />
              </button>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-1">
                <Link
                  to="/shops"
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    location.pathname.startsWith('/shops')
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  🏪 Shops
                </Link>

                {isAuthenticated && user?.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-rose-100 text-rose-800 shadow-2xs'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    <span>🛡️</span>
                    <span>Admin Panel</span>
                  </Link>
                )}

                {isAuthenticated && user?.role === 'shopOwner' && (
                  <Link
                    to="/shop/dashboard"
                    className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                      location.pathname.startsWith('/shop')
                        ? 'bg-emerald-100 text-emerald-800 shadow-2xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <span>🏪</span>
                    <span>Shop Dashboard</span>
                  </Link>
                )}

                {isAuthenticated && user?.role === 'customer' && (
                  <Link
                    to="/orders"
                    className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      location.pathname.startsWith('/orders')
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    📦 Orders
                  </Link>
                )}
              </div>

              {/* Cart Drawer Trigger Button */}
              <button
                type="button"
                onClick={() => setCartDrawerOpen(true)}
                className="relative p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"
                title="View cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px] font-extrabold text-white rounded-full gradient-primary shadow-xs animate-scale-in">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              {isAuthenticated && user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 p-1.5 sm:pr-3 rounded-xl hover:bg-slate-100 transition-all cursor-pointer">
                    <img
                      className="h-8 w-8 rounded-xl object-cover border-2 border-sky-100 shadow-xs"
                      src={
                        user.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name
                        )}&background=0284c7&color=ffffff&bold=true`
                      }
                      alt={user.name}
                    />
                    <div className="hidden xl:block text-left">
                      <p className="text-xs font-bold text-slate-800 max-w-[100px] truncate leading-tight">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
                    </div>
                    <ChevronDown size={13} className="text-slate-400 hidden xl:block" />
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 scale-95 group-hover:scale-100 origin-top-right z-50">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                      <span className="inline-block mt-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      {user.role === 'customer' && (
                        <>
                          <Link
                            to="/orders"
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
                          >
                            <Package size={15} className="text-slate-400" /> My Orders
                          </Link>
                          <button
                            type="button"
                            onClick={openLocationModal}
                            className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
                          >
                            <MapPin size={15} className="text-slate-400" /> Delivery Address
                          </button>
                        </>
                      )}

                      {user.role === 'shopOwner' && (
                        <Link
                          to="/shop/dashboard"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
                        >
                          <Store size={15} className="text-slate-400" /> Shop Dashboard
                        </Link>
                      )}

                      {user.role === 'admin' && (
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
                        >
                          <LayoutDashboard size={15} className="text-slate-400" /> Admin Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-sky-600 rounded-xl hover:bg-slate-100 transition-all"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary text-white px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm"
                  >
                    Sign up
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar Expansion */}
          {mobileSearchOpen && (
            <div className="lg:hidden pb-3 pt-1 animate-scale-in">
              <HeaderSearch placeholder="Search groceries..." />
            </div>
          )}

          {/* Mobile Collapsible Menu */}
          {mobileOpen && (
            <div className="md:hidden border-t border-slate-100 py-3 space-y-1 animate-fade-in">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  openLocationModal();
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <span className="flex items-center gap-2">
                  <MapPin size={16} className="text-sky-600" />
                  <span>Deliver to: {city}</span>
                </span>
                <span className="text-[10px] text-sky-600 font-bold uppercase">Change</span>
              </button>

              <Link
                to="/shops"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <Store size={16} className="text-slate-400" />
                <span>Explore Shops</span>
              </Link>

              {isAuthenticated && user?.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl"
                >
                  <LayoutDashboard size={16} className="text-rose-600" />
                  <span>🛡️ Admin Panel</span>
                </Link>
              )}

              {isAuthenticated && user?.role === 'shopOwner' && (
                <Link
                  to="/shop/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-xl"
                >
                  <Store size={16} className="text-emerald-600" />
                  <span>🏪 Shop Dashboard</span>
                </Link>
              )}

              {isAuthenticated && user?.role === 'customer' && (
                <Link
                  to="/orders"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
                >
                  <Package size={16} className="text-slate-400" />
                  <span>My Orders</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Slide-over Cart Drawer */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      {/* Location Picker Modal */}
      <LocationModal />
    </>
  );
};

export default Navbar;
