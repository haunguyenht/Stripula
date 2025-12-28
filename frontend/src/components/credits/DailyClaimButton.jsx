import { useState, useEffect, useCallback } from 'react';
import { Gift, Clock, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';

/**
 * DailyClaimButton Component
 * Shows claim button or countdown timer for daily free credits
 * 
 * Requirements: 7.1, 7.5, 12.5
 */

const API_BASE = '/api';
const DEFAULT_CLAIM_AMOUNT = 10;

export function DailyClaimButton({ className, onClaim, compact = false }) {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [claimStatus, setClaimStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  /**
   * Fetch claim status from backend
   */
  const fetchClaimStatus = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

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
          
          // Set countdown if not eligible
          if (!data.canClaim && data.timeUntilNextClaim) {
            setCountdown(data.timeUntilNextClaim);
          } else {
            setCountdown(null);
          }
        }
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to load claim status');
      }
    } catch (err) {

      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Handle daily claim
   */
  const handleClaim = async () => {
    if (!isAuthenticated || isClaiming) return;

    setIsClaiming(true);
    setError(null);

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
          timeUntilNextClaim: data.timeUntilNextClaim
        });
        setCountdown(data.timeUntilNextClaim);

        // Show success toast - Requirements: 12.5
        toastSuccess(`+${data.amount} credits claimed! New balance: ${data.newBalance}`);

        // Refresh user data to update balance
        if (refreshUser) {
          await refreshUser();
        }

        // Callback for parent component
        if (onClaim) {
          onClaim({
            amount: data.amount,
            newBalance: data.newBalance
          });
        }

        // Reset success state after animation
        setTimeout(() => setClaimSuccess(false), 3000);
      } else {
        setError(data.message || 'Failed to claim credits');
        // Show error toast - Requirements: 12.5
        toastError(data.message || 'Failed to claim credits');
        
        // Update status if already claimed
        if (data.code === 'CREDIT_ALREADY_CLAIMED') {
          setClaimStatus({
            canClaim: false,
            nextClaimAvailable: data.nextClaimAvailable,
            timeUntilNextClaim: data.timeUntilNextClaim
          });
          setCountdown(data.timeUntilNextClaim);
        }
      }
    } catch (err) {

      setError('Network error');
    } finally {
      setIsClaiming(false);
    }
  };

  // Fetch status on mount
  useEffect(() => {
    fetchClaimStatus();
  }, [fetchClaimStatus]);

  // Countdown timer
  useEffect(() => {
    if (!countdown || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1000) {
          // Refresh status when countdown reaches zero
          fetchClaimStatus();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, fetchClaimStatus]);

  // Don't render if not authenticated or not free tier
  if (!isAuthenticated || !user) {
    return null;
  }



  /**
   * Format countdown time
   */
  const formatCountdown = (ms) => {
    if (!ms || ms <= 0) return '00:00:00';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const canClaim = claimStatus?.canClaim && !countdown;

  // Compact version
  if (compact) {
    if (canClaim) {
      return (
        <Button
          variant="success"
          size="sm"
          onClick={handleClaim}
          disabled={isClaiming || isLoading}
          className={cn("gap-1.5", className)}
        >
          {isClaiming ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Gift className="h-3.5 w-3.5" />
          )}
          Claim {claimStatus?.claimAmount || DEFAULT_CLAIM_AMOUNT}
        </Button>
      );
    }
    
    // Show countdown when already claimed
    if (countdown && countdown > 0) {
      return (
        <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
          <Clock className="h-3.5 w-3.5" />
          <span>{formatCountdown(countdown)}</span>
        </div>
      );
    }

    // Show loading state
    if (isLoading) {
      return (
        <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        </div>
      );
    }
    
    return null;
  }

  return (
    <Card 
      variant="elevated" 
      className={cn(
        "overflow-hidden transition-all duration-300",
        claimSuccess && "ring-2 ring-emerald-500/50",
        className
      )}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className={cn(
            "p-2 rounded-lg",
            canClaim 
              ? "bg-emerald-500/10 dark:bg-emerald-500/20" 
              : "bg-muted"
          )}>
            <Gift className={cn(
              "h-5 w-5",
              canClaim 
                ? "text-emerald-600 dark:text-emerald-400" 
                : "text-muted-foreground"
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Free Daily Bonus</h3>
            <p className="text-xs text-muted-foreground">
              {canClaim ? `Claim ${claimStatus?.claimAmount || DEFAULT_CLAIM_AMOUNT} free credits!` : 'Already claimed today'}
            </p>
          </div>
        </div>

        {/* Claim button or countdown */}
        {canClaim ? (
          <Button
            variant="success"
            onClick={handleClaim}
            disabled={isClaiming || isLoading}
            className="w-full"
          >
            {isClaiming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Claiming...
              </>
            ) : claimSuccess ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Claimed +{claimStatus?.claimAmount || DEFAULT_CLAIM_AMOUNT} Credits!
              </>
            ) : (
              <>
                <Gift className="h-4 w-4 mr-2" />
                Claim {claimStatus?.claimAmount || DEFAULT_CLAIM_AMOUNT} Free Credits
              </>
            )}
          </Button>
        ) : (
          <div className={cn(
            "flex items-center justify-center gap-2 py-3 px-4 rounded-lg",
            "bg-muted/50 dark:bg-muted/30"
          )}>
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-lg font-semibold">
              {isLoading ? '--:--:--' : formatCountdown(countdown)}
            </span>
          </div>
        )}

        {/* Info text */}
        <p className="mt-3 text-xs text-center text-muted-foreground">
          {canClaim 
            ? 'Starter tier bonus - claim once per day'
            : `Resets at midnight UTC`
          }
        </p>

        {/* Error state */}
        {error && (
          <p className="mt-2 text-xs text-red-500 text-center">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default DailyClaimButton;
