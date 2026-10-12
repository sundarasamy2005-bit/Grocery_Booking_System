import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Truck, Store, Search, MapPin, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { Order } from '../../types';
import { format } from 'date-fns';

const ShopOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/shop');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch shop orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        setOrders(orders.map(o => o._id === orderId ? { ...o, orderStatus: newStatus as any } : o));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => {
        if (statusFilter === 'active') return ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.orderStatus);
        if (statusFilter === 'completed') return o.orderStatus === 'delivered';
        if (statusFilter === 'cancelled') return ['cancelled', 'rejected'].includes(o.orderStatus);
        return true;
      });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Manage Orders</h1>
        
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
        >
          <option value="all">All Orders</option>
          <option value="active">Active Orders</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled/Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          No orders found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">#{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(new Date(order.createdAt), 'MMM dd, yyyy - hh:mm a')}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="text-sm">
                    <span className="text-gray-500 mr-2">Type:</span>
                    <span className="font-medium text-gray-900 capitalize">{order.deliveryType}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 mr-2">Total:</span>
                    <span className="font-bold text-gray-900">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize border border-blue-200">
                    {order.orderStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Items</h4>
                  <ul className="divide-y divide-gray-100 border border-gray-100 rounded-md">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="p-3 flex justify-between text-sm">
                        <span className="font-medium text-gray-800">{item.name} <span className="text-gray-500 font-normal ml-2">x{item.quantity}</span></span>
                        <span className="font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  {order.customerNote && (
                    <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-800 border border-yellow-100">
                      <span className="font-semibold">Customer Note:</span> {order.customerNote}
                    </div>
                  )}

                  {order.deliveryType === 'delivery' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <MapPin size={15} className="text-rose-500" />
                          <span>Delivery Address & Location</span>
                        </span>
                        {(order.deliveryLocation?.latitude || order.deliveryAddress?.latitude) && (
                          <a
                            href={`https://www.openstreetmap.org/?mlat=${
                              order.deliveryLocation?.latitude || order.deliveryAddress?.latitude
                            }&mlon=${
                              order.deliveryLocation?.longitude || order.deliveryAddress?.longitude
                            }#map=16/${
                              order.deliveryLocation?.latitude || order.deliveryAddress?.latitude
                            }/${order.deliveryLocation?.longitude || order.deliveryAddress?.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-bold transition-all shadow-2xs"
                          >
                            <span>🗺️ View Location</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {order.deliveryLocation?.address ||
                          `${order.deliveryAddress?.addressLine1 || ''}, ${
                            order.deliveryAddress?.city || ''
                          }`}
                      </p>
                      {(order.deliveryLocation?.latitude || order.deliveryAddress?.latitude) && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          GPS: {Number(order.deliveryLocation?.latitude || order.deliveryAddress?.latitude).toFixed(5)},{' '}
                          {Number(order.deliveryLocation?.longitude || order.deliveryAddress?.longitude).toFixed(5)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Update Status</h4>
                  
                  <div className="flex flex-col gap-2">
                    {order.orderStatus === 'placed' && (
                      <>
                        <button onClick={() => updateOrderStatus(order._id, 'accepted')} className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium">Accept Order</button>
                        <button onClick={() => updateOrderStatus(order._id, 'rejected')} className="w-full py-2 px-4 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded-md text-sm font-medium">Reject Order</button>
                      </>
                    )}
                    
                    {order.orderStatus === 'accepted' && (
                      <button onClick={() => updateOrderStatus(order._id, 'preparing')} className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm font-medium">Mark as Preparing</button>
                    )}
                    
                    {order.orderStatus === 'preparing' && (
                      <button onClick={() => updateOrderStatus(order._id, 'ready')} className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium">Mark as Ready</button>
                    )}
                    
                    {order.orderStatus === 'ready' && order.deliveryType === 'delivery' && (
                      <button onClick={() => updateOrderStatus(order._id, 'out_for_delivery')} className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium">Out for Delivery</button>
                    )}

                    {(order.orderStatus === 'out_for_delivery' || (order.orderStatus === 'ready' && order.deliveryType === 'pickup')) && (
                      <button onClick={() => updateOrderStatus(order._id, 'delivered')} className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium">Complete Order</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopOrders;
