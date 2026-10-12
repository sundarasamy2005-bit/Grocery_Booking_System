import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Store, Package, ShoppingBag, BarChart3, Settings, Brain, Cpu } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuthStore } from '../../store/authStore';

import ShopDashboard from './ShopDashboard';
import ShopOrders from './ShopOrders';
import ShopProducts from './ShopProducts';
import ProductForm from './ProductForm';
import ShopProfile from './ShopProfile';
import ShopAiInsights from './ShopAiInsights';
import ShopAutomation from './ShopAutomation';
import ShopSettings from './ShopSettings';

const Placeholder = ({ name }: { name: string }) => (
  <div className="bg-white shadow rounded-lg p-6">
    <h2 className="text-lg font-medium text-gray-900 mb-4">{name}</h2>
    <p className="text-gray-500">This feature is under construction.</p>
  </div>
);

const ShopOwnerLayout = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (user?.role !== 'shopOwner' && user?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/shop/dashboard', icon: BarChart3 },
    { name: 'AI Insights', href: '/shop/ai-insights', icon: Brain },
    { name: 'Automation Center', href: '/shop/automation', icon: Cpu },
    { name: 'Orders', href: '/shop/orders', icon: ShoppingBag },
    { name: 'Products', href: '/shop/products', icon: Package },
    { name: 'Shop Profile', href: '/shop/profile', icon: Store },
    { name: 'Settings', href: '/shop/settings', icon: Settings },
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white shadow-xs rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="font-bold text-gray-900 text-sm">Shop Management</h2>
                <p className="text-[11px] text-gray-500">Store controls & automated intelligence</p>
              </div>
              <nav className="p-2 space-y-1">
                {navigation.map((item) => {
                  const isActive =
                    location.pathname === item.href ||
                    location.pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 shadow-2xs font-bold'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 flex-shrink-0 h-4 w-4 ${
                          isActive ? 'text-primary-600' : 'text-gray-400'
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Routes>
              <Route path="dashboard" element={<ShopDashboard />} />
              <Route path="ai-insights" element={<ShopAiInsights />} />
              <Route path="automation" element={<ShopAutomation />} />
              <Route path="orders" element={<ShopOrders />} />
              <Route path="products" element={<ShopProducts />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id/edit" element={<ProductForm />} />
              <Route path="profile" element={<ShopProfile />} />
              <Route path="settings" element={<ShopSettings />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ShopOwnerLayout;
