import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Store,
  ShoppingBag,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToastStore } from '../../store/toastStore';
import { format } from 'date-fns';

interface DashboardStats {
  totalUsers: number;
  totalShops: number;
  approvedShops: number;
  pendingShops: number;
  totalProducts: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenue: number;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToastStore();

  const fetchDashboardOverview = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/orders', { params: { limit: 6 } }),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (ordersRes.data.success) {
        setRecentOrders(ordersRes.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load admin overview', err);
      toast.error('Unable to fetch live system statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardOverview();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-10 skeleton rounded-2xl w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card p-6 h-32 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="card h-64 skeleton rounded-2xl" />
      </div>
    );
  }

  const completionRate =
    stats && stats.totalOrders > 0
      ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
      : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Executive Platform Overview
            </h1>
            <span className="badge-blue text-xs font-black">PHASE 1 ACTIVE</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time infrastructure telemetry, store approval queues, and transaction audits
          </p>
        </div>

        <button
          onClick={fetchDashboardOverview}
          className="btn-secondary py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs hover:bg-slate-50"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Alert: Pending Shops Requiring Verification */}
      {stats && stats.pendingShops > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-black">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-amber-950">
                {stats.pendingShops} Merchant Application{stats.pendingShops > 1 ? 's' : ''} Pending Review
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                New grocery shop owners have submitted store details and are waiting for your verification.
              </p>
            </div>
          </div>
          <Link
            to="/admin/shops"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold transition-colors shrink-0 text-center"
          >
            Review Applications →
          </Link>
        </div>
      )}

      {/* 6 Real KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Total Users */}
        <div className="card p-5 border border-slate-100 hover:border-sky-300 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Users</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">
                {stats?.totalUsers.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-semibold flex items-center gap-1">
                <span className="text-emerald-600">● Live Accounts</span>
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
          </div>
        </div>

        {/* Active Shops */}
        <div className="card p-5 border border-slate-100 hover:border-emerald-300 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Merchants</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">
                {stats?.approvedShops.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                Total Registered: {stats?.totalShops}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Store size={24} />
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="card p-5 border border-slate-100 hover:border-purple-300 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">
                {stats?.totalOrders.toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-600 mt-1 font-bold">
                {stats?.completedOrders} Delivered ({completionRate}%)
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ShoppingBag size={24} />
            </div>
          </div>
        </div>

        {/* Platform Revenue */}
        <div className="card p-5 border border-slate-100 hover:border-emerald-300 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Delivered GMV</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">
                ₹{stats?.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                100% Cash on Delivery
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        {/* Total Catalog Items */}
        <div className="card p-5 border border-slate-100 hover:border-amber-300 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catalog Products</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">
                {stats?.totalProducts.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                Across all verified shops
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Package size={24} />
            </div>
          </div>
        </div>

        {/* Order Reliability */}
        <div className="card p-5 border border-slate-100 hover:border-rose-300 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cancelled / Rejected</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">
                {stats?.cancelledOrders.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                {stats && stats.totalOrders > 0
                  ? ((stats.cancelledOrders / stats.totalOrders) * 100).toFixed(1)
                  : 0}
                % Cancellation rate
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
          Quick Management Portals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/users"
            className="card p-4 hover:border-sky-300 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Users size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800">User Management</p>
                <p className="text-[11px] text-slate-400">Suspend & adjust roles</p>
              </div>
            </div>
            <ArrowRight size={14} className="text-slate-300 group-hover:text-sky-600 transition-colors" />
          </Link>

          <Link
            to="/admin/shops"
            className="card p-4 hover:border-emerald-300 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Store size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800">Shop Approvals</p>
                <p className="text-[11px] text-slate-400">Verify new merchant KYC</p>
              </div>
            </div>
            <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
          </Link>

          <Link
            to="/admin/categories"
            className="card p-4 hover:border-amber-300 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Package size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800">Global Aisles</p>
                <p className="text-[11px] text-slate-400">Categories & taxonomy</p>
              </div>
            </div>
            <ArrowRight size={14} className="text-slate-300 group-hover:text-amber-600 transition-colors" />
          </Link>

          <Link
            to="/admin/orders"
            className="card p-4 hover:border-purple-300 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <ShoppingBag size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800">Orders Audit</p>
                <p className="text-[11px] text-slate-400">Monitor all transactions</p>
              </div>
            </div>
            <ArrowRight size={14} className="text-slate-300 group-hover:text-purple-600 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Recent Orders Telemetry Preview */}
      <div className="card overflow-hidden border border-slate-100 shadow-xs">
        <div className="p-4 sm:px-6 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Live System Order Stream
            </h3>
            <p className="text-xs text-slate-500">Most recent transactions across all shops</p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            View All Orders <ExternalLink size={12} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No transactions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50/50 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3 text-left">Order #</th>
                  <th className="px-5 py-3 text-left">Timestamp</th>
                  <th className="px-5 py-3 text-left">Merchant</th>
                  <th className="px-5 py-3 text-left">Total Amount</th>
                  <th className="px-5 py-3 text-right">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                {recentOrders.map((ord) => {
                  const shopName =
                    typeof ord.shopId === 'object' && ord.shopId
                      ? ord.shopId.shopName
                      : 'Local Merchant';

                  const statusStyles: Record<string, string> = {
                    delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    cancelled: 'bg-rose-50 text-rose-800 border-rose-200',
                    rejected: 'bg-rose-50 text-rose-800 border-rose-200',
                    placed: 'bg-sky-50 text-sky-800 border-sky-200',
                  };

                  return (
                    <tr key={ord._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">#{ord.orderNumber}</td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {format(new Date(ord.createdAt), 'MMM dd, hh:mm a')}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{shopName}</td>
                      <td className="px-5 py-3.5 font-black text-slate-900">
                        ₹{ord.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            statusStyles[ord.orderStatus] || 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {ord.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
