import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Shield,
  Store,
  User as UserIcon,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { format } from 'date-fns';

export const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const toast = useToastStore();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;

      const res = await api.get('/admin/users', { params });
      if (res.data.success) {
        setUsers(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalUsers(res.data.pagination.total || 0);
        }
      }
    } catch (err: any) {
      console.error('Failed to load users', err);
      toast.error('Failed to fetch user list');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user: User) => {
    const nextState = !user.isActive;
    const confirmMsg = nextState
      ? `Re-activate ${user.name}'s account?`
      : `Suspend ${user.name}'s account? They will not be able to log in.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.patch(`/admin/users/${user._id}`, { isActive: nextState });
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, isActive: nextState } : u))
        );
        toast.success(`Account ${nextState ? 'activated' : 'suspended'} successfully`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await api.patch(`/admin/users/${userId}`, { role: newRole });
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole as any } : u))
        );
        toast.success(`Role updated to ${newRole}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit registered customer, shop owner, and administrator accounts ({totalUsers} total)
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="btn-secondary py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 border border-slate-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by user name or email address..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input-field pl-10 text-xs sm:text-sm py-2.5 rounded-xl w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400 shrink-0" />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Roles</option>
            <option value="customer">Customer Only</option>
            <option value="shopOwner">Shop Owner Only</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden border border-slate-100 shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <RefreshCw className="animate-spin h-6 w-6 mx-auto text-sky-600" />
            <p>Loading accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No users match the search and role filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50/70 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 text-left">User Profile</th>
                  <th className="px-6 py-3.5 text-left">Role</th>
                  <th className="px-6 py-3.5 text-left">Account Status</th>
                  <th className="px-6 py-3.5 text-left">Member Since</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                {users.map((u) => {
                  const roleBadges: Record<string, string> = {
                    admin: 'bg-rose-100 text-rose-800 border-rose-200',
                    shopOwner: 'bg-purple-100 text-purple-800 border-purple-200',
                    customer: 'bg-slate-100 text-slate-800 border-slate-200',
                  };

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              u.profileImage ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                u.name
                              )}&background=0284c7&color=ffffff&bold=true`
                            }
                            alt=""
                            className="h-9 w-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 truncate">{u.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3.5">
                        {u.role === 'admin' ? (
                          <span className="badge-red text-[10px] font-black uppercase flex items-center gap-1 w-fit">
                            <Shield size={11} /> Admin
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className={`text-[11px] font-black px-2 py-1 rounded-lg border uppercase focus:outline-none ${
                              roleBadges[u.role] || 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            <option value="customer">Customer</option>
                            <option value="shopOwner">Shop Owner</option>
                          </select>
                        )}
                      </td>

                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {u.isActive ? <CheckCircle size={11} /> : <XCircle size={11} />}
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-slate-500">
                        {format(new Date(u.createdAt), 'MMM dd, yyyy')}
                      </td>

                      <td className="px-6 py-3.5 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors ${
                              u.isActive
                                ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                          >
                            {u.isActive ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
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

export default AdminUsers;
