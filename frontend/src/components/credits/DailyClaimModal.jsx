import { useState, useEffect, useCallback, useMemo } from 'react';
import { Gift, Clock, Check, Loader2, Coins, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useAuth } from '@/contexts/AuthContext';
import { getTierConfig } from '@/components/navigation/config/tier-config';

const API_BASE = '/api';

/**
 * DailyClaimModal - Premium Daily Rewards Experience
 * 
 * Light Mode: Vintage Treasury Vault aesthetic
 * - Aged parchment with copper foil accents
 * - Wax seal icon containers
 * - Embossed typography with certificate borders
 * - Treasury coin motif decorations
 * 
 * Dark Mode: Liquid Aurora Glass aesthetic
 * - Deep cosmic glass with aurora gradients
 * - Prismatic light effects
 * - Floating particle animations
 * - Specular edge highlights
 */

// Tier-specific accent colors for visual differentiation
const tierAccents = {
  free: {
    light: { primary: 'hsl(270,50%,55%)', secondary: 'hsl(280,45%,60%)' },
    dark: { primary: '#8b5cf6', secondary: '#a78bfa' }
  },
  bronze: {
    light: { primary: 'hsl(25,70%,50%)', secondary: 'hsl(30,65%,55%)' },
    dark: { primary: '#d97706', secondary: '#f59e0b' }
  },
  silver: {
    light: { primary: 'hsl(215,15%,50%)', secondary: 'hsl(210,10%,55%)' },
    dark: { primary: '#94a3b8', secondary: '#cbd5e1' }
  },
  gold: {
    light: { primary: 'hsl(45,85%,45%)', secondary: 'hsl(40,80%,50%)' },
    dark: { primary: '#eab308', secondary: '#facc15' }
  },
  diamond: {
    light: { primary: 'hsl(185,70%,45%)', secondary: 'hsl(200,80%,50%)' },
    dark: { primary: '#22d3ee', secondary: '#67e8f9' }
  }
};

const getAccent = (tier, mode) => tierAccents[tier]?.[mode] || tierAccents.free[mode];

// Floating coin particles for celebration
function FloatingCoins({ tier, count = 6 }) {
  const accent = getAccent(tier, 'dark');
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ 
            x: Math.random() * 100 - 50, 
            y: 120 + Math.random() * 40,
            opacity: 0,
            scale: 0.5,
            rotate: Math.random() * 360
          }}
          animate={{ 
            y: -60 - Math.random() * 60,
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1, 1, 0.8],
            rotate: Math.random() * 720 - 360
          }}
          transition={{
            duration: 2.5 + Math.random() * 1,
            delay: i * 0.15,
            ease: [0.25, 0.1, 0.25, 1]
          }}
          style={{ left: `${15 + i * 12}%` }}
        >
          <Coins 
            className="w-5 h-5" 
            style={{ 
              color: accent.primary,
              filter: `drop-shadow(0 0 8px ${accent.primary}40)`
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// Radial shimmer effect
function RadialShimmer({ active }) {
  if (!active) return null;
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0, 0.15, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)'
      }}
    />
  );
}

// Treasury seal icon container
function TreasurySeal({ children, tier, isSuccess, canClaim }) {
  const tierConfig = getTierConfig(tier);
  const accent = getAccent(tier, 'light');
  const accentDark = getAccent(tier, 'dark');
  
  return (
    <motion.div 
      className="relative"
      animate={canClaim && !isSuccess ? { 
        scale: [1, 1.03, 1], 
        rotate: [0, -2, 2, 0] 
      } : {}}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Outer glow ring */}
      {canClaim && !isSuccess && (
        <motion.div
          className="absolute -inset-2 rounded-2xl opacity-30 dark:opacity-40"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            background: `radial-gradient(circle, ${accent.primary}40 0%, transparent 70%)`
          }}
        />
      )}
      
      {/* Main seal container */}
      <div 
        className={cn(
          "relative flex items-center justify-center w-16 h-16 rounded-2xl",
          // Light mode: Wax seal with copper embossing
          "bg-gradient-to-b from-[hsl(38,45%,96%)] via-[hsl(35,40%,92%)] to-[hsl(32,35%,88%)]",
          "border-2",
          "shadow-[inset_0_2px_0_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(101,67,33,0.15),0_4px_12px_rgba(101,67,33,0.2)]",
          // Dark mode: Aurora glass with gradient
          "dark:bg-none dark:bg-gradient-to-b",
          "dark:border dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_30px_rgba(139,92,246,0.15)]"
        )}
        style={{
          borderColor: `${accent.primary}50`,
          '--tw-gradient-from': `${accentDark.primary}30`,
          '--tw-gradient-to': `${accentDark.secondary}15`,
        }}
      >
        {/* Inner highlight */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent dark:from-white/10" />
        </div>
        
        {/* Icon */}
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div 
              key="check"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Check 
                className="h-7 w-7" 
                style={{ color: accent.primary }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="gift"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              <tierConfig.icon 
                className="h-7 w-7" 
                style={{ 
                  color: accent.primary,
                  filter: canClaim ? `drop-shadow(0 2px 4px ${accent.primary}40)` : 'none'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Countdown timer display
function CountdownBadge({ tier }) {
  const accent = getAccent(tier, 'light');
  
  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
        // Light mode: Aged ledger paper
        "bg-gradient-to-r from-[hsl(38,35%,94%)] to-[hsl(35,30%,92%)]",
        "border border-[hsl(30,25%,78%)]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(101,67,33,0.1)]",
        // Dark mode: Glass with aurora tint
        "dark:bg-white/[0.05] dark:border-white/10"
      )}
    >
      <Clock className="w-3.5 h-3.5 text-[hsl(25,30%,50%)] dark:text-white/50" />
      <span className="text-xs font-medium text-[hsl(25,30%,45%)] dark:text-white/60">
        Already claimed today
      </span>
    </div>
  );
}

// Ready to claim badge
function ReadyBadge() {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
        // Light mode: Treasury seal green
        "bg-gradient-to-r from-[hsl(145,45%,92%)] to-[hsl(155,40%,90%)]",
        "border border-[hsl(145,40%,65%)]/50",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_8px_rgba(34,197,94,0.15)]",
        // Dark mode: Emerald glow
        "dark:bg-emerald-500/15 dark:border-emerald-400/30",
        "dark:shadow-[0_0_20px_rgba(34,197,94,0.15)]"
      )}
    >
      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
        Ready
      </span>
    </motion.div>
  );
}

