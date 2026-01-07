import { useState, useEffect, useCallback, memo } from 'react';
import { Gift, Clock, Check, Loader2, Sparkles, Zap, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getTierConfig } from '@/components/navigation/config/tier-config';

const API_BASE = '/api';

/**
 * Animated digit flip for countdown - Mechanical vault tumbler aesthetic
 */
const DigitFlip = memo(function DigitFlip({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        {/* Tumbler housing */}
        <div className={cn(
          "relative w-11 h-14 sm:w-14 sm:h-[4.5rem] rounded-lg overflow-hidden",
          // Light: Brass tumbler mechanism
          "bg-gradient-to-b from-[hsl(38,50%,88%)] via-[hsl(35,45%,82%)] to-[hsl(32,40%,75%)]",
          "border border-[hsl(30,40%,65%)]",
          "shadow-[inset_0_2px_4px_rgba(0,0,0,0.15),inset_0_-1px_0_rgba(255,255,255,0.4),0_4px_8px_rgba(101,67,33,0.2)]",
          // Dark: Holographic display cell
          "dark:bg-gradient-to-b dark:from-[rgba(30,35,50,0.9)] dark:via-[rgba(20,25,40,0.95)] dark:to-[rgba(15,18,30,1)]",
          "dark:border-[rgba(139,92,246,0.25)]",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-8px_16px_rgba(139,92,246,0.08),0_0_20px_rgba(139,92,246,0.15)]"
        )}>
          {/* Mechanical ridges - light mode */}
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-b from-[hsl(35,50%,70%)] to-transparent dark:hidden" />
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-t from-[hsl(30,45%,60%)] to-transparent dark:hidden" />
          
          {/* Scanline effect - dark mode */}
          <div className="hidden dark:block absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.03) 2px, rgba(139,92,246,0.03) 4px)'
            }}
          />
          
          {/* Digit */}
          <AnimatePresence mode="popLayout">
            <motion.div
              key={value}
              initial={{ y: -20, opacity: 0, rotateX: -90 }}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              exit={{ y: 20, opacity: 0, rotateX: 90 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ perspective: '100px' }}
            >
              <span className={cn(
                "text-2xl sm:text-3xl font-black tabular-nums tracking-tight",
                // Light: Engraved brass numerals
                "text-[hsl(25,50%,25%)]",
                "[text-shadow:0_1px_0_rgba(255,255,255,0.5),0_-1px_0_rgba(0,0,0,0.1)]",
                // Dark: Holographic cyan glow
                "dark:text-transparent dark:bg-clip-text",
                "dark:bg-gradient-to-b dark:from-cyan-200 dark:via-white dark:to-cyan-300",
                "dark:[text-shadow:0_0_20px_rgba(34,211,238,0.8),0_0_40px_rgba(34,211,238,0.4)]"
              )}>
                {value}
              </span>
            </motion.div>
          </AnimatePresence>
          
          {/* Center divider line */}
          <div className={cn(
            "absolute inset-x-0 top-1/2 h-px -translate-y-1/2",
            "bg-gradient-to-r from-transparent via-[hsl(30,40%,55%)] to-transparent", // dark:via overrides via (bg-none resets light gradient)
            "dark:via-[rgba(139,92,246,0.3)]"
          )} />
        </div>
      </div>
      
      {/* Label */}
      <span className={cn(
        "text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em]",
        "text-[hsl(30,30%,50%)]",
        "dark:text-violet-300/50"
      )}>
        {label}
      </span>
    </div>
  );
});

/**
 * Colon separator with pulse animation
 */
function ColonSeparator() {
  return (
    <motion.div 
      className="flex flex-col gap-2 px-0.5 sm:px-1 -mt-4"
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className={cn(
        "w-1.5 h-1.5 rounded-full",
        "bg-[hsl(30,50%,55%)]",
        "dark:bg-cyan-400 dark:shadow-[0_0_8px_rgba(34,211,238,0.8)]"
      )} />
      <div className={cn(
        "w-1.5 h-1.5 rounded-full",
        "bg-[hsl(30,50%,55%)]",
        "dark:bg-cyan-400 dark:shadow-[0_0_8px_rgba(34,211,238,0.8)]"
      )} />
    </motion.div>
  );
}

