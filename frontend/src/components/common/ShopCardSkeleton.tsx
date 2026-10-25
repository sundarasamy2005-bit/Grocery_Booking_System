import React from 'react';

interface ShopCardSkeletonProps {
  count?: number;
  className?: string;
}

export const ShopCardSkeleton: React.FC<ShopCardSkeletonProps> = ({
  count = 1,
  className = '',
}) => {
  const skeletons = Array.from({ length: count });

  return (
    <>
      {skeletons.map((_, idx) => (
        <div
          key={idx}
          className={`rounded-3xl border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] overflow-hidden flex flex-col justify-between ${className}`}
        >
          {/* Header image skeleton */}
          <div className="h-36 bg-slate-100 dark:bg-[#111827] skeleton w-full" />

          {/* Body info skeleton */}
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-slate-100 dark:bg-[#111827] rounded-md w-3/4 skeleton" />
              <div className="h-3 bg-slate-100 dark:bg-[#111827] rounded-md w-1/3 skeleton" />
              <div className="h-3 bg-slate-100 dark:bg-[#111827] rounded-md w-1/2 skeleton" />
            </div>

            {/* Button skeleton */}
            <div className="h-9 bg-slate-100 dark:bg-[#111827] rounded-xl w-full skeleton" />
          </div>
        </div>
      ))}
    </>
  );
};

export default ShopCardSkeleton;
