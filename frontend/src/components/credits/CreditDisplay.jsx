import { useState, useEffect, useCallback } from 'react';
import { Coins, TrendingUp, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getTierConfig, tierConfig } from '@/components/navigation/config/tier-config';

/**
 * CreditDisplay Component
 * Shows current credit balance with tier badge and daily limit usage
 * 
 * Requirements: 3.2, 6.2-6.6
 */

const API_BASE = '/api';

// Tier badge variants mapping
const tierBadgeVariants = {
  free: 'secondary',
  bronze: 'warning',
  silver: 'outline',
  gold: 'warning',
  diamond: 'live'
};

export function CreditDisplay({ className, compact = false }) {
  const { user, isAuthenticated } = useAuth();
  const [creditData, setCreditData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch credit summary from backend
   */
  const fetchCreditData = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/user/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          setCreditData({
            balance: data.credits.balance,
            tier: data.tier,
            dailyUsage: data.dailyUsage
          });
        }
      } else {
        setError('Failed to load credit data');
      }
    } catch (err) {

      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch on mount and when auth changes
  useEffect(() => {
    fetchCreditData();
  }, [fetchCreditData]);

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const tierName = creditData?.tier?.name || user?.tier || 'free';
  const tierInfo = getTierConfig(tierName);
  const TierIcon = tierInfo?.icon;

  const balance = creditData?.balance ?? user?.creditBalance ?? user?.credit_balance ?? 0;

  // Compact version for navbar
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn(
          // Credit badge (bg-none resets light gradient)
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full",
          "bg-gradient-to-r from-amber-500/10 to-orange-500/10",
          "dark:bg-none dark:bg-gradient-to-r dark:from-amber-500/20 dark:to-orange-500/20",
          "border border-amber-500/20 dark:border-amber-500/30"
        )}>
          <Coins className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            {balance.toLocaleString()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card variant="elevated" className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        {/* Header with balance and tier */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Credit Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                {isLoading ? '...' : balance.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">credits</span>
            </div>
          </div>

          {/* Tier Badge */}
          <Badge 
            variant={tierBadgeVariants[tierName] || 'secondary'}
            className="flex items-center gap-1"
          >
            {TierIcon && <TierIcon className="h-3 w-3" />}
            <span className="capitalize">{tierName}</span>
          </Badge>
        </div>

        {/* Tier multiplier info */}
        {creditData?.tier?.multiplier && creditData.tier.multiplier < 1 && (
          <div className={cn(
            "flex items-center gap-2 mb-4 px-3 py-2 rounded-lg",
            "bg-emerald-500/10 dark:bg-emerald-500/20",
            "border border-emerald-500/20 dark:border-emerald-500/30"
          )}>
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              {((1 - creditData.tier.multiplier) * 100).toFixed(0)}% discount on all operations
            </span>
          </div>
        )}



        {/* Refresh button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchCreditData}
          disabled={isLoading}
          className="mt-3 w-full"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isLoading && "animate-spin")} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>

        {/* Error state */}
        {error && (
          <p className="mt-2 text-xs text-red-500 text-center">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default CreditDisplay;
