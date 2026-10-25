import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, Edit2, Trash2, Search, AlertTriangle, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { Product } from '../../types';

export const ShopProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockRiskMap, setStockRiskMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [shopRes, stockRiskRes] = await Promise.all([
        api.get('/shops/my'),
        api.get('/shop/ai/stock-risk').catch(() => ({ data: { success: false, data: null } })),
      ]);

      if (shopRes.data?.success && shopRes.data?.data) {
        const myShopId = shopRes.data.data._id;
        const prodRes = await api.get('/products', { params: { shopId: myShopId, limit: 1000 } });
        if (prodRes.data?.success) {
          setProducts(prodRes.data.data);
        }
      }

      if (stockRiskRes.data?.success && stockRiskRes.data.data?.items) {
        const map: Record<string, any> = {};
        for (const item of stockRiskRes.data.data.items) {
          if (item.product_id) {
            map[item.product_id] = item;
          }
        }
        setStockRiskMap(map);
      }
    } catch (err) {
      console.error('Failed to fetch shop products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.data?.success) {
        setProducts(products.filter((p) => p._id !== id));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const urgentCount = Object.values(stockRiskMap).filter(
    (item) => item.urgency === 'IMMEDIATE' || item.urgency === 'UPCOMING'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F9FAFB]">Manage Products</h1>
          <p className="text-xs text-gray-500 dark:text-[#A7B3C5] mt-0.5">Catalog management with AI predictive stockout warnings</p>
        </div>
        <Link
          to="/shop/products/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} className="mr-2" /> Add Product
        </Link>
      </div>

      {urgentCount > 0 && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-medium">
            <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
            <span>
              <strong>AI Inventory Alert:</strong> {urgentCount} product(s) have critical depletion risk.
            </span>
          </div>
          <Link
            to="/shop/ai-insights"
            className="flex items-center gap-1 font-bold text-rose-700 dark:text-rose-300 hover:text-rose-900 bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200/80 px-2.5 py-1 rounded-lg transition-all shrink-0"
          >
            <Sparkles size={12} />
            <span>View Replenishment Plan</span>
          </Link>
        </div>
      )}

      <div className="bg-white dark:bg-[#172033] shadow rounded-2xl border border-gray-200 dark:border-[#2D3748] overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-[#2D3748] bg-gray-50 dark:bg-[#111827]">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 dark:text-[#A7B3C5]" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-[#2D3748] rounded-xl leading-5 bg-white dark:bg-[#172033] text-gray-900 dark:text-[#F9FAFB] placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="Search your products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-[#A7B3C5]">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-[#A7B3C5]">
            <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-600 mb-3" />
            <p>No products found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2D3748]">
              <thead className="bg-gray-50 dark:bg-[#111827]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#A7B3C5] uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#A7B3C5] uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#A7B3C5] uppercase tracking-wider">
                    Stock & Depletion Risk
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#A7B3C5] uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-[#A7B3C5] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#172033] divide-y divide-gray-200 dark:divide-[#2D3748]">
                {filteredProducts.map((product) => {
                  const riskInfo = stockRiskMap[product._id];
                  const isImmediate = riskInfo?.urgency === 'IMMEDIATE' || product.stock <= 2;
                  const isUpcoming = riskInfo?.urgency === 'UPCOMING' || (product.stock > 2 && product.stock <= 5);

                  return (
                    <tr key={product._id} className="hover:bg-gray-50/50 dark:hover:bg-[#111827]/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-gray-100 dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-[#2D3748] overflow-hidden">
                            {product.imageUrl ? (
                              <img className="h-10 w-10 object-cover dark:mix-blend-normal" src={product.imageUrl} alt="" />
                            ) : (
                              <Package className="h-6 w-6 m-2 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-[#F9FAFB]">{product.name}</div>
                            <div className="text-sm text-gray-500 dark:text-[#A7B3C5]">{product.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-[#F9FAFB] font-medium">
                        ₹{product.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isImmediate ? 'text-red-600 dark:text-red-400' : isUpcoming ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-[#F9FAFB]'}`}>
                            {product.stock} units
                          </span>
                          {isImmediate && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300">
                              <AlertTriangle size={10} />
                              Restock {riskInfo?.recommended_restock ? `+${riskInfo.recommended_restock}` : 'Urgent'}
                            </span>
                          )}
                          {!isImmediate && isUpcoming && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                              Low Stock {riskInfo?.recommended_restock ? `(+${riskInfo.recommended_restock})` : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.isAvailable ? 'bg-green-100 dark:bg-emerald-950/60 text-green-800 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {product.isAvailable ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/shop/products/${product._id}/edit`} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 mr-4">
                          <Edit2 size={18} className="inline" />
                        </Link>
                        <button onClick={() => handleDelete(product._id)} className="text-red-600 dark:text-red-400 hover:text-red-800 cursor-pointer">
                          <Trash2 size={18} className="inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopProducts;
