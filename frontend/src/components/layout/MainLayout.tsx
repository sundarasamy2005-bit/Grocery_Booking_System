import { useState } from 'react';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';
import ToastContainer from '../common/ToastContainer';
import CartDrawer from '../common/CartDrawer';
import CartConflictModal from '../common/CartConflictModal';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-16 md:pb-0">
      <Navbar />
      
      <main className="flex-grow w-full">
        {children}
      </main>

      {/* Global Toast Notifications */}
      <ToastContainer />

      {/* Cart Store Conflict Modal */}
      <CartConflictModal />

      {/* Slide-over Cart Drawer from Mobile Bottom Nav trigger */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      {/* Mobile Bottom Navigation (Visible on phone/tablet) */}
      <MobileBottomNav onOpenCart={() => setCartDrawerOpen(true)} />
    </div>
  );
};

export default MainLayout;
