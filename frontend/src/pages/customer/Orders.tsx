import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Truck, Store, ShoppingBag, ArrowRight, MapPin } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { api } from '../../services/api';
import { Order } from '../../types';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  placed:           { color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',   icon: <Package size={14} />,      label: 'Order Placed' },
  accepted:         { color: 'text-indigo-700',  bg: 'bg-indigo-50', border: 'border-indigo-200',  icon: <CheckCircle size={14} />,  label: 'Accepted' },
  preparing:        { color: 'text-yellow-700',  bg: 'bg-yellow-50', border: 'border-yellow-200',  icon: <Clock size={14} />,        label: 'Preparing' },
  ready:            { color: 'text-teal-700',    bg: 'bg-teal-50',   border: 'border-teal-200',    icon: <Store size={14} />,        label: 'Ready' },
  out_for_delivery: { color: 'text-purple-700',  bg: 'bg-purple-50', border: 'border-purple-200',  icon: <Truck size={14} />,        label: 'Out for Delivery' },
  delivered:        { color: 'text-green-700',   bg: 'bg-green-50',  border: 'border-green-200',   icon: <CheckCircle size={14} />,  label: 'Delivered ✓' },
  cancelled:        { color: 'text-red-700',     bg: 'bg-red-50',    border: 'border-red-200',     icon: <XCircle size={14} />,      label: 'Cancelled' },
  rejected:         { color: 'text-red-700',     bg: 'bg-red-50',    border: 'border-red-200',     icon: <XCircle size={14} />,      label: 'Rejected' },
};

const TIMELINE = ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

const OrderTimeline = ({ status }: { status: string }) => {
  const currentIdx = TIMELINE.indexOf(status);
  const isCancelled = status === 'cancelled' || status === 'rejected';
  return (
    <div className="flex items-center gap-0">
      {TIMELINE.map((step, i) => {
        const done = !isCancelled && i <= currentIdx;
        const active = !isCancelled && i === currentIdx;
        const labels: Record<string, string> = {
          placed: 'Placed', accepted: 'Accepted', preparing: 'Preparing',
          ready: 'Ready', out_for_delivery: 'Delivery', delivered: 'Delivered',
        };
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                done ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-300'
              } ${active ? 'ring-2 ring-primary-300 ring-offset-1' : ''}`}>
                {done && <CheckCircle size={10} className="text-white fill-white" />}
              </div>
              <span className={`mt-1 text-[9px] font-semibold whitespace-nowrap ${done ? 'text-primary-600' : 'text-gray-400'}`}>
                {labels[step]}
              </span>
            </div>
            {i < TIMELINE.length - 1 && (
              <div className={`h-0.5 w-6 sm:w-8 mb-3 transition-all duration-300 ${
                !isCancelled && i < currentIdx ? 'bg-primary-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const Orders = () => {
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.get('/orders/my');
        if (res.data.success) setOrders(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchOrders();
  }, []);

  const handleCancel = async (orderId: string) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      const res = await api.patch(`/orders/${orderId}/cancel`);
      if (res.data.success)
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: 'cancelled' } : o));
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to cancel'); }
  };

  return (
    <MainLayout>
      <div className="page-container py-8">
        {/* Success Banner */}
        {location.state?.orderSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 animate-scale-in">
            <div className="h-10 w-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-green-800">Order placed successfully! 🎉</p>
              <p className="text-xs text-green-600 mt-0.5">Order #{location.state.orderNumber} has been sent to the shop</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">My Orders</h1>
            <p className="text-sm text-gray-500 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
          </div>
          <Link to="/shops" className="btn-secondary px-4 py-2 rounded-xl text-sm flex items-center gap-1.5">
            <ShoppingBag size={14} /> Shop More
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(n => <div key={n} className="h-40 skeleton rounded-2xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="card p-16 text-center animate-scale-in">
            <div className="h-24 w-24 rounded-3xl bg-primary-50 flex items-center justify-center mx-auto mb-5 animate-float">
              <Package size={40} className="text-primary-300" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">No orders yet</h3>
            <p className="text-gray-500 mt-2 text-sm">You haven't placed any orders. Discover local shops and start shopping!</p>
            <Link to="/shops" className="btn-primary mt-6 px-8 py-3 rounded-xl inline-flex items-center gap-2">
              Browse Shops <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order, idx) => {
              const sc = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG['placed'];
              return (
                <div key={order._id} className={`card overflow-hidden animate-fade-in-up`} style={{ animationDelay: `${idx * 60}ms` }}>
                  {/* Header */}
                  <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl ${sc.bg} border ${sc.border} flex items-center justify-center flex-shrink-0`}>
                        <span className={sc.color}>{sc.icon}</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">#{order.orderNumber}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${sc.color} ${sc.bg} ${sc.border}`}>
                        {sc.icon} {sc.label}
                      </span>
                      <span className="text-lg font-extrabold text-gray-900">₹{order.totalAmount.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    {/* Timeline */}
                    <div className="mb-5 overflow-x-auto pb-2">
                      <OrderTimeline status={order.orderStatus} />
                    </div>

                    <div className="flex flex-col md:flex-row gap-5">
                      {/* Items */}
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                          From {order.shopId?.shopName}
                        </p>
                        <ul className="space-y-2">
                          {order.items.map((item, i) => (
                            <li key={i} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                {item.imageUrl && (
                                  <img src={item.imageUrl} alt={item.name} className="h-8 w-8 rounded-lg object-cover border border-gray-100" />
                                )}
                                <span className="font-medium text-gray-800">{item.name}</span>
                                <span className="text-gray-400">× {item.quantity}</span>
                              </div>
                              <span className="font-bold text-gray-700">₹{(item.price * item.quantity).toFixed(0)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Details */}
                      <div className="md:w-52 bg-gray-50 rounded-xl p-4 text-xs text-gray-600 space-y-2 flex-shrink-0">
                        <p className="font-bold text-gray-700 text-sm mb-3">Order Details</p>
                        <div className="flex justify-between">
                          <span>Delivery</span>
                          <span className="font-semibold">{order.deliveryType === 'delivery' ? '🚚 Home' : '🛍 Pickup'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payment</span>
                          <span className="font-semibold">💵 COD</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery Fee</span>
                          <span className="font-semibold">₹{order.deliveryFee}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
                          <span className="font-bold text-gray-700">Total</span>
                          <span className="font-bold text-gray-900">₹{order.totalAmount}</span>
                        </div>

                        {order.deliveryLocation?.address && (
                          <div className="pt-2 border-t border-gray-200 text-[11px]">
                            <span className="text-gray-400 block mb-0.5">Delivery Pin:</span>
                            <p className="text-gray-700 font-medium line-clamp-2" title={order.deliveryLocation.address}>
                              {order.deliveryLocation.address}
                            </p>
                            {order.deliveryLocation.latitude && (
                              <a
                                href={`https://www.openstreetmap.org/?mlat=${order.deliveryLocation.latitude}&mlon=${order.deliveryLocation.longitude}#map=16/${order.deliveryLocation.latitude}/${order.deliveryLocation.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-600 hover:text-sky-700 font-bold block mt-1"
                              >
                                🗺️ View on Map
                              </a>
                            )}
                          </div>
                        )}

                        {order.orderStatus === 'placed' && (
                          <button
                            onClick={() => handleCancel(order._id)}
                            className="w-full mt-3 py-2 text-xs font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-all"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Orders;
