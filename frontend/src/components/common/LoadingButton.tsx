import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText,
  variant = 'primary',
  children,
  className = '',
  disabled,
  ...props
}) => {
  let variantStyles = 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20';
  if (variant === 'secondary') {
    variantStyles = 'bg-emerald-50 dark:bg-[#12352D] text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-[#12352D]/80 border border-emerald-200 dark:border-emerald-800/40';
  } else if (variant === 'outline') {
    variantStyles = 'bg-transparent border border-slate-300 dark:border-[#2D3748] text-slate-700 dark:text-[#F9FAFB] hover:bg-slate-50 dark:hover:bg-[#172033]';
  } else if (variant === 'danger') {
    variantStyles = 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/20';
  }

  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      className={`relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantStyles} ${className}`}
    >
      {isLoading && <Loader2 size={15} className="animate-spin shrink-0" />}
      <span>{isLoading && loadingText ? loadingText : children}</span>
    </button>
  );
};

export default LoadingButton;
