import React from 'react';
import { GroceryLogoIllustration } from './GroceryLogoIllustration';

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Loading fresh groceries...',
  fullScreen = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="relative flex items-center justify-center animate-float">
        <GroceryLogoIllustration size={72} />
      </div>
      <div className="space-y-1">
        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#F9FAFB] tracking-wide">
          {message}
        </p>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 dark:text-[#34D399] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Fresh & Local</span>
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-[#0B1220] transition-colors">
        {content}
      </div>
    );
  }

  return content;
};

export default PageLoader;
