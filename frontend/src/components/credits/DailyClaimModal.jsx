import { useState, useEffect, useCallback } from 'react';
import { Gift, Clock, Check, Loader2, Sparkles, Coins, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = '/api';

const TIER_COLORS = {
  free: {
    gradient: 'from-neutral-400 to-neutral-500',
    bg: 'bg-neutral-500/10 dark:bg-neutral-400/15',
    glow: 'shadow-neutral-500/20',
    text: 'text-neutral-600 dark:text-neutral-300',
  },
  bronze: {
    gradient: 'from-amber-600 to-amber-700',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    glow: 'shadow-amber-500/30',
    text: 'text-amber-700 dark:text-amber-300',
  },
  silver: {
    gradient: 'from-slate-400 to-slate-500',
    bg: 'bg-slate-400/10 dark:bg-slate-400/15',
    glow: 'shadow-slate-400/30',
    text: 'text-slate-600 dark:text-slate-300',
  },
  gold: {
    gradient: 'from-yellow-400 to-yellow-600',
    bg: 'bg-yellow-500/10 dark:bg-yellow-500/15',
    glow: 'shadow-yellow-500/40',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  diamond: {
    gradient: 'from-cyan-400 to-blue-500',
    bg: 'bg-cyan-400/10 dark:bg-cyan-400/15',
    glow: 'shadow-cyan-400/50',
    text: 'text-cyan-700 dark:text-cyan-300',
  }
};

/**
 * DailyClaimModal - Redesigned for OrangeAI/OPUX Design System
 * 
 * Modern daily credit claim modal with:
 * - Tier-based gradient styling
 * - Animated gift icon and particles
 * - Glass morphism effects in dark mode
 */
export function DailyClaimModal({ 
  open, 
  onOpenChange, 
  onClaim,
  autoShow = false 
}) {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [claimStatus, setClaimStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const tier = user?.tier || 'free';
  const tierConfig = TIER_COLORS[tier] || TIER_COLORS.free;
  // Use claim amount from API only - no hardcoded fallback
  const claimAmount = claimStatus?.claimAmount || 0;

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
      // Silent error
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
        setClaimStatus({
          canClaim: false,
          nextClaimAvailable: data.nextClaimAvailable,
          timeUntilNextClaim: data.timeUntilNextClaim,
          claimAmount: data.amount
        });

        if (refreshUser) await refreshUser();
        if (onClaim) onClaim(data.amount);

        setTimeout(() => {
          setIsOpen(false);
          setClaimSuccess(false);
        }, 2000);
      }
    } catch (err) {
      // Silent error
    } finally {
      setIsClaiming(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setIsOpen(false);
  };

  useEffect(() => {
    fetchClaimStatus();
  }, [fetchClaimStatus]);

  useEffect(() => {
    const lastDismiss = localStorage.getItem('dailyClaimDismissed');
    if (lastDismiss) {
      const dismissTime = parseInt(lastDismiss, 10);
      const sixHoursMs = 6 * 60 * 60 * 1000;
      if (Date.now() - dismissTime > sixHoursMs) {
        setDismissed(false);
        localStorage.removeItem('dailyClaimDismissed');
      } else {
        setDismissed(true);
      }
    }
  }, []);

  useEffect(() => {
    if (dismissed) {
      localStorage.setItem('dailyClaimDismissed', Date.now().toString());
    }
  }, [dismissed]);

  if (!isAuthenticated || !user) return null;

  const canClaim = claimStatus?.canClaim;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent 
        className={cn(
          "sm:max-w-[380px] overflow-hidden",
          canClaim && `shadow-lg ${tierConfig.glow}`
        )} 
        hideCloseButton
      >
        {/* Gradient overlay for tier theming */}
        {canClaim && (
          <div className={cn(
            "absolute inset-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none",
            `bg-gradient-to-br ${tierConfig.gradient}`
          )} />
        )}
        
        {/* Animated particles */}
        <AnimatePresence>
          {(canClaim || claimSuccess) && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className={cn("absolute rounded-full", tierConfig.bg)}
                  style={{
                    width: 6 + Math.random() * 10,
                    height: 6 + Math.random() * 10,
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0.4, 0.7, 0.4],
                    scale: [0.8, 1.2, 0.8],
                    y: [0, -15, 0]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2 + Math.random() * 2,
                    delay: Math.random() * 0.5 
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        <DialogHeader className="text-center sm:text-center relative z-10">
          {/* Gift Icon */}
          <DialogTitle className="flex items-center justify-center">
            <motion.div
              className={cn(
                "p-4 rounded-2xl",
                `bg-gradient-to-br ${tierConfig.gradient}`,
                "shadow-lg",
                tierConfig.glow
              )}
              animate={canClaim && !claimSuccess ? { 
                scale: [1, 1.08, 1],
                rotate: [0, -4, 4, 0]
              } : {}}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            >
              {claimSuccess ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Check className="h-8 w-8 text-white" />
                </motion.div>
              ) : (
                <Gift className="h-8 w-8 text-white" />
              )}
            </motion.div>
          </DialogTitle>
          
          <DialogDescription asChild>
            <div className="space-y-3 pt-4">
              <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                {claimSuccess ? 'Credits Added!' : 'Daily Bonus Available!'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "capitalize font-medium",
                    "border-neutral-200 dark:border-white/15"
                  )}
                >
                  {tier} Tier
                </Badge>
                <Badge className={cn(
                  "text-white border-0 font-semibold",
                  `bg-gradient-to-r ${tierConfig.gradient}`
                )}>
                  <Coins className="h-3 w-3 mr-1" />
                  +{claimAmount}
                </Badge>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="relative z-10 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400 dark:text-white/40" />
            </div>
          ) : claimSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400"
              >
                <Sparkles className="h-7 w-7" />
                +{claimAmount}
                <Sparkles className="h-7 w-7" />
              </motion.div>
              <p className="text-[13px] text-neutral-500 dark:text-white/50 mt-2">
                Credits added to your balance!
              </p>
            </motion.div>
          ) : canClaim ? (
            <div className="space-y-4">
              <p className="text-center text-[14px] text-neutral-500 dark:text-white/60">
                Claim your free daily credits now!
              </p>
              
              <Button
                onClick={handleClaim}
                disabled={isClaiming}
                className={cn(
                  "w-full h-12 text-base font-semibold text-white border-0",
                  "bg-gradient-to-r hover:opacity-90 transition-opacity",
                  "shadow-lg",
                  tierConfig.gradient,
                  tierConfig.glow
                )}
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Gift className="h-5 w-5 mr-2" />
                    Claim {claimAmount} Credits
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="w-full text-neutral-400 hover:text-neutral-600 dark:text-white/40 dark:hover:text-white/70"
              >
                Remind me later
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className={cn(
                "inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3",
                "bg-neutral-100 dark:bg-white/[0.06]"
              )}>
                <Clock className="h-7 w-7 text-neutral-400 dark:text-white/40" />
              </div>
              <p className="text-[14px] text-neutral-500 dark:text-white/55">
                Already claimed today
              </p>
              <p className="text-[12px] text-neutral-400 dark:text-white/40 mt-1">
                Come back tomorrow!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage daily claim modal state
 */
export function useDailyClaimModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [claimAmount, setClaimAmount] = useState(0);

  const show = useCallback(() => setIsOpen(true), []);
  const hide = useCallback(() => setIsOpen(false), []);
  
  const handleClaim = useCallback((amount) => {
    setClaimAmount(amount);
  }, []);

  return {
    isOpen,
    setIsOpen,
    show,
    hide,
    claimAmount,
    onClaim: handleClaim
  };
}

export default DailyClaimModal;
