import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../store/themeStore';

interface ThemeToggleProps {
  variant?: 'icon' | 'segmented' | 'row';
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
  showLabel = false,
}) => {
  const { theme, isDark, setTheme, toggleTheme } = useTheme();

  const accessibleLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  if (variant === 'segmented') {
    return (
      <div
        role="group"
        aria-label="Theme selection"
        className={`inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-[#111827] border border-slate-200/80 dark:border-[#2D3748] ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          aria-pressed={!isDark}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            !isDark
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
              : 'text-slate-500 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB]'
          }`}
        >
          <Sun size={15} className={!isDark ? 'text-amber-500 fill-amber-500' : ''} />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          aria-pressed={isDark}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            isDark
              ? 'bg-[#172033] text-[#F9FAFB] shadow-sm border border-[#2D3748]'
              : 'text-slate-500 dark:text-[#A7B3C5] hover:text-slate-900 dark:hover:text-[#F9FAFB]'
          }`}
        >
          <Moon size={15} className={isDark ? 'text-emerald-400 fill-emerald-400/20' : ''} />
          <span>Dark</span>
        </button>
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div
        className={`flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200/80 dark:border-[#2D3748] ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-white dark:bg-[#172033] border border-slate-200 dark:border-[#2D3748] flex items-center justify-center text-slate-700 dark:text-[#A7B3C5]">
            {isDark ? (
              <Moon size={16} className="text-emerald-400" />
            ) : (
              <Sun size={16} className="text-amber-500" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-[#F9FAFB]">
              {isDark ? 'Dark Theme Active' : 'Light Theme Active'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-[#A7B3C5]">
              {isDark ? 'Deep emerald & obsidian UI' : 'Crisp high-contrast natural UI'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={accessibleLabel}
          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-200 dark:bg-emerald-900/60"
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-emerald-400 shadow-md transition duration-200 ease-in-out ${
              isDark ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    );
  }

  // Default 'icon' variant
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={accessibleLabel}
      title={accessibleLabel}
      className={`relative p-2.5 rounded-2xl text-slate-700 dark:text-[#A7B3C5] hover:text-emerald-600 dark:hover:text-[#34D399] hover:bg-emerald-50 dark:hover:bg-[#172033] border border-transparent hover:border-emerald-200 dark:hover:border-[#2D3748] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer group ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Moon
            size={18}
            className="text-emerald-400 transition-transform duration-300 group-hover:-rotate-12"
          />
        ) : (
          <Sun
            size={18}
            className="text-amber-500 transition-transform duration-300 group-hover:rotate-45"
          />
        )}
      </div>

      {showLabel && (
        <span className="ml-2 text-xs font-bold text-slate-800 dark:text-[#F9FAFB]">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
