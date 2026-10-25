import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { GroceryLogoIllustration } from './GroceryLogoIllustration';

interface AppSplashScreenProps {
  onComplete?: () => void;
  /** Max duration before automatically completing (in milliseconds). Defaults to 1250ms for snappy loading */
  maxDurationMs?: number;
}

const STAGES = [
  { threshold: 30, text: 'Connecting to local marketplace...', icon: '⚡' },
  { threshold: 65, text: 'Locating neighbourhood stores...', icon: '🏪' },
  { threshold: 92, text: 'Stocking daily farm-fresh arrivals...', icon: '🥦' },
  { threshold: 100, text: 'Fresh & Ready! Welcome', icon: '✨' },
];

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({
  onComplete,
  maxDurationMs = 1250,
}) => {
  const [progress, setProgress] = useState(10);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = Math.max(900, maxDurationMs); // Fast, snappy 1.0 - 1.25s load

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const ratio = Math.min(elapsed / duration, 1);

      // Smooth cubic-out easing for realistic, accelerating-to-finish feel
      const eased = 1 - Math.pow(1 - ratio, 2.2);
      const nextProgress = Math.round(10 + eased * 90);

      setProgress(nextProgress);

      if (ratio >= 1) {
        clearInterval(interval);
        setProgress(100);
        setIsReady(true);

        // Brief celebration pause at 100%, then smooth fade-out
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            if (!hasFinishedRef.current) {
              hasFinishedRef.current = true;
              if (onComplete) onComplete();
            }
          }, 280);
        }, 180);
      }
    }, 35);

    // Hard safety timeout: guaranteed release within 2.5s maximum under any condition
    const safetyTimer = setTimeout(() => {
      if (!hasFinishedRef.current) {
        hasFinishedRef.current = true;
        setIsReady(true);
        setIsFadingOut(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 200);
      }
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimer);
    };
  }, [maxDurationMs, onComplete]);

  // Determine current active stage
  const activeStage =
    STAGES.find((s) => progress <= s.threshold) || STAGES[STAGES.length - 1];

  const handleManualSkip = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsFadingOut(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 200);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#0B1220] text-white select-none transition-all duration-300 ease-out ${
        isFadingOut ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* 1. Multi-Layer Dynamic Ambient Glow Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary Emerald Glow Orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-emerald-600/20 via-teal-500/15 to-transparent blur-3xl animate-pulse" />
        {/* Secondary Golden Warm Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/3 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-gradient-to-br from-amber-400/10 via-emerald-400/5 to-transparent blur-2xl" />
        {/* Subtle Radial Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,#0B1220_85%)]" />
      </div>

      {/* 2. Main Content Card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center space-y-6">
        
        {/* Updated Graphic Emblem Container with Light Sweep Effect */}
        <div className="relative flex items-center justify-center">
          {/* Subtle Ambient Pulse Ring */}
          <div className="absolute -inset-4 rounded-[42px] bg-emerald-500/15 animate-pulse-ring blur-xs" />

          {/* Glass Card Housing the Grocery Artwork */}
          <div className="relative rounded-[36px] p-2.5 bg-gradient-to-b from-white/15 to-white/5 border border-white/20 shadow-2xl backdrop-blur-md overflow-hidden animate-float">
            {/* High-End Diagonal Light Sweep Overlay */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent w-full h-full animate-light-sweep pointer-events-none" />

            {/* Custom 3D SVG Grocery Illustration */}
            <GroceryLogoIllustration size={118} />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2">
            <span className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
              Local<span className="text-emerald-400">Grocery</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Fresh
            </span>
          </div>

          <p className="text-xs sm:text-sm font-medium text-slate-300/90 tracking-wide">
            Fresh groceries, closer to home.
          </p>
        </div>

        {/* 3. High-Performance Deluxe Progress Bar */}
        <div className="w-full max-w-[260px] space-y-2.5 pt-2">
          {/* Progress Track */}
          <div className="relative w-full h-2 rounded-full bg-slate-800/90 overflow-hidden border border-slate-700/70 p-0.5 shadow-inner">
            {/* Active Gradient Fill Bar */}
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-100 ease-out shadow-[0_0_12px_rgba(52,211,153,0.5)]"
              style={{ width: `${progress}%` }}
            >
              {/* Inner High-Speed Shimmer Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-progress-shimmer" />

              {/* Glowing Leading Head Dot */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#34D399]" />
            </div>
          </div>

          {/* Dynamic Stage Message & Live Percentage Counter */}
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium px-1">
            <span className="inline-flex items-center gap-1.5 truncate max-w-[200px] text-left">
              <span className="text-xs">{activeStage.icon}</span>
              <span className="truncate">{activeStage.text}</span>
            </span>

            <span className="font-mono text-[11px] font-bold text-emerald-400 tabular-nums shrink-0 ml-2">
              {isReady ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-300">
                  <Check size={12} className="stroke-[3]" /> 100%
                </span>
              ) : (
                `${progress}%`
              )}
            </span>
          </div>
        </div>

        {/* Quick Skip button (keyboard/click accessible if desired) */}
        <button
          type="button"
          onClick={handleManualSkip}
          className="text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition-colors pt-2 cursor-pointer focus:outline-none"
        >
          Press to enter immediately →
        </button>
      </div>
    </div>
  );
};

export default AppSplashScreen;
