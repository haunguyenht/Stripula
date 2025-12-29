import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Zap, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSpeedComparison } from '@/hooks/useSpeedComparison';
import { transition, softStaggerContainer, softStaggerItem } from '@/lib/motion';
import { getTierConfig, TIER_ORDER } from '@/components/navigation/config/tier-config';

/**
 * SpeedComparison Component
 * 
 * Displays a comparison table of speed settings across all tiers.
 * Highlights the current user's tier and shows estimated time savings.
 * Uses shared tier configuration for consistent styling.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * 
 * @param {string} gatewayId - Gateway ID (auth, charge, shopify)
 * @param {string} className - Additional CSS classes
 * @param {boolean} hideHeader - Whether to hide the header
 */

const gatewayLabels = {
  auth: 'Auth',
  charge: 'Charge',
  shopify: 'Shopify'
};

function formatTime(seconds) {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function SpeedComparison({ gatewayId = 'auth', className, hideHeader = false }) {
  const { user } = useAuth();
  const { comparison, isLoading, error, getTimeSavings } = useSpeedComparison(gatewayId);
  
  const userTier = user?.tier || 'free';
  const gatewayLabel = gatewayLabels[gatewayId] || gatewayId;

  // Calculate time savings for each tier relative to user's current tier
  const comparisonWithSavings = useMemo(() => {
    return comparison.map(tierData => {
      const savings = getTimeSavings(userTier, tierData.tier);
      return {
        ...tierData,
        ...savings
      };
    });
  }, [comparison, userTier, getTimeSavings]);

  if (isLoading) {
    return (
      <Card variant="elevated" className={className}>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className={className}>
      {!hideHeader && (
        <CardHeader size="sm" className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {gatewayLabel} Speed by Tier
            </CardTitle>
            {error && (
              <Badge variant="warning" className="text-[10px]">
                Using defaults
              </Badge>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent size="sm" className={hideHeader ? "pt-0" : "pt-0"}>
        <motion.div 
          className="space-y-1.5"
          variants={softStaggerContainer}
          initial="initial"
          animate="animate"
        >
          {comparisonWithSavings.map((tierData) => {
            // Use shared tier config
            const config = getTierConfig(tierData.tier);
            const TierIcon = config.icon;
            const isCurrentTier = tierData.tier === userTier;
            const isBetterTier = TIER_ORDER.indexOf(tierData.tier) > TIER_ORDER.indexOf(userTier);

            return (
              <motion.div
                key={tierData.tier}
                variants={softStaggerItem}
                transition={transition.opux}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg transition-all",
                  isCurrentTier 
                    ? "bg-primary/10 border border-primary/20 dark:bg-primary/5 dark:border-primary/15"
                    : "hover:bg-muted/50"
                )}
              >
                {/* Tier Icon & Name */}
                <div className="flex items-center gap-1.5 min-w-[80px]">
                  <div className={cn(
                    "p-1 rounded-md",
                    config.bgColor
                  )}>
                    <TierIcon className={cn("h-3 w-3", config.color)} />
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    isCurrentTier ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {config.label}
                  </span>
                  {isCurrentTier && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 ml-0.5">
                      You
                    </Badge>
                  )}
                </div>

                {/* Concurrency */}
                <div className="flex items-center gap-1 min-w-[50px]">
                  <Zap className="h-3 w-3 text-amber-500" />
                  <span className="text-xs font-mono tabular-nums">
                    {tierData.concurrency}x
                  </span>
                </div>

                {/* Delay */}
                <div className="flex items-center gap-1 min-w-[60px]">
                  <Clock className="h-3 w-3 text-blue-500" />
                  <span className="text-xs font-mono tabular-nums">
                    {tierData.delay}ms
                  </span>
                </div>

                {/* Speed Multiplier */}
                <div className="flex-1 text-right">
                  <span className={cn(
                    "text-xs font-medium",
                    tierData.speedMultiplier > 1 ? "text-emerald-500" : "text-muted-foreground"
                  )}>
                    {tierData.speedMultiplier}x
                  </span>
                </div>

                {/* Time for 100 cards */}
                <div className="text-right min-w-[50px]">
                  <span className="text-[10px] text-muted-foreground">
                    ~{formatTime(tierData.estimatedTimeFor100Cards)}
                  </span>
                </div>

                {/* Time Savings (only for better tiers) */}
                {isBetterTier && tierData.timeSaved > 0 && (
                  <div className="text-right min-w-[55px]">
                    <Badge variant="success" className="text-[9px] px-1 py-0">
                      -{tierData.percentFaster}%
                    </Badge>
                  </div>
                )}
                {!isBetterTier && <div className="min-w-[55px]" />}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Legend */}
        <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Zap className="h-2.5 w-2.5" /> Concurrent
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" /> Delay
            </span>
          </div>
          <span>Est. time for 100 cards</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default SpeedComparison;
