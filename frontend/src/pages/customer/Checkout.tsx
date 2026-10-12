import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Truck, MapPin, Loader2, CheckCircle2, Navigation, Bookmark } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import LocationPicker, { LocationData } from '../../components/LocationPicker';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../services/api';

const addressSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(5, 'Postal code is required'),
});

type AddressForm = z.infer<typeof addressSchema>;

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, fetchCart, clearCart } = useCartStore();
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  
  // Location & Address States
  const [deliveryLocation, setDeliveryLocation] = useState<LocationData | null>(null);
  const [addressMode, setAddressMode] = useState<'map' | 'saved'>('map');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [customerNote, setCustomerNote] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  });

  useEffect(() => {
    fetchCart();
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      if (res.data.success && res.data.data.length > 0) {
        setAddresses(res.data.data);
        const defaultAddr = res.data.data.find((a: any) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id);
        } else {
          setSelectedAddressId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch addresses', err);
    }
  };

  const onAddAddress = async (data: AddressForm) => {
    try {
      setLoading(true);
      const res = await api.post('/addresses', data);
      if (res.data.success) {
        await fetchAddresses();
        setShowNewAddress(false);
        reset();
      }
    } catch (err) {
      alert('Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart || !cart.shopId) return;

    if (deliveryType === 'delivery') {
      if (addressMode === 'map' && !deliveryLocation) {
        alert('Please confirm your delivery location on the map first.');
        return;
      }
      if (addressMode === 'saved' && !selectedAddressId) {
        alert('Please select a delivery address or pinpoint your location on the map.');
        return;
      }
    }

    try {
      setPlacingOrder(true);
      const orderData: any = {
        shopId: cart.shopId._id,
        items: cart.items.map((i) => ({ productId: i.productId._id, quantity: i.quantity })),
        deliveryType,
        customerNote,
      };

      if (deliveryType === 'delivery') {
        if (addressMode === 'map' && deliveryLocation) {
          orderData.deliveryLocation = {
            address: deliveryLocation.address,
            latitude: deliveryLocation.latitude,
            longitude: deliveryLocation.longitude,
          };
        } else if (addressMode === 'saved' && selectedAddressId) {
          orderData.addressId = selectedAddressId;
        }
      }

      const res = await api.post('/orders', orderData);
      
      if (res.data.success) {
        await clearCart();
        navigate('/orders', { state: { orderSuccess: true, orderNumber: res.data.data.orderNumber } });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!cart || !cart.shopId) {
    return (
      <MainLayout>
        <div className="flex justify-center p-20 text-gray-500 font-semibold">Your cart is empty.</div>
      </MainLayout>
    );
  }

  const deliveryFee = deliveryType === 'delivery' ? 40 : 0;
  const total = cart.subtotal + deliveryFee;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Checkout</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            
            {/* Delivery Type Selection */}
            <div className="bg-white shadow-xs rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="text-sky-600" size={22} /> Delivery Options
              </h2>
              <div className="flex gap-4">
                {cart.shopId.deliveryAvailable && (
                  <label className={`flex-1 border-2 rounded-xl p-4 cursor-pointer flex items-center transition-all ${
                    deliveryType === 'delivery' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input 
                      type="radio" 
                      name="deliveryType" 
                      value="delivery" 
                      checked={deliveryType === 'delivery'}
                      onChange={() => setDeliveryType('delivery')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="ml-3">
                      <span className="font-bold text-gray-900 block text-sm">Home Delivery</span>
                      <span className="text-xs text-gray-500">Delivered right to your doorstep</span>
                    </div>
                  </label>
                )}
                {cart.shopId.pickupAvailable && (
                  <label className={`flex-1 border-2 rounded-xl p-4 cursor-pointer flex items-center transition-all ${
                    deliveryType === 'pickup' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input 
                      type="radio" 
                      name="deliveryType" 
                      value="pickup" 
                      checked={deliveryType === 'pickup'}
                      onChange={() => setDeliveryType('pickup')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="ml-3">
                      <span className="font-bold text-gray-900 block text-sm">Store Pickup</span>
                      <span className="text-xs text-gray-500">Pick up in store for free</span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Delivery Location Section */}
            {deliveryType === 'delivery' && (
              <div className="bg-white shadow-xs rounded-2xl border border-gray-200 p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-rose-500" size={22} />
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 leading-tight">Delivery Location</h2>
                      <p className="text-xs text-gray-500">Sent directly to shop owner for accurate doorstep delivery</p>
                    </div>
                  </div>

                  {addresses.length > 0 && (
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setAddressMode('map')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          addressMode === 'map' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        📍 Live Map GPS
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddressMode('saved')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          addressMode === 'saved' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        📋 Saved Address
                      </button>
                    </div>
                  )}
                </div>

                {/* Mode: Live Map Pinpoint */}
                {addressMode === 'map' && (
                  <div>
                    {deliveryLocation ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-3 animate-scale-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                            <CheckCircle2 size={18} className="text-emerald-600" />
                            <span>Confirmed Delivery Location</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDeliveryLocation(null)}
                            className="text-xs font-bold text-sky-600 hover:text-sky-700 underline cursor-pointer"
                          >
                            Change Location
                          </button>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed font-semibold">
                          {deliveryLocation.address}
                        </p>
                        <div className="pt-2 border-t border-emerald-200/80 flex items-center gap-4 text-[11px] text-emerald-800 font-mono">
                          <span>Latitude: {deliveryLocation.latitude.toFixed(6)}</span>
                          <span>Longitude: {deliveryLocation.longitude.toFixed(6)}</span>
                        </div>
                      </div>
                    ) : (
                      <LocationPicker
                        onLocationConfirm={(loc) => setDeliveryLocation(loc)}
                        initialLocation={deliveryLocation}
                      />
                    )}
                  </div>
                )}

                {/* Mode: Saved Address */}
                {addressMode === 'saved' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Choose Saved Address</span>
                      {!showNewAddress && (
                        <button onClick={() => setShowNewAddress(true)} className="text-xs font-bold text-sky-600 hover:text-sky-700">
                          + Add New Address
                        </button>
                      )}
                    </div>

                    {showNewAddress ? (
                      <form onSubmit={handleSubmit(onAddAddress)} className="space-y-4 border border-gray-200 p-4 rounded-xl bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                            <input {...register('fullName')} type="text" className="input-field" />
                            {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                            <input {...register('phone')} type="text" className="input-field" />
                            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Address Line 1</label>
                            <input {...register('addressLine1')} type="text" className="input-field" />
                            {errors.addressLine1 && <p className="mt-1 text-xs text-red-600">{errors.addressLine1.message}</p>}
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Address Line 2 (Optional)</label>
                            <input {...register('addressLine2')} type="text" className="input-field" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                            <input {...register('city')} type="text" className="input-field" />
                            {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                            <input {...register('state')} type="text" className="input-field" />
                            {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state.message}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Postal Code</label>
                            <input {...register('postalCode')} type="text" className="input-field" />
                            {errors.postalCode && <p className="mt-1 text-xs text-red-600">{errors.postalCode.message}</p>}
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                          {addresses.length > 0 && (
                            <button type="button" onClick={() => setShowNewAddress(false)} className="btn-secondary py-2 px-3 text-xs">Cancel</button>
                          )}
                          <button type="submit" disabled={loading} className="btn-primary py-2 px-4 text-xs disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Address'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-3">
                        {addresses.map((address) => (
                          <label key={address._id} className={`block border-2 rounded-xl p-4 cursor-pointer transition-all ${
                            selectedAddressId === address._id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <div className="flex items-start">
                              <input 
                                type="radio" 
                                name="address" 
                                value={address._id}
                                checked={selectedAddressId === address._id}
                                onChange={() => setSelectedAddressId(address._id)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 mt-0.5" 
                              />
                              <div className="ml-3 text-xs">
                                <span className="font-bold text-gray-900 block text-sm">{address.fullName} ({address.phone})</span>
                                <span className="text-gray-600 block mt-1">{address.addressLine1} {address.addressLine2 && `, ${address.addressLine2}`}</span>
                                <span className="text-gray-500 block">{address.city}, {address.state} {address.postalCode}</span>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-white shadow-xs rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="text-emerald-600" size={22} /> Payment Method
              </h2>
              <div className="border-2 border-emerald-500 bg-emerald-50/70 rounded-xl p-4 flex items-center">
                <input type="radio" checked readOnly className="h-4 w-4 text-emerald-600" />
                <div className="ml-3">
                  <span className="block text-sm font-bold text-gray-900">Cash on Delivery (COD)</span>
                  <span className="block text-xs text-gray-500">Pay cash or UPI directly when your groceries arrive</span>
                </div>
              </div>
            </div>

            {/* Customer Note */}
            <div className="bg-white shadow-xs rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Delivery Instructions (Optional)</h2>
              <textarea 
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Doorbell instructions, nearby landmark, or instructions for the grocery shop..."
                className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm h-24"
              />
            </div>
            
          </div>

          {/* Order Summary Sidebar */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-white shadow-xs rounded-2xl border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">Order Summary</h2>
              
              <ul className="space-y-3.5 mb-6 max-h-64 overflow-y-auto pr-1">
                {cart.items.map((item) => (
                  <li key={item.productId._id} className="flex justify-between text-xs">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-gray-900 font-semibold truncate">{item.productId.name}</p>
                      <p className="text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-gray-900 font-bold">₹{(item.productId.price * item.quantity).toFixed(2)}</p>
                  </li>
                ))}
              </ul>

              <div className="space-y-2.5 border-t border-gray-100 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span className="font-semibold text-gray-900">₹{deliveryFee.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-base font-extrabold text-gray-900">Total</span>
                  <span className="text-xl font-black text-sky-600">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    placingOrder ||
                    (deliveryType === 'delivery' && addressMode === 'map' && !deliveryLocation) ||
                    (deliveryType === 'delivery' && addressMode === 'saved' && !selectedAddressId)
                  }
                  className="w-full flex items-center justify-center px-4 py-3.5 border border-transparent text-sm font-bold rounded-xl shadow-sm text-white btn-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {placingOrder ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin h-4 w-4" /> Placing Order...
                    </span>
                  ) : (
                    `Place Order • ₹${total.toFixed(2)}`
                  )}
                </button>
                {deliveryType === 'delivery' && addressMode === 'map' && !deliveryLocation && (
                  <p className="text-[11px] text-amber-700 text-center mt-2 font-medium">
                    ⚠️ Please confirm your map delivery location above
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Checkout;
