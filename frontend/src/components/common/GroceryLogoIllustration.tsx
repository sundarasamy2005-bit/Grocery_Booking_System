import React from 'react';

interface GroceryLogoIllustrationProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

export const GroceryLogoIllustration: React.FC<GroceryLogoIllustrationProps> = ({
  className = '',
  size = 110,
  animate = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer ambient glow ring */}
      <div
        className={`absolute inset-0 rounded-[28%] bg-emerald-500/30 dark:bg-emerald-400/25 blur-xl -z-10 ${
          animate ? 'animate-pulse' : ''
        }`}
        style={{ transform: 'scale(1.18)' }}
      />

      {/* Main SVG Vector Graphic */}
      <svg
        viewBox="0 0 160 160"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_16px_28px_rgba(5,150,105,0.35)]"
      >
        <defs>
          {/* Main Squircle Gradient */}
          <linearGradient id="squircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="45%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064E3B" />
          </linearGradient>

          {/* Bag Gradient */}
          <linearGradient id="bagGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Bag Fold Gradient */}
          <linearGradient id="bagFoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* Carrot Gradient */}
          <linearGradient id="carrotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>

          {/* Tomato Gradient */}
          <radialGradient id="tomatoGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#F87171" />
            <stop offset="60%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </radialGradient>

          {/* Leaf / Herb Gradient */}
          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>

          {/* Milk Bottle Gradient */}
          <linearGradient id="bottleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Gold Badge Gradient */}
          <linearGradient id="goldBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Glass Top Sheen Filter */}
          <linearGradient id="glassSheen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Shadow Filter */}
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#064E3B" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* 1. Base Squircle Card with Border & Gradients */}
        <rect
          x="8"
          y="8"
          width="144"
          height="144"
          rx="38"
          fill="url(#squircleGrad)"
        />

        {/* Inner subtle bevel border */}
        <rect
          x="9"
          y="9"
          width="142"
          height="142"
          rx="37"
          stroke="url(#glassSheen)"
          strokeWidth="2"
          fill="none"
        />

        {/* Diagonal Glass Sheen Curve */}
        <path
          d="M12 46 C 40 22, 120 18, 148 48 L 148 10 C 148 10, 140 10, 110 10 L 46 10 C 22 10, 12 24, 12 46 Z"
          fill="url(#glassSheen)"
        />

        {/* 2. Fresh Grocery Items Emerging from Bag */}
        <g id="groceries" filter="url(#softShadow)">
          {/* Milk Bottle (Left) */}
          <g transform="translate(38, 42) rotate(-8)">
            <rect x="0" y="8" width="16" height="30" rx="4" fill="url(#bottleGrad)" />
            <rect x="3" y="2" width="10" height="7" rx="2" fill="#38BDF8" />
            <rect x="0" y="16" width="16" height="10" fill="#E0F2FE" />
            {/* Bottle cap */}
            <rect x="4" y="0" width="8" height="3" rx="1.5" fill="#0284C7" />
          </g>

          {/* Fresh Celery / Herbs / Greens (Center Left) */}
          <g transform="translate(56, 32)">
            {/* Leaf 1 */}
            <path
              d="M10 26 C 6 18, 2 10, 0 4 C 8 4, 16 12, 14 26 Z"
              fill="url(#leafGrad)"
            />
            {/* Leaf 2 */}
            <path
              d="M12 28 C 12 16, 18 6, 26 2 C 26 12, 22 20, 16 28 Z"
              fill="#22C55E"
            />
            {/* Leaf Center Stem */}
            <path d="M12 28 Q 14 14 18 4" stroke="#86EFAC" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Crisp Farm Carrot (Center Right) */}
          <g transform="translate(86, 30) rotate(14)">
            {/* Carrot Tops */}
            <path d="M6 10 C 6 2, 2 0, 0 0 C 4 4, 4 8, 5 10" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
            <path d="M7 10 C 10 2, 14 2, 16 0 C 13 4, 10 8, 8 10" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
            {/* Carrot Body */}
            <path
              d="M2 10 C 2 10, 12 10, 12 10 L 7 36 Z"
              fill="url(#carrotGrad)"
            />
            {/* Carrot Ribs */}
            <line x1="4" y1="16" x2="8" y2="16" stroke="#C2410C" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            <line x1="5" y1="22" x2="9" y2="22" stroke="#C2410C" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            <line x1="5" y1="28" x2="8" y2="28" stroke="#C2410C" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          </g>

          {/* Ripe Farm Tomato (Right) */}
          <g transform="translate(98, 50)">
            <circle cx="12" cy="12" r="12" fill="url(#tomatoGrad)" />
            {/* Highlight */}
            <ellipse cx="8" cy="8" rx="3.5" ry="2" fill="#FFFFFF" opacity="0.55" transform="rotate(-25 8 8)" />
            {/* Tomato Calyx / Crown */}
            <path
              d="M12 2 L 10 5 L 7 3 L 8 6 L 5 7 L 8 9 L 7 12 L 10 10 L 12 13 L 13 10 L 16 11 L 15 8 L 18 7 L 15 6 L 16 3 L 13 5 Z"
              fill="#15803D"
            />
          </g>
        </g>

        {/* 3. Main Grocery Tote Bag Front */}
        <g id="toteBag">
          {/* Tote Bag Handles */}
          <path
            d="M62 66 C 62 48, 98 48, 98 66"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M66 66 C 66 52, 94 52, 94 66"
            stroke="#94A3B8"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />

          {/* Tote Bag Body */}
          <path
            d="M44 68 C 42 68, 40 70, 41 72 L 48 126 C 49 130, 52 133, 56 133 L 104 133 C 108 133, 111 130, 112 126 L 119 72 C 120 70, 118 68, 116 68 Z"
            fill="url(#bagGrad)"
          />

          {/* Tote Bag Fold / Collar */}
          <path
            d="M40 68 L 120 68 L 118 76 L 42 76 Z"
            fill="url(#bagFoldGrad)"
          />

          {/* Tote Front Emblem: Organic Leaf Stamp */}
          <g transform="translate(80, 102)">
            <circle cx="0" cy="0" r="14" fill="#059669" opacity="0.12" />
            <path
              d="M-7 3 C -7 -6, 0 -11, 7 -10 C 7 -1, 4 6, -4 7 C -5.5 7, -6.5 5, -7 3 Z"
              fill="#059669"
            />
            <path
              d="M-5 4 Q 0 0 5 -8"
              stroke="#A7F3D0"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* 4. Golden Star / Sparkle Quality Badge (Top-Right) */}
        <g id="sparkleBadge" transform="translate(120, 16)">
          {/* Badge Glow */}
          <circle cx="14" cy="14" r="16" fill="#F59E0B" opacity="0.25" />
          {/* Badge Circle */}
          <circle cx="14" cy="14" r="14" fill="url(#goldBadgeGrad)" stroke="#FFFFFF" strokeWidth="2.5" />
          {/* 4-Point Sparkle Icon */}
          <path
            d="M14 6 C 14 10, 18 14, 22 14 C 18 14, 14 18, 14 22 C 14 18, 10 14, 6 14 C 10 14, 14 10, 14 6 Z"
            fill="#FFFFFF"
          />
        </g>
      </svg>
    </div>
  );
};

export default GroceryLogoIllustration;
