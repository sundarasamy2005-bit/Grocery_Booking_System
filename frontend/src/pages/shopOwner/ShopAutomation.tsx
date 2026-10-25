import { useState, useEffect } from 'react';
import {
  Cpu,
  Clock,
  ShieldAlert,
  Mail,
  Play,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Bell,
  RefreshCw,
  CheckCheck,
  Send,
  Loader2,
  Settings
} from 'lucide-react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';

interface JobState {
  enabled: boolean;
  intervalHours?: number;
  preferredHour?: number;
  preferredMinute?: number;
  customTime?: string;
  dayOfWeek?: number;
  emailNotification?: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  lastStatus: 'idle' | 'running' | 'success' | 'failed';
  lastError?: string;
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'stock_alert' | 'sales_summary' | 'order_update' | 'system';
  severity: 'info' | 'warning' | 'critical';
  read: boolean;
  createdAt: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const format12HourTime = (timeStr?: string): string => {
  if (!timeStr) return '9:00 PM';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const minStr = String(m).padStart(2, '0');
  return `${hour12}:${minStr} ${period}`;
};

const getTimeOfDayLabel = (timeStr?: string): string => {
  if (!timeStr) return 'every evening';
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  if (isNaN(h)) return 'every evening';
  if (h >= 4 && h < 12) return 'every morning';
  if (h >= 12 && h < 17) return 'every afternoon';
  if (h >= 17 && h < 22) return 'every evening';
  return 'every night';
};

export const ShopAutomation = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [notificationEmail, setNotificationEmail] = useState('');
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  const [lowStockCheck, setLowStockCheck] = useState<JobState>({
    enabled: true,
    intervalHours: 6,
    emailNotification: true,
    lastStatus: 'idle',
  });

  const [dailySalesSummary, setDailySalesSummary] = useState<JobState>({
    enabled: true,
    preferredHour: 21,
    preferredMinute: 0,
    customTime: '21:00',
    emailNotification: true,
    lastStatus: 'idle',
  });

