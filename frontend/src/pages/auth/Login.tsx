import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import {
  ShoppingBag,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Store,
  ShieldCheck
} from 'lucide-react';
import ThemeToggle from '../../components/common/ThemeToggle';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type LoginForm = z.infer<typeof loginSchema>;

interface RegistrationState {
  email?: string;
  password?: string;
  role?: string;
  name?: string;
  justRegistered?: boolean;
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { syncUser } = useAuthStore();

  const regState = (location.state as RegistrationState) || {};
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: {
      email: regState.email || '',
      password: regState.password || '',
    },
  });

  // Automatically auto-fill the form fields if navigated from registration
  useEffect(() => {
    if (regState.email) {
      setValue('email', regState.email, { shouldValidate: true });
    }
    if (regState.password) {
      setValue('password', regState.password, { shouldValidate: true });
    }
  }, [regState, setValue]);

  const routeByRole = (userRole?: string) => {
    if (userRole === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (userRole === 'shopOwner') {
      navigate('/shop/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, data.email, data.password);
      const syncedUser = await syncUser();
      routeByRole(syncedUser?.role);
    } catch (err: any) {
      console.error('Login error:', err);
      let msg = 'Failed to sign in. Please verify your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please wait a moment and try again.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, googleProvider);
      const syncedUser = await syncUser();
      routeByRole(syncedUser?.role);
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex items-center justify-center p-4 relative transition-colors duration-200">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle variant="icon" />
      </div>

      <div className="w-full max-w-md animate-scale-in">
        <div className="bg-white dark:bg-[#172033] rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-[#2D3748]">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/30 mb-4 animate-float">
              <ShoppingBag size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-[#F9FAFB]">Welcome back!</h2>
            <p className="text-gray-500 dark:text-[#A7B3C5] text-sm mt-1">Sign in to your LocalGrocery account</p>
          </div>

          {/* Registration Success Banner with Auto-fill indicator */}
          {regState.justRegistered && (
            <div className="mb-5 p-4 bg-emerald-50 dark:bg-[#12352D]/60 border border-emerald-200 dark:border-[#2D3748] rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs font-medium animate-scale-in shadow-2xs">
              <div className="flex items-center gap-2 font-black text-emerald-900 dark:text-emerald-300 text-sm mb-1">
                <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Account Created Successfully!</span>
              </div>
              <p className="leading-relaxed">
                Welcome {regState.name ? <strong>{regState.name}</strong> : ''}! Your{' '}
                <strong className="capitalize">{regState.role === 'shopOwner' ? 'Shop Owner' : 'Customer'}</strong> account
                is registered. Credentials are auto-filled below. Click <strong>Sign In</strong> to open your {regState.role === 'shopOwner' ? 'Shop Dashboard' : 'Store'}.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-xl text-sm text-red-700 dark:text-red-300 flex items-start gap-2 animate-scale-in">
              <span className="text-red-500 mt-0.5 shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            {/* Email Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#F9FAFB] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#A7B3C5]" size={18} />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">⚠ {errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#F9FAFB] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#A7B3C5]" size={18} />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#A7B3C5] hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">⚠ {errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>

          {/* Role Auto-Detection Pill */}
          <div className="mt-4 p-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-100 dark:border-[#2D3748] flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-[#A7B3C5] font-semibold">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Auto-opens Customer, Shop Owner, or Admin dashboard</span>
          </div>

          {/* Divider */}
          <div className="my-5 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200 dark:bg-[#2D3748]" />
            <span className="text-xs text-gray-400 dark:text-[#A7B3C5] font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-[#2D3748]" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-gray-200 dark:border-[#2D3748] rounded-xl text-sm font-bold text-gray-700 dark:text-[#F9FAFB] hover:bg-gray-50 dark:hover:bg-[#111827] hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-200 disabled:opacity-60 cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          {/* Register Link */}
          <p className="mt-5 text-center text-sm text-gray-600 dark:text-[#A7B3C5]">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
