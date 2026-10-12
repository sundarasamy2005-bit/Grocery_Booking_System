import { useEffect } from 'react';
import { Store, AlertTriangle, ArrowRight, X, Loader2, RefreshCw } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useToastStore } from '../../store/toastStore';

export default function CartConflictModal() {
  const { conflictModal, closeConflictModal, confirmReplaceCart, isLoading } = useCartStore();
  const toast = useToastStore();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && conflictModal?.isOpen) {
        closeConflictModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [conflictModal, closeConflictModal]);

  if (!conflictModal || !conflictModal.isOpen || !conflictModal.product) {
    return null;
  }

  const { product, currentShopName, newShopName } = conflictModal;

  const handleConfirm = async () => {
    const success = await confirmReplaceCart();
    if (success) {
      toast.success(`Cart updated: Started new order with ${product.name}!`);
    } else {
      toast.error('Could not update cart. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={closeConflictModal}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden z-10 animate-scale-in">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-6 pb-4 border-b border-amber-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl shadow-2xs">
              <AlertTriangle size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Replace Cart Items?</h3>
              <p className="text-xs text-amber-800 font-semibold mt-0.5">Different Store Detected</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeConflictModal}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            Your cart already has items from{' '}
            <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
              {currentShopName || 'Another Store'}
            </span>
            . Since local deliveries come directly from each neighborhood shop, orders can only be placed from one store at a time.
          </p>

          {/* Transition Visual Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <span>Current Cart</span>
              <ArrowRight size={13} className="text-emerald-600" />
              <span className="text-emerald-700 font-black">New Store</span>
            </div>

            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <span className="text-gray-700 truncate max-w-[140px]">{currentShopName || 'Current Store'}</span>
              <span className="text-emerald-700 truncate max-w-[140px] font-black">{newShopName || 'This Store'}</span>
            </div>
          </div>

          {/* Product Preview Card */}
          <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white border border-emerald-100 overflow-hidden flex items-center justify-center shrink-0">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Store size={22} className="text-emerald-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 truncate">{product.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-black text-emerald-700">₹{product.price}</span>
                <span className="text-[11px] text-gray-400 font-medium">({product.unit})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={closeConflictModal}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer text-center"
          >
            Keep Current Cart
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-xs font-bold text-white shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer text-center"
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Replacing...</span>
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                <span>Clear Cart & Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