/**
 * Vault door progress indicator
 */
function VaultProgress({ progress, tierColor, darkColor }) {
  return (
    <div className="relative w-full h-2 rounded-full overflow-hidden">
      {/* Track */}
      <div className={cn(
        "absolute inset-0 rounded-full",
        "bg-[hsl(35,30%,85%)]",
        "dark:bg-[rgba(139,92,246,0.1)]"
      )} />
      
      {/* Progress fill - light mode (copper) */}
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full dark:hidden"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: `linear-gradient(90deg, ${tierColor}88, ${tierColor})`
        }}
      />
      
      {/* Progress fill - dark mode (tier color) */}
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full hidden dark:block"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: `linear-gradient(90deg, ${darkColor}88, ${darkColor})`
        }}
      />
      
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
          backgroundSize: '200% 100%'
        }}
        animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/**
 * Floating reward particles
 */
function RewardParticles({ active, color }) {
  if (!active) return null;
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{ 
            background: color,
            left: `${20 + i * 12}%`,
            bottom: '20%'
          }}
          animate={{
            y: [0, -60 - Math.random() * 40],
            x: [0, (Math.random() - 0.5) * 30],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{
            duration: 1.5 + Math.random() * 0.5,
            delay: i * 0.1,
            repeat: Infinity,
            repeatDelay: 1
          }}
        />
      ))}
    </div>
  );
}

/**
 * DailyClaimCard Component
 * 
 * Redesigned with "Treasure Vault" aesthetic:
 * - Light: Antique brass vault mechanism with mechanical tumblers
 * - Dark: Cosmic holographic display with aurora energy
 */
