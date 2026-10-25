import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { Category } from '../../types';

const productSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  stock: z.coerce.number().min(0, 'Stock cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  isAvailable: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const ProductForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isAvailable: true,
      unit: 'piece',
      price: 0,
      stock: 0
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await api.get('/categories');
        if (catRes.data.success) {
          setCategories(catRes.data.data);
        }

        if (isEditMode) {
          const prodRes = await api.get(`/products/${id}`);
          if (prodRes.data.success) {
            const prod = prodRes.data.data;
            reset({
              name: prod.name,
              categoryId: typeof prod.categoryId === 'object' ? prod.categoryId._id : prod.categoryId,
              description: prod.description || '',
              price: prod.price,
              stock: prod.stock,
              unit: prod.unit,
              isAvailable: prod.isAvailable,
            });
            if (prod.imageUrl) {
              setImagePreview(prod.imageUrl);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load form data', err);
        alert('Failed to load data');
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);
      setFormError(null);
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (isEditMode) {
        await api.put(`/products/${id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      
      navigate('/shop/products');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save product';
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-12 text-center text-gray-500">Loading form...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/shop/products')} className="p-2 bg-white dark:bg-[#172033] border border-gray-200 dark:border-[#2D3748] text-gray-700 dark:text-[#F9FAFB] rounded-xl hover:bg-gray-50 dark:hover:bg-[#111827] cursor-pointer">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F9FAFB]">{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
      </div>

      <div className="bg-white dark:bg-[#172033] shadow rounded-2xl border border-gray-200 dark:border-[#2D3748] p-6">
        {formError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-sm text-red-700 dark:text-red-300 flex items-start gap-2 animate-scale-in">
            <span className="shrink-0 text-red-500 font-bold">⚠️</span>
            <div>
              <p className="font-bold">Error saving product</p>
              <p className="text-xs mt-0.5">{formError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-[#F9FAFB]">Product Name</label>
              <input {...register('name')} type="text" className="mt-1 block w-full border border-gray-300 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] rounded-xl shadow-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm" />
              {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#F9FAFB]">Category</label>
              <select {...register('categoryId')} className="mt-1 block w-full border border-gray-300 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] rounded-xl shadow-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm">
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.categoryId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#F9FAFB]">Unit (e.g. kg, piece, 500g)</label>
              <input {...register('unit')} type="text" className="mt-1 block w-full border border-gray-300 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] rounded-xl shadow-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm" />
              {errors.unit && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.unit.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#F9FAFB]">Price (₹)</label>
              <input {...register('price')} type="number" step="0.01" className="mt-1 block w-full border border-gray-300 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] rounded-xl shadow-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm" />
              {errors.price && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.price.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#F9FAFB]">Stock Quantity</label>
              <input {...register('stock')} type="number" className="mt-1 block w-full border border-gray-300 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] rounded-xl shadow-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm" />
              {errors.stock && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.stock.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-[#F9FAFB]">Description</label>
              <textarea {...register('description')} rows={3} className="mt-1 block w-full border border-gray-300 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] rounded-xl shadow-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-[#F9FAFB] mb-2">Product Image</label>
              <div className="flex items-center gap-6">
                <div className="h-32 w-32 bg-gray-100 dark:bg-[#111827] rounded-xl border border-gray-300 dark:border-[#2D3748] overflow-hidden flex items-center justify-center flex-shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover dark:mix-blend-normal" />
                  ) : (
                    <span className="text-gray-400 dark:text-[#A7B3C5] text-xs">No image</span>
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-[#2D3748] shadow-xs text-sm font-medium rounded-xl text-gray-700 dark:text-[#F9FAFB] bg-white dark:bg-[#111827] hover:bg-gray-50 dark:hover:bg-[#172033] focus-within:ring-2 focus-within:ring-emerald-500">
                    <Upload size={16} className="mr-2" />
                    Upload Image
                    <input type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                  </label>
                  <p className="mt-2 text-xs text-gray-500 dark:text-[#A7B3C5]">JPG, PNG or WEBP up to 5MB.</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" {...register('isAvailable')} className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-[#2D3748] rounded" />
                <span className="ml-2 block text-sm text-gray-900 dark:text-[#F9FAFB]">Product is active and available for purchase</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-[#2D3748] flex justify-end">
            <button type="submit" disabled={loading} className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-xs text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer">
              {loading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Saving...</> : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
