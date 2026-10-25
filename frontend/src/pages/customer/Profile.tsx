import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Heart,
  Settings,
  HelpCircle,
  LogOut,
  Edit2,
  Check,
  X,
  Plus,
  Trash2,
  AlertTriangle,
  Shield,
  Star,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuthStore } from '../../store/authStore';
import { useAddressStore } from '../../store/addressStore';
import { toast } from '../../store/toastStore';
import { userApi } from '../../services/api';
import { Address } from '../../types';

export const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout, updateUser } = useAuthStore();
  const {
    addresses,
    isLoading: addressesLoading,
    fetchAddresses,
    deleteAddress,
    setDefaultAddress,
    openModal: openAddressModal,
  } = useAddressStore();

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Deactivate Account Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated, fetchAddresses]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await userApi.updateProfile({ name: name.trim(), phone: phone.trim() });
      updateUser({ name: updated.name, phone: updated.phone });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      toast.error(err.response?.data?.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmPhrase.toLowerCase() !== 'delete') {
      toast.error('Please type "delete" to confirm');
      return;
    }

    try {
      setDeleting(true);
      await userApi.deleteAccount();
      toast.info('Your account has been deactivated');
      await logout();
      navigate('/');
    } catch (err: any) {
      console.error('Failed to deactivate account:', err);
      toast.error(err.response?.data?.message || 'Failed to deactivate account');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (authLoading || !user) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-6">
          <div className="h-40 bg-slate-100 dark:bg-[#172033] rounded-3xl" />
          <div className="h-64 bg-slate-100 dark:bg-[#172033] rounded-3xl" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Profile Card Header */}
        <div className="bg-white dark:bg-[#172033] rounded-3xl border border-slate-200/80 dark:border-[#2D3748] p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative">
                <img
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl object-cover border-4 border-sky-100 dark:border-sky-950/60 shadow-md"
                  src={
                    user.profileImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name
                    )}&background=0284c7&color=ffffff&bold=true&size=128`
                  }
                  alt={user.name}
                />
                <span className="absolute -bottom-1 -right-1 h-6 px-2 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center shadow-xs">
                  {user.role}
                </span>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F9FAFB] tracking-tight">
                  {user.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A7B3C5] flex items-center gap-1.5 mt-1">
                  <Mail size={13} className="text-slate-400 dark:text-[#A7B3C5]" />
                  {user.email}
                </p>
                {user.phone ? (
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A7B3C5] flex items-center gap-1.5 mt-0.5">
                    <Phone size={13} className="text-slate-400 dark:text-[#A7B3C5]" />
                    {user.phone}
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                    No phone number provided
                  </p>
                )}
              </div>
            </div>

            <div>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-sky-50 dark:bg-[#12352D] text-sky-700 dark:text-emerald-300 hover:bg-sky-100 dark:hover:bg-emerald-950/60 font-extrabold text-xs transition-all cursor-pointer"
                >
                  <Edit2 size={13} /> Edit Profile
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setName(user.name || '');
                    setPhone(user.phone || '');
                    setIsEditing(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-[#F9FAFB] hover:bg-slate-200 dark:hover:bg-[#172033] border dark:border-[#2D3748] font-bold text-xs transition-all cursor-pointer"
                >
                  <X size={13} /> Cancel
                </button>
              )}
            </div>
          </div>

          {/* Edit Form Drawer */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-slate-100 dark:border-[#2D3748] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#F9FAFB] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-xs font-semibold text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#F9FAFB] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-xs font-semibold text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2D3748] text-slate-700 dark:text-[#A7B3C5] font-bold text-xs hover:bg-slate-50 dark:hover:bg-[#111827] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Quick Nav Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Link
            to="/orders"
            className="p-4 rounded-2xl bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-[#2D3748] hover:border-emerald-300 dark:hover:border-emerald-600/50 hover:shadow-md transition-all flex flex-col items-center justify-center text-center group"
          >
            <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Package size={20} />
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-[#F9FAFB]">My Orders</span>
            <span className="text-[10px] text-slate-400 dark:text-[#A7B3C5] mt-0.5">Track & History</span>
          </Link>

          <Link
            to="/favourites"
            className="p-4 rounded-2xl bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-[#2D3748] hover:border-red-300 dark:hover:border-red-600/50 hover:shadow-md transition-all flex flex-col items-center justify-center text-center group"
          >
            <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Heart size={20} className="fill-red-500" />
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-[#F9FAFB]">Favourites</span>
            <span className="text-[10px] text-slate-400 dark:text-[#A7B3C5] mt-0.5">Saved Groceries</span>
          </Link>

          <Link
            to="/help"
            className="p-4 rounded-2xl bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-[#2D3748] hover:border-amber-300 dark:hover:border-amber-600/50 hover:shadow-md transition-all flex flex-col items-center justify-center text-center group"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <HelpCircle size={20} />
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-[#F9FAFB]">Help & Support</span>
            <span className="text-[10px] text-slate-400 dark:text-[#A7B3C5] mt-0.5">FAQs & Contact</span>
          </Link>

          <Link
            to="/settings"
            className="p-4 rounded-2xl bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-[#2D3748] hover:border-purple-300 dark:hover:border-purple-600/50 hover:shadow-md transition-all flex flex-col items-center justify-center text-center group"
          >
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Settings size={20} />
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-[#F9FAFB]">Settings</span>
            <span className="text-[10px] text-slate-400 dark:text-[#A7B3C5] mt-0.5">Preferences</span>
          </Link>
        </div>

        {/* Saved Addresses Section */}
        <div id="addresses" className="bg-white dark:bg-[#172033] rounded-3xl border border-slate-200/80 dark:border-[#2D3748] p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-[#F9FAFB] tracking-tight flex items-center gap-2">
                <MapPin size={18} className="text-emerald-600 dark:text-emerald-400" /> Saved Delivery Addresses
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-0.5">
                Manage your home, work, and custom addresses for fast checkout
              </p>
            </div>

            <button
              type="button"
              onClick={() => openAddressModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus size={14} /> Add Address
            </button>
          </div>

          {addressesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-slate-100 dark:bg-[#111827] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 dark:border-[#2D3748] rounded-2xl">
              <MapPin size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-[#F9FAFB]">No saved addresses yet</p>
              <p className="text-[11px] text-slate-400 dark:text-[#A7B3C5] mt-0.5">
                Add your home or work address so you don't have to retype it at checkout
              </p>
              <button
                type="button"
                onClick={() => openAddressModal()}
                className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                + Add your first address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {addresses.map((addr: Address) => (
                <div
                  key={addr._id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    addr.isDefault
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-[#12352D]/40 ring-1 ring-emerald-200 dark:ring-emerald-800'
                      : 'border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#111827] hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#172033] text-slate-700 dark:text-[#F9FAFB] border dark:border-[#2D3748]">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-black text-slate-900 dark:text-[#F9FAFB] leading-snug">
                      {addr.houseStreet || addr.addressLine1}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-0.5">
                      {addr.areaCity || addr.city} - {addr.pinCode || addr.postalCode}
                    </p>
                    {addr.phone && (
                      <p className="text-[11px] text-slate-400 dark:text-[#A7B3C5] mt-1">Phone: {addr.phone}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#2D3748] flex items-center justify-between text-xs font-bold">
                    {!addr.isDefault ? (
                      <button
                        type="button"
                        onClick={() => setDefaultAddress(addr._id)}
                        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 cursor-pointer"
                      >
                        Set as Default
                      </button>
                    ) : (
                      <span className="text-slate-400 dark:text-[#A7B3C5]">Default Address</span>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openAddressModal(addr)}
                        className="text-slate-500 dark:text-[#A7B3C5] hover:text-emerald-600 dark:hover:text-emerald-400 p-1 cursor-pointer"
                        title="Edit address"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Delete this saved address?')) {
                            deleteAddress(addr._id);
                          }
                        }}
                        className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-1 cursor-pointer"
                        title="Delete address"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Security & Deactivation Section */}
        <div className="bg-white dark:bg-[#172033] rounded-3xl border border-red-100 dark:border-red-950/60 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-[#F9FAFB] tracking-tight flex items-center gap-2">
                <Shield size={18} className="text-red-500" /> Account Deactivation
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-1 max-w-lg">
                Permanently deactivate your customer profile and clear saved sessions. Historical orders are archived for accounting and merchant compliance.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmPhrase('');
                setDeleteModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Deactivate Account
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Account Deletion */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#172033] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-[#2D3748] space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-[#F9FAFB]">Deactivate Your Account?</h3>
              <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-2 leading-relaxed">
                This action will mark your account inactive and log you out. In compliance with commercial bookkeeping standards, past orders and invoice records will be preserved for store audit records.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#2D3748]">
              <label className="block text-xs font-bold text-slate-700 dark:text-[#F9FAFB] mb-1.5 text-center">
                Type <span className="text-red-600 dark:text-red-400 uppercase font-black">delete</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                placeholder="delete"
                className="w-full text-center px-3 py-2 rounded-xl border border-slate-300 dark:border-[#2D3748] bg-white dark:bg-[#172033] text-xs font-bold uppercase text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#2D3748] text-slate-700 dark:text-[#A7B3C5] font-bold text-xs hover:bg-slate-50 dark:hover:bg-[#111827] transition-colors cursor-pointer"
              >
                Keep Account
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || confirmPhrase.toLowerCase() !== 'delete'}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-all shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Profile;
