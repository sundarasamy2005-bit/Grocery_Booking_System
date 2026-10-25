import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle2,
  Truck,
  ShieldCheck,
  RotateCcw,
  Store,
  ChevronRight,
  Share2,
  Heart,
  Package,
  PackageX,
  AlertTriangle,
  Flame,
  ThumbsUp,
  Camera,
  X,
  Filter,
  ArrowUpDown,
  Sparkles,
  ChevronLeft,
  ExternalLink,
  Info,
  Clock,
  MapPin,
  Check,
  Trash2,
  Scale,
} from 'lucide-react';

import MainLayout from '../../components/layout/MainLayout';

const PRODUCT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';
import { api, reviewApi } from '../../services/api';
import { Product, Shop, Category, Review, ReviewStats, UserReviewState } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { toast } from '../../store/toastStore';
import { useFavoriteStore } from '../../store/favoriteStore';

const STORAGE_KEY_RECENTLY_VIEWED = 'localgrocery_recently_viewed';

export interface ProductVariant {
  id: string;
  label: string;
  shortLabel: string;
  price: number;
  originalPrice: number;
  badge?: string;
  isDefault?: boolean;
}

export function getVariantsForProduct(product: Product): ProductVariant[] {
  const basePrice = product.price || 50;
  const baseOriginalPrice = product.originalPrice || Math.round(basePrice * 1.25);
  const rawUnit = (product.unit || '').toLowerCase().trim();

  const calcP = (multiplier: number) => Math.max(1, Math.round(basePrice * multiplier));
  const calcOP = (multiplier: number, p: number) => Math.max(p, Math.round(baseOriginalPrice * multiplier));

  // 1. Dozen
  if (rawUnit.includes('dozen')) {
    return [
      { id: 'half_dozen', label: 'Half Dozen (6 pcs)', shortLabel: '6 pcs', price: calcP(0.5), originalPrice: calcOP(0.5, calcP(0.5)), badge: 'Regular' },
      { id: 'one_dozen', label: '1 Dozen (12 pcs)', shortLabel: '12 pcs', price: basePrice, originalPrice: baseOriginalPrice, badge: 'Popular', isDefault: true },
      { id: 'two_dozen', label: '2 Dozen (24 pcs)', shortLabel: '24 pcs', price: calcP(1.95), originalPrice: calcOP(2.0, calcP(1.95)), badge: 'Value Pack' },
    ];
  }

  // 2. Volume based (ml, litre, bottle, can, tin, tetra)
  if (rawUnit.includes('ml') || rawUnit.includes('l ') || rawUnit.endsWith('l') || rawUnit.includes('litre') || rawUnit.includes('liter')) {
    let baseMl = 1000;
    const matchMl = rawUnit.match(/(\d+)\s*ml/);
    const matchL = rawUnit.match(/(\d+(?:\.\d+)?)\s*l/);
    if (matchMl) baseMl = parseInt(matchMl[1], 10) || 500;
    else if (matchL) baseMl = Math.round(parseFloat(matchL[1]) * 1000) || 1000;

    const sizes = [
      { ml: 200, label: '200 ml', shortLabel: '200 ml', badge: baseMl === 200 ? 'Default' : undefined },
      { ml: 500, label: '500 ml', shortLabel: '500 ml', badge: baseMl === 500 ? 'Popular' : undefined },
      { ml: 1000, label: '1 Litre', shortLabel: '1 L', badge: baseMl === 1000 ? 'Standard' : undefined },
      { ml: 2000, label: '2 Litres', shortLabel: '2 L', badge: 'Value Pack' },
      { ml: 5000, label: '5 Litres Can', shortLabel: '5 L', badge: 'Mega Saver' },
    ];

    return sizes.map((s) => {
      const mult = s.ml / baseMl;
      const price = calcP(mult);
      return {
        id: `vol_${s.ml}`,
        label: s.label,
        shortLabel: s.shortLabel,
        price,
        originalPrice: calcOP(mult, price),
        badge: s.badge,
        isDefault: Math.abs(s.ml - baseMl) < 50,
      };
    });
  }

  // 3. Grams based (contains 'g' or 'gram', not 'kg')
  const isOnlyGrams = /(^|\s)\d+\s*(g|gm|gram|grams)($|\s|\))/.test(rawUnit) && !rawUnit.includes('kg');
  if (isOnlyGrams) {
    let baseG = 250;
    const matchG = rawUnit.match(/(\d+)\s*(?:g|gm|gram)/);
    if (matchG) baseG = parseInt(matchG[1], 10) || 250;

    const sizes = [
      { g: 50, label: '50 g', shortLabel: '50g', badge: baseG === 50 ? 'Sample' : undefined },
      { g: 100, label: '100 g', shortLabel: '100g', badge: baseG === 100 ? 'Compact' : undefined },
      { g: 200, label: '200 g', shortLabel: '200g', badge: baseG === 200 ? 'Popular' : undefined },
      { g: 500, label: '500 g', shortLabel: '500g', badge: baseG === 500 ? 'Value' : undefined },
      { g: 1000, label: '1 kg (1000g)', shortLabel: '1 kg', badge: 'Mega Saver' },
    ];

    return sizes.map((s) => {
      const mult = s.g / baseG;
      const price = calcP(mult);
      return {
        id: `wt_${s.g}`,
        label: s.label,
        shortLabel: s.shortLabel,
        price,
        originalPrice: calcOP(mult, price),
        badge: s.badge,
        isDefault: Math.abs(s.g - baseG) < 20,
      };
    });
  }

  // 4. Weight based (kg, or groceries/fruits/vegetables/meat)
  const isKg = rawUnit.includes('kg') || rawUnit === 'kg';
  if (isKg || (!rawUnit.includes('piece') && !rawUnit.includes('pack') && !rawUnit.includes('box') && !rawUnit.includes('roll') && !rawUnit.includes('bunch') && !rawUnit.includes('wicks') && !rawUnit.includes('pants'))) {
    let baseKg = 1.0;
    const matchKg = rawUnit.match(/(\d+(?:\.\d+)?)\s*kg/);
    if (matchKg) baseKg = parseFloat(matchKg[1]) || 1.0;

    const sizes = [
      { g: 100, label: '100 g', shortLabel: '100g', badge: 'Trial' },
      { g: 200, label: '200 g', shortLabel: '200g', badge: 'Compact' },
      { g: 500, label: '500 g', shortLabel: '500g', badge: 'Popular' },
      { g: 1000, label: '1 kg (1000g)', shortLabel: '1 kg', badge: baseKg === 1 ? 'Standard' : undefined },
      { g: 2000, label: '2 kg', shortLabel: '2 kg', badge: baseKg === 2 ? 'Standard' : 'Value Pack' },
      { g: 5000, label: '5 kg Family Pack', shortLabel: '5 kg', badge: 'Super Saver' },
    ];

    return sizes.map((s) => {
      const mult = (s.g / 1000) / baseKg;
      const price = calcP(mult);
      return {
        id: `kg_${s.g}`,
        label: s.label,
        shortLabel: s.shortLabel,
        price,
        originalPrice: calcOP(mult, price),
        badge: s.badge,
        isDefault: Math.abs((s.g / 1000) - baseKg) < 0.1,
      };
    });
  }

  // 5. Piece / Pack / Box based
  return [
    { id: 'pc_1', label: '1 Unit / Piece', shortLabel: '1 pc', price: basePrice, originalPrice: baseOriginalPrice, badge: 'Single', isDefault: true },
    { id: 'pc_2', label: 'Pack of 2 (Twin)', shortLabel: '2 pcs', price: calcP(1.95), originalPrice: calcOP(2.0, calcP(1.95)), badge: 'Save 5%' },
    { id: 'pc_4', label: 'Pack of 4', shortLabel: '4 pcs', price: calcP(3.8), originalPrice: calcOP(4.0, calcP(3.8)), badge: 'Save 10%' },
    { id: 'pc_6', label: 'Box of 6 (Family)', shortLabel: '6 pcs', price: calcP(5.5), originalPrice: calcOP(6.0, calcP(5.5)), badge: 'Best Value' },
  ];
}

