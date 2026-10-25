import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  Truck,
  Store,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cpu
} from 'lucide-react';
import { api } from '../../services/api';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ShopSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Shop basic & operational settings
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('21:00');
  const [operatingDays, setOperatingDays] = useState<string[]>(WEEK_DAYS);
  const [announcement, setAnnouncement] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(30);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(500);
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState(30);
  const [minimumOrderAmount, setMinimumOrderAmount] = useState(100);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [pickupAvailable, setPickupAvailable] = useState(true);

  // Load current shop settings
  useEffect(() => {
    let isMounted = true;
    const fetchShopSettings = async () => {
      try {
        setLoading(true);
        const shopRes = await api.get('/shops/my');

        if (isMounted && shopRes.data?.success && shopRes.data.data) {
          const s = shopRes.data.data;
          setShopId(s._id);
          setShopName(s.shopName || '');
          setIsOpen(s.isOpen ?? true);
          setOpeningTime(s.openingTime || '08:00');
          setClosingTime(s.closingTime || '21:00');
          if (Array.isArray(s.operatingDays) && s.operatingDays.length > 0) {
            setOperatingDays(s.operatingDays);
          }
          setAnnouncement(s.announcement || '');
          setDeliveryFee(s.deliveryFee ?? 30);
          setFreeDeliveryThreshold(s.freeDeliveryThreshold ?? 500);
          setEstimatedDeliveryTime(s.estimatedDeliveryTime ?? 30);
          setMinimumOrderAmount(s.minimumOrderAmount ?? 0);
          setDeliveryAvailable(s.deliveryAvailable ?? true);
          setPickupAvailable(s.pickupAvailable ?? true);
        }
      } catch (err: any) {
        console.error('Failed to load shop settings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchShopSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleDay = (day: string) => {
    if (operatingDays.includes(day)) {
      if (operatingDays.length > 1) {
        setOperatingDays(operatingDays.filter((d) => d !== day));
      }
    } else {
      setOperatingDays([...operatingDays, day]);
    }
  };

  const handleSaveAllSettings = async () => {
    try {
      setSaving(true);
      setFeedback(null);

      // Save Shop entity settings
      if (shopId) {
        await api.put(`/shops/${shopId}`, {
          isOpen,
          openingTime,
          closingTime,
          operatingDays,
          announcement,
          deliveryFee: Number(deliveryFee),
          freeDeliveryThreshold: Number(freeDeliveryThreshold),
          estimatedDeliveryTime: Number(estimatedDeliveryTime),
          minimumOrderAmount: Number(minimumOrderAmount),
          deliveryAvailable,
          pickupAvailable,
        });
      }

      setFeedback({
        type: 'success',
        message: 'Store operating hours, delivery rules, and preferences saved successfully!',
      });
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save settings. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        <span className="text-sm">Loading store management settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F9FAFB] flex items-center gap-2">
            <Settings className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Store Management Settings
          </h1>
          <p className="text-xs text-gray-500 dark:text-[#A7B3C5] mt-0.5">
            Manage your operating schedule, store vacation mode, storefront announcements, and delivery pricing rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/shop/automation"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-[#172033] border border-gray-200 dark:border-[#2D3748] hover:bg-gray-50 dark:hover:bg-[#111827] text-gray-700 dark:text-[#F9FAFB] text-xs font-bold rounded-xl shadow-2xs transition-all"
          >
            <Cpu className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Automation Center</span>
          </Link>
          <button
            onClick={handleSaveAllSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* ─── SECTION 1: Store Operating Schedule & Customer Announcement ─── */}
      <div className="bg-white dark:bg-[#172033] rounded-3xl p-6 border border-gray-200 dark:border-[#2D3748] shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#2D3748]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-[#F9FAFB]">Operating Hours & Store Status</h2>
              <p className="text-xs text-gray-500 dark:text-[#A7B3C5]">Control when customers can view and place orders from your store</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${isOpen ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'}`}>
              {isOpen ? 'Store Active (Open)' : 'Vacation Mode (Closed)'}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isOpen ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isOpen ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Operating Hours */}
          <div className="space-y-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-[#F9FAFB] uppercase tracking-wider">
              Daily Business Hours
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500 dark:text-[#A7B3C5] block mb-1">Opening Time</span>
                <input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 border border-gray-300 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-[#A7B3C5] block mb-1">Closing Time</span>
                <input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 border border-gray-300 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Operating Days pills */}
            <div>
              <span className="text-xs text-gray-500 dark:text-[#A7B3C5] block mb-2">Operating Days</span>
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS.map((day) => {
                  const active = operatingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-gray-100 dark:bg-[#111827] text-gray-600 dark:text-[#A7B3C5] hover:bg-gray-200 dark:hover:bg-[#172033]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Customer Announcement Banner */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-[#F9FAFB] uppercase tracking-wider">
              Storefront Announcement Banner (Visible to Customers)
            </label>
            <textarea
              rows={4}
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="e.g., Today's Special: 10% off fresh farm vegetables! Free delivery on orders above ₹499."
              className="w-full p-3 text-xs sm:text-sm border border-gray-300 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-gray-500 dark:text-[#A7B3C5]">
              This message is highlighted on your shop profile page for all local customers.
            </p>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: Order, Delivery & Pickup Rules ─── */}
      <div className="bg-white dark:bg-[#172033] rounded-3xl p-6 border border-gray-200 dark:border-[#2D3748] shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-[#2D3748]">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-[#F9FAFB]">Delivery, Pickup & Order Thresholds</h2>
            <p className="text-xs text-gray-500 dark:text-[#A7B3C5]">Manage minimum checkout thresholds and delivery charges</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-[#F9FAFB] mb-1">Minimum Order Value (₹)</label>
            <input
              type="number"
              min={0}
              value={minimumOrderAmount}
              onChange={(e) => setMinimumOrderAmount(Number(e.target.value))}
              className="w-full text-xs sm:text-sm p-2.5 border border-gray-300 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-gray-500 dark:text-[#A7B3C5]">Minimum basket value required</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-[#F9FAFB] mb-1">Standard Delivery Fee (₹)</label>
            <input
              type="number"
              min={0}
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(Number(e.target.value))}
              className="w-full text-xs sm:text-sm p-2.5 border border-gray-300 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-gray-500 dark:text-[#A7B3C5]">Standard charge for home delivery</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-[#F9FAFB] mb-1">Free Delivery Above (₹)</label>
            <input
              type="number"
              min={0}
              value={freeDeliveryThreshold}
              onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
              className="w-full text-xs sm:text-sm p-2.5 border border-gray-300 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-gray-500 dark:text-[#A7B3C5]">Orders qualifying for free delivery</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-[#F9FAFB] mb-1">Est. Delivery Time (Mins)</label>
            <input
              type="number"
              min={10}
              value={estimatedDeliveryTime}
              onChange={(e) => setEstimatedDeliveryTime(Number(e.target.value))}
              className="w-full text-xs sm:text-sm p-2.5 border border-gray-300 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-gray-500 dark:text-[#A7B3C5]">Displayed to nearby shoppers</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-100 dark:border-[#2D3748]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={deliveryAvailable}
              onChange={(e) => setDeliveryAvailable(e.target.checked)}
              className="h-4 w-4 text-emerald-600 rounded cursor-pointer"
            />
            <span className="text-xs font-bold text-gray-800 dark:text-[#F9FAFB]">Home Delivery Available</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pickupAvailable}
              onChange={(e) => setPickupAvailable(e.target.checked)}
              className="h-4 w-4 text-emerald-600 rounded cursor-pointer"
            />
            <span className="text-xs font-bold text-gray-800 dark:text-[#F9FAFB]">Store Counter Pickup Available</span>
          </label>
        </div>
      </div>

      {/* Save Button Bottom */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#2D3748]">
        <button
          onClick={handleSaveAllSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {saving ? 'Saving Preferences...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default ShopSettings;
