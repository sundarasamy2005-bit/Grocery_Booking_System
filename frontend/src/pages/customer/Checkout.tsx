import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  Truck,
  MapPin,
  Loader2,
  CheckCircle2,
  Plus,
  Home,
  Briefcase,
  Navigation,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { useCartStore } from '../../store/cartStore';
import { useAddressStore } from '../../store/addressStore';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import { api } from '../../services/api';
import { AddressLabel, AddressFormData } from '../../types';

export const Checkout = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { cart, fetchCart, clearCart } = useCartStore();
  const {
    addresses,
    activeAddress,
    fetchAddresses,
    selectActiveAddress,
    addAddress,
    openModal: openAddressModal,
  } = useAddressStore();

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showInlineAddForm, setShowInlineAddForm] = useState(false);

  // Inline address form states
  const [houseStreet, setHouseStreet] = useState('');
  const [areaCity, setAreaCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [phone, setPhone] = useState('');
  const [label, setLabel] = useState<AddressLabel>('Home');
  const [isDefault, setIsDefault] = useState(false);
  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({});
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const [placingOrder, setPlacingOrder] = useState(false);
  const [customerNote, setCustomerNote] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.info('Please sign in to complete checkout');
      navigate('/login?redirect=/checkout');
      return;
    }
    fetchCart();
    fetchAddresses();
  }, [authLoading, isAuthenticated, navigate, fetchCart, fetchAddresses]);

  useEffect(() => {
    if (activeAddress) {
      setSelectedAddressId(activeAddress._id);
    } else if (addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(def._id);
      selectActiveAddress(def);
    }
  }, [activeAddress, addresses, selectActiveAddress]);

  const validateInlineAddress = (): boolean => {
    const errs: Record<string, string> = {};
    const cleanHouse = houseStreet.trim();
    const cleanArea = areaCity.trim();
    const cleanPin = pinCode.trim();

    if (!cleanHouse) {
      errs.houseStreet = 'House number / street is required';
    } else if (cleanHouse.length > 200) {
      errs.houseStreet = 'Must be under 200 characters';
    }

    if (!cleanArea) {
      errs.areaCity = 'Area / town / city is required';
    } else if (cleanArea.length > 120) {
      errs.areaCity = 'Must be under 120 characters';
    }

    if (!cleanPin) {
      errs.pinCode = 'PIN code is required';
    } else if (!/^\d{6}$/.test(cleanPin)) {
      errs.pinCode = 'PIN code must be exactly 6 numeric digits';
    }

    if (landmark.trim().length > 150) {
      errs.landmark = 'Landmark must be under 150 characters';
    }

    setInlineErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveInlineAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInlineAddress()) return;

    try {
      setIsSavingAddress(true);
      const payload: AddressFormData = {
        houseStreet: houseStreet.trim(),
        areaCity: areaCity.trim(),
        pinCode: pinCode.trim(),
        landmark: landmark.trim(),
        phone: phone.trim() || undefined,
        label,
        isDefault,
      };

      const newAddr = await addAddress(payload);
      if (newAddr) {
        setSelectedAddressId(newAddr._id);
        setShowInlineAddForm(false);
        setHouseStreet('');
        setAreaCity('');
        setPinCode('');
        setLandmark('');
        setPhone('');
        setInlineErrors({});
      }
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart || !cart.shopId) {
      toast.error('Cart is empty');
      return;
    }

    if (deliveryType === 'delivery') {
      if (!selectedAddressId) {
        toast.error('Please choose or add a delivery address');
        return;
      }
    }

    try {
      setPlacingOrder(true);
      const orderPayload: any = {
        shopId: typeof cart.shopId === 'object' ? cart.shopId._id : cart.shopId,
        items: cart.items.map((i) => ({
          productId: typeof i.productId === 'object' ? i.productId._id : i.productId,
          quantity: i.quantity,
          variantId: i.variantId,
          variantLabel: i.variantLabel,
          variantPrice: i.variantPrice || (typeof i.productId === 'object' ? i.productId.price : undefined),
        })),
        deliveryType,
        customerNote: customerNote.trim() || undefined,
      };

      if (deliveryType === 'delivery') {
        orderPayload.addressId = selectedAddressId;
      }

      const res = await api.post('/orders', orderPayload);

      if (res.data.success) {
        await clearCart();
        toast.success('Order placed successfully!');
        navigate('/orders', {
          state: { orderSuccess: true, orderNumber: res.data.data.orderNumber },
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!cart || !cart.shopId || !cart.items || cart.items.length === 0) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-[#172033] text-slate-400 dark:text-[#A7B3C5] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-[#F9FAFB] mb-2">Your Cart is Empty</h2>
          <p className="text-slate-500 dark:text-[#A7B3C5] text-sm mb-6">Add fresh groceries from nearby shops to proceed to checkout.</p>
          <Link
            to="/"
            className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black text-sm shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            Explore Groceries <ArrowRight size={16} />
          </Link>
        </div>
      </MainLayout>
    );
  }

  const shopName = typeof cart.shopId === 'object' ? cart.shopId.shopName : 'Local Grocery Store';
  const deliveryAvailable = typeof cart.shopId === 'object' ? cart.shopId.deliveryAvailable : true;
  const pickupAvailable = typeof cart.shopId === 'object' ? cart.shopId.pickupAvailable : true;

  const deliveryFee = deliveryType === 'delivery' ? 40 : 0;
  const total = cart.subtotal + deliveryFee;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-slate-50 dark:bg-[#0B1220] min-h-screen">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#F9FAFB] tracking-tight">Checkout</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A7B3C5]">
            Ordering from <strong className="text-slate-800 dark:text-emerald-400">{shopName}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form & Address Selection */}
          <div className="lg:col-span-8 space-y-6">
            {/* Delivery Type Option */}
            <div className="bg-white dark:bg-[#172033] rounded-3xl border border-slate-200/80 dark:border-[#2D3748] p-6 shadow-xs space-y-4">
              <h2 className="text-base font-black text-slate-900 dark:text-[#F9FAFB] flex items-center gap-2">
                <Truck className="text-sky-600 dark:text-emerald-400" size={20} /> Fulfillment Option
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {deliveryAvailable && (
                  <label
                    className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition-all ${
                      deliveryType === 'delivery'
                        ? 'border-sky-600 dark:border-emerald-400 bg-sky-50/50 dark:bg-[#12352D] ring-2 ring-sky-200 dark:ring-emerald-500/30'
                        : 'border-slate-200 dark:border-[#2D3748] hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#111827]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryType"
                      value="delivery"
                      checked={deliveryType === 'delivery'}
                      onChange={() => setDeliveryType('delivery')}
                      className="mt-1 h-4 w-4 text-sky-600 dark:text-emerald-400 focus:ring-sky-500"
                    />
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-[#F9FAFB] block leading-tight">Home Delivery</span>
                      <span className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-0.5 block">
                        Fresh doorstep delivery from nearby store (₹40)
                      </span>
                    </div>
                  </label>
                )}

                {pickupAvailable && (
                  <label
                    className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition-all ${
                      deliveryType === 'pickup'
                        ? 'border-sky-600 dark:border-emerald-400 bg-sky-50/50 dark:bg-[#12352D] ring-2 ring-sky-200 dark:ring-emerald-500/30'
                        : 'border-slate-200 dark:border-[#2D3748] hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#111827]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryType"
                      value="pickup"
                      checked={deliveryType === 'pickup'}
                      onChange={() => setDeliveryType('pickup')}
                      className="mt-1 h-4 w-4 text-sky-600 dark:text-emerald-400 focus:ring-sky-500"
                    />
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-[#F9FAFB] block leading-tight">Store Pickup</span>
                      <span className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-0.5 block">
                        Self-collect at shop counter (Free)
                      </span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Text-Only Delivery Address Section */}
            {deliveryType === 'delivery' && (
              <div className="bg-white dark:bg-[#172033] rounded-3xl border border-slate-200/80 dark:border-[#2D3748] p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2D3748] pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-[#12352D] text-sky-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-[#F9FAFB] leading-tight">Delivery Address</h2>
                      <p className="text-xs text-slate-500 dark:text-[#A7B3C5] font-medium">
                        Street address and 6-digit PIN code for doorstep delivery
                      </p>
                    </div>
                  </div>

                  {!showInlineAddForm && (
                    <button
                      type="button"
                      onClick={() => setShowInlineAddForm(true)}
                      className="text-xs font-bold text-sky-600 dark:text-emerald-400 hover:text-sky-700 dark:hover:text-emerald-300 bg-sky-50 dark:bg-[#12352D] hover:bg-sky-100 dark:hover:bg-[#12352D]/80 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> Add New Address
                    </button>
                  )}
                </div>

                {/* Inline Add Address Form */}
                {showInlineAddForm ? (
                  <form onSubmit={handleSaveInlineAddress} className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-[#2D3748]">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#2D3748]">
                      <span className="text-xs font-black text-slate-900 dark:text-[#F9FAFB] uppercase tracking-wider">
                        New Delivery Address
                      </span>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowInlineAddForm(false)}
                          className="text-xs font-bold text-slate-500 dark:text-[#A7B3C5] hover:text-slate-800 dark:hover:text-[#F9FAFB] cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {/* Address Label Selector */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#A7B3C5] mb-1.5">
                        Address Label *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Home', 'Work', 'Other'] as AddressLabel[]).map((lbl) => (
                          <button
                            key={lbl}
                            type="button"
                            onClick={() => setLabel(lbl)}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              label === lbl
                                ? 'border-sky-600 dark:border-emerald-400 bg-sky-50 dark:bg-[#12352D] text-sky-700 dark:text-emerald-300 ring-2 ring-sky-200 dark:ring-emerald-500/30'
                                : 'border-slate-200 dark:border-[#2D3748] text-slate-700 dark:text-[#F9FAFB] hover:bg-slate-50 dark:hover:bg-[#172033]'
                            }`}
                          >
                            {lbl === 'Home' && <Home size={14} />}
                            {lbl === 'Work' && <Briefcase size={14} />}
                            {lbl === 'Other' && <Navigation size={14} />}
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* House number / Street */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#A7B3C5] mb-1">
                        House Number / Street *
                      </label>
                      <input
                        type="text"
                        value={houseStreet}
                        onChange={(e) => {
                          setHouseStreet(e.target.value);
                          if (inlineErrors.houseStreet) setInlineErrors((p) => ({ ...p, houseStreet: '' }));
                        }}
                        placeholder="e.g. No. 12, Anna Nagar"
                        maxLength={200}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 ${
                          inlineErrors.houseStreet ? 'border-red-400 bg-red-50/20' : 'border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#172033] text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-slate-500'
                        }`}
                      />
                      {inlineErrors.houseStreet && (
                        <p className="text-[11px] text-red-500 font-bold mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {inlineErrors.houseStreet}
                        </p>
                      )}
                    </div>

                    {/* Area / Town / City */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#A7B3C5] mb-1">
                        Area / Town / City *
                      </label>
                      <input
                        type="text"
                        value={areaCity}
                        onChange={(e) => {
                          setAreaCity(e.target.value);
                          if (inlineErrors.areaCity) setInlineErrors((p) => ({ ...p, areaCity: '' }));
                        }}
                        placeholder="e.g. Pollachi, Coimbatore"
                        maxLength={120}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 ${
                          inlineErrors.areaCity ? 'border-red-400 bg-red-50/20' : 'border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#172033] text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-slate-500'
                        }`}
                      />
                      {inlineErrors.areaCity && (
                        <p className="text-[11px] text-red-500 font-bold mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {inlineErrors.areaCity}
                        </p>
                      )}
                    </div>

                    {/* PIN Code */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#A7B3C5] mb-1">
                        PIN Code (6 digits) *
                      </label>
                      <input
                        type="text"
                        value={pinCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setPinCode(val);
                          if (inlineErrors.pinCode) setInlineErrors((p) => ({ ...p, pinCode: '' }));
                        }}
                        placeholder="e.g. 642001"
                        maxLength={6}
                        inputMode="numeric"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 ${
                          inlineErrors.pinCode ? 'border-red-400 bg-red-50/20' : 'border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#172033] text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-slate-500'
                        }`}
                      />
                      {inlineErrors.pinCode && (
                        <p className="text-[11px] text-red-500 font-bold mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {inlineErrors.pinCode}
                        </p>
                      )}
                    </div>

                    {/* Landmark */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#A7B3C5] mb-1">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="e.g. Near Bus Stand / Bismi Supermarket"
                        maxLength={150}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#172033] text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm font-medium"
                      />
                    </div>

                    {/* Contact Phone (Optional) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#A7B3C5] mb-1">
                        Contact Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9876543210 (For delivery updates)"
                        maxLength={15}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#172033] text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm font-medium"
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowInlineAddForm(false)}
                          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2D3748] text-slate-700 dark:text-[#A7B3C5] hover:bg-slate-100 dark:hover:bg-[#172033] text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSavingAddress}
                        className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {isSavingAddress ? 'Saving...' : 'Save & Select Address'}
                      </button>
                    </div>
                  </form>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#2D3748] text-slate-500 dark:text-[#A7B3C5]">
                    <MapPin size={32} className="mx-auto mb-2 text-slate-400 dark:text-slate-600" />
                    <p className="text-sm font-bold text-slate-800 dark:text-[#F9FAFB]">No Delivery Address Found</p>
                    <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-1 mb-4">
                      Please enter your delivery address to complete your order.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowInlineAddForm(true)}
                      className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer"
                    >
                      + Add Delivery Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr._id;
                      return (
                        <label
                          key={addr._id}
                          className={`block p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-sky-600 dark:border-emerald-400 bg-sky-50/50 dark:bg-[#12352D] ring-2 ring-sky-200 dark:ring-emerald-500/30'
                              : 'border-slate-200 dark:border-[#2D3748] hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#111827]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="checkoutAddress"
                              value={addr._id}
                              checked={isSelected}
                              onChange={() => {
                                setSelectedAddressId(addr._id);
                                selectActiveAddress(addr);
                              }}
                              className="mt-1 h-4 w-4 text-sky-600 dark:text-emerald-400 focus:ring-sky-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="bg-slate-100 dark:bg-[#172033] text-slate-800 dark:text-[#F9FAFB] text-[10px] font-bold px-2 py-0.5 rounded-md">
                                  {addr.label || 'Home'}
                                </span>
                                {addr.isDefault && (
                                  <span className="bg-emerald-100 dark:bg-[#12352D] text-emerald-800 dark:text-emerald-300 text-[10px] font-black px-1.5 py-0.2 rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F9FAFB] leading-snug">
                                {addr.houseStreet || addr.addressLine1}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-[#A7B3C5] mt-0.5">
                                {addr.areaCity || addr.city} - <span className="font-semibold text-slate-800 dark:text-[#F9FAFB]">{addr.pinCode || addr.postalCode}</span>
                              </p>
                              {addr.landmark && (
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                  Landmark: {addr.landmark}
                                </p>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-white dark:bg-[#172033] rounded-3xl border border-slate-200/80 dark:border-[#2D3748] p-6 shadow-xs space-y-4">
              <h2 className="text-base font-black text-slate-900 dark:text-[#F9FAFB] flex items-center gap-2">
                <CreditCard className="text-emerald-600 dark:text-emerald-400" size={20} /> Payment Method
              </h2>

              <div className="border-2 border-emerald-500 dark:border-emerald-500/70 bg-emerald-50/70 dark:bg-[#12352D] rounded-2xl p-4 flex items-center gap-3">
                <input type="radio" checked readOnly className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <span className="block text-sm font-black text-slate-900 dark:text-[#F9FAFB]">Cash on Delivery (COD)</span>
                  <span className="block text-xs text-slate-600 dark:text-[#A7B3C5] mt-0.5">
                    Pay with cash or UPI directly when your fresh groceries arrive at your door
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Note */}
            <div className="bg-white dark:bg-[#172033] rounded-3xl border border-slate-200/80 dark:border-[#2D3748] p-6 shadow-xs space-y-2">
              <h2 className="text-base font-black text-slate-900 dark:text-[#F9FAFB]">Delivery Instructions (Optional)</h2>
              <textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Doorbell instructions, flat number details, or specific guidance for the shop..."
                rows={3}
                maxLength={300}
                className="w-full border border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl p-3 focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-400 focus:outline-none text-xs sm:text-sm resize-none"
              />
            </div>
          </div>

          {/* Right Column: Order Summary Sidebar */}
          <div className="lg:col-span-4 sticky top-24">
            <div className="bg-white dark:bg-[#172033] rounded-3xl border border-slate-200/80 dark:border-[#2D3748] p-6 shadow-xs space-y-5">
              <h3 className="text-base font-black text-slate-900 dark:text-[#F9FAFB] border-b border-slate-100 dark:border-[#2D3748] pb-3">
                Order Summary
              </h3>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cart.items.map((item) => {
                  const prod = typeof item.productId === 'object' ? item.productId : null;
                  if (!prod) return null;
                  const itemPrice = item.variantPrice || prod.price;
                  const itemKey = `${prod._id}_${item.variantId || 'base'}`;
                  return (
                    <div key={itemKey} className="flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 dark:text-[#F9FAFB] truncate">{prod.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-[#A7B3C5]">
                          {item.variantLabel || prod.unit} × {item.quantity}
                        </p>
                      </div>
                      <span className="font-black text-slate-900 dark:text-[#F9FAFB] shrink-0">
                        ₹{(itemPrice * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 border-t border-slate-100 dark:border-[#2D3748] pt-4 text-xs font-bold text-slate-600 dark:text-[#A7B3C5]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-900 dark:text-[#F9FAFB]">₹{cart.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-900 dark:text-[#F9FAFB]'}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-[#2D3748] text-sm">
                  <span className="text-slate-900 dark:text-[#F9FAFB] font-black">Total Amount</span>
                  <span className="text-xl font-black text-sky-600 dark:text-emerald-400">₹{total}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placingOrder || (deliveryType === 'delivery' && !selectedAddressId)}
                className="w-full py-3.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black text-sm shadow-md shadow-sky-600/20 dark:shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placingOrder ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Placing Order...
                  </>
                ) : (
                  `Place Order • ₹${total}`
                )}
              </button>

              {deliveryType === 'delivery' && !selectedAddressId && (
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold text-center">
                  ⚠️ Please select or add a delivery address to place your order.
                </p>
              )}

              <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-[#A7B3C5] font-medium">
                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>100% Quality & Freshness Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Checkout;