// Main claim button with premium styling
function ClaimButton({ onClick, isClaiming, claimAmount, tier }) {
  const tierConfig = getTierConfig(tier);
  const accent = getAccent(tier, 'light');
  const accentDark = getAccent(tier, 'dark');
  
  return (
    <Button
      onClick={onClick}
      disabled={isClaiming}
      className={cn(
        "w-full h-14 text-base font-bold rounded-xl text-white relative overflow-hidden",
        "transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
        // Light mode: Copper foil button
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_16px_rgba(101,67,33,0.25),0_2px_4px_rgba(101,67,33,0.15)]",
        "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_24px_rgba(101,67,33,0.3),0_3px_6px_rgba(101,67,33,0.2)]",
        // Dark mode: Aurora glow button
        "dark:shadow-[0_0_30px_rgba(139,92,246,0.2),0_4px_20px_rgba(0,0,0,0.4)]",
        "dark:hover:shadow-[0_0_40px_rgba(139,92,246,0.3),0_6px_30px_rgba(0,0,0,0.5)]"
      )}
      style={{
        background: `linear-gradient(135deg, ${accent.primary} 0%, ${accent.secondary} 50%, ${accent.primary} 100%)`,
        backgroundSize: '200% 100%'
      }}
    >
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
          width: '50%'
        }}
      />
      
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isClaiming ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Claiming...</span>
          </>
        ) : (
          <>
            <Gift className="h-5 w-5" />
            <span>Claim {claimAmount} Credits</span>
          </>
        )}
      </span>
    </Button>
  );
}

