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

const TIER_CLAIM_AMOUNTS = {
  free: 10,
  bronze: 15,
  silver: 20,
  gold: 30,
  diamond: 50
};

const TIER_COLORS = {
  free: 'from-gray-400 to-gray-500',
  bronze: 'from-amber-600 to-amber-700',
  silver: 'from-slate-400 to-slate-500',
  gold: 'from-yellow-400 to-yellow-600',
  diamond: 'from-cyan-400 to-blue-500'
};

const TIER_BG = {
  free: 'bg-gray-500/10',
  bronze: 'bg-amber-500/10',
  silver: 'bg-slate-400/10',
  gold: 'bg-yellow-500/10',
  diamond: 'bg-cyan-400/10'
};

const TIER_GLOW = {
  free: 'shadow-gray-500/20',
  bronze: 'shadow-amber-500/30',
  silver: 'shadow-slate-400/30',
  gold: 'shadow-yellow-500/40',
  diamond: 'shadow-cyan-400/50'
};

/**
 * DailyClaimModal - Popup modal for daily credit claim
 * 
 * Shows automatically when daily claim is available (if autoShow is true).
 * Features animated gift icon, tier-based styling, and celebration effects.
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
  const claimAmount = claimStatus?.claimAmount || TIER_CLAIM_AMOUNTS[tier] || 10;

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
          
          // Auto-show modal if claim is available and autoShow is enabled
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

        // Close modal after showing success
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

  // Reset dismissed state on new session (every 6 hours)
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

  // Persist dismiss state
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
          "sm:max-w-md overflow-hidden",
          canClaim && `shadow-lg ${TIER_GLOW[tier]}`
        )} 
        hideCloseButton
      >
        {/* Light mode: subtle gradient overlay */}
        {canClaim && (
          <div className={cn(
            "absolute inset-0 opacity-[0.03] pointer-events-none",
            `bg-gradient-to-br ${TIER_COLORS[tier]}`
          )} />
        )}
        
        <DialogHeader className="text-center sm:text-center relative z-10">
          <DialogTitle className="flex items-center justify-center gap-2">
            <motion.div
              className={cn(
                "p-3 rounded-2xl shadow-lg",
                `bg-gradient-to-br ${TIER_COLORS[tier]}`,
                // Light mode shadow
                "shadow-black/10",
                // Dark mode glow
                `dark:shadow-lg dark:${TIER_GLOW[tier]}`
              )}
              animate={canClaim && !claimSuccess ? { 
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0]
              } : {}}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
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
            <div className="space-y-2 pt-2">
              <p className={cn(
                "text-lg font-semibold",
                // Light mode
                "text-neutral-900",
                // Dark mode
                "dark:text-white"
              )}>
                {claimSuccess ? 'Credits Added!' : 'Daily Bonus Available!'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {tier} Tier
                </Badge>
                <Badge className={cn("bg-gradient-to-r text-white border-0", TIER_COLORS[tier])}>
                  <Coins className="h-3 w-3 mr-1" />
                  +{claimAmount}
                </Badge>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Animated coins/sparkles background */}
        <AnimatePresence>
          {(canClaim || claimSuccess) && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className={cn("absolute", TIER_BG[tier])}
                  style={{
                    width: 8 + Math.random() * 12,
                    height: 8 + Math.random() * 12,
                    borderRadius: '50%',
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0.3, 0.6, 0.3],
                    scale: [0.8, 1.2, 0.8],
                    y: [0, -20, 0]
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

        {/* Content */}
        <div className="relative z-10 space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : claimSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className={cn(
                  "inline-flex items-center gap-2 text-3xl font-bold",
                  "text-emerald-600 dark:text-emerald-400"
                )}
              >
                <Sparkles className="h-8 w-8" />
                +{claimAmount}
                <Sparkles className="h-8 w-8" />
              </motion.div>
              <p className="text-sm text-muted-foreground mt-2">
                Credits added to your balance!
              </p>
            </motion.div>
          ) : canClaim ? (
            <div className="space-y-4">
              <p className={cn(
                "text-center text-sm",
                "text-neutral-500 dark:text-white/60"
              )}>
                Claim your free daily credits now!
              </p>
              
              <Button
                onClick={handleClaim}
                disabled={isClaiming}
                className={cn(
                  "w-full h-14 text-lg font-semibold relative overflow-hidden border-0",
                  "bg-gradient-to-r hover:opacity-90 transition-opacity",
                  // Add shadow for depth
                  "shadow-lg",
                  TIER_COLORS[tier]
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
                className={cn(
                  "w-full",
                  "text-neutral-400 hover:text-neutral-600",
                  "dark:text-white/40 dark:hover:text-white/80"
                )}
              >
                Remind me later
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <Clock className={cn(
                "h-8 w-8 mx-auto mb-2",
                "text-neutral-400 dark:text-white/40"
              )} />
              <p className={cn(
                "text-sm",
                "text-neutral-500 dark:text-white/55"
              )}>
                Already claimed today. Come back tomorrow!
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
