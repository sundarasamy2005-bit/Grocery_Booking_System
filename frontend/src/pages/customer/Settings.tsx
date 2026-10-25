import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Bell,
  Globe,
  MapPin,
  User,
  Shield,
  LogOut,
  Check,
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuthStore } from '../../store/authStore';
import { useAddressStore } from '../../store/addressStore';
import { useTheme } from '../../store/themeStore';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { toast } from '../../store/toastStore';
import { userApi } from '../../services/api';

export const Settings = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout, updateUser } = useAuthStore();
  const { openModal: openAddressModal } = useAddressStore();
  const { theme, isDark, setTheme, toggleTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notificationsEnabled !== false
  );
  const [orderUpdatesSms, setOrderUpdatesSms] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (user?.notificationsEnabled !== undefined) {
      setNotificationsEnabled(user.notificationsEnabled);
    }
  }, [user]);

  const handleToggleNotifications = async (val: boolean) => {
    setNotificationsEnabled(val);
    if (!isAuthenticated) {
      localStorage.setItem('localgrocery_notifications', JSON.stringify(val));
      toast.info(val ? 'Notifications enabled on this device' : 'Notifications disabled on this device');
      return;
    }

    try {
      setSavingSettings(true);
      await userApi.updateSettings({ notificationsEnabled: val });
      updateUser({ notificationsEnabled: val });
      toast.success(val ? 'Notifications enabled' : 'Notifications disabled');
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      toast.error('Could not save notification setting');
      setNotificationsEnabled(!val); // Rollback
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLanguageChange = (lang: 'en' | 'ta') => {
    setLanguage(lang);
    toast.info(lang === 'ta' ? 'தமிழ் மொழி தேர்ந்தெடுக்கப்பட்டது' : 'Language set to English');
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-[#34D399] text-xs font-bold uppercase tracking-wider">
            <SettingsIcon size={14} />
            <span>Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#F9FAFB] tracking-tight mt-1">
            Customer Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A7B3C5] mt-1">
            Customize appearance, notifications, language, and shortcuts for your account
          </p>
        </div>

        {/* 1. Appearance & Theme Section */}
        <div className="bg-white dark:bg-[#172033] rounded-3xl border border-slate-200/80 dark:border-[#2D3748] p-6 shadow-xs space-y-5 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-[#12352D] text-emerald-700 dark:text-[#34D399] flex items-center justify-center shrink-0">
                <Palette size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-[#F9FAFB]">Appearance & Theme</h2>
                <p className="text-xs text-slate-500 dark:text-[#A7B3C5]">Choose light or dark visual theme for your device</p>
              </div>
            </div>
            <ThemeToggle variant="segmented" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Light Mode Preview Card */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                !isDark
                  ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-200 shadow-sm'
                  : 'border-slate-200/80 dark:border-[#2D3748] bg-slate-50 dark:bg-[#111827] hover:border-emerald-300 dark:hover:border-emerald-500/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Sun size={17} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-[#F9FAFB]">Light Theme</p>
                    <p className="text-[10px] text-slate-400">Default natural</p>
                  </div>
                </div>
                {!isDark && (
                  <span className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
              </div>

              {/* Mini Color Swatches */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="w-5 h-5 rounded-md bg-white border border-slate-200 shadow-2xs" title="Background #FFFFFF" />
                <span className="w-5 h-5 rounded-md bg-[#F5F7F5] border border-slate-200" title="Surface #F5F7F5" />
                <span className="w-5 h-5 rounded-md bg-[#059669]" title="Primary Emerald #059669" />
                <span className="w-5 h-5 rounded-md bg-[#064E3B]" title="Deep Emerald #064E3B" />
                <span className="w-5 h-5 rounded-md bg-[#111827]" title="Main Text #111827" />
              </div>
            </button>

            {/* Dark Mode Preview Card */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                isDark
                  ? 'border-[#34D399] bg-[#12352D]/40 ring-2 ring-[#34D399]/30 shadow-sm'
                  : 'border-slate-200/80 dark:border-[#2D3748] bg-slate-50 dark:bg-[#111827] hover:border-emerald-300 dark:hover:border-emerald-500/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#12352D] text-[#34D399] flex items-center justify-center border border-[#2D3748]">
                    <Moon size={17} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-[#F9FAFB]">Dark Theme</p>
                    <p className="text-[10px] text-slate-400">Obsidian & Emerald</p>
                  </div>
                </div>
                {isDark && (
                  <span className="h-6 w-6 rounded-full bg-[#34D399] text-[#0B1220] flex items-center justify-center font-bold">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
              </div>

              {/* Mini Color Swatches */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="w-5 h-5 rounded-md bg-[#0B1220] border border-[#2D3748]" title="Background #0B1220" />
                <span className="w-5 h-5 rounded-md bg-[#111827] border border-[#2D3748]" title="Surface #111827" />
                <span className="w-5 h-5 rounded-md bg-[#172033] border border-[#2D3748]" title="Cards #172033" />
                <span className="w-5 h-5 rounded-md bg-[#34D399]" title="Primary #34D399" />
                <span className="w-5 h-5 rounded-md bg-[#064E3B]" title="Deep Emerald #064E3B" />
              </div>
            </button>
          </div>
        </div>

        {/* 2. Notifications Section */}
        <div className="bg-white dark:bg-[#172033] rounded-3xl border border-slate-200/80 dark:border-[#2D3748] p-6 shadow-xs space-y-5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-[#12352D] text-emerald-700 dark:text-[#34D399] flex items-center justify-center shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-[#F9FAFB]">Notifications & Alerts</h2>
              <p className="text-xs text-slate-500 dark:text-[#A7B3C5]">Manage real-time updates for your grocery orders</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-[#2D3748]">
            {/* Master Push/Email Toggle */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-[#F9FAFB]">Order Status Notifications</p>
                <p className="text-[11px] text-slate-500 dark:text-[#A7B3C5]">
                  Receive status notifications when your order is accepted, prepared, or out for delivery
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotifications(!notificationsEnabled)}
                disabled={savingSettings}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notificationsEnabled ? 'bg-emerald-600 dark:bg-[#34D399]' : 'bg-slate-200 dark:bg-[#2D3748]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* WhatsApp / SMS Alerts */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-[#F9FAFB]">SMS & WhatsApp Alerts</p>
                <p className="text-[11px] text-slate-500 dark:text-[#A7B3C5]">
                  Receive doorstep delivery OTP and store receipt notifications
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOrderUpdatesSms(!orderUpdatesSms);
                  toast.success(!orderUpdatesSms ? 'SMS alerts enabled' : 'SMS alerts paused');
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  orderUpdatesSms ? 'bg-emerald-600 dark:bg-[#34D399]' : 'bg-slate-200 dark:bg-[#2D3748]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    orderUpdatesSms ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Language & Localization */}
        <div className="bg-white dark:bg-[#172033] rounded-3xl border border-slate-200/80 dark:border-[#2D3748] p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-[#12352D] text-emerald-700 dark:text-[#34D399] flex items-center justify-center shrink-0">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-[#F9FAFB]">Language & Region</h2>
              <p className="text-xs text-slate-500 dark:text-[#A7B3C5]">Choose your preferred shopping language</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                language === 'en'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-[#12352D]/40 ring-2 ring-emerald-200 dark:ring-emerald-800'
                  : 'border-slate-200/80 dark:border-[#2D3748] hover:bg-slate-50 dark:hover:bg-[#111827]'
              }`}
            >
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-[#F9FAFB]">English</p>
                <p className="text-[10px] text-slate-400 dark:text-[#A7B3C5]">Default</p>
              </div>
              {language === 'en' && <Check size={16} className="text-emerald-600 dark:text-[#34D399]" />}
            </button>

            <button
              type="button"
              onClick={() => handleLanguageChange('ta')}
              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                language === 'ta'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-[#12352D]/40 ring-2 ring-emerald-200 dark:ring-emerald-800'
                  : 'border-slate-200/80 dark:border-[#2D3748] hover:bg-slate-50 dark:hover:bg-[#111827]'
              }`}
            >
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-[#F9FAFB]">தமிழ் (Tamil)</p>
                <p className="text-[10px] text-slate-400 dark:text-[#A7B3C5]">Tamil Nadu regional</p>
              </div>
              {language === 'ta' && <Check size={16} className="text-emerald-600 dark:text-[#34D399]" />}
            </button>
          </div>
        </div>

        {/* 4. Account Shortcuts */}
        <div className="bg-white dark:bg-[#172033] rounded-3xl border border-slate-200/80 dark:border-[#2D3748] p-6 shadow-xs space-y-4 transition-colors">
          <h2 className="text-sm font-black text-slate-900 dark:text-[#F9FAFB]">Account Management Shortcuts</h2>

          <div className="space-y-2">
            <Link
              to="/profile"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111827] hover:bg-emerald-50 dark:hover:bg-[#12352D] border border-slate-100 dark:border-[#2D3748] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <User size={18} className="text-slate-500 dark:text-[#A7B3C5] group-hover:text-emerald-600 dark:group-hover:text-[#34D399]" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-[#F9FAFB]">Edit Profile & Contact Details</p>
                  <p className="text-[10px] text-slate-500 dark:text-[#A7B3C5]">Update your name, phone number, and avatar</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 dark:text-[#A7B3C5] group-hover:text-emerald-600 dark:group-hover:text-[#34D399]" />
            </Link>

            <button
              type="button"
              onClick={() => openAddressModal()}
              className="w-full text-left flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111827] hover:bg-emerald-50 dark:hover:bg-[#12352D] border border-slate-100 dark:border-[#2D3748] transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-slate-500 dark:text-[#A7B3C5] group-hover:text-emerald-600 dark:group-hover:text-[#34D399]" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-[#F9FAFB]">Saved Delivery Addresses</p>
                  <p className="text-[10px] text-slate-500 dark:text-[#A7B3C5]">Add or manage home, work, and custom addresses</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 dark:text-[#A7B3C5] group-hover:text-emerald-600 dark:group-hover:text-[#34D399]" />
            </button>

            <Link
              to="/help"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111827] hover:bg-emerald-50 dark:hover:bg-[#12352D] border border-slate-100 dark:border-[#2D3748] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-slate-500 dark:text-[#A7B3C5] group-hover:text-emerald-600 dark:group-hover:text-[#34D399]" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-[#F9FAFB]">Help, FAQs & Cancellation Policy</p>
                  <p className="text-[10px] text-slate-500 dark:text-[#A7B3C5]">Customer guidelines and support tickets</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 dark:text-[#A7B3C5] group-hover:text-emerald-600 dark:group-hover:text-[#34D399]" />
            </Link>
          </div>
        </div>

        {/* 5. Session & Storage Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all saved local preferences to default?')) {
                localStorage.removeItem('localgrocery_notifications');
                setNotificationsEnabled(true);
                setOrderUpdatesSms(true);
                setLanguage('en');
                toast.success('Preferences reset to default');
              }
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-[#2D3748] hover:bg-slate-50 dark:hover:bg-[#172033] text-slate-700 dark:text-[#A7B3C5] font-bold text-xs transition-colors cursor-pointer"
          >
            Reset App Preferences
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('Sign out of your LocalGrocery account?')) {
                  await logout();
                  navigate('/');
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-extrabold text-xs transition-colors cursor-pointer border border-transparent dark:border-red-900/50"
            >
              <LogOut size={16} /> Sign Out
            </button>
          ) : (
            <Link
              to="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-md shadow-emerald-600/20"
            >
              Sign In to Account
            </Link>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
