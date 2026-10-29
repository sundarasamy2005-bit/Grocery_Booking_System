import React, { useState } from 'react';
import { TrendingUp, AlertTriangle, Users, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── 1. DAY-BY-DAY SALES LINE GRAPH ──────────────────────────
export interface DailySalesPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

interface SalesLineChartProps {
  data: DailySalesPoint[];
  days: number;
  onDaysChange: (days: number) => void;
}

export const SalesLineChart: React.FC<SalesLineChartProps> = ({ data, days, onDaysChange }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-gray-400 text-xs">No daily sales data available for this period.</div>;
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1000);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
  const avgDaily = Math.round(totalRevenue / data.length);

  // SVG dimensions
  const width = 640;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // Calculate coordinates
  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1 || 1)) * chartW;
    const y = height - paddingY - (d.revenue / maxRevenue) * chartH;
    return { x, y, ...d };
  });

  // Generate SVG path polyline string
  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    // Simple smooth bezier interpolation
    const prev = points[i - 1];
    const cpX = (prev.x + p.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  // Closed path for gradient area fill
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  const hovered = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="bg-white dark:bg-[#172033] rounded-3xl p-6 border border-gray-200 dark:border-[#2D3748] shadow-xs space-y-4 w-full overflow-hidden">
      {/* Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl">
              <TrendingUp size={18} />
            </div>
            <h3 className="font-extrabold text-base text-gray-900 dark:text-[#F9FAFB]">Day by Day Sales Velocity</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-[#A7B3C5] mt-0.5">Real-time revenue progression and order density line graph</p>
        </div>

        {/* Days Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#111827] p-1 rounded-xl self-start sm:self-auto">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => onDaysChange(d)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                days === d ? 'bg-white dark:bg-[#172033] text-emerald-700 dark:text-emerald-400 shadow-2xs' : 'text-gray-500 dark:text-[#A7B3C5] hover:text-gray-900 dark:hover:text-[#F9FAFB]'
              }`}
            >
              Last {d}D
            </button>
          ))}
        </div>
      </div>

      {/* KPI Chips */}
      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="bg-slate-50 dark:bg-[#111827] p-3 rounded-2xl border border-slate-100 dark:border-[#2D3748]">
          <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-[#A7B3C5]">Total Period Revenue</p>
          <p className="text-lg font-black text-gray-900 dark:text-[#F9FAFB] mt-0.5">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-slate-50 dark:bg-[#111827] p-3 rounded-2xl border border-slate-100 dark:border-[#2D3748]">
          <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-[#A7B3C5]">Average Daily Revenue</p>
          <p className="text-lg font-black text-sky-700 dark:text-sky-400 mt-0.5">₹{avgDaily.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-slate-50 dark:bg-[#111827] p-3 rounded-2xl border border-slate-100 dark:border-[#2D3748]">
          <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-[#A7B3C5]">Total Orders Placed</p>
          <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{totalOrders} orders</p>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative w-full overflow-hidden pt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.5, 1].map((ratio) => {
            const y = height - paddingY - ratio * chartH;
            return (
              <g key={ratio}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <text x={paddingX - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="600">
                  ₹{Math.round(ratio * maxRevenue)}
                </text>
              </g>
            );
          })}

          {/* Shaded Area */}
          <path d={areaD} fill="url(#salesGrad)" />

          {/* Line Path */}
          <path d={pathD} fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />

          {/* Data Points */}
          {points.map((p, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <g key={p.date} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} className="cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 3.5}
                  fill={isHovered ? '#0284c7' : '#ffffff'}
                  stroke="#0284c7"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all"
                />
                {/* X-axis date labels for key points */}
                {(index === 0 || index === points.length - 1 || index === Math.floor(points.length / 2)) && (
                  <text x={p.x} y={height - 8} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">
                    {p.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Popup */}
        {hovered && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-lg border border-slate-700 pointer-events-none text-xs flex items-center gap-2 animate-fade-in z-10"
          >
            <span className="font-bold text-sky-300">{hovered.label}:</span>
            <span className="font-black text-emerald-400">₹{hovered.revenue.toFixed(2)}</span>
            <span className="text-gray-300">({hovered.orders} orders)</span>
          </div>
        )}
      </div>
    </div>
  );
};


// ─── 2. LOW STOCK ANALYSIS BAR GRAPH ─────────────────────────
export interface StockItemAnalysis {
  id: string;
  name: string;
  stock: number;
  threshold: number;
  status: 'critical' | 'low' | 'adequate';
  unit: string;
  price: number;
}

interface StockAnalysisBarChartProps {
  items: StockItemAnalysis[];
  threshold: number;
}

export const StockAnalysisBarChart: React.FC<StockAnalysisBarChartProps> = ({ items, threshold }) => {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white dark:bg-[#172033] rounded-3xl p-6 border border-gray-200 dark:border-[#2D3748] shadow-xs text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
        <h4 className="font-bold text-sm text-gray-900 dark:text-[#F9FAFB]">Inventory Well Stocked</h4>
        <p className="text-xs text-gray-500 dark:text-[#A7B3C5] mt-1">All catalog items have stock levels exceeding {threshold} units.</p>
      </div>
    );
  }

  const maxScale = Math.max(...items.map((i) => i.stock), threshold * 1.5, 20);

  return (
    <div className="bg-white dark:bg-[#172033] rounded-3xl p-6 border border-gray-200 dark:border-[#2D3748] shadow-xs space-y-4 w-full overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-gray-900 dark:text-[#F9FAFB]">Low Stock Inventory Analysis</h3>
            <p className="text-xs text-gray-500 dark:text-[#A7B3C5] mt-0.5">Horizontal bar breakdown comparing current units against safety threshold ({threshold} units)</p>
          </div>
        </div>

        <Link
          to="/shop/products"
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1"
        >
          <span>Restock Catalog</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Threshold Reference Indicator */}
      <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 dark:text-[#A7B3C5] bg-slate-50 dark:bg-[#111827] p-2.5 rounded-xl border border-slate-100 dark:border-[#2D3748]">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-rose-500"></div>
          <span>Critical (0–3 units)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-amber-500"></div>
          <span>Low (4–{threshold} units)</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto text-[11px] text-gray-400 dark:text-[#A7B3C5]">
          Safety Buffer Line: {threshold} units
        </div>
      </div>

      {/* Stacked Bars List */}
      <div className="space-y-3 pt-2">
        {items.map((item) => {
          const widthPercent = Math.min(100, Math.max(4, (item.stock / maxScale) * 100));
          const thresholdPercent = Math.min(100, (item.threshold / maxScale) * 100);

          let barColor = 'bg-emerald-500';
          let textColor = 'text-emerald-700 dark:text-emerald-400';
          if (item.status === 'critical') {
            barColor = 'bg-rose-500';
            textColor = 'text-rose-700 dark:text-rose-400';
          } else if (item.status === 'low') {
            barColor = 'bg-amber-500';
            textColor = 'text-amber-700 dark:text-amber-400';
          }

          return (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800 dark:text-[#F9FAFB] truncate max-w-[200px]">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-black ${textColor}`}>
                    {item.stock} {item.unit}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-[#A7B3C5]">₹{item.price}/{item.unit}</span>
                </div>
              </div>

              {/* Bar track */}
              <div className="relative h-4 w-full bg-gray-100 dark:bg-[#111827] rounded-full overflow-hidden">
                {/* Safety threshold vertical line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-300 z-10"
                  style={{ left: `${thresholdPercent}%` }}
                />
                {/* Actual Bar Fill */}
                <div
                  className={`h-full ${barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// ─── 3. TOTAL CUSTOMER GROWTH HISTOGRAM ──────────────────────
export interface CustomerGrowthBucket {
  period: string;
  newCustomers: number;
  repeatOrders: number;
  totalCustomers: number;
}

interface CustomerGrowthHistogramProps {
  data: CustomerGrowthBucket[];
  uniqueCustomers: number;
}

const formatBucketLabel = (period: string): { range: string; month: string } => {
  if (!period) return { range: '', month: '' };
  const parts = period.split('-').map((s) => s.trim());
  if (parts.length === 2) {
    const [p1, p2] = parts;
    const match1 = p1.match(/^(\d+)\s*([A-Za-z]+)?$/);
    const match2 = p2.match(/^(\d+)\s*([A-Za-z]+)?$/);
    if (match1 && match2) {
      const d1 = match1[1];
      const m1 = match1[2] || '';
      const d2 = match2[1];
      const m2 = match2[2] || m1;
      if (m1.toLowerCase() === m2.toLowerCase() || !m1) {
        return {
          range: `${d1}–${d2}`,
          month: (m2 || m1).substring(0, 3).toUpperCase(),
        };
      }
      return {
        range: `${d1}–${d2}`,
        month: `${m1.substring(0, 3)}/${m2.substring(0, 3)}`.toUpperCase(),
      };
    }
  }
  const single = period.match(/^(\d+)\s*([A-Za-z]+)?$/);
  if (single) {
    return { range: single[1], month: (single[2] || '').substring(0, 3).toUpperCase() };
  }
  return { range: period, month: '' };
};

export const CustomerGrowthHistogram: React.FC<CustomerGrowthHistogramProps> = ({ data, uniqueCustomers }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-[#172033] rounded-3xl p-6 border border-gray-200 dark:border-[#2D3748] shadow-xs text-center text-gray-400 dark:text-[#A7B3C5] text-xs">
        No customer growth data available.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.newCustomers + d.repeatOrders), 5);
  const totalRepeat = data.reduce((sum, d) => sum + d.repeatOrders, 0);
  const totalNew = data.reduce((sum, d) => sum + d.newCustomers, 0);
  const totalCombined = totalRepeat + totalNew;
  const repeatRate = totalCombined > 0 ? Math.round((totalRepeat / totalCombined) * 100) : 0;

  return (
    <div className="bg-white dark:bg-[#172033] rounded-3xl p-6 border border-gray-200 dark:border-[#2D3748] shadow-xs space-y-4 w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <Users size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-gray-900 dark:text-[#F9FAFB] leading-tight">Total Customer Growth Histogram</h3>
            <p className="text-xs text-gray-500 dark:text-[#A7B3C5] mt-0.5">Chronological customer acquisition bins & repeat order frequency</p>
          </div>
        </div>

        <span className="text-xs font-black px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-100 dark:border-indigo-900/60 self-start sm:self-auto shrink-0">
          {uniqueCustomers} Active Shoppers
        </span>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-slate-50 dark:bg-[#111827] p-2.5 sm:p-3 rounded-2xl border border-slate-100 dark:border-[#2D3748] min-w-0">
          <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-[#A7B3C5] truncate">Total Unique</p>
          <p className="text-base sm:text-lg font-black text-gray-900 dark:text-[#F9FAFB] mt-0.5 truncate">{uniqueCustomers}</p>
        </div>
        <div className="bg-slate-50 dark:bg-[#111827] p-2.5 sm:p-3 rounded-2xl border border-slate-100 dark:border-[#2D3748] min-w-0">
          <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-[#A7B3C5] truncate">New Joined</p>
          <p className="text-base sm:text-lg font-black text-indigo-700 dark:text-indigo-400 mt-0.5 truncate">+{totalNew}</p>
        </div>
        <div className="bg-slate-50 dark:bg-[#111827] p-2.5 sm:p-3 rounded-2xl border border-slate-100 dark:border-[#2D3748] min-w-0">
          <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-[#A7B3C5] truncate">Repeat Rate</p>
          <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5 truncate">{repeatRate}%</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-gray-500 dark:text-[#A7B3C5] pt-1">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-xs bg-indigo-600"></div>
          <span className="font-semibold text-gray-700 dark:text-[#F9FAFB]">New Customers</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-xs bg-sky-400"></div>
          <span className="font-semibold text-gray-700 dark:text-[#F9FAFB]">Repeat Orders</span>
        </div>
      </div>

      {/* Histogram Column Bars */}
      <div className="relative pt-6 w-full">
        <div className="h-44 w-full flex items-end justify-between gap-1 sm:gap-2 px-1 sm:px-2 border-b border-gray-200 dark:border-[#2D3748]">
          {data.map((bucket, idx) => {
            const isHovered = hoveredIdx === idx;
            const newHeight = (bucket.newCustomers / maxVal) * 140;
            const repeatHeight = (bucket.repeatOrders / maxVal) * 140;
            const hasNew = newHeight > 0;
            const hasRepeat = repeatHeight > 0;
            const { range, month } = formatBucketLabel(bucket.period);

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="flex-1 min-w-0 flex flex-col items-center justify-end h-full cursor-pointer group"
              >
                {/* Stacked histogram bar */}
                <div className="w-full max-w-[28px] sm:max-w-[36px] flex flex-col justify-end transition-all duration-300 group-hover:scale-105">
                  {/* Repeat orders block (top) */}
                  {hasRepeat && (
                    <div
                      className={`w-full bg-sky-400 transition-all ${
                        hasNew ? 'rounded-t-sm' : 'rounded-sm'
                      } ${isHovered ? 'brightness-110' : ''}`}
                      style={{ height: `${Math.max(4, repeatHeight)}px` }}
                    />
                  )}
                  {/* New customers block (bottom) */}
                  {hasNew && (
                    <div
                      className={`w-full bg-indigo-600 transition-all ${
                        hasRepeat ? 'rounded-b-sm' : 'rounded-sm'
                      } ${isHovered ? 'brightness-110' : ''}`}
                      style={{ height: `${Math.max(4, newHeight)}px` }}
                    />
                  )}
                  {!hasNew && !hasRepeat && (
                    <div className="w-full h-1 bg-gray-200 dark:bg-slate-700 rounded-sm" />
                  )}
                </div>

                {/* Compact, clean date label */}
                <div className="flex flex-col items-center justify-center mt-2 w-full text-center leading-none select-none">
                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 dark:text-[#F9FAFB] tracking-tight truncate w-full">
                    {range}
                  </span>
                  {month && (
                    <span className="text-[8px] sm:text-[9px] font-bold text-gray-400 dark:text-[#A7B3C5] uppercase tracking-wider mt-0.5 truncate w-full">
                      {month}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hover Tooltip Popup */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3.5 py-2 rounded-2xl shadow-xl border border-slate-700 pointer-events-none text-xs flex items-center gap-2.5 animate-fade-in z-20 whitespace-nowrap">
            <span className="font-extrabold text-indigo-300">{data[hoveredIdx].period}:</span>
            <span className="font-bold text-emerald-400">+{data[hoveredIdx].newCustomers} New</span>
            <span className="font-bold text-sky-400">{data[hoveredIdx].repeatOrders} Repeat</span>
            <span className="text-[10px] text-gray-400 border-l border-slate-700 pl-2">
              Total {data[hoveredIdx].totalCustomers}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
