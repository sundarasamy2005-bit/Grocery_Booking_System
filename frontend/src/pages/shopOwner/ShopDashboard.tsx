import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  Clock,
  Award,
  CheckCircle2,
  Bell,
  ArrowRight,
  Settings,
  Users,
  Package
} from 'lucide-react';
import { api } from '../../services/api';
import { Order } from '../../types';
import {
  SalesLineChart,
  StockAnalysisBarChart,
  CustomerGrowthHistogram,
} from '../../components/charts/ShopCharts';

export const ShopDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [stockRisk, setStockRisk] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsDays, setAnalyticsDays] = useState<number>(14);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async (days = analyticsDays) => {
    try {
      setLoading(true);
      const [ordersRes, insightsRes, stockRiskRes, automationRes, analyticsRes] = await Promise.all([
        api.get('/orders/shop').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/shop/ai/insights').catch(() => ({ data: { success: false, data: null } })),
        api.get('/shop/ai/stock-risk').catch(() => ({ data: { success: false, data: null } })),
        api.get('/shop/automation/settings').catch(() => ({ data: { success: false, data: null } })),
        api.get('/shop/ai/analytics', { params: { days } }).catch(() => ({ data: { success: false, data: null } })),
      ]);

      if (ordersRes.data?.success && Array.isArray(ordersRes.data.data)) {
        setOrders(ordersRes.data.data);
      }
      if (insightsRes.data?.success && insightsRes.data.data) {
        setAiInsights(insightsRes.data.data);
      }
      if (stockRiskRes.data?.success && stockRiskRes.data.data) {
        setStockRisk(stockRiskRes.data.data);
      }
      if (automationRes.data?.success && automationRes.data.data?.notifications) {
        setNotifications(automationRes.data.data.notifications);
      }
      if (analyticsRes.data?.success && analyticsRes.data.data) {
        setAnalyticsData(analyticsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(analyticsDays);
  }, []);

  const handleRangeChange = (days: number) => {
    setAnalyticsDays(days);
    api.get('/shop/ai/analytics', { params: { days } })
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setAnalyticsData(res.data.data);
        }
      })
      .catch((err) => console.error('Failed to update analytics range:', err));
  };

  const today = new Date().toISOString().split('T')[0];
  const todaysOrders = orders.filter((o) => o.createdAt && o.createdAt.startsWith(today));
  const pendingOrders = orders.filter((o) => ['placed', 'accepted', 'preparing'].includes(o.orderStatus));
  const todaysRevenue = todaysOrders
    .filter((o) => !['cancelled', 'rejected'].includes(o.orderStatus))
    .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  if (loading) {
    return <div className="p-12 text-center text-gray-500 font-medium">Loading shop dashboard & analytics...</div>;
  }

  const shopScore = aiInsights?.performanceScore ?? 92;
  const classification = aiInsights?.classification ?? 'High Performer';
  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shop Dashboard Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">Order operations, AI analytics, stock monitoring and automated reporting</p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2">
          <Link
            to="/shop/settings"
            className="flex items-center gap-1.5 p-2 px-3 rounded-2xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all shadow-2xs"
          >
            <Settings className="h-4 w-4 text-gray-500" />
            <span>Store Settings</span>
          </Link>

          <Link
            to="/shop/ai-insights"
            className="flex items-center gap-2.5 p-2 px-3 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 shadow-2xs hover:border-sky-300 transition-all cursor-pointer"
          >
            <Award className="h-5 w-5 text-sky-600" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-800">AI Score: {shopScore}%</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  {classification}
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Unread Automation Alerts Banner */}
      {unreadNotifications.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Bell size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                {unreadNotifications.length} Automation Alert(s) Pending Review
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {unreadNotifications[0]?.title}: {unreadNotifications[0]?.message}
              </p>
            </div>
          </div>
          <Link
            to="/shop/automation"
            className="flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-200/70 hover:bg-amber-200 px-3 py-1.5 rounded-xl shrink-0 transition-all"
          >
            <span>Review Alerts</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-xs p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today&apos;s Revenue</p>
              <p className="text-2xl font-black text-gray-900 mt-1">₹{todaysRevenue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-2xl text-green-600">
              <IndianRupee size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today&apos;s Orders</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{todaysOrders.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <ShoppingBag size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Queue</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{pendingOrders.length}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-2xl text-yellow-600">
              <Clock size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{orders.length}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
              <TrendingUp size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── GRAPH 1: Day by Day Sales (Line Graph) ─── */}
      <SalesLineChart
        data={analyticsData?.dailySales || []}
        days={analyticsDays}
        onDaysChange={handleRangeChange}
      />

      {/* ─── GRAPHS 2 & 3: Two Column Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAPH 2: Low Stock Analysis (Bar Graph) */}
        <StockAnalysisBarChart
          items={analyticsData?.stockAnalysis || []}
          threshold={10}
        />

        {/* GRAPH 3: Total Customer Growth (Histogram) */}
        <CustomerGrowthHistogram
          data={analyticsData?.customerGrowth || []}
          uniqueCustomers={analyticsData?.summary?.uniqueCustomers || 0}
        />
      </div>



      {/* Recent Orders List */}
      <div className="bg-white shadow-xs rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Recent Customer Orders</h2>
          <span className="text-xs text-gray-500 font-medium">{pendingOrders.length} in queue</span>
        </div>
        {pendingOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            No active pending orders. Your store order queue is clear!
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {pendingOrders.slice(0, 5).map((order) => (
              <li key={order._id} className="p-5 hover:bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">Order #{order.orderNumber}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    ₹{order.totalAmount.toFixed(2)} • {order.items.length} items • COD
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 capitalize">
                  {order.orderStatus.replace(/_/g, ' ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ShopDashboard;
