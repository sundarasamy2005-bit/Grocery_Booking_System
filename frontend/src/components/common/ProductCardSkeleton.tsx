import React from 'react';

interface ProductCardSkeletonProps {
  count?: number;
  className?: string;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({
  count = 1,
  className = '',
}) => {
  const skeletons = Array.from({ length: count });

  return (
    <>
      {skeletons.map((_, idx) => (
        <div
          key={idx}
          className={`rounded-2xl border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#172033] p-3.5 flex flex-col justify-between space-y-3 ${className}`}
        >
          {/* Image skeleton */}
          <div className="relative aspect-square rounded-xl bg-slate-100 dark:bg-[#111827] skeleton overflow-hidden" />

          {/* Details skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 dark:bg-[#111827] rounded-md w-4/5 skeleton" />
            <div className="h-3 bg-slate-100 dark:bg-[#111827] rounded-md w-1/2 skeleton" />
            <div className="h-4 bg-slate-100 dark:bg-[#111827] rounded-md w-1/3 skeleton pt-1" />
          </div>

          {/* Button skeleton */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#2D3748]">
            <div className="h-8 bg-slate-100 dark:bg-[#111827] rounded-xl w-full skeleton" />
          </div>
        </div>
      ))}
    </>
  );
};

export default ProductCardSkeleton;
