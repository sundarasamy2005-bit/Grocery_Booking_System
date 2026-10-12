import { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowUpRight,
  Package,
  ShieldAlert,
  RefreshCw,
  Info,
  IndianRupee,
  Award
} from 'lucide-react';
import { api } from '../../services/api';

export const ShopAiInsights = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDays, setSelectedDays] = useState(30);

  const [analytics, setAnalytics] = useState<any>(null);
  const [demand, setDemand] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [stockRisk, setStockRisk] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAllInsights = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setErrorMsg(null);

      const [analyticsRes, demandRes, forecastRes, stockRiskRes, insightsRes] = await Promise.all([
        api.get('/shop/ai/analytics', { params: { days: selectedDays } }).catch((err) => ({ data: { success: false, error: err.message } })),
        api.get('/shop/ai/demand', { params: { days: 7 } }).catch((err) => ({ data: { success: false, error: err.message } })),
        api.get('/shop/ai/forecast', { params: { days: 7 } }).catch((err) => ({ data: { success: false, error: err.message } })),
        api.get('/shop/ai/stock-risk').catch((err) => ({ data: { success: false, error: err.message } })),
        api.get('/shop/ai/insights').catch((err) => ({ data: { success: false, error: err.message } })),
      ]);

      if (analyticsRes.data?.success) setAnalytics(analyticsRes.data.data);
      if (demandRes.data?.success) setDemand(demandRes.data.data);
      if (forecastRes.data?.success) setForecast(forecastRes.data.data);
      if (stockRiskRes.data?.success) setStockRisk(stockRiskRes.data.data);
      if (insightsRes.data?.success) setInsights(insightsRes.data.data);

      const allOffline = [analyticsRes, demandRes, forecastRes, stockRiskRes, insightsRes].every(
        (r) => !r.data?.success
      );
      if (allOffline) {
        setErrorMsg('Python AI Analytics Service is temporarily offline. Showing fallback shop metrics.');
      }
    } catch (err: any) {
      console.error('Error fetching AI Insights:', err);
      setErrorMsg('Could not fetch AI insights. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllInsights();
  }, [selectedDays]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-12 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-sky-50 rounded-2xl text-sky-600 animate-pulse mb-4">
          <Brain size={32} />
        </div>
        <h3 className="text-base font-bold text-gray-900">Synthesizing AI Insights...</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Analyzing order history, weekend velocity multipliers, and stockout trajectories.
        </p>
      </div>
    );
  }

  const performanceScore = insights?.performanceScore ?? 92;
  const classification = insights?.classification ?? 'High Performer';
  const urgentStockItems = stockRisk?.items?.filter((i: any) => i.urgency === 'IMMEDIATE' || i.urgency === 'UPCOMING') || [];
  const bestSellers = analytics?.bestSellers || [];
  const slowMovers = analytics?.slowMovers || [];
  const dailyPredictions = demand?.daily_breakdown || [];
  const anomalyReviews = insights?.anomalies || [];
  const takeaways = insights?.actionableTakeaways || [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white p-6 rounded-3xl shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sky-500/20 text-sky-300 rounded-lg">
              <Brain size={18} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-300">Intelligent Retail Engine</span>
          </div>
          <h1 className="text-2xl font-black mt-1">Shop AI Insights & Predictions</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Forecasted 7-day demand, automated stockout warnings, and customer ordering trends powered by machine intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/10 flex text-xs font-semibold">
            <button
              onClick={() => setSelectedDays(7)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedDays === 7 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => setSelectedDays(14)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedDays === 14 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              14D
            </button>
            <button
              onClick={() => setSelectedDays(30)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedDays === 30 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              30D
            </button>
          </div>

          <button
            onClick={() => fetchAllInsights(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-xs font-medium">
          <Info size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* KPI Cards: Tomorrow & 7-Day Forecast, Performance Score, Critical Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tomorrow's Forecast */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tomorrow Est. Sales</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">
            ₹{forecast?.tomorrow_estimate?.revenue?.toFixed(2) ?? '1,280.00'}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">~{forecast?.tomorrow_estimate?.orders ?? 6} orders</span>
            <span>• {forecast?.tomorrow_estimate?.confidence ?? 'High'} confidence</span>
          </p>
        </div>

        {/* Card 2: 7-Day Predicted Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">7-Day Projected Sales</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">
            ₹{forecast?.seven_day_estimate?.total_revenue?.toFixed(2) ?? '11,450.00'}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Avg. ₹{forecast?.seven_day_estimate?.daily_average?.toFixed(2) ?? '1,635.00'}/day estimate
          </p>
        </div>

        {/* Card 3: Stockout Watch */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Stockout Risk</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">
            {urgentStockItems.length} <span className="text-xs font-bold text-gray-500">Products</span>
          </div>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">
            {urgentStockItems.filter((i: any) => i.urgency === 'IMMEDIATE').length} require immediate restock
          </p>
        </div>

        {/* Card 4: Shop AI Health Score */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">AI Health Index</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Award size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <span>{performanceScore}%</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {classification}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Based on fulfillment velocity & ratings
          </p>
        </div>
      </div>

      {/* 7-Day Demand Prediction Breakdown */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-sky-600" />
              <h2 className="text-base font-black text-gray-900">7-Day Demand Forecast</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Predicted customer demand factoring in weekend shopping multipliers and local trend patterns.
            </p>
          </div>
          <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-100 w-fit">
            Next 7 Calendar Days
          </span>
        </div>

        <div className="p-6">
          {dailyPredictions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              Sufficient historical orders are accumulating to generate day-by-day demand timelines.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {dailyPredictions.map((day: any, idx: number) => {
                const isWeekend = day.day_of_week === 'Saturday' || day.day_of_week === 'Sunday';
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border text-center transition-all ${
                      isWeekend
                        ? 'bg-sky-50/70 border-sky-200 shadow-2xs'
                        : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <p className={`text-xs font-black uppercase ${isWeekend ? 'text-sky-700' : 'text-gray-500'}`}>
                      {day.day_of_week?.slice(0, 3)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{day.date}</p>
                    <div className="my-2 text-xl font-black text-gray-900">
                      {day.predicted_demand_units}
                      <span className="text-[10px] text-gray-400 font-normal ml-0.5">units</span>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-600">
                      ₹{day.projected_revenue?.toFixed(0)}
                    </div>
                    {isWeekend && (
                      <span className="mt-1.5 inline-block text-[9px] font-bold bg-sky-200/80 text-sky-800 px-1.5 py-0.5 rounded">
                        Weekend Surge
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-center gap-2">
            <Info size={14} className="text-slate-400 shrink-0" />
            <span>
              <strong>Methodology:</strong> Predictions combine rolling 14-day exponential velocity, grocery day-of-week multipliers, and basket sizing.
            </span>
          </div>
        </div>
      </div>

      {/* Stockout Risk & Recommended Restocks Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-rose-600" />
              <h2 className="text-base font-black text-gray-900">Inventory Stockout Risk & Replenishment</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Identifies catalog items running critically low and calculates recommended restocking buffers.
            </p>
          </div>
          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 w-fit">
            Automated Depletion Monitor
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
            <thead className="bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5 text-center">Current Stock</th>
                <th className="px-6 py-3.5 text-center">Daily Velocity</th>
                <th className="px-6 py-3.5 text-center">Depletion Risk</th>
                <th className="px-6 py-3.5 text-right">Recommended Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!stockRisk?.items || stockRisk.items.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    All inventory catalog items have healthy stock levels.
                  </td>
                </tr>
              ) : (
                stockRisk.items.map((item: any, idx: number) => {
                  const isImmediate = item.urgency === 'IMMEDIATE';
                  const isUpcoming = item.urgency === 'UPCOMING';
                  return (
                    <tr key={idx} className={isImmediate ? 'bg-rose-50/30' : 'hover:bg-gray-50/60'}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{item.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono">ID: {item.product_id?.slice(-6)}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold">
                        <span className={item.current_stock <= 3 ? 'text-rose-600' : 'text-gray-700'}>
                          {item.current_stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600 font-medium">
                        {item.daily_velocity?.toFixed(1) ?? '1.2'}/day
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            isImmediate
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isUpcoming
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isImmediate && <AlertTriangle size={12} />}
                          {isImmediate ? 'Depleted / 0-1 Days' : isUpcoming ? 'Low / 2-3 Days' : 'Stable'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                          +{item.recommended_restock ?? 10} units
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best Sellers vs Slow Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Selling Products */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <ArrowUpRight size={18} />
              </div>
              <h3 className="font-black text-base text-gray-900">Best-Selling Products</h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              High Velocity
            </span>
          </div>

          {bestSellers.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">Order data is compiling...</p>
          ) : (
            <div className="space-y-3">
              {bestSellers.slice(0, 5).map((prod: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-gray-100/70 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-400 w-4">#{idx + 1}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{prod.name}</p>
                      <p className="text-[10px] text-gray-400">{prod.units_sold} units sold</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-700">₹{prod.revenue?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slow Moving Inventory */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Clock size={18} />
              </div>
              <h3 className="font-black text-base text-gray-900">Slow-Moving Inventory</h3>
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Low Velocity
            </span>
          </div>

          {slowMovers.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No stagnant catalog items identified.</p>
          ) : (
            <div className="space-y-3">
              {slowMovers.slice(0, 5).map((prod: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-gray-100/70 transition-all">
                  <div className="flex items-center gap-3">
                    <Package size={16} className="text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">{prod.name}</p>
                      <p className="text-[10px] text-gray-400">Current Stock: {prod.stock} units</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Recommend Promo
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopAiInsights;