  const [weeklyBusinessReport, setWeeklyBusinessReport] = useState<JobState>({
    enabled: true,
    dayOfWeek: 0,
    preferredHour: 20,
    preferredMinute: 0,
    customTime: '20:00',
    emailNotification: true,
    lastStatus: 'idle',
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/shop/automation/settings');
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        setNotificationEmail(d.notificationEmail || '');
        setEmailAlertsEnabled(d.emailAlertsEnabled ?? true);
        setLowStockThreshold(d.lowStockThreshold ?? 10);

        if (d.lowStockCheck) setLowStockCheck(d.lowStockCheck);
        if (d.dailySalesSummary) {
          setDailySalesSummary({
            ...d.dailySalesSummary,
            customTime: d.dailySalesSummary.customTime || `${String(d.dailySalesSummary.preferredHour ?? 21).padStart(2, '0')}:${String(d.dailySalesSummary.preferredMinute ?? 0).padStart(2, '0')}`,
          });
        }
        if (d.weeklyBusinessReport) {
          setWeeklyBusinessReport({
            ...d.weeklyBusinessReport,
            customTime: d.weeklyBusinessReport.customTime || `${String(d.weeklyBusinessReport.preferredHour ?? 20).padStart(2, '0')}:${String(d.weeklyBusinessReport.preferredMinute ?? 0).padStart(2, '0')}`,
          });
        }
        if (d.notifications) setNotifications(d.notifications);
      }
    } catch (err: any) {
      console.error('Failed to load automation settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setStatusMessage(null);
      const res = await api.put('/shop/automation/settings', {
        notificationEmail,
        emailAlertsEnabled,
        lowStockThreshold,
        lowStockCheck,
        dailySalesSummary,
        weeklyBusinessReport,
      });
      if (res.data?.success) {
        setStatusMessage('Automation and notification times saved successfully!');
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      console.error('Failed to save automation settings', err);
      alert(err.response?.data?.message || 'Could not save automation settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setTestingEmail(true);
      setStatusMessage(null);
      const res = await api.post('/shop/automation/test-email', {
        email: notificationEmail,
      });
      if (res.data?.success) {
        setStatusMessage(`Verification test email dispatched to ${res.data.data?.recipient || notificationEmail}!`);
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not send test email.');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleRunNow = async (jobType: 'lowStockCheck' | 'dailySalesSummary' | 'weeklyBusinessReport') => {
    try {
      setTriggeringJob(jobType);
      const res = await api.post(`/shop/automation/run/${jobType}`);
      if (res.data?.success) {
        setStatusMessage(`Executed '${jobType}' successfully!`);
        setTimeout(() => setStatusMessage(null), 4000);
        await fetchSettings();
      }
    } catch (err: any) {
      console.error(`Failed to trigger ${jobType}`, err);
      alert(err.response?.data?.message || `Execution of ${jobType} failed`);
    } finally {
      setTriggeringJob(null);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/shop/automation/notifications/${id}/read`);
      setNotifications(notifications.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/shop/automation/notifications/mark-all-read');
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
        <RefreshCw className="h-6 w-6 animate-spin text-primary-600" />
        <span className="text-sm">Loading automation center & scheduled monitors...</span>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F9FAFB] flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary-600 dark:text-emerald-400" />
            Shop Automation Center & Gmail Dispatcher
          </h1>
          <p className="text-xs text-gray-500 dark:text-[#A7B3C5] mt-0.5">
            Autonomous background intelligence delivering inventory alerts and sales reports directly to your Gmail
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/shop/settings"
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#172033] border border-gray-200 dark:border-[#2D3748] rounded-xl text-xs font-bold text-gray-700 dark:text-[#A7B3C5] hover:bg-gray-50 dark:hover:bg-[#111827]"
          >
            <Settings size={14} />
            <span>Store Settings</span>
          </Link>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            <span>{saving ? 'Saving...' : 'Save All Schedules'}</span>
          </button>
        </div>
      </div>

      {/* Success banner */}
      {statusMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ─── GMAIL DISPATCH CONFIGURATION BOX ─── */}
      <div className="bg-white dark:bg-[#172033] rounded-3xl border border-gray-200 dark:border-[#2D3748] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#2D3748]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-[#F9FAFB]">Owner Gmail Dispatcher</h3>
              <p className="text-xs text-gray-500 dark:text-[#A7B3C5]">Scheduled reports will be sent directly to your registered Gmail address</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600 dark:text-[#A7B3C5]">Email Alerts:</span>
            <input
              type="checkbox"
              checked={emailAlertsEnabled}
              onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
              className="h-4 w-4 text-primary-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3 bg-slate-50 dark:bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-[#2D3748]">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-700 dark:text-[#F9FAFB] uppercase tracking-wider mb-1">
              Shop Owner Gmail Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-slate-400" />
              <input
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="owner@gmail.com"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-[#172033] border border-gray-300 dark:border-[#2D3748] text-gray-900 dark:text-[#F9FAFB] placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleTestEmail}
            disabled={testingEmail || !notificationEmail}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shrink-0"
          >
            {testingEmail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            <span>Send Test Alert to My Gmail</span>
          </button>
        </div>
      </div>

      {/* ─── 3 JOB SCHEDULE CARDS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Low-Stock Analysis */}
        <div className="bg-white dark:bg-[#172033] rounded-3xl border border-gray-100 dark:border-[#2D3748] shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl">
                <ShieldAlert size={22} />
              </div>
              <input
                type="checkbox"
                checked={lowStockCheck.enabled}
                onChange={(e) => setLowStockCheck({ ...lowStockCheck, enabled: e.target.checked })}
                className="h-5 w-5 text-rose-600 rounded cursor-pointer"
              />
            </div>

            <h3 className="font-black text-base text-gray-900 dark:text-[#F9FAFB]">Low-Stock Watch</h3>
            <p className="text-xs text-gray-500 dark:text-[#A7B3C5] mt-1 leading-relaxed">
              Monitors items running low on stock and sends urgent email alerts to prevent stockouts.
            </p>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#2D3748] space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#A7B3C5] block mb-1">
                  Check Frequency
                </label>
                <select
                  value={lowStockCheck.intervalHours || 6}
                  onChange={(e) => setLowStockCheck({ ...lowStockCheck, intervalHours: parseInt(e.target.value) })}
                  className="w-full text-xs font-medium border border-gray-200 dark:border-[#2D3748] rounded-xl p-2 bg-gray-50 dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value={2}>Every 2 Hours</option>
                  <option value={4}>Every 4 Hours</option>
                  <option value={6}>Every 6 Hours (Recommended)</option>
                  <option value={12}>Every 12 Hours</option>
                  <option value={24}>Once Daily</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#A7B3C5] block mb-1">
                  Alert Threshold
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 10)}
                    className="w-20 text-xs p-2 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-[#2D3748] text-gray-900 dark:text-[#F9FAFB] rounded-xl focus:outline-none"
                  />
                  <span className="text-[11px] text-gray-500 dark:text-[#A7B3C5]">units or fewer</span>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 dark:text-[#A7B3C5] space-y-1 pt-1">
                <div className="flex justify-between">
                  <span>Last Run:</span>
                  <span className="font-semibold text-gray-700 dark:text-[#F9FAFB]">
                    {lowStockCheck.lastRunAt ? new Date(lowStockCheck.lastRunAt).toLocaleTimeString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-bold uppercase text-[10px] text-emerald-600 dark:text-emerald-400">{lowStockCheck.lastStatus}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-[#2D3748]">
            <button
              onClick={() => handleRunNow('lowStockCheck')}
              disabled={triggeringJob === 'lowStockCheck'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {triggeringJob === 'lowStockCheck' ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
              <span>{triggeringJob === 'lowStockCheck' ? 'Running Analysis...' : 'Run Stock Check Now'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Daily Sales Summary */}
        <div className="bg-white dark:bg-[#172033] rounded-3xl border border-gray-100 dark:border-[#2D3748] shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <Clock size={22} />
              </div>
              <input
                type="checkbox"
                checked={dailySalesSummary.enabled}
                onChange={(e) => setDailySalesSummary({ ...dailySalesSummary, enabled: e.target.checked })}
                className="h-5 w-5 text-emerald-600 rounded cursor-pointer"
              />
            </div>

            <h3 className="font-black text-base text-gray-900 dark:text-[#F9FAFB]">Daily Sales Summary</h3>
            <p className="text-xs text-gray-500 dark:text-[#A7B3C5] mt-1 leading-relaxed">
              Consolidates daily order totals, completed revenues, and top product directly to your Gmail.
            </p>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#2D3748] space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#A7B3C5] block mb-1">
                  Convenient Dispatch Time
                </label>
                <input
                  type="time"
                  value={dailySalesSummary.customTime || '21:00'}
                  onChange={(e) => {
                    const timeStr = e.target.value;
                    const [h, m] = timeStr.split(':').map((v) => parseInt(v));
                    setDailySalesSummary({
                      ...dailySalesSummary,
                      customTime: timeStr,
                      preferredHour: !isNaN(h) ? h : 21,
                      preferredMinute: !isNaN(m) ? m : 0,
                    });
                  }}
                  className="w-full text-xs font-bold border border-gray-200 dark:border-[#2D3748] rounded-xl p-2 bg-gray-50 dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">
                  Dispatches at <strong>{format12HourTime(dailySalesSummary.customTime)}</strong> daily ({getTimeOfDayLabel(dailySalesSummary.customTime)}).
                </p>
              </div>

              <div className="text-[11px] text-gray-500 dark:text-[#A7B3C5] space-y-1">
                <div className="flex justify-between">
                  <span>Last Run:</span>
                  <span className="font-semibold text-gray-700 dark:text-[#F9FAFB]">
                    {dailySalesSummary.lastRunAt ? new Date(dailySalesSummary.lastRunAt).toLocaleTimeString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-bold uppercase text-[10px] text-emerald-600 dark:text-emerald-400">{dailySalesSummary.lastStatus}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-[#2D3748]">
            <button
              onClick={() => handleRunNow('dailySalesSummary')}
              disabled={triggeringJob === 'dailySalesSummary'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {triggeringJob === 'dailySalesSummary' ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
              <span>{triggeringJob === 'dailySalesSummary' ? 'Compiling Recap...' : 'Send Daily Recap Now'}</span>
            </button>
          </div>
        </div>

        {/* Card 3: Weekly Business Report */}
        <div className="bg-white dark:bg-[#172033] rounded-3xl border border-gray-100 dark:border-[#2D3748] shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Calendar size={22} />
              </div>
              <input
                type="checkbox"
                checked={weeklyBusinessReport.enabled}
                onChange={(e) => setWeeklyBusinessReport({ ...weeklyBusinessReport, enabled: e.target.checked })}
                className="h-5 w-5 text-indigo-600 rounded cursor-pointer"
              />
            </div>

            <h3 className="font-black text-base text-gray-900 dark:text-[#F9FAFB]">Weekly Business Digest</h3>
            <p className="text-xs text-gray-500 dark:text-[#A7B3C5] mt-1 leading-relaxed">
              Synthesizes 7-day cumulative revenues, fulfillment rates, and customer trends for strategic shop management.
            </p>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#2D3748] space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#A7B3C5] block mb-1">
                    Day of Week
                  </label>
                  <select
                    value={weeklyBusinessReport.dayOfWeek ?? 0}
                    onChange={(e) => setWeeklyBusinessReport({ ...weeklyBusinessReport, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full text-xs font-medium border border-gray-200 dark:border-[#2D3748] rounded-xl p-2 bg-gray-50 dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#A7B3C5] block mb-1">
                    Dispatch Time
                  </label>
                  <input
                    type="time"
                    value={weeklyBusinessReport.customTime || '20:00'}
                    onChange={(e) => {
                      const timeStr = e.target.value;
                      const [h, m] = timeStr.split(':').map((v) => parseInt(v));
                      setWeeklyBusinessReport({
                        ...weeklyBusinessReport,
                        customTime: timeStr,
                        preferredHour: !isNaN(h) ? h : 20,
                        preferredMinute: !isNaN(m) ? m : 0,
                      });
                    }}
                    className="w-full text-xs font-bold border border-gray-200 dark:border-[#2D3748] rounded-xl p-2 bg-gray-50 dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-indigo-700 dark:text-indigo-400 mt-1 font-semibold">
                    Dispatches at <strong>{format12HourTime(weeklyBusinessReport.customTime)}</strong> every {DAYS_OF_WEEK.find((d) => d.value === weeklyBusinessReport.dayOfWeek)?.label || 'Sunday'} ({getTimeOfDayLabel(weeklyBusinessReport.customTime)}).
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 dark:text-[#A7B3C5] space-y-1">
                <div className="flex justify-between">
                  <span>Last Run:</span>
                  <span className="font-semibold text-gray-700 dark:text-[#F9FAFB]">
                    {weeklyBusinessReport.lastRunAt ? new Date(weeklyBusinessReport.lastRunAt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-bold uppercase text-[10px] text-emerald-600 dark:text-emerald-400">{weeklyBusinessReport.lastStatus}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-[#2D3748]">
            <button
              onClick={() => handleRunNow('weeklyBusinessReport')}
              disabled={triggeringJob === 'weeklyBusinessReport'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {triggeringJob === 'weeklyBusinessReport' ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
              <span>{triggeringJob === 'weeklyBusinessReport' ? 'Compiling Digest...' : 'Send Weekly Digest Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── IN-APP NOTIFICATIONS AUDIT LOG ─── */}
      <div className="bg-white dark:bg-[#172033] rounded-3xl border border-gray-100 dark:border-[#2D3748] shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#2D3748]">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-gray-400 dark:text-[#A7B3C5]" />
            <h3 className="font-extrabold text-base text-gray-900 dark:text-[#F9FAFB]">Recent Automation Dispatch History</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                {unreadCount} unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs font-bold text-primary-600 dark:text-emerald-400 hover:text-primary-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck size={14} />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-[#A7B3C5] text-xs">
            No automation alerts recorded yet. Jobs run automatically on your scheduled intervals.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.slice(0, 10).map((n) => {
              let badgeBg = 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800/40';
              if (n.severity === 'critical') badgeBg = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800/40';
              else if (n.severity === 'warning') badgeBg = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800/40';

              return (
                <div
                  key={n._id}
                  onClick={() => !n.read && handleMarkAsRead(n._id)}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                    n.read ? 'bg-white dark:bg-[#172033] border-gray-100 dark:border-[#2D3748] opacity-75' : 'bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-[#2D3748] shadow-2xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${badgeBg}`}>
                        {n.type.replace('_', ' ')}
                      </span>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-[#F9FAFB]">{n.title}</h4>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-[#A7B3C5] leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-gray-400 dark:text-slate-400 block pt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-primary-600 dark:bg-emerald-400 shrink-0 mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopAutomation;