export const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { cart, addToCart, updateQuantity, removeItem } = useCartStore();

  // Primary product state
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [userReviewState, setUserReviewState] = useState<UserReviewState | null>(null);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [reviewSort, setReviewSort] = useState<'recent' | 'helpful' | 'highest' | 'lowest'>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterWithPhotos, setFilterWithPhotos] = useState(false);

  // Review submission modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewFormRating, setReviewFormRating] = useState(5);
  const [reviewFormHoverRating, setReviewFormHoverRating] = useState(0);
  const [reviewFormTitle, setReviewFormTitle] = useState('');
  const [reviewFormComment, setReviewFormComment] = useState('');
  const [reviewFormPhotos, setReviewFormPhotos] = useState<File[]>([]);
  const [reviewPhotoPreviews, setReviewPhotoPreviews] = useState<string[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Recommendations state
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // Favourites state from Zustand store
  const { isFavorite, toggleFavorite } = useFavoriteStore();
  const isFav = product ? isFavorite(product._id) : false;

  // Active tab for product info
  const [activeTab, setActiveTab] = useState<'details' | 'freshness' | 'reviews'>('details');

  // Compute quantity in cart
  const cartItem = useMemo(() => {
    if (!product || !cart?.items) return null;
    return cart.items.find((item) => {
      const pid = typeof item.productId === 'object' ? item.productId._id : item.productId;
      return pid === product._id;
    });
  }, [product, cart?.items]);

  const cartQty = cartItem?.quantity || 0;
  const isOutOfStock = product ? product.stock <= 0 || !product.isAvailable : false;

  // Weight & Pack size variants
  const variants = useMemo(() => {
    if (!product) return [];
    return getVariantsForProduct(product);
  }, [product]);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Sync selected variant when variants load/change
  useEffect(() => {
    if (variants.length > 0) {
      const defaultVar = variants.find((v) => v.isDefault) || variants[0];
      setSelectedVariant(defaultVar);
    } else {
      setSelectedVariant(null);
    }
  }, [variants]);

  // Gallery images array
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const list: string[] = [];
    if (product.imageUrl) list.push(product.imageUrl);
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list.length > 0 ? list : ['/placeholder-grocery.png'];
  }, [product]);

  // Load product details
  const fetchProductData = useCallback(async (productId: string) => {
    try {
      setIsLoading(true);
      setProductError(null);
      const res = await api.get(`/products/${productId}`);
      if (res.data.success && res.data.data) {
        const prodData: Product = res.data.data;
        setProduct(prodData);
        setSelectedImageIndex(0);

        // Update recently viewed in localStorage
        try {
          const raw = localStorage.getItem(STORAGE_KEY_RECENTLY_VIEWED);
          const currentList: Product[] = raw ? JSON.parse(raw) : [];
          const filtered = currentList.filter((p) => p._id !== prodData._id);
          const updated = [prodData, ...filtered].slice(0, 8);
          localStorage.setItem(STORAGE_KEY_RECENTLY_VIEWED, JSON.stringify(updated));
          setRecentlyViewed(updated.filter((p) => p._id !== prodData._id));
        } catch (e) {
          console.warn('Failed to update recently viewed products:', e);
        }

        // Fetch related products
        const shopId = typeof prodData.shopId === 'object' ? prodData.shopId._id : prodData.shopId;
        const categoryId =
          typeof prodData.categoryId === 'object' ? prodData.categoryId._id : prodData.categoryId;

        if (shopId) {
          api
            .get('/products', { params: { shopId, limit: 6 } })
            .then((r) => {
              if (r.data.success) {
                setShopProducts((r.data.data || []).filter((p: Product) => p._id !== prodData._id));
              }
            })
            .catch(() => {});
        }

        if (categoryId) {
          api
            .get('/products', { params: { categoryId, limit: 6 } })
            .then((r) => {
              if (r.data.success) {
                setSimilarProducts((r.data.data || []).filter((p: Product) => p._id !== prodData._id));
              }
            })
            .catch(() => {});
        }
      } else {
        setProductError('Product not found.');
      }
    } catch (err: any) {
      setProductError(err.response?.data?.message || 'Failed to load product details.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch reviews
  const fetchReviews = useCallback(
    async (productId: string, page = 1) => {
      try {
        setIsReviewsLoading(true);
        const params: Record<string, any> = {
          page,
          limit: 8,
          sort: reviewSort,
        };
        if (filterRating) params.rating = filterRating;
        if (filterWithPhotos) params.withPhotos = true;

        const res = await reviewApi.getReviews(productId, params);
        if (res.success) {
          setReviews(res.data || []);
          setReviewStats(res.stats);
          setUserReviewState(res.userState);
          setReviewTotalPages(res.pagination?.totalPages || 1);
          setReviewPage(res.pagination?.page || 1);

          // If user has an existing review, prefill the edit form
          if (res.userState?.userReview) {
            setReviewFormRating(res.userState.userReview.rating || 5);
            setReviewFormTitle(res.userState.userReview.title || '');
            setReviewFormComment(res.userState.userReview.comment || '');
          }
        }
      } catch (err) {
        console.warn('Failed to load reviews:', err);
      } finally {
        setIsReviewsLoading(false);
      }
    },
    [reviewSort, filterRating, filterWithPhotos]
  );

  // Initialize
  useEffect(() => {
    if (id) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchProductData(id);
      fetchReviews(id, 1);
    }
  }, [id, fetchProductData, fetchReviews]);

  // Load recently viewed from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RECENTLY_VIEWED);
      if (raw) {
        const list: Product[] = JSON.parse(raw);
        if (id) {
          setRecentlyViewed(list.filter((p) => p._id !== id));
        } else {
          setRecentlyViewed(list);
        }
      }
    } catch {
      // ignore
    }
  }, [id]);

  // Handle Cart Interactions
  const handleAddToCart = async () => {
    if (!product || isOutOfStock) return;
    const ok = await addToCart(product, 1);
    if (ok) {
      const variantText = selectedVariant ? ` (${selectedVariant.label})` : '';
      toast.success(`Added ${product.name}${variantText} to cart!`);
    }
  };

  const handleIncrement = async () => {
    if (!product || isOutOfStock) return;
    if (cartQty >= product.stock) {
      toast.error(`Only ${product.stock} items in stock!`);
      return;
    }
    await updateQuantity(product._id, cartQty + 1);
  };

  const handleDecrement = async () => {
    if (!product) return;
    if (cartQty <= 1) {
      await removeItem(product._id);
      toast.info(`Removed ${product.name} from cart`);
    } else {
      await updateQuantity(product._id, cartQty - 1);
    }
  };

  const handleBuyNow = async () => {
    if (!product || isOutOfStock) return;
    if (cartQty === 0) {
      const ok = await addToCart(product, 1);
      if (!ok) return;
    }
    navigate('/checkout');
  };

  // Handle Share
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: product?.name || 'LocalGrocery Item',
          text: `Check out ${product?.name} on LocalGrocery!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  // Photo uploads preview for review
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (reviewFormPhotos.length + files.length > 5) {
      toast.error('You can upload a maximum of 5 photos.');
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 5 MB.`);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setReviewFormPhotos((prev) => [...prev, ...validFiles]);
    setReviewPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemovePhoto = (index: number) => {
    setReviewFormPhotos((prev) => prev.filter((_, i) => i !== index));
    setReviewPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to leave a review.');
      navigate('/login');
      return;
    }

    if (!reviewFormComment.trim()) {
      toast.error('Please write a comment for your review.');
      return;
    }

    if (!id) return;

    try {
      setIsSubmittingReview(true);
      const formData = new FormData();
      formData.append('rating', String(reviewFormRating));
      if (reviewFormTitle.trim()) formData.append('title', reviewFormTitle.trim());
      formData.append('comment', reviewFormComment.trim());

      reviewFormPhotos.forEach((file) => {
        formData.append('photos', file);
      });

      const res = await reviewApi.submitReview(id, formData);
      if (res.success) {
        toast.success(res.message || 'Review submitted successfully!');
        setIsReviewModalOpen(false);
        setReviewFormPhotos([]);
        setReviewPhotoPreviews([]);
        // Re-fetch product data and reviews
        fetchProductData(id);
        fetchReviews(id, 1);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Helpful vote
  const handleVoteHelpful = async (reviewId: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to vote.');
      return;
    }
    try {
      const res = await reviewApi.voteHelpful(reviewId);
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) => {
            if (r._id === reviewId) {
              const currentUserId = user?._id || '';
              const alreadyVoted = r.helpfulUsers?.includes(currentUserId);
              const updatedUsers = alreadyVoted
                ? (r.helpfulUsers || []).filter((uid) => uid !== currentUserId)
                : [...(r.helpfulUsers || []), currentUserId];

              return {
                ...r,
                helpfulVotes: res.data.helpfulVotes,
                helpfulUsers: updatedUsers,
              };
            }
            return r;
          })
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to vote.');
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      const res = await reviewApi.deleteReview(reviewId);
      if (res.success) {
        toast.success('Review deleted');
        if (id) {
          fetchProductData(id);
          fetchReviews(id, 1);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete review');
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
          <div className="h-6 w-48 bg-slate-200 dark:bg-[#172033] rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 h-96 bg-slate-200 dark:bg-[#172033] rounded-3xl"></div>
            <div className="lg:col-span-6 space-y-4">
              <div className="h-8 bg-slate-200 dark:bg-[#172033] rounded w-3/4"></div>
              <div className="h-5 bg-slate-200 dark:bg-[#172033] rounded w-1/4"></div>
              <div className="h-10 bg-slate-200 dark:bg-[#172033] rounded w-1/3"></div>
              <div className="h-24 bg-slate-200 dark:bg-[#172033] rounded"></div>
              <div className="h-12 bg-slate-200 dark:bg-[#172033] rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (productError || !product) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center">
            <PackageX size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-[#F9FAFB] mb-2">Product Not Found</h2>
          <p className="text-slate-500 dark:text-[#A7B3C5] mb-6">{productError || 'We could not find the grocery item you were looking for.'}</p>
          <div className="flex justify-center gap-4">
            <Link
              to="/"
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold transition-colors"
            >
              Back to Home
            </Link>
            <Link
              to="/shops"
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#172033] dark:hover:bg-[#111827] text-slate-800 dark:text-[#F9FAFB] border border-transparent dark:border-[#2D3748] font-bold transition-colors"
            >
              Browse Nearby Shops
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Shop details
  const shopObj = typeof product.shopId === 'object' ? (product.shopId as Shop) : null;
  const shopName = shopObj?.shopName || 'Local Verified Grocery';
  const shopId = shopObj?._id || (typeof product.shopId === 'string' ? product.shopId : '');
  const shopCity = shopObj?.city || 'Local Area';

  // Category details
  const categoryObj = typeof product.categoryId === 'object' ? (product.categoryId as Category) : null;
  const categoryName = categoryObj?.name || 'Groceries';

  // Pricing calculations
  const activePrice = selectedVariant ? selectedVariant.price : product.price;
  const activeOriginalPrice = selectedVariant
    ? selectedVariant.originalPrice
    : (product.originalPrice || Math.round(product.price * 1.25));
  const originalPrice = product.originalPrice || Math.round(product.price * 1.25);
  const discountPercent =
    product.discountPercentage ||
    (activeOriginalPrice > activePrice
      ? Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100)
      : 0);
  const savings = Math.max(0, activeOriginalPrice - activePrice);

  // Ratings calculation
  const avgRating = reviewStats?.averageRating || product.averageRating || 0;
  const totalReviewsCount = reviewStats?.totalReviews || product.totalReviews || 0;

  // Real purchase metrics
  const distinctBuyers = reviewStats?.purchaseStats?.distinctBuyers || 0;
  const totalUnitsSold = reviewStats?.purchaseStats?.totalUnitsSold || product.unitsSold || 0;

  return (
    <MainLayout>
      {/* Lightbox Modal */}
      {isLightboxOpen && lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-[#172033] border border-transparent dark:border-[#2D3748] rounded-3xl p-4 overflow-hidden shadow-2xl">
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
            <img
              src={lightboxImage}
              alt="Enlarged view"
              className="max-h-[80vh] max-w-full object-contain mx-auto rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#172033] border border-transparent dark:border-[#2D3748] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative animate-fade-in-up">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 dark:text-[#A7B3C5] hover:text-slate-600 dark:hover:text-[#F9FAFB] p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#111827] transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-[#12352D] text-sky-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-[#F9FAFB]">
                  {userReviewState?.hasReviewed ? 'Update Your Review' : 'Rate & Review'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#A7B3C5] font-medium">{product.name}</p>
              </div>
            </div>

            {userReviewState?.isDelivered && (
              <div className="mb-5 flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>You are a Verified Buyer for this item! A verified badge will be added to your review.</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-5">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#A7B3C5] mb-2">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled =
                      reviewFormHoverRating >= star || (!reviewFormHoverRating && reviewFormRating >= star);
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewFormRating(star)}
                        onMouseEnter={() => setReviewFormHoverRating(star)}
                        onMouseLeave={() => setReviewFormHoverRating(0)}
                        className="p-1 text-slate-300 dark:text-slate-600 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          size={28}
                          className={
                            isFilled
                              ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                              : 'text-slate-200 dark:text-slate-700 fill-transparent'
                          }
                        />
                      </button>
                    );
                  })}
                  <span className="text-xs font-bold text-slate-600 dark:text-[#A7B3C5] ml-2">
                    {reviewFormHoverRating === 5 || reviewFormRating === 5
                      ? '5 - Excellent!'
                      : reviewFormHoverRating === 4 || reviewFormRating === 4
                      ? '4 - Very Good'
                      : reviewFormHoverRating === 3 || reviewFormRating === 3
                      ? '3 - Average'
                      : reviewFormHoverRating === 2 || reviewFormRating === 2
                      ? '2 - Poor'
                      : '1 - Terrible'}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#A7B3C5] mb-1.5">
                  Headline / Title (Optional)
                </label>
                <input
                  type="text"
                  value={reviewFormTitle}
                  onChange={(e) => setReviewFormTitle(e.target.value)}
                  placeholder="e.g. Crisp, fresh and arrived on time!"
                  maxLength={100}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-400 font-medium"
                />
              </div>

              {/* Detailed Review */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#A7B3C5] mb-1.5">
                  Detailed Review *
                </label>
                <textarea
                  rows={4}
                  value={reviewFormComment}
                  onChange={(e) => setReviewFormComment(e.target.value)}
                  placeholder="Describe the freshness, taste, packaging, and quality of this grocery..."
                  required
                  maxLength={1000}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-400 font-medium resize-none"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">{reviewFormComment.length}/1000</span>
                </div>
              </div>

              {/* Upload Photos */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#A7B3C5] mb-1.5">
                  Add Photos (Up to 5)
                </label>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {reviewPhotoPreviews.map((preview, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-[#2D3748]">
                      <img src={preview} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 shadow-xs"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {reviewFormPhotos.length < 5 && (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 dark:border-[#2D3748] hover:border-sky-500 dark:hover:border-emerald-400 bg-slate-50 dark:bg-[#111827] flex flex-col items-center justify-center text-slate-400 dark:text-[#A7B3C5] hover:text-sky-600 dark:hover:text-emerald-400 cursor-pointer transition-colors">
                      <Camera size={20} />
                      <span className="text-[9px] font-bold mt-1">Add</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        multiple
                        className="hidden"
                        onChange={handlePhotoSelect}
                      />
                    </label>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-[#A7B3C5] mt-1.5">
                  Show other buyers the actual grocery items you received.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2D3748] text-slate-700 dark:text-[#F9FAFB] hover:bg-slate-50 dark:hover:bg-[#111827] text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-bold shadow-md shadow-sky-600/20 dark:shadow-emerald-950/40 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingReview ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#A7B3C5] font-medium mb-6 overflow-x-auto whitespace-nowrap pb-1">
          <Link to="/" className="hover:text-sky-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1">
            Home
          </Link>
          <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
          {shopId ? (
            <Link to={`/shops/${shopId}`} className="hover:text-sky-600 dark:hover:text-emerald-400 transition-colors">
              {shopName}
            </Link>
          ) : (
            <span>Shops</span>
          )}
          <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
          <span className="text-slate-400 dark:text-[#A7B3C5]">{categoryName}</span>
          <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
          <span className="text-slate-900 dark:text-[#F9FAFB] font-bold truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Top Product Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white dark:bg-[#172033] rounded-3xl p-4 sm:p-8 border border-slate-200/80 dark:border-[#2D3748] shadow-xs mb-10">
          {/* Left Column: Interactive Image Gallery */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Main Showcase Image */}
            <div className="relative aspect-square bg-slate-50 dark:bg-[#111827] rounded-3xl p-6 flex items-center justify-center border border-slate-100 dark:border-[#2D3748] overflow-hidden group">
              {/* Action Floating Buttons */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-white/90 dark:bg-[#172033]/90 hover:bg-white dark:hover:bg-[#172033] text-slate-700 dark:text-[#F9FAFB] border border-transparent dark:border-[#2D3748] shadow-md flex items-center justify-center transition-all hover:scale-105"
                  title="Share product"
                >
                  <Share2 size={18} />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!isAuthenticated) {
                      toast.info('Sign in to save items to your favourites');
                      navigate('/login');
                      return;
                    }
                    if (product) {
                      const nextFav = await toggleFavorite(product);
                      toast.success(nextFav ? 'Saved to favourites!' : 'Removed from favourites');
                    }
                  }}
                  className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all hover:scale-105 cursor-pointer ${
                    isFav ? 'bg-red-50 dark:bg-red-950/40 text-red-500' : 'bg-white/90 dark:bg-[#172033]/90 hover:bg-white dark:hover:bg-[#172033] text-slate-700 dark:text-[#F9FAFB] border border-transparent dark:border-[#2D3748]'
                  }`}
                  title={isFav ? 'Remove from favourites' : 'Save to favourites'}
                >
                  <Heart size={18} className={isFav ? 'fill-red-500 text-red-500' : ''} />
                </button>
              </div>

              {/* Status Badges */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                {discountPercent > 0 && (
                  <span className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-xl shadow-xs">
                    {discountPercent}% OFF
                  </span>
                )}
                {product.freshnessInfo && (
                  <span className="bg-emerald-600 text-white font-bold text-[11px] px-2 py-0.5 rounded-lg shadow-xs flex items-center gap-1">
                    <Sparkles size={11} /> Fresh
                  </span>
                )}
              </div>

              {/* Product Main Image with Zoom Trigger */}
              <img
                src={galleryImages[selectedImageIndex] || PRODUCT_FALLBACK_IMAGE}
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = PRODUCT_FALLBACK_IMAGE;
                }}
                onClick={() => {
                  setLightboxImage(galleryImages[selectedImageIndex] || PRODUCT_FALLBACK_IMAGE);
                  setIsLightboxOpen(true);
                }}
              />

              {/* Out of Stock Overlay */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-white/80 dark:bg-[#111827]/85 backdrop-blur-2xs flex flex-col items-center justify-center p-4">
                  <div className="w-12 h-12 rounded-full bg-slate-900 dark:bg-[#172033] text-white flex items-center justify-center mb-2">
                    <PackageX size={24} />
                  </div>
                  <span className="text-base font-black text-slate-900 dark:text-[#F9FAFB] uppercase tracking-wider">
                    Currently Out of Stock
                  </span>
                  <span className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-1">Check back soon or visit shop for alternatives</span>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-2xl p-1.5 bg-slate-50 dark:bg-[#111827] border-2 shrink-0 transition-all overflow-hidden ${
                      selectedImageIndex === idx
                        ? 'border-sky-600 dark:border-emerald-400 ring-2 ring-sky-200 dark:ring-emerald-500/30'
                        : 'border-slate-200 dark:border-[#2D3748] hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details, Real Metrics, Pricing & Cart Stepper */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Category & Brand Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-emerald-400 bg-sky-50 dark:bg-[#12352D] px-2.5 py-1 rounded-lg">
                  {categoryName}
                </span>
                <span className="text-xs font-semibold text-slate-400 dark:text-[#A7B3C5]">
                  Brand: <strong className="text-slate-700 dark:text-[#F9FAFB]">{product.brand || 'Local Verified Farms'}</strong>
                </span>
              </div>

              {/* Product Title */}
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#F9FAFB] tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Unit & Shelf Info */}
              <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-500 dark:text-[#A7B3C5]">
                <span className="bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-[#F9FAFB] px-2.5 py-0.5 rounded-md font-bold">
                  {product.unit}
                </span>
                {product.freshnessInfo && (
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 size={13} /> {product.freshnessInfo}
                  </span>
                )}
              </div>

              {/* Rating & Real Purchase Social Proof */}
              <div className="flex flex-wrap items-center gap-4 mt-4 pb-4 border-b border-slate-100 dark:border-[#2D3748]">
                {/* Star rating summary */}
                <a
                  href="#customer-reviews"
                  className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100/80 dark:hover:bg-amber-900/50 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                >
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  <span className="text-sm font-black text-amber-900 dark:text-amber-200">
                    {avgRating > 0 ? avgRating.toFixed(1) : 'New'}
                  </span>
                  <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold underline ml-0.5">
                    ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
                  </span>
                </a>

                {/* Real MongoDB Database-backed Purchase Counter */}
                {distinctBuyers > 0 ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-3 py-1 rounded-xl border border-orange-100 dark:border-orange-900/50">
                    <Flame size={15} className="fill-orange-500 text-orange-500" />
                    <span>
                      Purchased by <strong>{distinctBuyers}+ customers</strong> in this area
                    </span>
                  </div>
                ) : totalUnitsSold > 0 ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-emerald-300 bg-sky-50 dark:bg-[#12352D] px-3 py-1 rounded-xl">
                    <Package size={14} />
                    <span>{totalUnitsSold} units delivered fresh</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-[#12352D] px-2.5 py-1 rounded-xl">
                    <Sparkles size={14} />
                    <span>Fresh batch in stock</span>
                  </div>
                )}
              </div>

              {/* Weight / Pack Size Variant Selector */}
              {variants.length > 0 && (
                <div className="mt-5 p-4 rounded-2xl bg-slate-50/90 dark:bg-[#111827]/90 border border-slate-200 dark:border-[#2D3748]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-[#F9FAFB] flex items-center gap-1.5">
                      <Scale size={15} className="text-sky-600 dark:text-emerald-400" />
                      Select Weight / Pack Size
                    </span>
                    {selectedVariant && (
                      <span className="text-xs font-bold text-sky-700 dark:text-emerald-300 bg-sky-100/70 dark:bg-[#12352D] px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-emerald-500/40">
                        {selectedVariant.label}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`relative p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-sky-600 dark:border-emerald-400 bg-sky-50/80 dark:bg-[#12352D] ring-2 ring-sky-500/30 dark:ring-emerald-500/30 shadow-xs'
                              : 'border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#172033] hover:border-slate-300 dark:hover:border-emerald-500/50 hover:bg-slate-50/50 dark:hover:bg-[#111827]'
                          }`}
                        >
                          {v.badge && (
                            <span
                              className={`absolute -top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                isSelected
                                  ? 'bg-sky-600 dark:bg-emerald-600 text-white'
                                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              }`}
                            >
                              {v.badge}
                            </span>
                          )}
                          <div>
                            <span className={`block text-xs font-black ${isSelected ? 'text-sky-950 dark:text-emerald-200' : 'text-slate-800 dark:text-[#F9FAFB]'}`}>
                              {v.label}
                            </span>
                          </div>
                          <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-sm font-black text-slate-900 dark:text-[#F9FAFB]">₹{v.price}</span>
                            {v.originalPrice > v.price && (
                              <span className="text-[10px] text-slate-400 dark:text-[#A7B3C5]/70 line-through font-semibold">
                                ₹{v.originalPrice}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price & Discount Card */}
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-sky-50/60 via-slate-50 to-amber-50/30 dark:from-[#111827] dark:via-[#172033] dark:to-[#111827] border border-slate-200/60 dark:border-[#2D3748]">
                <div className="flex items-baseline flex-wrap gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-[#F9FAFB]">
                    ₹{activePrice}
                  </span>
                  {activeOriginalPrice > activePrice && (
                    <span className="text-base sm:text-lg text-slate-400 dark:text-[#A7B3C5] line-through font-bold">
                      ₹{activeOriginalPrice}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-xs font-black bg-amber-400 text-slate-900 px-2 py-0.5 rounded-lg shadow-2xs">
                      {discountPercent}% OFF
                    </span>
                  )}
                  {selectedVariant && (
                    <span className="text-xs font-bold text-slate-500 dark:text-[#A7B3C5] bg-white/70 dark:bg-[#111827]/70 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-[#2D3748] ml-auto">
                      for {selectedVariant.label}
                    </span>
                  )}
                </div>

                {savings > 0 && (
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                    <CheckCircle2 size={13} /> You save ₹{savings} on this item! (MRP inclusive of all taxes)
                  </p>
                )}
              </div>

              {/* Shop / Seller Snapshot Card */}
              <div className="mt-5 p-3.5 rounded-2xl border border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#111827] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-sky-100 dark:bg-[#12352D] text-sky-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Store size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black text-slate-900 dark:text-[#F9FAFB] leading-tight">{shopName}</h4>
                      <span className="text-[10px] bg-emerald-100 dark:bg-[#12352D] text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                        Verified Shop
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-0.5 flex items-center gap-1">
                      <MapPin size={12} /> {shopCity} • {shopObj?.deliveryAvailable ? 'Express Delivery' : 'Pickup Available'}
                    </p>
                  </div>
                </div>

                {shopId && (
                  <Link
                    to={`/shops/${shopId}`}
                    className="text-xs font-bold text-sky-600 dark:text-emerald-400 hover:text-sky-700 dark:hover:text-emerald-300 border border-sky-200 dark:border-emerald-500/40 bg-sky-50 dark:bg-[#12352D] px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                  >
                    Visit Shop <ExternalLink size={12} />
                  </Link>
                )}
              </div>

              {/* Stock Status Alert */}
              <div className="mt-4">
                {isOutOfStock ? (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <span>Currently out of stock at {shopName}.</span>
                  </div>
                ) : product.stock <= 5 ? (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                    <Flame size={16} className="text-amber-600 dark:text-amber-400" />
                    <span>Hurry! Only {product.stock} items left in stock.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={15} /> In Stock & Ready for Fast Local Dispatch
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions: Stepper + Add to Cart + Buy Now */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#2D3748]">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {isOutOfStock ? (
                  <button
                    disabled
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-slate-100 dark:bg-[#111827] text-slate-400 dark:text-slate-500 font-black text-sm cursor-not-allowed text-center"
                  >
                    Item Unavailable
                  </button>
                ) : cartQty > 0 ? (
                  /* Quantity Stepper Sync with Cart */
                  <div className="flex items-center justify-between sm:justify-start gap-4 p-2 bg-slate-100 dark:bg-[#111827] rounded-2xl border border-transparent dark:border-[#2D3748]">
                    <div className="flex items-center gap-2 bg-sky-600 dark:bg-emerald-600 text-white rounded-xl p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={handleDecrement}
                        className="w-9 h-9 rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-emerald-700 dark:hover:bg-emerald-800 flex items-center justify-center font-bold transition-all active:scale-90"
                        title="Decrease quantity"
                      >
                        <Minus size={16} strokeWidth={3} />
                      </button>
                      <span className="w-8 text-center text-sm font-black select-none">
                        {cartQty}
                      </span>
                      <button
                        type="button"
                        onClick={handleIncrement}
                        disabled={cartQty >= product.stock}
                        className="w-9 h-9 rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-emerald-700 dark:hover:bg-emerald-800 flex items-center justify-center font-bold transition-all active:scale-90 disabled:opacity-50"
                        title="Increase quantity"
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-[#A7B3C5] pr-2">
                      Total: ₹{activePrice * cartQty}
                    </span>
                  </div>
                ) : (
                  /* Add to Cart Button */
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-sky-600 hover:bg-sky-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-sky-600/20 dark:shadow-emerald-950/40 hover:shadow-sky-600/30 transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    <ShoppingCart size={18} />
                    Add to Cart
                  </button>
                )}

                {!isOutOfStock && (
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="py-3.5 px-6 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-400/20 hover:shadow-amber-400/30 transition-all text-center active:scale-98"
                  >
                    Buy Now
                  </button>
                )}
              </div>

              {/* Guarantees Row */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-slate-100 dark:border-[#2D3748] text-center">
                <div className="flex flex-col items-center gap-1 p-2">
                  <Truck size={18} className="text-sky-600 dark:text-emerald-400" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-[#F9FAFB]">Local Delivery</span>
                  <span className="text-[10px] text-slate-400 dark:text-[#A7B3C5]">Within 30-60 mins</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2">
                  <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-[#F9FAFB]">Freshness Assured</span>
                  <span className="text-[10px] text-slate-400 dark:text-[#A7B3C5]">Handpicked Quality</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2">
                  <RotateCcw size={18} className="text-amber-600 dark:text-amber-400" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-[#F9FAFB]">Easy Support</span>
                  <span className="text-[10px] text-slate-400 dark:text-[#A7B3C5]">Instant Shop Contact</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Product Details & Customer Reviews */}
        <div className="bg-white dark:bg-[#172033] rounded-3xl border border-slate-200/80 dark:border-[#2D3748] p-6 sm:p-8 shadow-xs mb-12">
          {/* Tabs bar */}
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-[#2D3748] pb-4 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-sky-600 dark:bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB] hover:bg-slate-100 dark:hover:bg-[#111827]'
              }`}
            >
              Description & Specifications
            </button>
            <button
              onClick={() => setActiveTab('freshness')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'freshness'
                  ? 'bg-sky-600 dark:bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB] hover:bg-slate-100 dark:hover:bg-[#111827]'
              }`}
            >
              Freshness & Storage Tips
            </button>
            <button
              id="customer-reviews"
              onClick={() => setActiveTab('reviews')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'bg-sky-600 dark:bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB] hover:bg-slate-100 dark:hover:bg-[#111827]'
              }`}
            >
              Customer Reviews ({totalReviewsCount})
            </button>
          </div>

          {/* Tab 1: Product Description */}
          {activeTab === 'details' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-[#F9FAFB] mb-2">About this Item</h3>
                <p className="text-slate-600 dark:text-[#A7B3C5] text-sm leading-relaxed whitespace-pre-line">
                  {product.description ||
                    `${product.name} sourced fresh from trusted local vendors. Hand-selected for peak flavor, high nutritional value, and optimum quality.`}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-[#2D3748]">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-100 dark:border-[#2D3748]">
                  <span className="text-xs text-slate-400 dark:text-[#A7B3C5] font-semibold">Category</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-[#F9FAFB] mt-0.5">{categoryName}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-100 dark:border-[#2D3748]">
                  <span className="text-xs text-slate-400 dark:text-[#A7B3C5] font-semibold">Unit / Weight</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-[#F9FAFB] mt-0.5">
                    {selectedVariant ? selectedVariant.label : product.unit}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-100 dark:border-[#2D3748]">
                  <span className="text-xs text-slate-400 dark:text-[#A7B3C5] font-semibold">Brand / Vendor</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-[#F9FAFB] mt-0.5">{product.brand || shopName}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-100 dark:border-[#2D3748]">
                  <span className="text-xs text-slate-400 dark:text-[#A7B3C5] font-semibold">Stock Availability</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-[#F9FAFB] mt-0.5">
                    {product.stock > 0 ? `${product.stock} units available` : 'Out of stock'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Freshness & Storage */}
          {activeTab === 'freshness' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-[#F9FAFB] mb-2">Shelf Life & Freshness Guide</h3>
                <p className="text-slate-600 dark:text-[#A7B3C5] text-sm leading-relaxed">
                  {product.freshnessInfo ||
                    'Best consumed within 2 to 5 days of delivery. Keep refrigerated or store in a cool, ventilated container away from direct sunlight.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-[#111827] border border-emerald-100 dark:border-[#2D3748]">
                  <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 mb-2" size={20} />
                  <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-300 uppercase">Quality Inspected</h4>
                  <p className="text-xs text-emerald-800 dark:text-[#A7B3C5] mt-1">
                    Every batch is inspected at pickup for freshness and damage before dispatch.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-[#111827] border border-sky-100 dark:border-[#2D3748]">
                  <Truck className="text-sky-600 dark:text-emerald-400 mb-2" size={20} />
                  <h4 className="text-xs font-bold text-sky-950 dark:text-emerald-300 uppercase">Same-Day Sourced</h4>
                  <p className="text-xs text-sky-800 dark:text-[#A7B3C5] mt-1">
                    Picked directly from local markets to ensure minimal travel time and freshness.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-[#111827] border border-amber-100 dark:border-[#2D3748]">
                  <RotateCcw className="text-amber-600 dark:text-amber-400 mb-2" size={20} />
                  <h4 className="text-xs font-bold text-amber-950 dark:text-amber-300 uppercase">Freshness Guarantee</h4>
                  <p className="text-xs text-amber-800 dark:text-[#A7B3C5] mt-1">
                    Not satisfied with the condition upon delivery? Contact the store or support right away.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Customer Reviews & Ratings */}
          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Reviews Summary Header */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-slate-50/70 dark:bg-[#111827]/70 p-6 rounded-3xl border border-slate-100 dark:border-[#2D3748]">
                {/* Rating Overview */}
                <div className="lg:col-span-4 text-center lg:text-left flex flex-col items-center lg:items-start">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-slate-900 dark:text-[#F9FAFB]">
                      {avgRating > 0 ? avgRating.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-slate-400 dark:text-[#A7B3C5] font-bold text-lg">/ 5</span>
                  </div>

                  <div className="flex items-center gap-1 my-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        className={
                          avgRating >= star
                            ? 'text-amber-400 fill-amber-400'
                            : avgRating >= star - 0.5
                            ? 'text-amber-400 fill-amber-400/50'
                            : 'text-slate-200 dark:text-slate-700 fill-slate-200 dark:fill-slate-700'
                        }
                      />
                    ))}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-[#A7B3C5] font-medium">
                    Based on <strong>{totalReviewsCount}</strong> verified ratings
                  </p>

                  {/* Write a review button */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Please log in to leave a review.');
                        navigate('/login');
                        return;
                      }
                      setIsReviewModalOpen(true);
                    }}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 dark:shadow-emerald-950/40 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={14} />
                    {userReviewState?.hasReviewed ? 'Edit Your Review' : 'Write a Review'}
                  </button>
                </div>

                {/* Rating Distribution Progress Bars */}
                <div className="lg:col-span-8 w-full space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewStats?.breakdown?.[star]?.count || 0;
                    const percent = reviewStats?.breakdown?.[star]?.percentage || 0;
                    const isSelected = filterRating === star;

                    return (
                      <div
                        key={star}
                        onClick={() => setFilterRating(isSelected ? null : star)}
                        className={`flex items-center gap-3 text-xs cursor-pointer p-1 rounded-xl transition-colors ${
                          isSelected ? 'bg-sky-100/60 dark:bg-[#12352D] font-black text-sky-800 dark:text-emerald-300' : 'hover:bg-slate-100 dark:hover:bg-[#172033]'
                        }`}
                        title={`Filter by ${star} star reviews`}
                      >
                        <span className="w-12 font-bold text-slate-700 dark:text-[#A7B3C5] flex items-center gap-1">
                          {star} <Star size={12} className="text-amber-400 fill-amber-400" />
                        </span>

                        <div className="flex-1 h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <span className="w-14 text-right text-slate-500 dark:text-[#A7B3C5] font-medium">
                          {percent}% ({count})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer Photos Gallery Strip */}
              {reviewStats?.customerPhotos && reviewStats.customerPhotos.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <Camera size={16} className="text-sky-600" />
                      Photos from Customers ({reviewStats.customerPhotos.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setFilterWithPhotos(!filterWithPhotos)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                        filterWithPhotos ? 'bg-sky-600 text-white' : 'text-sky-600 hover:bg-sky-50'
                      }`}
                    >
                      {filterWithPhotos ? 'Show All Reviews' : 'Filter by Photos'}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {reviewStats.customerPhotos.slice(0, 6).map((photo, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() => {
                          setLightboxImage(photo.url);
                          setIsLightboxOpen(true);
                        }}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer"
                      >
                        <img
                          src={photo.url}
                          alt="Customer uploaded"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Sparkles size={18} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Filters & Sorting Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-[#2D3748]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 dark:text-[#A7B3C5] flex items-center gap-1">
                    <Filter size={13} /> Filter:
                  </span>
                  <button
                    onClick={() => setFilterRating(null)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      filterRating === null ? 'bg-slate-900 dark:bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-[#A7B3C5] hover:bg-slate-200 dark:hover:bg-[#172033]'
                    }`}
                  >
                    All Stars
                  </button>
                  {[5, 4, 3].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFilterRating(filterRating === star ? null : star)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        filterRating === star
                          ? 'bg-amber-400 text-slate-900'
                          : 'bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-[#A7B3C5] hover:bg-slate-200 dark:hover:bg-[#172033]'
                      }`}
                    >
                      {star}★
                    </button>
                  ))}
                  <button
                    onClick={() => setFilterWithPhotos(!filterWithPhotos)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                      filterWithPhotos ? 'bg-sky-600 dark:bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-[#A7B3C5] hover:bg-slate-200 dark:hover:bg-[#172033]'
                    }`}
                  >
                    <Camera size={12} /> With Photos
                  </button>
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 dark:text-[#A7B3C5] font-bold flex items-center gap-1">
                    <ArrowUpDown size={13} /> Sort:
                  </span>
                  <select
                    value={reviewSort}
                    onChange={(e) => setReviewSort(e.target.value as any)}
                    className="bg-slate-100 dark:bg-[#111827] font-bold text-slate-800 dark:text-[#F9FAFB] rounded-xl px-3 py-1.5 border border-transparent dark:border-[#2D3748] focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-400 text-xs"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="helpful">Most Helpful</option>
                    <option value="highest">Highest Rating</option>
                    <option value="lowest">Lowest Rating</option>
                  </select>
                </div>
              </div>

              {/* Reviews List */}
              {isReviewsLoading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="p-4 bg-slate-50 dark:bg-[#111827] rounded-2xl h-28"></div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-[#111827] rounded-3xl border border-slate-100 dark:border-[#2D3748]">
                  <Sparkles size={36} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <h4 className="text-base font-black text-slate-800 dark:text-[#F9FAFB]">No reviews yet</h4>
                  <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-1 max-w-sm mx-auto">
                    Be the first customer to share your thoughts on the quality and freshness of this product!
                  </p>
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Please log in to leave a review.');
                        navigate('/login');
                        return;
                      }
                      setIsReviewModalOpen(true);
                    }}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    Write a Review
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => {
                    const isOwnReview = user && rev.userId && rev.userId._id === user._id;
                    const hasVotedHelpful = user && rev.helpfulUsers?.includes(user._id);

                    return (
                      <div
                        key={rev._id}
                        className="p-5 rounded-2xl border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#111827] hover:border-slate-300 dark:hover:border-emerald-500/50 transition-all space-y-3"
                      >
                        {/* Header: User avatar, name, verified badge & date */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-[#12352D] text-sky-700 dark:text-emerald-400 font-black flex items-center justify-center text-sm overflow-hidden">
                              {rev.userId?.profileImage ? (
                                <img
                                  src={rev.userId.profileImage}
                                  alt={rev.userId.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (rev.userId?.name || 'Customer').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-black text-slate-900 dark:text-[#F9FAFB] leading-tight">
                                  {rev.userId?.name || 'Local Customer'}
                                </h5>
                                {rev.isVerifiedPurchase && (
                                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-[#12352D] px-2 py-0.5 rounded-md">
                                    <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                                    Verified Buyer
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 dark:text-[#A7B3C5]">
                                {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                daylight: 'numeric',
                                } as any)}
                              </span>
                            </div>
                          </div>

                          {/* Delete own review */}
                          {isOwnReview && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(rev._id)}
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                              title="Delete your review"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        {/* Stars & Title */}
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={
                                  rev.rating >= star
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-200 dark:text-slate-700 fill-slate-200 dark:fill-slate-700'
                                }
                              />
                            ))}
                          </div>
                          {rev.title && (
                            <h6 className="text-sm font-bold text-slate-900 dark:text-[#F9FAFB] mt-1">{rev.title}</h6>
                          )}
                        </div>

                        {/* Comment Body */}
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-[#A7B3C5] leading-relaxed whitespace-pre-line">
                          {rev.comment}
                        </p>

                        {/* Customer Photos in Review */}
                        {rev.photos && rev.photos.length > 0 && (
                          <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                            {rev.photos.map((p, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setLightboxImage(p.url);
                                  setIsLightboxOpen(true);
                                }}
                                className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#2D3748] shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                              >
                                <img src={p.url} alt="review pic" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Helpful voting */}
                        <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-[#A7B3C5]">
                          <button
                            type="button"
                            onClick={() => handleVoteHelpful(rev._id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                              hasVotedHelpful
                                ? 'bg-sky-50 dark:bg-[#12352D] border-sky-300 dark:border-emerald-500/40 text-sky-700 dark:text-emerald-300 font-bold'
                                : 'border-slate-200 dark:border-[#2D3748] hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-[#A7B3C5]'
                            }`}
                          >
                            <ThumbsUp size={13} className={hasVotedHelpful ? 'fill-sky-600 text-sky-600 dark:fill-emerald-400 dark:text-emerald-400' : ''} />
                            <span>Helpful ({rev.helpfulVotes || 0})</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination */}
                  {reviewTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      {Array.from({ length: reviewTotalPages }, (_, i) => i + 1).map((pg) => (
                        <button
                          key={pg}
                          onClick={() => {
                            if (id) fetchReviews(id, pg);
                          }}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                            reviewPage === pg
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {pg}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section: More from this Shop */}
        {shopProducts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-[#F9FAFB]">More from {shopName}</h3>
                <p className="text-xs text-slate-500 dark:text-[#A7B3C5]">Order together for a single delivery fee</p>
              </div>
              {shopId && (
                <Link
                  to={`/shops/${shopId}`}
                  className="text-xs font-bold text-sky-600 dark:text-emerald-400 hover:text-sky-700 dark:hover:text-emerald-300 flex items-center gap-1"
                >
                  View All <ChevronRight size={14} />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {shopProducts.map((p) => (
                <ProductRecommendationCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Section: Similar Products in Category */}
        {similarProducts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-[#F9FAFB]">Similar Products</h3>
                <p className="text-xs text-slate-500 dark:text-[#A7B3C5]">Explore other popular {categoryName.toLowerCase()} choices</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similarProducts.map((p) => (
                <ProductRecommendationCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Section: Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-[#F9FAFB]">Recently Viewed</h3>
                <p className="text-xs text-slate-500 dark:text-[#A7B3C5]">Items you checked out recently</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentlyViewed.map((p) => (
                <ProductRecommendationCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

// Reusable mini product card for recommendation sections
const ProductRecommendationCard = ({ product }: { product: Product }) => {
  const { cart, addToCart, updateQuantity, removeItem } = useCartStore();

  const cartItem = useMemo(() => {
    if (!cart?.items) return null;
    return cart.items.find((item) => {
      const pid = typeof item.productId === 'object' ? item.productId._id : item.productId;
      return pid === product._id;
    });
  }, [product._id, cart?.items]);

  const cartQty = cartItem?.quantity || 0;
  const isOutOfStock = product.stock <= 0 || !product.isAvailable;

  const originalPrice = product.originalPrice || Math.round(product.price * 1.25);
  const discountPercent =
    product.discountPercentage ||
    (originalPrice > product.price
      ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
      : 0);

  return (
    <div className="card p-3 rounded-2xl border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] hover:border-sky-300 dark:hover:border-emerald-500/50 hover:shadow-lg transition-all flex flex-col justify-between group">
      <Link to={`/products/${product._id}`} className="block">
        <div className="relative aspect-square rounded-xl bg-slate-50 dark:bg-[#111827] p-2 flex items-center justify-center overflow-hidden mb-2">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = PRODUCT_FALLBACK_IMAGE;
              }}
            />
          ) : (
            <Package size={28} className="text-slate-300 dark:text-slate-600" />
          )}

          {discountPercent > 0 && (
            <span className="absolute top-1.5 left-1.5 bg-amber-400 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded-md">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        <h5 className="text-xs font-bold text-slate-900 dark:text-[#F9FAFB] line-clamp-2 leading-tight group-hover:text-sky-600 dark:group-hover:text-emerald-400 transition-colors">
          {product.name}
        </h5>
        <p className="text-[10px] text-slate-400 dark:text-[#A7B3C5] mt-0.5">{product.unit}</p>
      </Link>

      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-[#2D3748] flex items-center justify-between gap-1">
        <div>
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-[#F9FAFB]">₹{product.price}</span>
          {originalPrice > product.price && (
            <span className="text-[10px] text-slate-400 dark:text-[#A7B3C5]/70 line-through font-semibold ml-1">
              ₹{originalPrice}
            </span>
          )}
        </div>

        {isOutOfStock ? (
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-[#111827] px-1.5 py-0.5 rounded">
            Out
          </span>
        ) : cartQty > 0 ? (
          <div className="flex items-center gap-1 bg-sky-600 dark:bg-emerald-600 text-white rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                if (cartQty <= 1) await removeItem(product._id);
                else await updateQuantity(product._id, cartQty - 1);
              }}
              className="w-5 h-5 rounded bg-sky-700 hover:bg-sky-800 dark:bg-emerald-700 dark:hover:bg-emerald-800 flex items-center justify-center font-bold text-xs"
            >
              <Minus size={11} />
            </button>
            <span className="w-4 text-center text-[11px] font-black">{cartQty}</span>
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                await updateQuantity(product._id, cartQty + 1);
              }}
              className="w-5 h-5 rounded bg-sky-700 hover:bg-sky-800 dark:bg-emerald-700 dark:hover:bg-emerald-800 flex items-center justify-center font-bold text-xs"
            >
              <Plus size={11} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              const ok = await addToCart(product, 1);
              if (ok) toast.success(`Added ${product.name}`);
            }}
            className="w-7 h-7 rounded-lg bg-sky-600 hover:bg-sky-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
            title="Add to cart"
          >
            <Plus size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
