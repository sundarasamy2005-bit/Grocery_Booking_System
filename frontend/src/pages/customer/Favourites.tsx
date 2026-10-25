import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ShoppingCart, Trash2, Plus, Minus, ArrowRight, Star, Package, Sparkles } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { useFavoriteStore } from '../../store/favoriteStore';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { toast } from '../../store/toastStore';
import { Product } from '../../types';

const PRODUCT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';

export const Favourites = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { favorites, isLoading, fetchFavorites, removeFavorite } = useFavoriteStore();
  const { cart, addToCart, updateQuantity, removeItem } = useCartStore();

  const [filterStockOnly, setFilterStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'priceAsc' | 'priceDesc' | 'name'>('default');

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [isAuthenticated, fetchFavorites]);

  const getCartQuantity = (productId: string) => {
    const item = cart?.items?.find((i) => i.productId._id === productId);
    return item ? item.quantity : 0;
  };

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      toast.info('Please sign in to add items to your cart');
      navigate('/login');
      return;
    }
    const success = await addToCart(product, 1);
    if (success) {
      toast.success(`Added ${product.name} to cart`);
    }
  };

  const handleIncrement = async (productId: string, currentQty: number, maxStock: number) => {
    if (currentQty >= maxStock) {
      toast.info(`Maximum available stock reached (${maxStock} items)`);
      return;
    }
    await updateQuantity(productId, currentQty + 1);
  };

  const handleDecrement = async (productId: string, currentQty: number) => {
    if (currentQty <= 1) {
      await removeItem(productId);
    } else {
      await updateQuantity(productId, currentQty - 1);
    }
  };

  const handleRemoveFavorite = async (e: React.MouseEvent, productId: string, productName: string) => {
    e.preventDefault();
    e.stopPropagation();
    await removeFavorite(productId);
    toast.info(`Removed ${productName} from favourites`);
  };

  const filteredAndSortedFavorites = useMemo(() => {
    let list = [...favorites];

    if (filterStockOnly) {
      list = list.filter((p) => p.stock > 0 && p.isAvailable);
    }

    if (sortBy === 'priceAsc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceDesc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [favorites, filterStockOnly, sortBy]);

  if (!authLoading && !isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-center">
          <div className="h-24 w-24 rounded-3xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mb-6 shadow-sm">
            <Heart size={44} className="fill-red-100 dark:fill-red-900/40" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-[#F9FAFB] tracking-tight">Save Your Favourite Groceries</h2>
          <p className="text-sm text-slate-500 dark:text-[#A7B3C5] mt-2 max-w-md">
            Sign in to keep track of items you love, quickly reorder your daily staples, and access them across all your devices.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              to="/login"
              className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md shadow-sky-600/20 dark:shadow-emerald-950/40 transition-all cursor-pointer"
            >
              Sign In to View
            </Link>
            <Link
              to="/shops"
              className="px-6 py-3 rounded-2xl bg-white dark:bg-[#172033] border border-slate-200 dark:border-[#2D3748] hover:bg-slate-50 dark:hover:bg-[#111827] text-slate-700 dark:text-[#F9FAFB] font-bold text-sm transition-all cursor-pointer"
            >
              Browse Shops
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-[#2D3748]">
          <div>
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-wider">
              <Heart size={14} className="fill-red-500" />
              <span>Saved Items</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#F9FAFB] tracking-tight mt-1">
              My Favourites
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A7B3C5] mt-1">
              Quickly reorder and inspect price updates on your favorite grocery staples
            </p>
          </div>

          {favorites.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#172033] border border-slate-200 dark:border-[#2D3748] text-xs font-bold text-slate-700 dark:text-[#F9FAFB] cursor-pointer hover:bg-slate-50 dark:hover:bg-[#111827] select-none">
                <input
                  type="checkbox"
                  checked={filterStockOnly}
                  onChange={(e) => setFilterStockOnly(e.target.checked)}
                  className="rounded text-sky-600 dark:text-emerald-400 focus:ring-sky-500 h-4 w-4"
                />
                In Stock Only
              </label>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#172033] border border-slate-200 dark:border-[#2D3748] text-xs font-bold text-slate-700 dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-400 cursor-pointer"
              >
                <option value="default">Default Order</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-72 bg-slate-100 dark:bg-[#172033] rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          /* Empty State */
          <div className="mt-12 py-16 px-4 bg-white dark:bg-[#172033] rounded-3xl border border-dashed border-slate-200 dark:border-[#2D3748] text-center max-w-xl mx-auto shadow-2xs">
            <div className="h-20 w-20 rounded-3xl bg-red-50 dark:bg-red-950/40 text-red-400 flex items-center justify-center mx-auto mb-4">
              <Heart size={36} className="fill-red-100 dark:fill-red-900/40" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-[#F9FAFB]">Your favourites list is empty</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A7B3C5] mt-2 max-w-sm mx-auto">
              Tap the heart icon on any grocery item while browsing products to save it here for fast reordering.
            </p>
            <div className="mt-6">
              <Link
                to="/shops"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-sky-600/20 dark:shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <ShoppingBag size={16} /> Explore Local Groceries
              </Link>
            </div>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-8">
            {filteredAndSortedFavorites.map((product) => {
              const originalPrice = product.originalPrice || Math.round(product.price * 1.3);
              const discount =
                product.discountPercentage ||
                Math.max(8, Math.round(((originalPrice - product.price) / originalPrice) * 100));
              const cartQty = getCartQuantity(product._id);
              const isOutOfStock = product.stock <= 0 || !product.isAvailable;
              const shop = typeof product.shopId === 'object' && product.shopId !== null ? product.shopId : null;

              return (
                <div
                  key={product._id}
                  className="rounded-2xl border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] hover:border-sky-300 dark:hover:border-emerald-500/50 hover:shadow-lg transition-all p-3 flex flex-col justify-between group relative"
                >
                  {/* Remove / Heart button */}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveFavorite(e, product._id, product.name)}
                    className="absolute top-4 right-4 z-20 h-7 w-7 rounded-full bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center shadow-xs transition-all cursor-pointer"
                    title="Remove from favourites"
                  >
                    <Heart size={15} className="fill-red-500" />
                  </button>

                  {/* Product Details Link */}
                  <Link to={`/products/${product._id}`} className="block">
                    <div className="relative aspect-square rounded-xl bg-slate-50 dark:bg-[#111827] p-2 flex items-center justify-center overflow-hidden mb-2">
                      {/* Discount Badge */}
                      <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-2xs z-10">
                        {discount}% OFF
                      </span>

                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = PRODUCT_FALLBACK_IMAGE;
                          }}
                        />
                      ) : (
                        <Package size={32} className="text-slate-300 dark:text-slate-600" />
                      )}
                    </div>

                    {/* Shop Name */}
                    {shop && (
                      <p className="text-[10px] font-bold text-sky-600 dark:text-emerald-400 truncate mb-0.5">
                        {shop.shopName}
                      </p>
                    )}

                    {/* Title & Unit */}
                    <h5 className="text-xs font-black text-slate-900 dark:text-[#F9FAFB] group-hover:text-sky-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 leading-snug">
                      {product.name}
                    </h5>
                    <p className="text-[10px] text-slate-400 dark:text-[#A7B3C5] mt-0.5">
                      {product.unit} (Approx.)
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-[#A7B3C5] mt-1">
                      <Star size={11} className="text-amber-500 fill-amber-500" />
                      <span className="font-bold text-slate-800 dark:text-[#F9FAFB]">
                        {product.averageRating ? product.averageRating.toFixed(1) : '4.5'}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500">
                        ({product.totalReviews ?? 24})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-sm font-black text-slate-900 dark:text-[#F9FAFB]">
                        ₹{product.price}
                      </span>
                      {originalPrice > product.price && (
                        <span className="text-[11px] text-slate-400 dark:text-[#A7B3C5]/70 line-through font-semibold">
                          ₹{originalPrice}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Add to Cart Stepper */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-[#2D3748]">
                    {isOutOfStock ? (
                      <button
                        disabled
                        className="w-full py-1.5 rounded-xl bg-slate-100 dark:bg-[#111827] text-slate-400 dark:text-slate-500 font-bold text-[11px] cursor-not-allowed"
                      >
                        Out of Stock
                      </button>
                    ) : cartQty > 0 ? (
                      <div className="flex items-center justify-between bg-sky-600 dark:bg-emerald-600 text-white rounded-xl p-1 shadow-xs">
                        <button
                          type="button"
                          onClick={() => handleDecrement(product._id, cartQty)}
                          className="w-6 h-6 rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-emerald-700 dark:hover:bg-emerald-800 flex items-center justify-center font-bold text-xs cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-black px-2">{cartQty}</span>
                        <button
                          type="button"
                          onClick={() => handleIncrement(product._id, cartQty, product.stock)}
                          className="w-6 h-6 rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-emerald-700 dark:hover:bg-emerald-800 flex items-center justify-center font-bold text-xs cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="w-full py-1.5 rounded-xl bg-slate-50 dark:bg-[#111827] hover:bg-sky-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white text-sky-700 dark:text-emerald-400 border border-sky-200/80 dark:border-emerald-500/30 hover:border-transparent font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus size={12} /> Add
                      </button>
                    )}
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

export default Favourites;