function DailyClaimCardComponent({ className, onClaim }) {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [claimStatus, setClaimStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const tier = user?.tier || 'free';
  const tierConfig = getTierConfig(tier);
  const claimAmount = claimStatus?.claimAmount || tierConfig.dailyClaim || 10;
  
  // Light mode: consistent copper/gold | Dark mode: tier-based aurora colors
  const lightAccent = '#b8860b'; // Dark goldenrod - consistent for all tiers in light mode
  const darkTierColors = {
    free: '#8b5cf6',
    bronze: '#f59e0b',
    silver: '#94a3b8',
    gold: '#facc15',
    diamond: '#22d3ee'
  };
  const darkAccent = darkTierColors[tier] || darkTierColors.free;

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
          setCountdown(!data.canClaim && data.timeUntilNextClaim ? data.timeUntilNextClaim : null);
        }
      }
    } catch {
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
    } catch {
      // Silent fail
    } finally {
      setIsClaiming(false);
    }
  };

  useEffect(() => { fetchClaimStatus(); }, [fetchClaimStatus]);

  useEffect(() => {
    if (!countdown || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1000) { fetchClaimStatus(); return 0; }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, fetchClaimStatus]);

  if (!isAuthenticated || !user) return null;

  const formatCountdown = (ms) => {
    if (!ms || ms <= 0) return { hours: '00', minutes: '00', seconds: '00' };
    const totalSeconds = Math.floor(ms / 1000);
    return {
      hours: Math.floor(totalSeconds / 3600).toString().padStart(2, '0'),
      minutes: Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0'),
      seconds: (totalSeconds % 60).toString().padStart(2, '0')
    };
  };

  const canClaim = claimStatus?.canClaim && !countdown;
  const time = formatCountdown(countdown);
  const progress = countdown ? ((86400000 - countdown) / 86400000) * 100 : 100;
  const TierIcon = tierConfig.icon || Gift;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        // Light: Antique vault door with brass frame
        "bg-gradient-to-br from-[hsl(42,55%,96%)] via-[hsl(38,50%,93%)] to-[hsl(35,45%,88%)]",
        "border-2 border-[hsl(32,45%,70%)]",
        "shadow-[inset_0_0_0_1px_hsl(40,50%,95%),0_8px_32px_rgba(101,67,33,0.15),0_2px_8px_rgba(101,67,33,0.1)]",
        // Dark: Cosmic containment field
        "dark:bg-gradient-to-br dark:from-[rgba(15,18,30,0.98)] dark:via-[rgba(20,25,45,0.95)] dark:to-[rgba(12,15,25,0.98)]",
        "dark:border dark:border-[rgba(139,92,246,0.2)]",
        "dark:shadow-[0_0_60px_-15px_rgba(139,92,246,0.3),0_0_30px_-10px_rgba(34,211,238,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]",
        // Hover states
        "transition-shadow duration-300",
        canClaim && "hover:shadow-[inset_0_0_0_1px_hsl(40,50%,95%),0_12px_40px_rgba(101,67,33,0.2)]",
        canClaim && "dark:hover:shadow-[0_0_80px_-15px_rgba(139,92,246,0.4),0_0_40px_-10px_rgba(34,211,238,0.3)]",
        className
      )}
    >
      {/* Decorative corner bolts - light mode */}
      <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-gradient-to-br from-[hsl(35,50%,75%)] to-[hsl(30,45%,60%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.2)] dark:hidden" />
      <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-gradient-to-br from-[hsl(35,50%,75%)] to-[hsl(30,45%,60%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.2)] dark:hidden" />
      <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-gradient-to-br from-[hsl(35,50%,75%)] to-[hsl(30,45%,60%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.2)] dark:hidden" />
      <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-gradient-to-br from-[hsl(35,50%,75%)] to-[hsl(30,45%,60%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.2)] dark:hidden" />
      
      {/* Aurora energy field - dark mode */}
      <div className="hidden dark:block absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-br from-violet-500/20 via-transparent to-transparent blur-3xl"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-tl from-cyan-500/15 via-transparent to-transparent blur-3xl"
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      
      {/* Reward particles when claimable - copper for light, tier color for dark */}
      <RewardParticles active={canClaim} color={lightAccent} />
      
      {/* Top accent bar - copper foil for light, tier aurora for dark */}
      <div 
        className={cn(
          "absolute top-0 inset-x-0 h-1",
          "bg-gradient-to-r from-transparent via-[hsl(35,70%,45%)] to-transparent",
          "dark:from-transparent dark:to-transparent"
        )}
        style={{ '--tw-gradient-via': undefined }}
      />
      <div 
        className="absolute top-0 inset-x-0 h-1 hidden dark:block"
        style={{ background: `linear-gradient(90deg, transparent, ${darkAccent}, transparent)` }}
      />
      
      {/* Content */}
      <div className="relative p-4 sm:p-5 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Vault seal icon */}
            <motion.div
              className={cn(
                "relative flex items-center justify-center w-11 h-11 rounded-xl",
                // Light: Wax seal
                "bg-gradient-to-br from-[hsl(38,50%,92%)] to-[hsl(32,45%,85%)]",
                "border border-[hsl(30,40%,70%)]",
                "shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(101,67,33,0.1),0_2px_8px_rgba(101,67,33,0.15)]",
                // Dark: Energy core
                "dark:bg-gradient-to-br dark:from-[rgba(139,92,246,0.15)] dark:to-[rgba(34,211,238,0.1)]",
                "dark:border-[rgba(139,92,246,0.3)]",
                "dark:shadow-[0_0_20px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]"
              )}
              animate={canClaim ? { scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <TierIcon 
                className={cn("w-5 h-5", tierConfig.color)}
                style={{ filter: canClaim ? `drop-shadow(0 0 6px ${lightAccent})` : 'none' }}
              />
            </motion.div>
            
            <div>
              <h3 className={cn(
                "text-sm font-bold tracking-tight flex items-center gap-1.5",
                "text-[hsl(25,40%,22%)] [text-shadow:0_1px_0_rgba(255,255,255,0.6)]",
                "dark:text-white dark:[text-shadow:none]"
              )}>
                Daily Vault
                {canClaim && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 0.5, rotate: { duration: 2, repeat: Infinity } }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-cyan-400" />
                  </motion.span>
                )}
              </h3>
              <p className="text-xs text-[hsl(25,25%,50%)] dark:text-white/50">
                <span className="font-semibold text-[hsl(35,70%,40%)] dark:hidden">+{claimAmount}</span>
                <span className="font-semibold hidden dark:inline" style={{ color: darkAccent }}>+{claimAmount}</span>
                {' '}credits · {tierConfig.label}
              </p>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
            canClaim ? [
              "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-300/50",
              "dark:from-emerald-500/20 dark:to-cyan-500/20 dark:text-emerald-300 dark:border-emerald-400/30"
            ] : [
              "bg-[hsl(38,30%,92%)] text-[hsl(25,20%,50%)] border border-[hsl(30,25%,82%)]",
              "dark:bg-white/5 dark:text-white/40 dark:border-white/10"
            ]
          )}>
            {canClaim ? 'Unlocked' : 'Locked'}
          </div>
        </div>

        {/* Main content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Loader2 className={cn("w-8 h-8", tierConfig.color)} />
            </motion.div>
          </div>
        ) : canClaim ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            {/* Claim button - copper foil for light, tier aurora for dark */}
            <Button
              onClick={handleClaim}
              disabled={isClaiming}
              className={cn(
                "w-full h-12 text-sm font-bold rounded-xl text-white relative overflow-hidden group",
                "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                // Light: Copper foil button
                "bg-gradient-to-br from-[hsl(35,70%,45%)] via-[hsl(38,65%,50%)] to-[hsl(30,60%,40%)]",
                "shadow-[0_4px_20px_rgba(184,134,11,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]",
                "hover:shadow-[0_6px_28px_rgba(184,134,11,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]",
                // Dark: Tier-colored aurora button
                "dark:bg-none dark:shadow-[0_4px_20px_var(--shadow-color),inset_0_1px_0_rgba(255,255,255,0.2)]",
                "dark:hover:shadow-[0_6px_28px_var(--shadow-color),inset_0_1px_0_rgba(255,255,255,0.3)]"
              )}
              style={{ 
                '--shadow-color': `${darkAccent}50`,
                '--dark-bg': `linear-gradient(135deg, ${darkAccent}, ${darkAccent}dd)`
              }}
            >
              {/* Dark mode background override */}
              <div 
                className="absolute inset-0 hidden dark:block rounded-xl"
                style={{ background: `linear-gradient(135deg, ${darkAccent}, ${darkAccent}dd)` }}
              />
              {/* Shimmer */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              
              <span className="relative flex items-center justify-center gap-2">
                {isClaiming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening Vault...
                  </>
                ) : claimSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    +{claimAmount} Claimed!
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Claim Reward
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </span>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Countdown display */}
            <div className={cn(
              "flex items-center justify-center gap-1 sm:gap-2 py-3 px-2 rounded-xl",
              "bg-gradient-to-b from-[hsl(38,40%,94%)] to-[hsl(35,35%,90%)]",
              "border border-[hsl(30,30%,80%)]",
              "shadow-[inset_0_2px_8px_rgba(101,67,33,0.08)]",
              "dark:from-[rgba(20,25,40,0.6)] dark:to-[rgba(15,18,30,0.8)]",
              "dark:border-[rgba(139,92,246,0.15)]",
              "dark:shadow-[inset_0_0_30px_rgba(139,92,246,0.05)]"
            )}>
              <DigitFlip value={time.hours} label="hrs" />
              <ColonSeparator />
              <DigitFlip value={time.minutes} label="min" />
              <ColonSeparator />
              <DigitFlip value={time.seconds} label="sec" />
            </div>
            
            {/* Progress bar - copper for light, tier for dark */}
            <div className="space-y-2">
              <VaultProgress progress={progress} tierColor={lightAccent} darkColor={darkAccent} />
              <p className={cn(
                "text-center text-[10px] flex items-center justify-center gap-1",
                "text-[hsl(25,20%,50%)] dark:text-white/40"
              )}>
                <Clock className="w-3 h-3" />
                Resets at midnight UTC
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export const DailyClaimCard = memo(DailyClaimCardComponent);
export default DailyClaimCard;
