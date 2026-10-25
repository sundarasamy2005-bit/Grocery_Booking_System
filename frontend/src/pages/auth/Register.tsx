import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import {
  ShoppingBag,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShoppingCart,
  Store,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import ThemeToggle from '../../components/common/ThemeToggle';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'shopOwner']).default('customer'),
});
type RegisterForm = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const { syncUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: { role: 'customer' },
  });
  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true);
      setError(null);

      // Save role into sessionStorage to avoid any async race conditions with onAuthStateChanged
      sessionStorage.setItem('pending_registration_role', data.role);
      sessionStorage.setItem('pending_registration_name', data.name);

      // 1. Create account with Firebase Auth
      await createUserWithEmailAndPassword(auth, data.email, data.password);

      // 2. Synchronize account to MongoDB with the chosen role (creates shop if shopOwner)
      const syncedUser = await syncUser({ name: data.name, role: data.role });

      // 3. Sign out of Firebase so user lands on login page to sign in and view their role interface
      await signOut(auth);
      useAuthStore.setState({ user: null, isAuthenticated: false });

      // 4. Automatically navigate to /login with prefilled credentials & role state
      navigate('/login', {
        replace: true,
        state: {
          email: data.email,
          password: data.password,
          role: syncedUser?.role || data.role,
          name: data.name,
          justRegistered: true,
        },
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      let message = err.message || 'Failed to register account';
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters long.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setLoading(true);
      setError(null);

      sessionStorage.setItem('pending_registration_role', selectedRole);
      await signInWithPopup(auth, googleProvider);
      const syncedUser = await syncUser({ role: selectedRole });

      // Google OAuth users are immediately authenticated, open their role-based interface
      if (syncedUser?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (syncedUser?.role === 'shopOwner') {
        navigate('/shop/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      console.error('Google register error:', err);
      setError(err.message || 'Failed to register with Google');
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
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/30 mb-4 animate-float">
              <ShoppingBag size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-[#F9FAFB]">Create your account</h2>
            <p className="text-gray-500 dark:text-[#A7B3C5] text-sm mt-1">Join LocalGrocery for free today</p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-xl text-sm text-red-700 dark:text-red-300 animate-scale-in flex items-start gap-2">
              <span className="shrink-0 text-red-500 font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#F9FAFB] mb-2">I want to...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('role', 'customer')}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    selectedRole === 'customer'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-[#12352D] text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                      : 'border-gray-200 dark:border-[#2D3748] text-gray-600 dark:text-[#A7B3C5] hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-[#111827]'
                  }`}
                >
                  <ShoppingCart size={22} className={selectedRole === 'customer' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'} />
                  <span>Shop as Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('role', 'shopOwner')}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    selectedRole === 'shopOwner'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-[#12352D] text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                      : 'border-gray-200 dark:border-[#2D3748] text-gray-600 dark:text-[#A7B3C5] hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-[#111827]'
                  }`}
                >
                  <Store size={22} className={selectedRole === 'shopOwner' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'} />
                  <span>Register My Shop</span>
                </button>
              </div>

              {/* Informative helper text for the selected role */}
              <div className="mt-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-100 dark:border-[#2D3748] text-[11px] text-slate-600 dark:text-[#A7B3C5] flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {selectedRole === 'shopOwner'
                    ? 'Includes merchant dashboard, order management, AI demand forecasts & stock alerts.'
                    : 'Discover nearby grocery shops, browse fresh catalog, and place local delivery orders.'}
                </span>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#F9FAFB] mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#A7B3C5]" size={18} />
                <input
                  {...register('name')}
                  type="text"
                  placeholder="e.g. Gokul"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {errors.name && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">⚠ {errors.name.message}</p>}
            </div>

            {/* Email */}
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
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-gray-900 dark:text-[#F9FAFB] placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#A7B3C5] hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">⚠ {errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-60 cursor-pointer mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> Creating account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create Account <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>

          <div className="my-5 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200 dark:bg-[#2D3748]" />
            <span className="text-xs text-gray-400 dark:text-[#A7B3C5] font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-[#2D3748]" />
          </div>

          <button
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-gray-200 dark:border-[#2D3748] rounded-xl text-sm font-bold text-gray-700 dark:text-[#F9FAFB] hover:bg-gray-50 dark:hover:bg-[#111827] hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </button>

          <p className="mt-5 text-center text-sm text-gray-600 dark:text-[#A7B3C5]">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
