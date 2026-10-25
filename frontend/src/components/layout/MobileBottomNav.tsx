import { Link, useLocation } from 'react-router-dom';
import { Home, Store, ShoppingCart, Heart, User } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useFavoriteStore } from '../../store/favoriteStore';

interface MobileBottomNavProps {
  onOpenCart?: () => void;
}

export const MobileBottomNav = ({ onOpenCart }: MobileBottomNavProps) => {
  const location = useLocation();
  const cartCount = useCartStore((state) => state.cart?.items?.length ?? 0);
  const favoriteCount = useFavoriteStore((state) => state.favorites?.length ?? 0);

  const tabs = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/shops', label: 'Shops', icon: Store },
    { to: '/favourites', label: 'Favourites', icon: Heart, badge: favoriteCount },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, isCart: true, badge: cartCount },
    { to: '/profile', label: 'Account', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-lg border-t border-slate-100 dark:border-[#2D3748] shadow-lg px-2 py-1.5 flex items-center justify-around safe-area-bottom transition-colors">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          tab.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.to);

        if (tab.isCart && onOpenCart) {
          return (
            <button
              key={tab.label}
              onClick={onOpenCart}
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                location.pathname === '/cart'
                  ? 'text-emerald-600 dark:text-[#34D399] font-bold'
                  : 'text-slate-500 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB] font-medium'
              }`}
            >
              <div className="relative">
                <Icon size={20} className={location.pathname === '/cart' ? 'stroke-[2.5]' : ''} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px] font-bold text-white rounded-full bg-emerald-600 dark:bg-emerald-500 animate-scale-in">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        }

        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
              isActive
                ? 'text-emerald-600 dark:text-[#34D399] font-bold'
                : 'text-slate-500 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB] font-medium'
            }`}
          >
            <div className="relative">
              <Icon size={20} className={isActive ? 'stroke-[2.5]' : ''} />
              {tab.badge && tab.badge > 0 ? (
                <span className={`absolute -top-1.5 -right-2 h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px] font-bold text-white rounded-full ${tab.to === '/favourites' ? 'bg-red-500' : 'bg-emerald-600 dark:bg-emerald-500'} animate-scale-in`}>
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default MobileBottomNav;
