import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, Store, ShieldCheck } from 'lucide-react';

const PRODUCT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { cart, isLoading, updateQuantity, removeItem, clearCart } = useCartStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const deliveryFee = 40;
  const total = subtotal + (items.length > 0 ? deliveryFee : 0);
  const belowMinimum = cart?.shopId && subtotal < (cart.shopId.minimumOrderAmount || 0);

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#111827] text-slate-900 dark:text-[#F9FAFB] shadow-2xl flex flex-col justify-between animate-scale-in transition-colors">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-[#2D3748] flex items-center justify-between bg-slate-50/70 dark:bg-[#172033]">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-md">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-[#F9FAFB] text-base">Your Cart</h3>
                <p className="text-xs text-slate-500 dark:text-[#A7B3C5]">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                  {cart?.shopId && ` from ${cart.shopId.shopName}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Clear all items from your cart?')) clearCart();
                  }}
                  className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                onClick={onClose}
                className="text-slate-400 dark:text-[#A7B3C5] hover:text-slate-600 dark:hover:text-[#F9FAFB] p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#172033] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="h-20 w-20 rounded-3xl bg-emerald-50 dark:bg-[#12352D] flex items-center justify-center text-emerald-600 dark:text-[#34D399] mb-4 animate-float">
                  <ShoppingBag size={36} />
                </div>
                <h4 className="text-base font-extrabold text-slate-800 dark:text-[#F9FAFB]">Your cart is empty</h4>
                <p className="text-xs text-slate-400 dark:text-[#A7B3C5] mt-1 max-w-xs">
                  Discover delicious, fresh groceries from nearby local shops and add them here!
                </p>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/shops');
                  }}
                  className="btn-primary mt-6 px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Explore Shops
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId._id}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-[#2D3748] bg-white dark:bg-[#172033] hover:border-slate-200 dark:hover:border-slate-700 transition-all shadow-sm"
                >
                  <div className="h-16 w-16 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-100 dark:border-[#2D3748] overflow-hidden flex items-center justify-center shrink-0">
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
                      <ShoppingBag size={20} className="text-slate-300 dark:text-[#2D3748]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F9FAFB] truncate">
                      {item.productId.name}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-[#A7B3C5]">{item.productId.unit}</p>
                    <p className="text-xs font-extrabold text-emerald-700 dark:text-[#34D399] mt-0.5">
                      ₹{item.productId.price}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#111827] rounded-xl p-1 border border-slate-200/60 dark:border-[#2D3748]">
                      <button
                        onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isLoading}
                        className="h-6 w-6 rounded-lg bg-white dark:bg-[#172033] text-slate-700 dark:text-[#F9FAFB] flex items-center justify-center shadow-xs hover:bg-emerald-50 dark:hover:bg-[#12352D] hover:text-emerald-600 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-slate-800 dark:text-[#F9FAFB]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                        disabled={item.quantity >= item.productId.stock || isLoading}
                        className="h-6 w-6 rounded-lg bg-white dark:bg-[#172033] text-slate-700 dark:text-[#F9FAFB] flex items-center justify-center shadow-xs hover:bg-emerald-50 dark:hover:bg-[#12352D] hover:text-emerald-600 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-[#F9FAFB]">
                        ₹{(item.productId.price * item.quantity).toFixed(0)}
                      </span>
                      <button
                        onClick={() => removeItem(item.productId._id)}
                        className="text-slate-300 dark:text-[#A7B3C5]/40 hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-100 dark:border-[#2D3748] bg-slate-50/70 dark:bg-[#172033] space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-[#A7B3C5]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800 dark:text-[#F9FAFB]">₹{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery fee</span>
                  <span className="font-semibold text-slate-700 dark:text-[#A7B3C5]">₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-[#F9FAFB] pt-1.5 border-t border-slate-200 dark:border-[#2D3748]">
                  <span>Total Amount</span>
                  <span className="text-emerald-700 dark:text-[#34D399]">₹{total.toFixed(0)}</span>
                </div>
              </div>

              {belowMinimum && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 text-center font-medium">
                  Min. order for this shop is ₹{cart?.shopId?.minimumOrderAmount}.
                  Add ₹{(cart!.shopId!.minimumOrderAmount - subtotal).toFixed(0)} more.
                </div>
              )}

              <div className="pt-1">
                {belowMinimum ? (
                  <button
                    onClick={() => {
                      onClose();
                      if (cart?.shopId?._id) navigate(`/shops/${cart.shopId._id}`);
                    }}
                    className="w-full btn-secondary py-3 rounded-2xl text-xs font-bold justify-center cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                ) : (
                  <button
                    onClick={handleCheckout}
                    className="w-full btn-primary py-3.5 rounded-2xl text-xs sm:text-sm font-bold justify-center shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    Proceed to Checkout <ArrowRight size={16} className="ml-1.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-[#A7B3C5] pt-1">
                <ShieldCheck size={13} className="text-emerald-500 dark:text-[#34D399]" />
                <span>Cash on Delivery only • Safe & Contactless</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
