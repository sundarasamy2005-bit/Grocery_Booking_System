import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, MapPin, Store, Search, Phone, Clock, ChevronRight, Plus, Minus, Tag, Package } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { api } from '../../services/api';
import { Shop, Product, Category } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

const PRODUCT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';

const ProductCard = ({
  product, onAdd, cartQty,
}: { product: Product; onAdd: () => void; cartQty: number }) => {
  const outOfStock = product.stock <= 0 || !product.isAvailable;
  return (
    <div className={`card flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] ${outOfStock ? 'opacity-60' : ''}`}>
      <Link to={`/products/${product._id}`} className="group block">
        <div className="relative h-36 bg-slate-50 dark:bg-[#111827] rounded-t-2xl overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain p-2 mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = PRODUCT_FALLBACK_IMAGE;
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package size={32} className="text-gray-300 dark:text-slate-600" />
            </div>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <div className="absolute top-2 left-2 badge-red text-[10px] px-1.5 py-0.5">
              Only {product.stock} left!
            </div>
          )}
          {outOfStock && (
            <div className="absolute inset-0 bg-white/80 dark:bg-[#111827]/85 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-400 dark:text-[#A7B3C5] uppercase tracking-wider">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="p-3 pb-0">
          <h4 className="text-sm font-bold text-gray-900 dark:text-[#F9FAFB] group-hover:text-primary-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-tight">{product.name}</h4>
          <p className="text-xs text-gray-400 dark:text-[#A7B3C5] mt-0.5">{product.unit}</p>
        </div>
      </Link>

      <div className="p-3 pt-2 flex flex-col flex-grow justify-end">
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-base font-extrabold text-gray-900 dark:text-[#F9FAFB]">₹{product.price}</span>
          {!outOfStock && (
            cartQty > 0 ? (
              <span className="flex items-center gap-1 bg-primary-600 dark:bg-emerald-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl">
                ✓ {cartQty} in cart
              </span>
            ) : (
              <button
                onClick={onAdd}
                className="flex items-center gap-1 bg-primary-600 hover:bg-primary-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all duration-200 hover:shadow-md active:scale-95 cursor-pointer"
              >
                <Plus size={13} /> Add
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

const ShopDetails = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const { isAuthenticated } = useAuthStore();
  const { addToCart, cart } = useCartStore();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [shopRes, catRes, prodRes] = await Promise.all([
          api.get(`/shops/${shopId}`),
          api.get('/categories'),
          api.get('/products', { params: { shopId, limit: 250 } }),
        ]);
        if (shopRes.data.success) setShop(shopRes.data.data);
        if (catRes.data.success) setCategories(catRes.data.data);
        if (prodRes.data.success) setProducts(prodRes.data.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    if (shopId) fetchAll();
  }, [shopId]);

  const cartQtyFor = (productId: string) =>
    cart?.items.find(i => i.productId._id === productId)?.quantity ?? 0;

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = activeCategory
      ? (typeof p.categoryId === 'string' ? p.categoryId : p.categoryId._id) === activeCategory
      : true;
    return matchSearch && matchCat;
  });

  const handleAdd = async (product: Product) => {
    if (!isAuthenticated) { alert('Please login to add items to cart'); return; }
    await addToCart(product, 1);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="page-container py-8">
          <div className="h-48 skeleton rounded-2xl mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="h-36 skeleton rounded-t-2xl" />
                <div className="p-3 space-y-2">
                  <div className="h-4 skeleton rounded w-3/4" />
                  <div className="h-3 skeleton rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!shop) {
    return (
      <MainLayout>
        <div className="page-container py-20 text-center">
          <Store size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700">Shop not found</h2>
          <Link to="/shops" className="btn-primary mt-4 px-6 py-2.5 rounded-xl inline-flex">Back to Shops</Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Shop Hero Banner */}
      <div className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white overflow-hidden">
        {shop.shopImage && (
          <img src={shop.shopImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay" />
        )}
        <div className="relative page-container py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="h-24 w-24 md:h-28 md:w-28 rounded-2xl bg-white/15 backdrop-blur border-2 border-white/30 overflow-hidden flex-shrink-0 shadow-xl">
              {shop.shopImage ? (
                <img src={shop.shopImage} alt={shop.shopName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store size={36} className="text-white/60" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                {shop.deliveryAvailable && <span className="badge-green text-xs">🚚 Delivery Available</span>}
                {shop.pickupAvailable && <span className="badge-blue text-xs">🛍 Pickup Available</span>}
              </div>
              <h1 className="text-3xl font-extrabold">{shop.shopName}</h1>
              {shop.announcement && (
                <div className="mt-2.5 p-2.5 bg-amber-400/20 border border-amber-300/40 rounded-xl text-amber-100 text-xs font-semibold flex items-center gap-2 max-w-xl">
                  <span>📢 {shop.announcement}</span>
                </div>
              )}
              {shop.description && <p className="mt-2 text-blue-100 text-sm max-w-xl">{shop.description}</p>}

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-100">
                <span className="flex items-center gap-1.5"><MapPin size={14} />{shop.address}, {shop.city}, {shop.state}</span>
                {shop.openingTime && shop.closingTime && (
                  <span className="flex items-center gap-1.5"><Clock size={14} />{shop.openingTime} - {shop.closingTime}</span>
                )}
                {shop.phone && <span className="flex items-center gap-1.5"><Phone size={14} />{shop.phone}</span>}
                <span className="flex items-center gap-1.5"><Tag size={14} />Min. order ₹{shop.minimumOrderAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="page-container py-8 flex flex-col lg:flex-row gap-6">
        {/* Sidebar Categories */}
        <aside className="w-full lg:w-52 flex-shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-[#A7B3C5] mb-3 px-2">Categories</h3>
          <nav className="space-y-0.5">
            <button
              onClick={() => setActiveCategory('')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeCategory === '' ? 'bg-primary-600 dark:bg-emerald-600 text-white shadow-sm' : 'text-gray-600 dark:text-[#A7B3C5] hover:bg-gray-100 dark:hover:bg-[#172033]'
              }`}
            >
              All Products ({products.length})
            </button>
            {categories.map(cat => {
              const count = products.filter(p =>
                (typeof p.categoryId === 'string' ? p.categoryId : p.categoryId._id) === cat._id
              ).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-between cursor-pointer ${
                    activeCategory === cat._id ? 'bg-primary-600 dark:bg-emerald-600 text-white shadow-sm' : 'text-gray-600 dark:text-[#A7B3C5] hover:bg-gray-100 dark:hover:bg-[#172033]'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCategory === cat._id ? 'bg-white/20' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-[#F9FAFB]'}`}>{count}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#A7B3C5]" />
            <input
              type="text"
              className="input-field pl-10"
              placeholder="Search products in this shop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="card p-12 text-center animate-scale-in border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033]">
              <Package size={40} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
              <p className="text-gray-500 dark:text-[#A7B3C5] font-medium">No products found</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Try a different search term or category</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 dark:text-[#A7B3C5] mb-4">{filtered.length} products found</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtered.map((p, i) => (
                  <div key={p._id} className="animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <ProductCard product={p} onAdd={() => handleAdd(p)} cartQty={cartQtyFor(p._id)} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ShopDetails;
