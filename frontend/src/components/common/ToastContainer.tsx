import { useToastStore } from '../../store/toastStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
          error: <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />,
          info: <Info className="h-5 w-5 text-sky-500 shrink-0" />,
        };

        const bgStyles = {
          success: 'bg-white dark:bg-[#172033] border-emerald-200 dark:border-emerald-800/60 text-slate-900 dark:text-[#F9FAFB] shadow-emerald-500/10',
          error: 'bg-white dark:bg-[#172033] border-red-200 dark:border-red-800/60 text-slate-900 dark:text-[#F9FAFB] shadow-red-500/10',
          info: 'bg-white dark:bg-[#172033] border-slate-200 dark:border-[#2D3748] text-slate-900 dark:text-[#F9FAFB] shadow-slate-500/10',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-fade-in-up ${bgStyles[toast.type]}`}
          >
            <div className="flex items-center gap-2.5">
              {icons[toast.type]}
              <p className="text-xs sm:text-sm font-semibold">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
