import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Trash2, Plus, Loader2, Search, X, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Category } from '../../types';
import { useToastStore } from '../../store/toastStore';

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});
type CategoryFormData = z.infer<typeof categorySchema>;

const CATEGORY_EMOJIS: Record<string, string> = {
  Fruits: '🍎',
  Vegetables: '🥦',
  Dairy: '🥛',
  'Rice & Grains': '🌾',
  Snacks: '🍪',
  Beverages: '🧃',
  Bakery: '🍞',
  'Personal Care': '🧴',
  Household: '🏠',
};

export const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const toast = useToastStore();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load categories', err);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setSaving(true);
      const res = await api.post('/categories', data);
      if (res.data.success) {
        setCategories((prev) => [res.data.data, ...prev]);
        setShowModal(false);
        reset();
        toast.success(`Category "${data.name}" created successfully!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete the category "${name}"? Products inside may lose category indexing.`)) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      toast.success(`Category "${name}" removed`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Category Taxonomy</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage global grocery aisles, classifications, and system taxonomies ({categories.length} aisles)
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="card p-3.5 border border-slate-100 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 text-xs py-2 rounded-xl w-full"
          />
        </div>
        <span className="text-xs font-bold text-slate-400 hidden sm:block">
          {filtered.length} categories active
        </span>
      </div>

      {/* Grid of Categories */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading categories...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-xs text-slate-400">
          No categories found. Click "Add Category" above to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => (
            <div
              key={cat._id}
              className="card p-4 border border-slate-100 hover:border-sky-200 hover:shadow-md transition-all flex items-start justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                  {CATEGORY_EMOJIS[cat.name] || '🛒'}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    /{cat.slug || cat.name.toLowerCase()}
                  </p>
                  {cat.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description}</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(cat._id, cat.name)}
                className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors shrink-0"
                title="Delete Category"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl gradient-primary text-white flex items-center justify-center font-bold">
                  <Package size={16} />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Add New Grocery Category</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="e.g. Organic Greens, Bakery, Dairy..."
                  className="input-field text-xs py-2.5 rounded-xl"
                />
                {errors.name && (
                  <p className="text-xs text-rose-600 mt-1">⚠ {errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Short description of items included in this aisle..."
                  className="input-field text-xs py-2 rounded-xl resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary py-2 px-4 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary py-2 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  <span>{saving ? 'Creating...' : 'Save Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
