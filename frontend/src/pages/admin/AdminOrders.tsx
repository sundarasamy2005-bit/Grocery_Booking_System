import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Store,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { Order } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { format } from 'date-fns';

export const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const toast = useToastStore();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/admin/orders', { params });
      if (res.data.success) {
        setOrders(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalOrders(res.data.pagination.total || 0);
        }
      }
    } catch (err: any) {
      console.error('Failed to load admin orders', err);
      toast.error('Failed to fetch platform orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const STATUS_CONFIG: Record<
    string,
    { label: string; badge: string; icon: React.ReactNode }
  > = {
    placed: { label: 'Placed', badge: 'bg-sky-50 text-sky-800 border-sky-200', icon: <Package size={12} /> },
    accepted: { label: 'Accepted', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: <CheckCircle2 size={12} /> },
    preparing: { label: 'Preparing', badge: 'bg-amber-50 text-amber-800 border-amber-200', icon: <Clock size={12} /> },
    ready: { label: 'Ready', badge: 'bg-teal-50 text-teal-800 border-teal-200', icon: <Store size={12} /> },
    out_for_delivery: { label: 'Out for Delivery', badge: 'bg-purple-50 text-purple-800 border-purple-200', icon: <Truck size={12} /> },
    delivered: { label: 'Delivered', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: <CheckCircle2 size={12} /> },
    cancelled: { label: 'Cancelled', badge: 'bg-rose-50 text-rose-800 border-rose-200', icon: <XCircle size={12} /> },
    rejected: { label: 'Rejected', badge: 'bg-rose-50 text-rose-800 border-rose-200', icon: <XCircle size={12} /> },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Order Audits</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time fulfillment across all shops, delivery logs & payment records ({totalOrders} orders)
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="btn-secondary py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Status Filter Bar */}
      <div className="card p-3.5 border border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-500">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Orders (Any Status)</option>
            <option value="placed">Placed (Pending Store)</option>
            <option value="accepted">Accepted</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready for Pickup</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered Successfully</option>
            <option value="cancelled">Cancelled / Rejected</option>
          </select>
        </div>

        <span className="text-xs font-bold text-slate-400">
          Showing Page {page} of {totalPages}
        </span>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden border border-slate-100 shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <RefreshCw className="animate-spin h-6 w-6 mx-auto text-sky-600" />
            <p>Loading transactions...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No orders match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50/70 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 text-left">Order Reference</th>
                  <th className="px-6 py-3.5 text-left">Date / Time</th>
                  <th className="px-6 py-3.5 text-left">Store Merchant</th>
                  <th className="px-6 py-3.5 text-left">Amount & Mode</th>
                  <th className="px-6 py-3.5 text-left">Fulfillment Status</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                {orders.map((ord) => {
                  const shopName =
                    typeof ord.shopId === 'object' && ord.shopId
                      ? ord.shopId.shopName
                      : 'Local Merchant';
                  const cfg = STATUS_CONFIG[ord.orderStatus] || {
                    label: ord.orderStatus,
                    badge: 'bg-slate-100 text-slate-800 border-slate-200',
                    icon: null,
                  };

                  return (
                    <tr key={ord._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="font-extrabold text-slate-900">#{ord.orderNumber}</p>
                        <p className="text-[10px] text-slate-400">{ord.items.length} items</p>
                      </td>

                      <td className="px-6 py-3.5 text-slate-500">
                        {format(new Date(ord.createdAt), 'MMM dd, yyyy - hh:mm a')}
                      </td>

                      <td className="px-6 py-3.5">
                        <p className="font-bold text-slate-800 truncate max-w-[150px]">{shopName}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">
                          {ord.deliveryType === 'delivery' ? '🚚 Home Delivery' : '🛍 Store Pickup'}
                        </p>
                      </td>

                      <td className="px-6 py-3.5">
                        <p className="font-black text-slate-900 text-sm">
                          ₹{ord.totalAmount.toLocaleString()}
                        </p>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Cash on Delivery
                        </span>
                      </td>

                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${cfg.badge}`}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-2.5 py-1 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors font-bold text-xs inline-flex items-center gap-1"
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Order #{selectedOrder.orderNumber}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {format(new Date(selectedOrder.createdAt), 'dd MMMM yyyy, hh:mm a')}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Items List */}
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  Items Snapshot ({selectedOrder.items.length})
                </p>
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 p-3 bg-slate-50/50 space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs pt-1.5 first:pt-0">
                      <div>
                        <p className="font-extrabold text-slate-800">{item.name}</p>
                        <p className="text-[10px] text-slate-400">
                          ₹{item.price} × {item.quantity}
                        </p>
                      </div>
                      <span className="font-black text-slate-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800">
                    ₹{selectedOrder.subtotal?.toFixed(2) || selectedOrder.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-slate-800">₹{selectedOrder.deliveryFee || 0}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount (COD)</span>
                  <span className="text-sky-700">₹{selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Status & Delivery Info */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fulfillment Mode:</span>
                  <span className="font-extrabold capitalize text-slate-800">
                    {selectedOrder.deliveryType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Status:</span>
                  <span className="font-black capitalize text-slate-900">
                    {selectedOrder.orderStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                {(selectedOrder.deliveryLocation?.address || selectedOrder.deliveryAddress?.addressLine1) && (
                  <div className="pt-2 border-t border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">Delivery Location:</span>
                      {(selectedOrder.deliveryLocation?.latitude || selectedOrder.deliveryAddress?.latitude) && (
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${
                            selectedOrder.deliveryLocation?.latitude || selectedOrder.deliveryAddress?.latitude
                          }&mlon=${
                            selectedOrder.deliveryLocation?.longitude || selectedOrder.deliveryAddress?.longitude
                          }#map=16/${
                            selectedOrder.deliveryLocation?.latitude || selectedOrder.deliveryAddress?.latitude
                          }/${selectedOrder.deliveryLocation?.longitude || selectedOrder.deliveryAddress?.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100"
                        >
                          <span>🗺️ OpenStreetMap</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <p className="text-slate-700 font-medium leading-relaxed">
                      {selectedOrder.deliveryLocation?.address ||
                        `${selectedOrder.deliveryAddress?.addressLine1}, ${selectedOrder.deliveryAddress?.city}`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50/70 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-primary py-2 px-4 rounded-xl text-xs font-bold"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
