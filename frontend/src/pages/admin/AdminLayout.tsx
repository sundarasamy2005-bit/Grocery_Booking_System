import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingBag,
  ShieldCheck,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuthStore } from '../../store/authStore';

import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminShops from './AdminShops';
import AdminCategories from './AdminCategories';
import AdminOrders from './AdminOrders';

export const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const primaryNav = [
    { name: 'Dashboard Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  ];

  const managementNav = [
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Shops & Approvals', href: '/admin/shops', icon: Store },
    { name: 'Categories', href: '/admin/categories', icon: Package },
    { name: 'Orders Audit', href: '/admin/orders', icon: ShoppingBag },
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="card overflow-hidden shadow-xs border border-slate-100 dark:border-[#2D3748] dark:bg-[#172033] sticky top-24">
              {/* Header Badge */}
              <div className="p-4 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} />
                  <span className="font-extrabold text-sm tracking-wide">ADMIN PORTAL</span>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20">
                  ROOT
                </span>
              </div>

              {/* Navigation Sections */}
              <div className="p-3 space-y-4">
                <div>
                  <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-[#A7B3C5] mb-1.5">
                    Overview
                  </p>
                  <nav className="space-y-0.5">
                    {primaryNav.map((item) => {
                      const isActive =
                        location.pathname === item.href ||
                        (item.href === '/admin/dashboard' && location.pathname === '/admin');
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-black shadow-2xs'
                              : 'text-slate-600 dark:text-[#A7B3C5] hover:bg-slate-50 dark:hover:bg-[#111827] hover:text-slate-900 dark:hover:text-[#F9FAFB]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon size={16} className={isActive ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'} />
                            <span className="truncate">{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-[#2D3748]">
                  <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-[#A7B3C5] mb-1.5">
                    Platform Management
                  </p>
                  <nav className="space-y-0.5">
                    {managementNav.map((item) => {
                      const isActive = location.pathname.startsWith(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-black shadow-2xs'
                              : 'text-slate-600 dark:text-[#A7B3C5] hover:bg-slate-50 dark:hover:bg-[#111827] hover:text-slate-900 dark:hover:text-[#F9FAFB]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon size={16} className={isActive ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'} />
                            <span className="truncate">{item.name}</span>
                          </div>
                          <ChevronRight size={13} className="text-slate-300 dark:text-slate-600" />
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Admin user info & Logout */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#2D3748] px-3 pb-1">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-[#F9FAFB] truncate">{user?.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-[#A7B3C5] truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => logout()}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-[#A7B3C5] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Sign Out"
                    >
                      <LogOut size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <Routes>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="shops" element={<AdminShops />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="orders" element={<AdminOrders />} />
              {/* Fallback to dashboard */}
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminLayout;
