import { useState, useEffect, useCallback } from 'react';
import { Gift, Clock, Check, Loader2, Sparkles, Star, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getTierConfig } from '@/components/navigation/config/tier-config';

const API_BASE = '/api';

/**
 * Time segment display for countdown - Holographic crystal numerals
 */
function TimeSegment({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div 
        className={cn(
          "relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl",
          // Light: Copper embossed numeral plate
          "bg-gradient-to-b from-[hsl(38,35%,94%)] to-[hsl(35,30%,90%)]",
          "border border-[hsl(30,25%,78%)]",
          "shadow-[inset_0_2px_4px_rgba(101,67,33,0.08),0_2px_6px_rgba(101,67,33,0.1)]",
          // Dark: Holographic crystal segment
          "dark:bg-gradient-to-br dark:from-[rgba(20,24,35,0.8)] dark:to-[rgba(15,18,28,0.9)]",
          "dark:border dark:border-transparent",
          "dark:[background-image:linear-gradient(135deg,rgba(20,24,35,0.8),rgba(15,18,28,0.9)),linear-gradient(135deg,rgba(139,92,246,0.3),rgba(34,211,238,0.2),rgba(139,92,246,0.3))]",
          "dark:[background-origin:border-box] dark:[background-clip:padding-box,border-box]",
          "dark:shadow-[0_0_20px_-8px_rgba(139,92,246,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]"
        )}
        key={value}
        initial={{ y: -10, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <span className={cn(
          "text-base sm:text-xl font-bold tabular-nums",
          // Light: Copper foil numerals
          "text-transparent bg-clip-text bg-gradient-to-b from-[hsl(25,70%,50%)] via-[hsl(35,80%,55%)] to-[hsl(25,65%,42%)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
          // Dark: Holographic gradient text
          "dark:from-violet-200 dark:via-cyan-200 dark:to-violet-200",
          "dark:[text-shadow:0_0_20px_rgba(139,92,246,0.5)]"
        )}>
          {value}
        </span>
      </motion.div>
      <span className={cn(
        "text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.15em] mt-1 sm:mt-1.5",
        "text-[hsl(25,25%,50%)]",
        "dark:text-white/40"
      )}>
        {label}
      </span>
    </div>
  );
}

/**
 * Circular progress ring - Aurora orbital ring
 */
function ProgressRing({ progress, tierColor }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative w-16 h-16 sm:w-24 sm:h-24">
      {/* Ambient aurora glow - dark mode only */}
      <motion.div 
        className={cn(
          "absolute inset-0 rounded-full opacity-0 dark:opacity-100 blur-xl",
          "bg-gradient-conic from-violet-500/30 via-cyan-500/20 to-violet-500/30"
        )}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      
      <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
        {/* Background track */}
        <circle
          cx="50"
          cy="50"
          r="36"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className={cn(
            "text-[hsl(30,25%,85%)]",
            "dark:text-white/[0.06]"
          )}
        />
        
        {/* Aurora gradient definition */}
        <defs>
          <linearGradient id="auroraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(139, 92, 246)" />
            <stop offset="50%" stopColor="rgb(34, 211, 238)" />
            <stop offset="100%" stopColor="rgb(236, 72, 153)" />
          </linearGradient>
        </defs>
        
        {/* Progress arc */}
        <motion.circle
          cx="50"
          cy="50"
          r="36"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className="dark:stroke-[url(#auroraGradient)]"
          stroke={tierColor}
          style={{ strokeDasharray: circumference }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <Clock className={cn(
            "w-4 h-4 sm:w-6 sm:h-6",
            "text-[hsl(25,30%,55%)]",
            "dark:text-violet-300 dark:drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
          )} />
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Floating aurora particle
 */
function AuroraParticle({ delay, color }) {
  return (
    <motion.div
      className={cn(
        "absolute w-1 h-1 rounded-full opacity-0 dark:opacity-100",
        color
      )}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0, 1.5, 0],
        y: [-20, -60],
        x: [0, Math.random() * 40 - 20],
      }}
      transition={{
        duration: 2.5,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 2,
      }}
    />
  );
}

/**
 * DailyClaimCard Component
 * 
 * Premium daily bonus card with Obsidian Aurora aesthetic:
 * - Holographic crystal container with prismatic edges
 * - Aurora orbital countdown ring
 * - Floating sparkle particles
 * - 3D tier-colored claim button
 */
export function DailyClaimCard({ className, onClaim }) {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [claimStatus, setClaimStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const tier = user?.tier || 'free';
  const tierConfig = getTierConfig(tier);
  const claimAmount = claimStatus?.claimAmount || tierConfig.dailyClaim || 10;
  
  // Aurora tier colors for dark mode
  const tierColors = {
    free: { light: '#8b5cf6', dark: 'from-violet-400 via-purple-400 to-violet-500' },
    bronze: { light: '#d97706', dark: 'from-amber-400 via-orange-400 to-amber-500' },
    silver: { light: '#64748b', dark: 'from-slate-300 via-zinc-300 to-slate-400' },
    gold: { light: '#ca8a04', dark: 'from-yellow-300 via-amber-300 to-yellow-400' },
    diamond: { light: '#06b6d4', dark: 'from-cyan-300 via-teal-300 to-cyan-400' }
  };
  const tierColor = tierColors[tier] || tierColors.free;

  const fetchClaimStatus = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/credits/claim-status`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          setClaimStatus(data);
          if (!data.canClaim && data.timeUntilNextClaim) {
            setCountdown(data.timeUntilNextClaim);
          } else {
            setCountdown(null);
          }
        }
      }
    } catch (err) {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleClaim = async () => {
    if (!isAuthenticated || isClaiming) return;

    setIsClaiming(true);
    try {
      const response = await fetch(`${API_BASE}/credits/claim-daily`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        setClaimSuccess(true);
        setClaimStatus({
          canClaim: false,
          nextClaimAvailable: data.nextClaimAvailable,
          timeUntilNextClaim: data.timeUntilNextClaim,
          claimAmount: data.amount
        });
        setCountdown(data.timeUntilNextClaim);

        if (refreshUser) await refreshUser();
        if (onClaim) onClaim();

        setTimeout(() => setClaimSuccess(false), 3000);
      }
    } catch (err) {
      // Silent fail
    } finally {
      setIsClaiming(false);
    }
  };

  useEffect(() => {
    fetchClaimStatus();
  }, [fetchClaimStatus]);

  useEffect(() => {
    if (!countdown || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1000) {
          fetchClaimStatus();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, fetchClaimStatus]);

  if (!isAuthenticated || !user) return null;

  const formatCountdown = (ms) => {
    if (!ms || ms <= 0) return { hours: '00', minutes: '00', seconds: '00' };
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    };
  };

  const canClaim = claimStatus?.canClaim && !countdown;
  const time = formatCountdown(countdown);
  const progress = countdown ? ((86400000 - countdown) / 86400000) * 100 : 100;

  const TierIcon = tierConfig.icon || Gift;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "transition-all duration-300 ease-out",
        
        // ===== LIGHT MODE (Vintage Banking Certificate) =====
        "bg-gradient-to-b from-[hsl(40,50%,97%)] via-[hsl(38,45%,95%)] to-[hsl(35,40%,93%)]",
        "border-2 border-[hsl(30,35%,75%)]",
        "shadow-[inset_0_0_0_3px_hsl(38,45%,96%),inset_0_0_0_4px_hsl(30,30%,80%),0_8px_32px_rgba(101,67,33,0.12)]",
        
        // ===== DARK MODE (Obsidian Aurora Crystal) =====
        "dark:bg-gradient-to-br dark:from-[rgba(12,14,22,0.95)] dark:via-[rgba(16,20,30,0.9)] dark:to-[rgba(12,14,22,0.95)]",
        "dark:backdrop-blur-[60px] dark:backdrop-saturate-[1.8]",
        // Prismatic aurora border
        "dark:border dark:border-transparent",
        "dark:[background-image:linear-gradient(135deg,rgba(12,14,22,0.95),rgba(16,20,30,0.9)),linear-gradient(135deg,rgba(139,92,246,0.4),rgba(34,211,238,0.3),rgba(236,72,153,0.3),rgba(139,92,246,0.4))]",
        "dark:[background-origin:border-box] dark:[background-clip:padding-box,border-box]",
        // Ambient aurora glow
        "dark:shadow-[0_0_40px_-10px_rgba(139,92,246,0.3),0_0_60px_-15px_rgba(34,211,238,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]",
        
        // Success state
        claimSuccess && [
          "ring-2 ring-emerald-500/50",
          "dark:ring-emerald-400/50 dark:shadow-[0_0_50px_-10px_rgba(52,211,153,0.5)]"
        ],
        className
      )}
    >
      {/* Paper texture for light mode */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none dark:opacity-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Aurora shimmer overlay - dark mode only */}
      <motion.div 
        className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, transparent 40%, rgba(139,92,246,0.05) 50%, transparent 60%)',
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(25,60%,60%)]/30 to-transparent dark:via-white/20" />
      
      {/* Tier accent line with glow */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 h-1 z-10",
          "shadow-[0_2px_8px_var(--tier-shadow)]"
        )}
        style={{ 
          background: `linear-gradient(to right, ${tierColor.light}, ${tierColor.light}88)`,
          '--tier-shadow': `${tierColor.light}40`
        }}
      />
      
      {/* Floating aurora particles - dark mode only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {canClaim && (
          <>
            <AuroraParticle delay={0} color="bg-violet-400" />
            <AuroraParticle delay={0.5} color="bg-cyan-400" />
            <AuroraParticle delay={1} color="bg-pink-400" />
            <AuroraParticle delay={1.5} color="bg-violet-400" />
          </>
        )}
      </div>
      
      {/* Corner ornaments (light mode only) */}
      <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-[hsl(25,60%,55%)]/40 rounded-tl-sm dark:hidden" />
      <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-[hsl(25,60%,55%)]/40 rounded-tr-sm dark:hidden" />
      
      {/* Shimmer effect when claimable */}
      <AnimatePresence>
        {canClaim && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
            className={cn(
              "absolute inset-0 w-1/3 skew-x-12 pointer-events-none",
              "bg-gradient-to-r from-transparent via-[hsl(35,80%,70%)]/25 to-transparent",
              "dark:via-violet-400/20"
            )}
          />
        )}
      </AnimatePresence>

      <div className="relative p-3 sm:p-5 z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-5 gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Icon with holographic effect */}
            <motion.div 
              className={cn(
                "relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shrink-0",
                // Light: wax seal effect
                "bg-gradient-to-br",
                tierConfig.bgGradient,
                "border border-[hsl(30,40%,75%)]/60",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_6px_rgba(101,67,33,0.15)]",
                // Dark: Holographic crystal
                "dark:bg-gradient-to-br dark:from-[rgba(20,24,35,0.9)] dark:to-[rgba(15,18,28,0.95)]",
                "dark:border dark:border-transparent",
                "dark:[background-image:linear-gradient(135deg,rgba(20,24,35,0.9),rgba(15,18,28,0.95)),linear-gradient(135deg,rgba(139,92,246,0.5),rgba(34,211,238,0.4),rgba(139,92,246,0.5))]",
                "dark:[background-origin:border-box] dark:[background-clip:padding-box,border-box]",
                "dark:shadow-[0_0_20px_-5px_rgba(139,92,246,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]"
              )}
              animate={canClaim ? tierConfig.iconAnimation : {}}
              transition={canClaim ? tierConfig.iconTransition : {}}
            >
              {/* Aurora glow behind icon - dark mode */}
              <motion.div
                className="absolute inset-0 rounded-xl opacity-0 dark:opacity-100 blur-sm"
                style={{
                  background: `linear-gradient(135deg, ${tierColor.light}40, transparent, ${tierColor.light}40)`
                }}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              />
              <TierIcon className={cn(
                "w-5 h-5 sm:w-6 sm:h-6 relative z-10",
                tierConfig.color,
                "dark:drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
              )} />
            </motion.div>
            
            <div className="min-w-0">
              <h3 className={cn(
                "text-sm sm:text-base font-semibold flex items-center gap-1.5 sm:gap-2",
                "text-[hsl(25,40%,25%)] [text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
                "dark:text-white dark:[text-shadow:none]"
              )}>
                Daily Bonus
                {canClaim && (
                  <motion.span
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Sparkles className={cn(
                      "w-3 h-3 sm:w-4 sm:h-4 text-amber-500 fill-amber-500",
                      "dark:text-violet-300 dark:fill-violet-300 dark:drop-shadow-[0_0_6px_rgba(139,92,246,0.8)]"
                    )} />
                  </motion.span>
                )}
              </h3>
              <p className={cn(
                "text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 flex-wrap",
                "text-[hsl(25,20%,50%)]",
                "dark:text-white/50"
              )}>
                <span className={cn(
                  "px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium",
                  "bg-[hsl(30,30%,90%)] text-[hsl(25,40%,40%)]",
                  "dark:bg-white/[0.08] dark:text-white/70"
                )}>
                  {tierConfig.label}
                </span>
                <span className="font-semibold" style={{ color: tierColor.light }}>
                  +{claimAmount}
                </span>
                <span>credits</span>
              </p>
            </div>
          </div>
          
          {/* Status badge */}
          <motion.span 
            className={cn(
              "px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-full shrink-0",
              canClaim 
                ? [
                    // Light
                    "bg-gradient-to-b from-emerald-100 to-emerald-50",
                    "text-emerald-800 border border-emerald-300/60",
                    // Dark: Holographic ready badge
                    "dark:bg-gradient-to-r dark:from-emerald-500/20 dark:to-teal-500/20",
                    "dark:text-emerald-300 dark:border-emerald-400/30",
                    "dark:shadow-[0_0_15px_-5px_rgba(52,211,153,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]"
                  ]
                : [
                    "bg-[hsl(38,30%,92%)] text-[hsl(25,20%,45%)] border border-[hsl(30,25%,82%)]",
                    "dark:bg-white/[0.05] dark:text-white/40 dark:border-white/[0.08]"
                  ]
            )}
            animate={canClaim ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {canClaim ? (
              <span className="flex items-center gap-0.5 sm:gap-1">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Ready!
              </span>
            ) : 'Claimed'}
          </motion.span>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className={cn(
                "w-8 h-8",
                "text-[hsl(25,40%,55%)]",
                "dark:text-violet-400 dark:drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]"
              )} />
            </motion.div>
          </div>
        ) : canClaim ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Button
              onClick={handleClaim}
              disabled={isClaiming}
              className={cn(
                "w-full h-11 sm:h-14 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl",
                "text-white transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.98]",
                // Light mode
                "shadow-[0_4px_16px_var(--tier-shadow),inset_0_1px_0_rgba(255,255,255,0.25)]",
                "hover:shadow-[0_6px_24px_var(--tier-shadow),inset_0_1px_0_rgba(255,255,255,0.3)]",
                // Dark mode: Holographic button with aurora glow
                "dark:bg-gradient-to-r",
                tierColor.dark,
                "dark:shadow-[0_0_30px_-8px_rgba(139,92,246,0.6),0_0_20px_-5px_rgba(34,211,238,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]",
                "dark:hover:shadow-[0_0_40px_-8px_rgba(139,92,246,0.8),0_0_30px_-5px_rgba(34,211,238,0.6),inset_0_1px_0_rgba(255,255,255,0.3)]"
              )}
              style={{ 
                background: `linear-gradient(135deg, ${tierColor.light}, ${tierColor.light}dd)`,
                '--tier-shadow': `${tierColor.light}40`
              }}
            >
              {isClaiming ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Claiming...
                </span>
              ) : claimSuccess ? (
                <motion.span
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  +{claimAmount} Credits Added!
                </motion.span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Claim {claimAmount} Credits
                </span>
              )}
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Countdown display */}
            <div className={cn(
              "flex items-center justify-center gap-3 sm:gap-6 py-3 sm:py-5 px-2 sm:px-4 rounded-lg sm:rounded-xl",
              // Light
              "bg-gradient-to-b from-[hsl(38,35%,94%)] to-[hsl(35,30%,91%)]",
              "border border-[hsl(30,25%,80%)]",
              "shadow-[inset_0_2px_4px_rgba(101,67,33,0.08)]",
              // Dark: Obsidian countdown container
              "dark:bg-gradient-to-br dark:from-[rgba(15,18,28,0.8)] dark:to-[rgba(10,12,20,0.9)]",
              "dark:border dark:border-white/[0.06]",
              "dark:shadow-[inset_0_0_30px_-10px_rgba(139,92,246,0.1),0_0_20px_-10px_rgba(139,92,246,0.2)]"
            )}>
              {/* Progress ring */}
              <ProgressRing progress={progress} tierColor={tierColor.light} />

              {/* Time segments */}
              <div className="flex items-center gap-1.5 sm:gap-3">
                <TimeSegment value={time.hours} label="hrs" />
                <span className={cn(
                  "text-xl sm:text-2xl font-light -mt-5 sm:-mt-6",
                  "text-[hsl(30,20%,70%)]",
                  "dark:text-violet-400/50"
                )}>:</span>
                <TimeSegment value={time.minutes} label="min" />
                <span className={cn(
                  "text-xl sm:text-2xl font-light -mt-5 sm:-mt-6",
                  "text-[hsl(30,20%,70%)]",
                  "dark:text-violet-400/50"
                )}>:</span>
                <TimeSegment value={time.seconds} label="sec" />
              </div>
            </div>
            
            <p className={cn(
              "text-center text-[10px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5",
              "text-[hsl(25,20%,50%)]",
              "dark:text-white/40"
            )}>
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              Resets at midnight UTC
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default DailyClaimCard;
