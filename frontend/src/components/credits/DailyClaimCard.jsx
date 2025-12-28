import { useState, useEffect, useCallback } from 'react';
import { Gift, Clock, Check, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const TIER_GLOW = {
  free: 'shadow-gray-500/20',
  bronze: 'shadow-amber-500/30',
  silver: 'shadow-slate-400/30',
  gold: 'shadow-yellow-500/40',
  diamond: 'shadow-cyan-400/50'
};

export function DailyClaimCard({ className, onClaim }) {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [claimStatus, setClaimStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const tier = user?.tier || 'free';
  const claimAmount = claimStatus?.claimAmount || TIER_CLAIM_AMOUNTS[tier] || 10;

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

  return (
    <Card 
      variant="elevated" 
      className={cn(
        "overflow-hidden transition-all duration-500 relative",
        claimSuccess && "ring-2 ring-emerald-500/50",
        canClaim && `shadow-lg ${TIER_GLOW[tier]}`,
        className
      )}
    >
      {/* Animated background gradient when claimable */}
      <AnimatePresence>
        {canClaim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-5",
              TIER_COLORS[tier]
            )}
          />
        )}
      </AnimatePresence>

      <CardContent className="p-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl border",
                canClaim 
                  ? `bg-gradient-to-br ${TIER_COLORS[tier]} border-transparent` 
                  : "bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-400/15 dark:to-purple-400/15 border-violet-500/20 dark:border-violet-400/20"
              )}
              animate={canClaim ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Gift className={cn(
                "h-5 w-5",
                canClaim ? "text-white" : "text-violet-600 dark:text-violet-400"
              )} />
            </motion.div>
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                Daily Bonus
                {canClaim && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                  </motion.span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground capitalize">
                {tier} tier · +{claimAmount} credits/day
              </p>
            </div>
          </div>
          
          <Badge 
            variant={canClaim ? "success" : "secondary"}
            className="text-[10px]"
          >
            {canClaim ? 'Ready!' : 'Claimed'}
          </Badge>
        </div>

        {/* Claim Button or Countdown */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : canClaim ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              variant="default"
              onClick={handleClaim}
              disabled={isClaiming}
              className={cn(
                "w-full h-12 text-base font-semibold relative overflow-hidden",
                "bg-gradient-to-r hover:opacity-90 transition-opacity",
                TIER_COLORS[tier]
              )}
            >
              {isClaiming ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : claimSuccess ? (
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="flex items-center"
                >
                  <Check className="h-5 w-5 mr-2" />
                  +{claimAmount} Credits Added!
                </motion.span>
              ) : (
                <>
                  <Gift className="h-5 w-5 mr-2" />
                  Claim {claimAmount} Credits
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Modern circular progress with countdown */}
            <div className="flex items-center justify-center">
              <div className="relative">
                {/* Circular progress ring */}
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-muted/30"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className={cn("text-transparent stroke-[url(#gradient)]")}
                    style={{
                      strokeDasharray: 264,
                      strokeDashoffset: 264 - (264 * progress) / 100
                    }}
                    initial={{ strokeDashoffset: 264 }}
                    animate={{ strokeDashoffset: 264 - (264 * progress) / 100 }}
                    transition={{ duration: 0.5 }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={
                        tier === 'diamond' ? '#22d3ee' :
                        tier === 'gold' ? '#facc15' :
                        tier === 'silver' ? '#94a3b8' :
                        tier === 'bronze' ? '#d97706' : '#9ca3af'
                      } />
                      <stop offset="100%" stopColor={
                        tier === 'diamond' ? '#3b82f6' :
                        tier === 'gold' ? '#ca8a04' :
                        tier === 'silver' ? '#64748b' :
                        tier === 'bronze' ? '#b45309' : '#6b7280'
                      } />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Time display in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold tabular-nums tracking-tight">
                    {time.hours}:{time.minutes}
                  </span>
                  <motion.span 
                    className="text-xs text-muted-foreground tabular-nums"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    :{time.seconds}
                  </motion.span>
                </div>
              </div>
            </div>
            
            <p className="text-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1 opacity-60" />
              Resets at midnight UTC
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
