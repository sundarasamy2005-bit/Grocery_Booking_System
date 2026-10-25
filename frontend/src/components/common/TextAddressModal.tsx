import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Home,
  Briefcase,
  Navigation,
  Check,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAddressStore } from '../../store/addressStore';
import { useAuthStore } from '../../store/authStore';
import { Address, AddressFormData, AddressLabel } from '../../types';

export const TextAddressModal = () => {
  const {
    isModalOpen,
    closeModal,
    addresses,
    activeAddress,
    selectActiveAddress,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    editingAddress,
    isLoading,
  } = useAddressStore();

  const { isAuthenticated } = useAuthStore();

  // Mode: 'list' (choose / manage) or 'form' (add or edit)
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');

  // Form states
  const [houseStreet, setHouseStreet] = useState('');
  const [areaCity, setAreaCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [phone, setPhone] = useState('');
  const [label, setLabel] = useState<AddressLabel>('Home');
  const [isDefault, setIsDefault] = useState(false);

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Synchronize editing address if opened directly in edit mode or when list changes
  useEffect(() => {
    if (editingAddress) {
      setHouseStreet(editingAddress.houseStreet || editingAddress.addressLine1 || '');
      setAreaCity(editingAddress.areaCity || editingAddress.city || '');
      setPinCode(editingAddress.pinCode || editingAddress.postalCode || '');
      setLandmark(editingAddress.landmark || '');
      setPhone(editingAddress.phone || '');
      setLabel(editingAddress.label || 'Home');
      setIsDefault(Boolean(editingAddress.isDefault));
      setErrors({});
      setViewMode('form');
    } else if (addresses.length === 0) {
      resetForm();
      setViewMode('form');
    } else {
      setViewMode('list');
      setErrors({});
    }
  }, [editingAddress, addresses.length]);

  const resetForm = () => {
    setHouseStreet('');
    setAreaCity('');
    setPinCode('');
    setLandmark('');
    setPhone('');
    setLabel('Home');
    setIsDefault(false);
    setErrors({});
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!houseStreet.trim()) {
      errs.houseStreet = 'House / flat number and street name are required.';
    } else if (houseStreet.trim().length < 5) {
      errs.houseStreet = 'Please provide full street details (min 5 characters).';
    }

    if (!areaCity.trim()) {
      errs.areaCity = 'Area, town, or city is required.';
    }

    if (!pinCode.trim()) {
      errs.pinCode = '6-digit PIN code is required.';
    } else if (!/^\d{6}$/.test(pinCode.trim())) {
      errs.pinCode = 'Please enter a valid 6-digit PIN code (e.g. 642001).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: AddressFormData = {
      label,
      houseStreet: houseStreet.trim(),
      areaCity: areaCity.trim(),
      pinCode: pinCode.trim(),
      landmark: landmark.trim() || undefined,
      phone: phone.trim() || undefined,
      addressLine1: houseStreet.trim(),
      city: areaCity.trim(),
      postalCode: pinCode.trim(),
      state: 'Tamil Nadu',
      isDefault,
    };

    if (editingAddress) {
      const ok = await updateAddress(editingAddress._id, payload);
      if (ok) {
        resetForm();
        setViewMode('list');
      }
    } else {
      const res = await addAddress(payload);
      if (res) {
        resetForm();
        setViewMode('list');
      }
    }
  };

  const handleDelete = async (id: string) => {
    await deleteAddress(id);
    setConfirmDeleteId(null);
  };

  if (!isModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={closeModal}
    >
      <div
        className="bg-white dark:bg-[#172033] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-fade-in-up border border-slate-100 dark:border-[#2D3748] flex flex-col text-slate-900 dark:text-[#F9FAFB] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-[#2D3748] flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#172033]/95 backdrop-blur-md z-10 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-[#12352D] text-emerald-600 dark:text-[#34D399] flex items-center justify-center font-bold">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-[#F9FAFB] leading-tight">
                {viewMode === 'form'
                  ? editingAddress
                    ? 'Edit Delivery Address'
                    : 'Add Delivery Address'
                  : 'Choose Delivery Address'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A7B3C5] font-medium">
                {viewMode === 'form'
                  ? 'Enter your complete street address and 6-digit PIN code'
                  : 'Select where you would like your groceries delivered'}
              </p>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="text-slate-400 dark:text-[#A7B3C5] hover:text-slate-600 dark:hover:text-[#F9FAFB] p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#111827] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 flex-1">
          {viewMode === 'list' ? (
            <div className="space-y-4">
              {/* Add New Address Button */}
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setViewMode('form');
                }}
                className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-600 hover:border-emerald-500 bg-emerald-50/50 dark:bg-[#12352D]/40 hover:bg-emerald-50 text-emerald-700 dark:text-[#34D399] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus size={16} />
                Add New Delivery Address
              </button>

              {/* Saved Addresses List */}
              <div className="space-y-3">
                {addresses.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 dark:text-[#A7B3C5]">
                    <MapPin size={36} className="mx-auto mb-2 text-slate-300 dark:text-[#2D3748]" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-[#F9FAFB]">No saved delivery addresses found.</p>
                    <p className="text-[11px] text-slate-400 dark:text-[#A7B3C5] mt-0.5">Click above to add your first address.</p>
                  </div>
                ) : (
                  addresses.map((addr) => {
                    const isSelected = activeAddress?._id === addr._id;
                    const labelIcon =
                      addr.label === 'Work' ? (
                        <Briefcase size={14} />
                      ) : addr.label === 'Other' ? (
                        <Navigation size={14} />
                      ) : (
                        <Home size={14} />
                      );

                    return (
                      <div
                        key={addr._id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-[#12352D]/40 ring-2 ring-emerald-200 dark:ring-emerald-800 shadow-sm'
                            : 'border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#111827] hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => {
                              selectActiveAddress(addr);
                              closeModal();
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#172033] text-slate-800 dark:text-[#F9FAFB]">
                                {labelIcon}
                                {addr.label}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                  Default
                                </span>
                              )}
                              {isSelected && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-0.5">
                                  <Check size={10} strokeWidth={3} /> Delivering Here
                                </span>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-[#F9FAFB] leading-snug">
                              {addr.houseStreet || addr.addressLine1}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-[#A7B3C5] mt-0.5">
                              {addr.areaCity || addr.city} - {addr.pinCode || addr.postalCode}
                            </p>
                            {addr.landmark && (
                              <p className="text-[11px] text-slate-400 dark:text-[#A7B3C5]/80 mt-0.5">
                                Landmark: {addr.landmark}
                              </p>
                            )}
                            {addr.phone && (
                              <p className="text-[11px] text-slate-400 dark:text-[#A7B3C5]/80 mt-0.5">
                                Phone: {addr.phone}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                useAddressStore.setState({ editingAddress: addr });
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-[#172033] transition-colors cursor-pointer"
                              title="Edit address"
                            >
                              <Edit2 size={14} />
                            </button>

                            {confirmDeleteId === addr._id ? (
                              <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/40 p-1 rounded-xl">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(addr._id)}
                                  className="text-[10px] font-bold text-red-600 hover:underline px-1.5 py-1"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-[10px] text-slate-600 dark:text-[#A7B3C5] px-1 py-1"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(addr._id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                title="Delete address"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Set default link if not default */}
                        {!addr.isDefault && (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-[#2D3748] flex items-center justify-between text-[11px]">
                            <button
                              type="button"
                              onClick={() => setDefaultAddress(addr._id)}
                              className="text-slate-500 dark:text-[#A7B3C5] hover:text-emerald-600 dark:hover:text-[#34D399] font-semibold cursor-pointer"
                            >
                              Set as default address
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Address Form View (Add / Edit) */
            <form onSubmit={handleSave} className="space-y-4">
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
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-[#12352D] text-emerald-700 dark:text-[#34D399] ring-2 ring-emerald-200 dark:ring-emerald-800'
                          : 'border-slate-200 dark:border-[#2D3748] text-slate-700 dark:text-[#A7B3C5] hover:bg-slate-50 dark:hover:bg-[#111827]'
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

              {/* House Number / Street */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#A7B3C5] mb-1">
                  House Number / Street *
                </label>
                <input
                  type="text"
                  value={houseStreet}
                  onChange={(e) => {
                    setHouseStreet(e.target.value);
                    if (errors.houseStreet) setErrors((prev) => ({ ...prev, houseStreet: '' }));
                  }}
                  placeholder="e.g. No. 12, Anna Nagar"
                  maxLength={200}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 ${
                    errors.houseStreet
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                      : 'border-slate-200 dark:border-[#2D3748] focus:ring-emerald-500 bg-white dark:bg-[#111827] text-slate-900 dark:text-[#F9FAFB] placeholder-slate-400 dark:placeholder-[#A7B3C5]'
                  }`}
                />
                {errors.houseStreet && (
                  <p className="text-[11px] text-red-500 font-bold mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.houseStreet}
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
                    if (errors.areaCity) setErrors((prev) => ({ ...prev, areaCity: '' }));
                  }}
                  placeholder="e.g. Pollachi, Coimbatore"
                  maxLength={120}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 ${
                    errors.areaCity
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                      : 'border-slate-200 dark:border-[#2D3748] focus:ring-emerald-500 bg-white dark:bg-[#111827] text-slate-900 dark:text-[#F9FAFB] placeholder-slate-400 dark:placeholder-[#A7B3C5]'
                  }`}
                />
                {errors.areaCity && (
                  <p className="text-[11px] text-red-500 font-bold mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.areaCity}
                  </p>
                )}
              </div>

              {/* PIN Code (Exactly 6 digits) */}
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
                    if (errors.pinCode) setErrors((prev) => ({ ...prev, pinCode: '' }));
                  }}
                  placeholder="e.g. 642001"
                  maxLength={6}
                  inputMode="numeric"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 ${
                    errors.pinCode
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                      : 'border-slate-200 dark:border-[#2D3748] focus:ring-emerald-500 bg-white dark:bg-[#111827] text-slate-900 dark:text-[#F9FAFB] placeholder-slate-400 dark:placeholder-[#A7B3C5]'
                  }`}
                />
                {errors.pinCode && (
                  <p className="text-[11px] text-red-500 font-bold mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.pinCode}
                  </p>
                )}
              </div>

              {/* Landmark (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#A7B3C5] mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => {
                    setLandmark(e.target.value);
                    if (errors.landmark) setErrors((prev) => ({ ...prev, landmark: '' }));
                  }}
                  placeholder="e.g. Near Bus Stand / Bismi Supermarket"
                  maxLength={150}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2D3748] text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-[#111827] text-slate-900 dark:text-[#F9FAFB] placeholder-slate-400 dark:placeholder-[#A7B3C5]"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2D3748] text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-[#111827] text-slate-900 dark:text-[#F9FAFB] placeholder-slate-400 dark:placeholder-[#A7B3C5]"
                />
              </div>

              {/* Set as default checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-[#2D3748] dark:bg-[#111827]"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-[#A7B3C5]">Make this my default delivery address</span>
              </label>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-[#2D3748]">
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setViewMode('list');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2D3748] text-slate-700 dark:text-[#A7B3C5] text-xs sm:text-sm font-bold hover:bg-slate-50 dark:hover:bg-[#111827] transition-colors cursor-pointer"
                  >
                    Back to List
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextAddressModal;
