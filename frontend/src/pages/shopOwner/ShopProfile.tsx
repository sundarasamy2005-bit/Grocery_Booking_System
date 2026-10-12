import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Upload,
  Loader2,
  Store,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  Truck,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Megaphone,
} from 'lucide-react';
import { api } from '../../services/api';
import ShopLocationMap, { GeocodedAddress } from '../../components/shop/ShopLocationMap';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const shopSchema = z.object({
  shopName: z.string().min(2, 'Shop name is required (min 2 characters)'),
  description: z.string().optional(),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  email: z.string().email('Please enter a valid email address'),
  address: z.string().min(3, 'Address line is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(4, 'Postal code is required'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  deliveryAvailable: z.boolean(),
  pickupAvailable: z.boolean(),
  minimumOrderAmount: z.coerce.number().min(0, 'Cannot be negative'),
  deliveryFee: z.coerce.number().min(0, 'Cannot be negative').optional(),
  freeDeliveryThreshold: z.coerce.number().min(0, 'Cannot be negative').optional(),
  estimatedDeliveryTime: z.coerce.number().min(5, 'Minimum 5 minutes').optional(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  announcement: z.string().optional(),
  isOpen: z.boolean().optional(),
});

type ShopFormValues = z.infer<typeof shopSchema>;

const ShopProfile = () => {
  const [shopId, setShopId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Additional shop metadata
  const [isApproved, setIsApproved] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [operatingDays, setOperatingDays] = useState<string[]>(ALL_DAYS);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      shopName: '',
      description: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      latitude: 10.6585,
      longitude: 77.0094,
      deliveryAvailable: true,
      pickupAvailable: true,
      minimumOrderAmount: 0,
      deliveryFee: 30,
      freeDeliveryThreshold: 500,
      estimatedDeliveryTime: 30,
      openingTime: '08:00',
      closingTime: '21:00',
      announcement: '',
      isOpen: true,
    },
  });

  const watchedLat = watch('latitude') ?? 10.6585;
  const watchedLng = watch('longitude') ?? 77.0094;
  const watchedIsOpen = watch('isOpen') ?? true;
  const watchedDeliveryAvailable = watch('deliveryAvailable') ?? true;
  const watchedPickupAvailable = watch('pickupAvailable') ?? true;

  // Load current shop profile
  useEffect(() => {
    let isMounted = true;
    const fetchShop = async () => {
      try {
        setInitialLoading(true);
        const res = await api.get('/shops/my');
        if (isMounted && res.data?.success && res.data.data) {
          const shop = res.data.data;
          setShopId(shop._id);
          setIsApproved(shop.isApproved ?? true);
          setIsActive(shop.isActive ?? true);
          if (Array.isArray(shop.operatingDays) && shop.operatingDays.length > 0) {
            setOperatingDays(shop.operatingDays);
          }

          reset({
            shopName: shop.shopName || '',
            description: shop.description || '',
            phone: shop.phone || '',
            email: shop.email || '',
            address: shop.address || '',
            city: shop.city || '',
            state: shop.state || '',
            postalCode: shop.postalCode || '',
            latitude: typeof shop.latitude === 'number' ? shop.latitude : 10.6585,
            longitude: typeof shop.longitude === 'number' ? shop.longitude : 77.0094,
            deliveryAvailable: shop.deliveryAvailable ?? true,
            pickupAvailable: shop.pickupAvailable ?? true,
            minimumOrderAmount: shop.minimumOrderAmount ?? 0,
            deliveryFee: shop.deliveryFee ?? 30,
            freeDeliveryThreshold: shop.freeDeliveryThreshold ?? 500,
            estimatedDeliveryTime: shop.estimatedDeliveryTime ?? 30,
            openingTime: shop.openingTime || '08:00',
            closingTime: shop.closingTime || '21:00',
            announcement: shop.announcement || '',
            isOpen: shop.isOpen ?? true,
          });

          if (shop.shopImage) setImagePreview(shop.shopImage);
        }
      } catch (err: any) {
        console.warn('Notice loading shop profile:', err?.response?.data?.message || err.message);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };

    fetchShop();
    return () => {
      isMounted = false;
    };
  }, [reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Synchronize map selection with React Hook Form
  const handleMapLocationChange = (
    coords: { latitude: number; longitude: number },
    addressData?: GeocodedAddress
  ) => {
    setValue('latitude', coords.latitude, { shouldValidate: true, shouldDirty: true });
    setValue('longitude', coords.longitude, { shouldValidate: true, shouldDirty: true });

    if (addressData) {
      if (addressData.address) setValue('address', addressData.address, { shouldValidate: true, shouldDirty: true });
      if (addressData.city) setValue('city', addressData.city, { shouldValidate: true, shouldDirty: true });
      if (addressData.state) setValue('state', addressData.state, { shouldValidate: true, shouldDirty: true });
      if (addressData.postalCode) setValue('postalCode', addressData.postalCode, { shouldValidate: true, shouldDirty: true });
    }
  };

  const toggleDay = (day: string) => {
    setOperatingDays((prev) =>
      prev.includes(day)
        ? prev.length > 1
          ? prev.filter((d) => d !== day)
          : prev
        : [...prev, day]
    );
  };

  const setAllDays = () => setOperatingDays(ALL_DAYS);
  const setWeekdaysOnly = () => setOperatingDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  const onSubmit = async (data: ShopFormValues) => {
    try {
      setLoading(true);
      setFeedback(null);

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Operating Days array
      formData.append('operatingDays', JSON.stringify(operatingDays));

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (shopId) {
        const res = await api.put(`/shops/${shopId}`, formData);
        if (res.data?.success) {
          setFeedback({
            type: 'success',
            message: 'Shop profile & real-world map coordinates updated successfully!',
          });
          if (res.data.data?.shopImage) {
            setImagePreview(res.data.data.shopImage);
          }
          setImageFile(null);
        }
      } else {
        const res = await api.post('/shops', formData);
        if (res.data?.success) {
          if (res.data.data?._id) {
            setShopId(res.data.data._id);
          }
          if (res.data.data?.shopImage) {
            setImagePreview(res.data.data.shopImage);
          }
          setImageFile(null);
          setFeedback({
            type: 'success',
            message: 'Shop profile created and saved with exact coordinates!',
          });
        }
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to save shop profile';
      setFeedback({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="text-sm font-semibold text-gray-700">Loading your store details & map configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header with Store Status Pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Store Profile & Location</h1>
            {isApproved ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck size={13} className="text-emerald-600" />
                Verified Store
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Pending Approval
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Configure your storefront branding, real-world OpenStreetMap GPS location, operating timings, and delivery rules.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Live Store Open/Closed Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-black border transition-all ${
              watchedIsOpen
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                watchedIsOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>{watchedIsOpen ? 'Open for Orders' : 'Store Closed'}</span>
          </div>

          {/* View Public Storefront Link */}
          {shopId && (
            <Link
              to={`/shops/${shopId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors border border-gray-200 shadow-2xs"
            >
              <span>Public Storefront</span>
              <ExternalLink size={12} className="text-gray-500" />
            </Link>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all animate-scale-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <span className="text-sm font-semibold">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Section 1: Storefront Identity & Banner ── */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Store size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Store Identity & Branding</h2>
              <p className="text-xs text-gray-500">Your store's public appearance and contact info</p>
            </div>
          </div>

          {/* Banner Upload */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-2">
            <div className="relative h-32 w-48 sm:w-56 bg-slate-100 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center flex-shrink-0 group">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Shop Banner" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="cursor-pointer p-2 bg-white text-gray-800 rounded-xl shadow text-xs font-bold hover:bg-gray-100">
                      Change
                      <input type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-2 bg-rose-600 text-white rounded-xl shadow text-xs font-bold hover:bg-rose-700"
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-3">
                  <Store className="text-gray-400 mx-auto mb-1" size={32} />
                  <span className="text-[11px] text-gray-400 font-medium">No banner uploaded</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-gray-900">Storefront Cover Image</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-md">
                Upload a clear photo of your grocery storefront or entrance. This helps nearby customers recognize your shop. Supports JPG, PNG, WEBP up to 5MB.
              </p>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 shadow-2xs text-xs font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <Upload size={14} className="text-emerald-600" />
                <span>{imagePreview ? 'Replace Photo' : 'Upload Storefront Photo'}</span>
                <input type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Shop Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('shopName')}
                type="text"
                placeholder="e.g. Pollachi Fresh Organics"
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              {errors.shopName && <p className="mt-1 text-xs text-red-600 font-medium">{errors.shopName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                {...register('phone')}
                type="tel"
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600 font-medium">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="owner@yourshop.com"
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Special Announcement Banner (Optional)
              </label>
              <div className="relative">
                <input
                  {...register('announcement')}
                  type="text"
                  placeholder="e.g. Fresh organic vegetables arrived this morning! Flat 10% off."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/60 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                <Megaphone size={15} className="absolute left-3 top-3 text-emerald-600" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Store Description</label>
              <textarea
                {...register('description')}
                rows={2}
                placeholder="Provide a brief summary of what you specialize in, quality guarantees, organic sources, etc."
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── Section 2: Real-World Store Location & Interactive Map ── */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <MapPin size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Real-World Map Location & Address</h2>
                <p className="text-xs text-gray-500">
                  Pinpoint your exact physical grocery storefront on the live OpenStreetMap
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              ⚡ OpenStreetMap & GPS Integrated
            </span>
          </div>

          {/* Interactive Map Component */}
          <ShopLocationMap
            latitude={watchedLat}
            longitude={watchedLng}
            onChange={handleMapLocationChange}
            deliveryRadiusKm={5}
          />

          {/* Form Address Fields (Auto-filled & manually fine-tunable) */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Store Street & Postal Details
              </h3>
              <span className="text-[11px] text-gray-400 font-medium">
                Auto-updated when you search or click the map
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Street / Door No / Landmark <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('address')}
                  type="text"
                  placeholder="e.g. 12/A, Gandhi Market Road, Near Old Bus Stand"
                  className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                {errors.address && <p className="mt-1 text-xs text-red-600 font-medium">{errors.address.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  City / Town <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('city')}
                  type="text"
                  placeholder="e.g. Pollachi"
                  className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                {errors.city && <p className="mt-1 text-xs text-red-600 font-medium">{errors.city.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('state')}
                  type="text"
                  placeholder="e.g. Tamil Nadu"
                  className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                {errors.state && <p className="mt-1 text-xs text-red-600 font-medium">{errors.state.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Postal / PIN Code <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('postalCode')}
                  type="text"
                  placeholder="e.g. 642001"
                  className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                {errors.postalCode && <p className="mt-1 text-xs text-red-600 font-medium">{errors.postalCode.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Latitude (GPS Coordinate)
                </label>
                <input
                  {...register('latitude')}
                  type="number"
                  step="0.000001"
                  className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Longitude (GPS Coordinate)
                </label>
                <input
                  {...register('longitude')}
                  type="number"
                  step="0.000001"
                  className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: Operating Timings & Schedule ── */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Clock size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Operating Timings & Working Days</h2>
                <p className="text-xs text-gray-500">Configure your daily working hours and active shopping days</p>
              </div>
            </div>

            {/* Live Store Status Switch */}
            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-gray-700">Currently Open:</span>
              <input
                type="checkbox"
                {...register('isOpen')}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Daily Opening Time</label>
              <input
                {...register('openingTime')}
                type="time"
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Daily Closing Time</label>
              <input
                {...register('closingTime')}
                type="time"
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            {/* Operating Days Pills */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700">Operating Days of the Week</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={setAllDays}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    All 7 Days
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={setWeekdaysOnly}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    Mon – Fri
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => {
                  const isSelected = operatingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                      <span>{day}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 4: Delivery & Ordering Rules ── */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Truck size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Delivery & Ordering Rules</h2>
              <p className="text-xs text-gray-500">
                Set minimum order constraints, delivery fee thresholds, and fulfillment modes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fulfillment Toggles */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">Home Delivery</p>
                <p className="text-[11px] text-gray-500">Allow customers to order to doorstep</p>
              </div>
              <input
                type="checkbox"
                {...register('deliveryAvailable')}
                className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
              />
            </div>

            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">Store Pickup</p>
                <p className="text-[11px] text-gray-500">Allow customers to collect in-store</p>
              </div>
              <input
                type="checkbox"
                {...register('pickupAvailable')}
                className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Minimum Order Amount (₹)
              </label>
              <input
                {...register('minimumOrderAmount')}
                type="number"
                min="0"
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Standard Delivery Fee (₹)</label>
              <input
                {...register('deliveryFee')}
                type="number"
                min="0"
                placeholder="30"
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Free Delivery Above (₹)
              </label>
              <input
                {...register('freeDeliveryThreshold')}
                type="number"
                min="0"
                placeholder="500"
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Estimated Delivery Time (Minutes)
              </label>
              <input
                {...register('estimatedDeliveryTime')}
                type="number"
                min="5"
                placeholder="30"
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── Sticky Save Action Bar ── */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-md flex items-center justify-between gap-4 sticky bottom-4 z-30">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Sparkles size={16} className="text-emerald-600" />
            <span className="hidden sm:inline">Changes will be saved to your physical shop profile and live GPS map.</span>
            <span className="sm:hidden">Ready to update your store profile.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                <span>Saving Store Profile...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Save Store Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShopProfile;