// Success celebration display - responsive layout
function SuccessDisplay({ claimAmount, tier }) {
  const accent = getAccent(tier, 'light');
  const accentDark = getAccent(tier, 'dark');
  const tierConfig = getTierConfig(tier);
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="py-5 px-2"
    >
      {/* Success card container - responsive flex */}
      <motion.div
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        className={cn(
          "flex flex-col items-center gap-4 p-5 rounded-2xl",
          // Light mode: Treasury certificate badge
          "bg-gradient-to-b from-[hsl(38,45%,97%)] to-[hsl(35,40%,93%)]",
          "border-2 border-[hsl(30,35%,75%)]",
          "shadow-[inset_0_0_0_3px_hsl(38,45%,96%),inset_0_0_0_4px_hsl(30,30%,82%),0_4px_20px_rgba(101,67,33,0.15)]",
          // Dark mode: Aurora glass
          "dark:bg-none dark:bg-[rgba(255,255,255,0.04)]",
          "dark:border dark:border-white/10",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_40px_rgba(139,92,246,0.12)]"
        )}
      >
        {/* Icon with celebration ring */}
        <div className="relative">
          {/* Pulsing ring */}
          <motion.div
            className="absolute -inset-3 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ 
              background: `radial-gradient(circle, ${accent.primary}30 0%, transparent 70%)` 
            }}
          />
          {/* Icon container */}
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className={cn(
              "relative flex items-center justify-center w-14 h-14 rounded-xl",
              // Light mode
              "bg-gradient-to-b from-[hsl(145,50%,92%)] to-[hsl(150,45%,88%)]",
              "border border-[hsl(145,40%,70%)]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_8px_rgba(34,197,94,0.2)]",
              // Dark mode
              "dark:bg-gradient-to-b dark:from-emerald-500/20 dark:to-emerald-600/10",
              "dark:border-emerald-400/30",
              "dark:shadow-[0_0_20px_rgba(34,197,94,0.15)]"
            )}
          >
            <Check className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </motion.div>
        </div>
        
        {/* Amount and label - stacked for responsiveness */}
        <div className="flex flex-col items-center gap-1 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2"
          >
            <Coins 
              className="w-6 h-6 shrink-0" 
              style={{ color: accent.primary }}
            />
            <span 
              className="text-3xl sm:text-4xl font-black tracking-tight"
              style={{ 
                color: accent.primary,
                textShadow: `0 2px 4px ${accent.primary}20`
              }}
            >
              +{claimAmount}
            </span>
          </motion.div>
          
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              "text-[hsl(25,30%,55%)] dark:text-white/50"
            )}
          >
            Credits
          </motion.span>
        </div>
        
        {/* Confirmation message */}
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={cn(
            "text-sm font-medium text-center leading-relaxed max-w-[200px]",
            "text-[hsl(25,25%,45%)] dark:text-white/60"
          )}
        >
          Added to your balance
        </motion.p>
      </motion.div>
      
      {/* Tier info badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center mt-4"
      >
        <div 
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
            // Light mode
            "bg-[hsl(38,35%,94%)] border border-[hsl(30,25%,80%)]",
            // Dark mode
            "dark:bg-white/[0.04] dark:border-white/10"
          )}
        >
          <tierConfig.icon 
            className="w-3.5 h-3.5" 
            style={{ color: accent.primary }}
          />
          <span 
            className="text-xs font-medium"
            style={{ color: accent.primary }}
          >
            {tierConfig.label} Bonus
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function DailyClaimModal({ open, onOpenChange, onClaim, autoShow = false }) {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [claimStatus, setClaimStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const tier = user?.tier || 'free';
  const tierConfig = getTierConfig(tier);
  const accent = getAccent(tier, 'light');
  const claimAmount = claimStatus?.claimAmount || tierConfig.dailyClaim || 10;

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

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
          if (autoShow && data.canClaim && !dismissed && open === undefined) {
            setInternalOpen(true);
          }
        }
      }
    } catch (err) {
      // Silent
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, autoShow, dismissed, open]);

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
        setClaimStatus({ canClaim: false, claimAmount: data.amount });
        if (refreshUser) await refreshUser();
        if (onClaim) onClaim(data.amount);
        setTimeout(() => { setIsOpen(false); setClaimSuccess(false); }, 2800);
      }
    } catch (err) {
      // Silent
    } finally {
      setIsClaiming(false);
    }
  };

  useEffect(() => { fetchClaimStatus(); }, [fetchClaimStatus]);

  useEffect(() => {
    const lastDismiss = localStorage.getItem('dailyClaimDismissed');
    if (lastDismiss) {
      const dismissTime = parseInt(lastDismiss, 10);
      if (Date.now() - dismissTime > 6 * 60 * 60 * 1000) {
        setDismissed(false);
        localStorage.removeItem('dailyClaimDismissed');
      } else {
        setDismissed(true);
      }
    }
  }, []);

  useEffect(() => {
    if (dismissed) localStorage.setItem('dailyClaimDismissed', Date.now().toString());
  }, [dismissed]);

  if (!isAuthenticated || !user) return null;

  const canClaim = claimStatus?.canClaim;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent 
        className={cn(
          "sm:max-w-[380px] p-0 overflow-hidden border-0",
          // Remove default DialogContent styles - we'll handle them ourselves
          "!bg-transparent !shadow-none !border-0"
        )} 
        hideCloseButton
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>Daily Bonus</DialogTitle>
        </VisuallyHidden>
        {/* Custom modal container */}
        <div 
          className={cn(
            "relative rounded-2xl overflow-hidden",
            // Light mode: Vintage treasury vault aesthetic
            "bg-gradient-to-b from-[hsl(40,50%,97%)] via-[hsl(38,45%,95%)] to-[hsl(35,40%,92%)]",
            "border-2 border-[hsl(30,35%,72%)]",
            "shadow-[inset_0_0_0_3px_hsl(38,45%,96%),inset_0_0_0_4px_hsl(30,30%,78%),0_24px_80px_rgba(101,67,33,0.25),0_8px_32px_rgba(101,67,33,0.15)]",
            // Dark mode: Liquid aurora glass
            "dark:bg-none dark:bg-[rgba(12,15,22,0.95)]",
            "dark:backdrop-blur-[60px] dark:backdrop-saturate-[180%]",
            "dark:border dark:border-[rgba(139,92,246,0.15)]",
            "dark:shadow-[0_0_0_1px_rgba(139,92,246,0.08),0_0_60px_rgba(139,92,246,0.1),0_0_100px_-20px_rgba(34,211,238,0.08),0_32px_100px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]"
          )}
        >
          {/* Paper grain texture - light mode */}
          <div 
            className="absolute inset-0 pointer-events-none dark:hidden opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '120px 120px'
            }}
          />
          
          {/* Aurora gradient overlay - dark mode */}
          <div className="absolute inset-0 pointer-events-none hidden dark:block">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6]/[0.04] via-transparent to-[#22d3ee]/[0.03]" />
          </div>
          
          {/* Corner ornaments - light mode */}
          <div className="absolute top-3 left-3 w-5 h-5 border-l-2 border-t-2 border-[hsl(25,55%,55%)]/40 rounded-tl-sm pointer-events-none dark:hidden" />
          <div className="absolute top-3 right-3 w-5 h-5 border-r-2 border-t-2 border-[hsl(25,55%,55%)]/40 rounded-tr-sm pointer-events-none dark:hidden" />
          <div className="absolute bottom-3 left-3 w-5 h-5 border-l-2 border-b-2 border-[hsl(25,55%,55%)]/40 rounded-bl-sm pointer-events-none dark:hidden" />
          <div className="absolute bottom-3 right-3 w-5 h-5 border-r-2 border-b-2 border-[hsl(25,55%,55%)]/40 rounded-br-sm pointer-events-none dark:hidden" />
          
          {/* Radial shimmer for "can claim" state */}
          <RadialShimmer active={canClaim && !claimSuccess} />
          
          {/* Floating coins celebration */}
          <AnimatePresence>
            {claimSuccess && <FloatingCoins tier={tier} count={8} />}
          </AnimatePresence>
          
          {/* Content container */}
          <div className="relative z-10 p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <TreasurySeal 
                tier={tier} 
                isSuccess={claimSuccess}
                canClaim={canClaim}
              />
              
              <div className="flex-1 min-w-0">
                <h2 
                  className={cn(
                    "text-lg font-bold tracking-tight",
                    // Light mode: Embossed sepia text
                    "text-[hsl(25,35%,22%)]",
                    "[text-shadow:0_1px_0_rgba(255,255,255,0.5),0_-1px_0_rgba(101,67,33,0.1)]",
                    // Dark mode: Bright white
                    "dark:text-white dark:[text-shadow:none]"
                  )}
                >
                  {claimSuccess ? 'Claimed!' : 'Daily Bonus'}
                </h2>
                <p 
                  className={cn(
                    "text-sm mt-0.5",
                    "text-[hsl(25,25%,45%)] dark:text-white/60"
                  )}
                >
                  {tierConfig.label} · <span className="font-semibold">+{claimAmount}</span> credits
                </p>
              </div>
              
              {/* Status badge */}
              {canClaim ? <ReadyBadge /> : <CountdownBadge tier={tier} />}
            </div>
            
            {/* Main content area */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                >
                  <Loader2 
                    className="h-8 w-8" 
                    style={{ color: accent.primary }}
                  />
                </motion.div>
              </div>
            ) : claimSuccess ? (
              <SuccessDisplay claimAmount={claimAmount} tier={tier} />
            ) : canClaim ? (
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <ClaimButton
                  onClick={handleClaim}
                  isClaiming={isClaiming}
                  claimAmount={claimAmount}
                  tier={tier}
                />
                
                <button
                  onClick={() => { setDismissed(true); setIsOpen(false); }}
                  className={cn(
                    "w-full text-sm py-2 font-medium transition-colors",
                    "text-[hsl(25,20%,50%)] hover:text-[hsl(25,25%,35%)]",
                    "dark:text-white/40 dark:hover:text-white/70"
                  )}
                >
                  Remind me later
                </button>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
              >
                <div 
                  className={cn(
                    "w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center",
                    // Light mode: Muted parchment
                    "bg-gradient-to-b from-[hsl(38,35%,94%)] to-[hsl(35,30%,90%)]",
                    "border border-[hsl(30,25%,78%)]",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_4px_rgba(101,67,33,0.08)]",
                    // Dark mode: Subtle glass
                    "dark:bg-white/[0.04] dark:border-white/10"
                  )}
                >
                  <Clock className="h-6 w-6 text-[hsl(25,25%,55%)] dark:text-white/40" />
                </div>
                <p className="text-sm font-medium text-[hsl(25,25%,45%)] dark:text-white/50">
                  Come back tomorrow for more credits
                </p>
              </motion.div>
            )}
          </div>
          
          {/* Specular edge highlight - dark mode */}
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none hidden dark:block" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { useDailyClaimModal } from '@/hooks/useDailyClaimModal';

export default DailyClaimModal;
