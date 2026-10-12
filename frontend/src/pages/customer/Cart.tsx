import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShoppingCart, Tag } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

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
          <div className="h-32 w-32 rounded-3xl bg-primary-50 flex items-center justify-center mb-6 animate-float">
            <ShoppingCart size={52} className="text-primary-300" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Your cart is empty</h2>
          <p className="text-gray-500 mt-2 max-w-sm">Looks like you haven't added any groceries yet. Discover local shops and start adding items!</p>
          <Link to="/shops" className="btn-primary mt-8 px-8 py-3.5 rounded-2xl text-base">
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
            <h1 className="text-2xl font-extrabold text-gray-900">Shopping Cart</h1>
            <p className="text-sm text-gray-500 mt-1">{cart.items.length} item{cart.items.length !== 1 ? 's' : ''} from <span className="font-semibold text-gray-700">{cart.shopId?.shopName}</span></p>
          </div>
          <button
            onClick={() => { if (window.confirm('Clear your entire cart?')) clearCart(); }}
            className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all duration-200"
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
                className={`card p-4 flex items-center gap-4 animate-fade-in-up`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Image */}
                <div className="h-20 w-20 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                  {item.productId.imageUrl ? (
                    <img src={item.productId.imageUrl} alt={item.productId.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-300">
                      <ShoppingBag size={24} />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{item.productId.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{item.productId.unit}</p>
                  <p className="text-sm font-bold text-primary-600 mt-1">₹{item.productId.price} <span className="text-gray-400 font-normal">each</span></p>
                  {!item.productId.isAvailable && (
                    <p className="text-xs text-red-500 mt-1 font-medium">⚠ Unavailable</p>
                  )}
                </div>

                {/* Quantity + Delete */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || isLoading}
                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-white shadow-sm text-gray-600 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-40 transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                      disabled={item.quantity >= item.productId.stock || isLoading}
                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-white shadow-sm text-gray-600 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-40 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-extrabold text-gray-900">₹{(item.productId.price * item.quantity).toFixed(0)}</p>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId._id)}
                    className="h-8 w-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="card p-6 sticky top-24 animate-fade-in-up delay-200">
              <h2 className="text-lg font-extrabold text-gray-900 mb-5">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.items.length} items)</span>
                  <span className="font-semibold text-gray-900">₹{cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery fee</span>
                  <span className="text-gray-400">Calculated at checkout</span>
                </div>
              </div>

              <div className="my-4 h-px bg-gray-100" />
              <div className="flex justify-between text-base font-extrabold text-gray-900">
                <span>Estimated Total</span>
                <span>₹{cart.subtotal.toFixed(2)}</span>
              </div>

              {belowMinimum && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-700 text-center">
                  <span className="font-bold">Minimum order ₹{cart.shopId!.minimumOrderAmount}</span>
                  <br />Add ₹{(cart.shopId!.minimumOrderAmount - cart.subtotal).toFixed(2)} more to checkout
                </div>
              )}

              <div className="mt-5">
                {belowMinimum ? (
                  <Link
                    to={`/shops/${cart.shopId?._id}`}
                    className="w-full btn-secondary flex items-center justify-center py-3.5 rounded-xl text-sm font-bold"
                  >
                    Continue Shopping
                  </Link>
                ) : (
                  <Link
                    to="/checkout"
                    className="w-full btn-primary flex items-center justify-center py-3.5 rounded-xl text-base font-bold"
                  >
                    Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                )}
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
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
