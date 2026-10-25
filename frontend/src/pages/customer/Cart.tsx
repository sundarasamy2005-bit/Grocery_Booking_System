import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShoppingCart, Tag } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

const PRODUCT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { cart, isLoading, fetchCart, updateQuantity, removeItem, clearCart } = useCartStore();

  useEffect(() => {
    if (isAuthenticated) fetchCart();
    else navigate('/login');
  }, [isAuthenticated, fetchCart, navigate]);

  if (isLoading && !cart) {
    return (
      <MainLayout>
        <div className="page-container py-8">
          <div className="h-8 skeleton rounded-xl w-48 mb-8" />
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-4">
              {[1, 2, 3].map(n => <div key={n} className="h-28 skeleton rounded-2xl" />)}
            </div>
            <div className="w-full lg:w-80 h-64 skeleton rounded-2xl" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <MainLayout>
        <div className="page-container py-20 flex flex-col items-center text-center animate-scale-in">
          <div className="h-32 w-32 rounded-3xl bg-primary-50 dark:bg-[#12352D] flex items-center justify-center mb-6 animate-float">
            <ShoppingCart size={52} className="text-primary-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-[#F9FAFB]">Your cart is empty</h2>
          <p className="text-gray-500 dark:text-[#A7B3C5] mt-2 max-w-sm">Looks like you haven't added any groceries yet. Discover local shops and start adding items!</p>
          <Link to="/shops" className="btn-primary dark:bg-emerald-600 dark:hover:bg-emerald-500 mt-8 px-8 py-3.5 rounded-2xl text-base">
            Start Shopping <ArrowRight className="ml-2 h-5 w-5 inline" />
          </Link>
        </div>
      </MainLayout>
    );
  }

  const belowMinimum = cart.shopId && cart.subtotal < (cart.shopId.minimumOrderAmount || 0);

  return (
    <MainLayout>
      <div className="page-container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-[#F9FAFB]">Shopping Cart</h1>
            <p className="text-sm text-gray-500 dark:text-[#A7B3C5] mt-1">{cart.items.length} item{cart.items.length !== 1 ? 's' : ''} from <span className="font-semibold text-gray-700 dark:text-emerald-400">{cart.shopId?.shopName}</span></p>
          </div>
          <button
            onClick={() => { if (window.confirm('Clear your entire cart?')) clearCart(); }}
            className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer"
          >
            Clear Cart
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Items */}
          <div className="flex-1 space-y-3">
            {cart.items.map((item, idx) => (
              <div
                key={item.productId._id}
                className={`card p-4 flex items-center gap-4 animate-fade-in-up border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033]`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Image */}
                <div className="h-20 w-20 flex-shrink-0 bg-gray-50 dark:bg-[#111827] rounded-xl overflow-hidden border border-gray-100 dark:border-[#2D3748]">
                  {item.productId.imageUrl ? (
                    <img
                      src={item.productId.imageUrl}
                      alt={item.productId.name}
                      className="h-full w-full object-contain p-1 mix-blend-multiply dark:mix-blend-normal"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = PRODUCT_FALLBACK_IMAGE;
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-300 dark:text-slate-600">
                      <ShoppingBag size={24} />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-[#F9FAFB] truncate">{item.productId.name}</h4>
                  <p className="text-xs text-gray-400 dark:text-[#A7B3C5] mt-0.5">{item.productId.unit}</p>
                  <p className="text-sm font-bold text-primary-600 dark:text-emerald-400 mt-1">₹{item.productId.price} <span className="text-gray-400 dark:text-[#A7B3C5] font-normal">each</span></p>
                  {!item.productId.isAvailable && (
                    <p className="text-xs text-red-500 mt-1 font-medium">⚠ Unavailable</p>
                  )}
                </div>

                {/* Quantity + Delete */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#111827] rounded-xl p-1 border border-transparent dark:border-[#2D3748]">
                    <button
                      onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || isLoading}
                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-white dark:bg-[#172033] shadow-sm text-gray-600 dark:text-[#F9FAFB] hover:bg-primary-50 dark:hover:bg-[#12352D] hover:text-primary-600 dark:hover:text-emerald-400 disabled:opacity-40 transition-all cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-[#F9FAFB]">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                      disabled={item.quantity >= item.productId.stock || isLoading}
                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-white dark:bg-[#172033] shadow-sm text-gray-600 dark:text-[#F9FAFB] hover:bg-primary-50 dark:hover:bg-[#12352D] hover:text-primary-600 dark:hover:text-emerald-400 disabled:opacity-40 transition-all cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-extrabold text-gray-900 dark:text-[#F9FAFB]">₹{(item.productId.price * item.quantity).toFixed(0)}</p>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId._id)}
                    className="h-8 w-8 flex items-center justify-center text-gray-300 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="card p-6 sticky top-24 animate-fade-in-up delay-200 border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033]">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-[#F9FAFB] mb-5">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-[#A7B3C5]">
                  <span>Subtotal ({cart.items.length} items)</span>
                  <span className="font-semibold text-gray-900 dark:text-[#F9FAFB]">₹{cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-[#A7B3C5]">
                  <span>Delivery fee</span>
                  <span className="text-gray-700 dark:text-[#A7B3C5] font-semibold">
                    {cart.shopId?.freeDeliveryThreshold && cart.subtotal >= cart.shopId.freeDeliveryThreshold
                      ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">FREE</span>
                      : cart.shopId?.deliveryFee !== undefined
                      ? `₹${cart.shopId.deliveryFee}`
                      : 'Calculated at checkout'}
                  </span>
                </div>
              </div>

              <div className="my-4 h-px bg-gray-100 dark:bg-[#2D3748]" />
              <div className="flex justify-between text-base font-extrabold text-gray-900 dark:text-[#F9FAFB]">
                <span>Estimated Total</span>
                <span>
                  ₹{((cart.shopId?.freeDeliveryThreshold && cart.subtotal >= cart.shopId.freeDeliveryThreshold)
                    ? cart.subtotal
                    : cart.subtotal + (cart.shopId?.deliveryFee || 0)).toFixed(2)}
                </span>
              </div>

              {belowMinimum && (
                <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 rounded-xl text-xs text-orange-700 dark:text-orange-300 text-center">
                  <span className="font-bold">Minimum order ₹{cart.shopId!.minimumOrderAmount}</span>
                  <br />Add ₹{(cart.shopId!.minimumOrderAmount - cart.subtotal).toFixed(2)} more to checkout
                </div>
              )}

              <div className="mt-5 space-y-2.5">
                {belowMinimum ? (
                  <Link
                    to={`/shops/${cart.shopId?._id}`}
                    className="w-full btn-secondary flex items-center justify-center py-3.5 rounded-xl text-sm font-bold"
                  >
                    Continue Shopping
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/checkout"
                      className="w-full btn-primary dark:bg-emerald-600 dark:hover:bg-emerald-500 flex items-center justify-center py-3.5 rounded-xl text-base font-bold shadow-md shadow-emerald-950/40"
                    >
                      Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                    <Link
                      to={`/shops/${cart.shopId?._id || ''}`}
                      className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-[#2D3748] hover:bg-slate-50 dark:hover:bg-[#111827] text-slate-700 dark:text-[#F9FAFB] flex items-center justify-center text-xs font-bold transition-colors"
                    >
                      + Add More Items
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-[#A7B3C5]">
                <Tag size={11} /> Cash on Delivery only
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Cart;
