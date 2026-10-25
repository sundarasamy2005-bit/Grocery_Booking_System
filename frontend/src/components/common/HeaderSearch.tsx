import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Store, Package, Loader2, Plus, Check } from 'lucide-react';
import { api } from '../../services/api';
import { Product, Shop } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

const PRODUCT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';

interface SearchResults {
  products: Product[];
  shops: Shop[];
}

export const HeaderSearch = ({
  placeholder = 'Search milk, rice, vegetables, biscuits...',
  className = '',
}: {
  placeholder?: string;
  className?: string;
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({ products: [], shops: [] });
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const toast = useToastStore();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({ products: [], shops: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const [prodRes, shopRes] = await Promise.all([
          api.get('/products', { params: { search: query.trim(), limit: 6 } }),
          api.get('/shops', { params: { search: query.trim(), limit: 3 } }),
        ]);

        setResults({
          products: prodRes.data.success ? prodRes.data.data : [],
          shops: shopRes.data.success ? shopRes.data.data : [],
        });
        setIsOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    navigate(`/shops?search=${encodeURIComponent(query.trim())}`);
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Please sign in to add items to your cart');
      navigate('/login');
      return;
    }

    const success = await addToCart(product, 1);
    if (success) {
      setAddedIds((prev) => ({ ...prev, [product._id]: true }));
      toast.success(`Added ${product.name} to cart!`);
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [product._id]: false }));
      }, 1500);
    }
  };

  const handleProductClick = (product: Product) => {
    setIsOpen(false);
    navigate(`/products/${product._id}`);
  };

  const handleShopClick = (shopId: string) => {
    setIsOpen(false);
    navigate(`/shops/${shopId}`);
  };

  const hasResults = results.products.length > 0 || results.shops.length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.trim().length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2.5 bg-slate-100/80 hover:bg-slate-100 dark:bg-[#111827] dark:hover:bg-[#172033] focus:bg-white dark:focus:bg-[#172033] text-slate-800 dark:text-[#F9FAFB] text-xs sm:text-sm rounded-2xl border border-transparent dark:border-[#2D3748] focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-950/40 transition-all font-medium placeholder-slate-400 dark:placeholder-[#A7B3C5] outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults({ products: [], shops: [] });
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#A7B3C5] hover:text-slate-600 dark:hover:text-[#F9FAFB] p-0.5 rounded-full"
          >
            <X size={15} />
          </button>
        )}
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#172033] rounded-2xl shadow-2xl border border-slate-100 dark:border-[#2D3748] overflow-hidden z-50 animate-scale-in max-h-[460px] overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-slate-500 dark:text-[#A7B3C5] flex items-center justify-center gap-2 text-sm">
              <Loader2 className="animate-spin text-emerald-600 dark:text-[#34D399]" size={18} />
              <span>Searching groceries...</span>
            </div>
          ) : !hasResults ? (
            <div className="p-6 text-center text-slate-400 dark:text-[#A7B3C5]">
              <Package className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-[#2D3748]" />
              <p className="text-sm font-semibold text-slate-700 dark:text-[#F9FAFB]">No items found for "{query}"</p>
              <p className="text-xs text-slate-400 dark:text-[#A7B3C5] mt-1">Try searching for milk, rice, tomato, bread...</p>
            </div>
          ) : (
            <div className="py-2 divide-y divide-slate-100 dark:divide-[#2D3748]">
              {/* Product Matches */}
              {results.products.length > 0 && (
                <div className="p-2">
                  <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#A7B3C5] flex items-center gap-1.5">
                    <Package size={13} /> Products
                  </p>
                  <div className="space-y-1">
                    {results.products.map((product) => {
                      const shopName =
                        typeof product.shopId === 'object' && product.shopId
                          ? (product.shopId as Shop).shopName
                          : 'Local Shop';
                      const isAdded = addedIds[product._id];

                      return (
                        <div
                          key={product._id}
                          onClick={() => handleProductClick(product)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#111827] cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-11 w-11 rounded-lg bg-slate-50 dark:bg-[#111827] border border-slate-100 dark:border-[#2D3748] overflow-hidden flex items-center justify-center shrink-0">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="h-full w-full object-contain p-1 mix-blend-multiply dark:mix-blend-normal"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = PRODUCT_FALLBACK_IMAGE;
                                  }}
                                />
                              ) : (
                                <Package size={18} className="text-slate-300 dark:text-[#2D3748]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#F9FAFB] truncate group-hover:text-emerald-600 dark:group-hover:text-[#34D399] transition-colors">
                                {product.name}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-[#A7B3C5] flex items-center gap-1 truncate">
                                <span>🏪 {shopName}</span>
                                <span>•</span>
                                <span>{product.unit}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 pl-2">
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-[#F9FAFB]">
                              ₹{product.price}
                            </span>
                            <button
                              onClick={(e) => handleAddToCart(e, product)}
                              disabled={!product.isAvailable || product.stock <= 0}
                              className={`p-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer ${
                                isAdded
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 text-white active:scale-95'
                              }`}
                            >
                              {isAdded ? <Check size={14} /> : <Plus size={14} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Shop Matches */}
              {results.shops.length > 0 && (
                <div className="p-2">
                  <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#A7B3C5] flex items-center gap-1.5">
                    <Store size={13} /> Nearby Shops
                  </p>
                  <div className="space-y-1">
                    {results.shops.map((shop) => (
                      <div
                        key={shop._id}
                        onClick={() => handleShopClick(shop._id)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#111827] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            <Store size={16} />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#F9FAFB]">{shop.shopName}</p>
                            <p className="text-[11px] text-slate-400 dark:text-[#A7B3C5]">
                              📍 {shop.address}, {shop.city}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-[#34D399] hover:underline">Visit →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View All CTA */}
              <div className="p-2 bg-slate-50 dark:bg-[#111827] text-center">
                <button
                  onClick={handleSubmit}
                  className="text-xs font-bold text-emerald-600 dark:text-[#34D399] hover:underline py-1 cursor-pointer"
                >
                  View all results for "{query}" →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HeaderSearch;
