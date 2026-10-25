import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';
import Footer from './Footer';
import ToastContainer from '../common/ToastContainer';
import CartDrawer from '../common/CartDrawer';
import CartConflictModal from '../common/CartConflictModal';
import TextAddressModal from '../common/TextAddressModal';

interface MainLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export const MainLayout = ({ children, showFooter }: MainLayoutProps) => {
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const location = useLocation();

  // Footer is strictly displayed on customer pages, and omitted from admin, shop owner, and auth screens
  const isCustomerPage =
    !location.pathname.startsWith('/shop') &&
    !location.pathname.startsWith('/admin') &&
    !location.pathname.startsWith('/login') &&
    !location.pathname.startsWith('/register');

  const shouldShowFooter = showFooter !== undefined ? showFooter : isCustomerPage;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-main)] dark:bg-[#0B1220] dark:text-[#F9FAFB] pb-16 md:pb-0 transition-colors duration-200">
      <Navbar />
      
      <main className="flex-grow w-full">
        {children}
      </main>

      {/* Customer-Only Footer */}
      {shouldShowFooter && <Footer />}

      {/* Global Toast Notifications */}
      <ToastContainer />

      {/* Cart Store Conflict Modal */}
      <CartConflictModal />

      {/* Text-Only Delivery Address Modal */}
      <TextAddressModal />

      {/* Slide-over Cart Drawer from Mobile Bottom Nav trigger */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      {/* Mobile Bottom Navigation (Visible on customer pages for mobile) */}
      {isCustomerPage && <MobileBottomNav onOpenCart={() => setCartDrawerOpen(true)} />}
    </div>
  );
};

export default MainLayout;
