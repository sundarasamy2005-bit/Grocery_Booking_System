import { useState, useEffect, useCallback } from 'react';
import {
  Store,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  MapPin,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { Shop } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { format } from 'date-fns';

export const AdminShops = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalShops, setTotalShops] = useState(0);

  const toast = useToastStore();

  const fetchShops = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter === 'pending') params.approved = 'false';
      if (statusFilter === 'approved') params.approved = 'true';

      const res = await api.get('/admin/shops', { params });
      if (res.data.success) {
        setShops(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalShops(res.data.pagination.total || 0);
        }
      }
    } catch (err: any) {
      console.error('Failed to load shops', err);
      toast.error('Failed to fetch stores list');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, toast]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const handleApprove = async (id: string, approve: boolean) => {
    const confirmMsg = approve
      ? 'Approve this shop for public discovery on LocalGrocery?'
      : 'Suspend/revoke approval for this store?';

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.patch(`/admin/shops/${id}/approve`, { isApproved: approve });
      if (res.data.success) {
        setShops((prev) =>
          prev.map((s) => (s._id === id ? { ...s, isApproved: approve } : s))
        );
        toast.success(`Store ${approve ? 'approved' : 'suspended'} successfully`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update store approval');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await api.patch(`/admin/shops/${id}/approve`, { isActive: !currentActive });
      if (res.data.success) {
        setShops((prev) =>
          prev.map((s) => (s._id === id ? { ...s, isActive: !currentActive } : s))
        );
        toast.success(`Store active status toggled`);
      }
    } catch (err: any) {
      toast.error('Failed to update active state');
    }
  };

  const pendingCount = shops.filter((s) => !s.isApproved).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-[#F9FAFB] tracking-tight">
            Shop Management & KYC Approvals
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-0.5">
            Verify independent grocery stores, audit operating parameters, and enforce quality ({totalShops} stores)
          </p>
        </div>

        <button
          onClick={fetchShops}
          className="btn-secondary py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs dark:bg-[#172033] dark:border-[#2D3748] dark:text-[#F9FAFB] dark:hover:bg-[#111827] cursor-pointer"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="card p-4 border border-slate-100 dark:border-[#2D3748] flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-[#111827] rounded-xl w-full sm:w-auto">
          <button
            onClick={() => {
              setStatusFilter('all');
              setPage(1);
            }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-[#172033] text-slate-900 dark:text-[#F9FAFB] shadow-2xs'
                : 'text-slate-500 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB]'
            }`}
          >
            All Stores
          </button>
          <button
            onClick={() => {
              setStatusFilter('pending');
              setPage(1);
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200'
            }`}
          >
            <span>Pending Review</span>
            {pendingCount > 0 && (
              <span className="h-4 min-w-[16px] px-1 rounded-full bg-white dark:bg-[#172033] text-amber-800 dark:text-amber-300 text-[10px] font-black flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setStatusFilter('approved');
              setPage(1);
            }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-white dark:bg-[#172033] text-slate-900 dark:text-[#F9FAFB] shadow-2xs'
                : 'text-slate-500 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB]'
            }`}
          >
            Verified Only
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#A7B3C5]" size={15} />
          <input
            type="text"
            placeholder="Filter by shop name or city..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input-field pl-10 text-xs py-2 rounded-xl w-full"
          />
        </div>
      </div>

      {/* Stores Table */}
      <div className="card overflow-hidden border border-slate-100 dark:border-[#2D3748] shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-[#A7B3C5] space-y-2">
            <RefreshCw className="animate-spin h-6 w-6 mx-auto text-emerald-600 dark:text-emerald-400" />
            <p>Loading stores list...</p>
          </div>
        ) : shops.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-[#A7B3C5]">
            No grocery stores found under the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-[#2D3748] text-xs">
              <thead className="bg-slate-50/70 dark:bg-[#111827] text-slate-400 dark:text-[#A7B3C5] uppercase font-black tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 text-left">Store Profile</th>
                  <th className="px-6 py-3.5 text-left">Location</th>
                  <th className="px-6 py-3.5 text-left">Order Min.</th>
                  <th className="px-6 py-3.5 text-left">Fulfillment</th>
                  <th className="px-6 py-3.5 text-left">Verification</th>
                  <th className="px-6 py-3.5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2D3748] bg-white dark:bg-[#172033] font-medium text-slate-700 dark:text-[#A7B3C5]">
                {shops.map((shop) => (
                  <tr key={shop._id} className="hover:bg-slate-50/80 dark:hover:bg-[#111827] transition-colors">
                    {/* Store Image & Name */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-[#111827] overflow-hidden shrink-0 border border-slate-200 dark:border-[#2D3748]">
                          {shop.shopImage ? (
                            <img src={shop.shopImage} alt="" className="h-full w-full object-cover dark:mix-blend-normal" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-400 font-black">
                              <Store size={18} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 dark:text-[#F9FAFB] truncate">{shop.shopName}</p>
                          <p className="text-[11px] text-slate-400 dark:text-[#A7B3C5] truncate">
                            Owner ID: {String(shop.ownerId).slice(-6)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-3.5">
                      <p className="text-slate-800 dark:text-[#F9FAFB] font-semibold truncate max-w-[140px]">{shop.city}</p>
                      <p className="text-[11px] text-slate-400 dark:text-[#A7B3C5] truncate max-w-[140px]">{shop.address}</p>
                    </td>

                    {/* Minimum Order */}
                    <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-[#F9FAFB]">
                      ₹{shop.minimumOrderAmount || 0}
                    </td>

                    {/* Fulfillment Badges */}
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col gap-1 w-fit">
                        {shop.deliveryAvailable && (
                          <span className="badge-green text-[9px] py-0.2">🚚 Delivery</span>
                        )}
                        {shop.pickupAvailable && (
                          <span className="badge-blue text-[9px] py-0.2">🛍 Pickup</span>
                        )}
                      </div>
                    </td>

                    {/* Approval Status */}
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          shop.isApproved
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {shop.isApproved ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                        {shop.isApproved ? 'Approved' : 'Pending Review'}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!shop.isApproved ? (
                          <button
                            onClick={() => handleApprove(shop._id, true)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black transition-colors shadow-2xs cursor-pointer"
                          >
                            Approve Store
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApprove(shop._id, false)}
                            className="px-3 py-1 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50/70 dark:bg-[#111827] border-t border-slate-100 dark:border-[#2D3748] flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-[#A7B3C5]">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#172033] hover:bg-slate-50 dark:hover:bg-[#111827] disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#172033] hover:bg-slate-50 dark:hover:bg-[#111827] disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminShops;
