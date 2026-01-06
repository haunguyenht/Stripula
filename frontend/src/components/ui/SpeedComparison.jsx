import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Zap, Clock, TrendingUp, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSpeedComparison } from '@/hooks/useSpeedComparison';
import { getTierConfig, TIER_ORDER } from '@/components/navigation/config/tier-config';

/**
 * Format time duration elegantly
 */
function formatTime(seconds) {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

/**
 * Individual tier row in the comparison table
 */
function TierRow({ tierData, isCurrentTier, isBetterTier, index }) {
  const config = getTierConfig(tierData.tier);
  const TierIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
        isCurrentTier 
          ? "bg-stone-100 dark:bg-zinc-800 ring-1 ring-stone-300 dark:ring-zinc-600"
          : "hover:bg-stone-50 dark:hover:bg-zinc-800/50"
      )}
    >
      {/* Tier Icon & Name */}
      <div className="flex items-center gap-2.5 min-w-[100px]">
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg",
          "bg-gradient-to-br",
          config.bgGradient,
          "border border-white/50 dark:border-white/10"
        )}>
          <TierIcon className={cn("w-4 h-4", config.color)} />
        </div>
        <div className="flex flex-col">
          <span className={cn(
            "text-sm font-medium",
            isCurrentTier ? "text-stone-900 dark:text-zinc-100" : "text-stone-600 dark:text-zinc-400"
          )}>
            {config.label}
          </span>
          {isCurrentTier && (
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <Check className="w-2.5 h-2.5" />
              Current
            </span>
          )}
        </div>
      </div>

      {/* Concurrency */}
      <div className="flex items-center gap-1.5 min-w-[55px]">
        <Zap className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-sm font-mono tabular-nums text-stone-700 dark:text-zinc-300">
          {tierData.concurrency}×
        </span>
      </div>

      {/* Delay */}
      <div className="flex items-center gap-1.5 min-w-[65px]">
        <Clock className="w-3.5 h-3.5 text-blue-500" />
        <span className="text-sm font-mono tabular-nums text-stone-700 dark:text-zinc-300">
          {tierData.delay}ms
        </span>
      </div>

      {/* Speed multiplier */}
      <div className="flex-1 text-right">
        <span className={cn(
          "text-sm font-semibold tabular-nums",
          tierData.speedMultiplier > 1 ? "text-emerald-600 dark:text-emerald-400" : "text-stone-500 dark:text-zinc-500"
        )}>
          {tierData.speedMultiplier}×
        </span>
      </div>

      {/* Estimated time */}
      <div className="text-right min-w-[50px]">
        <span className="text-xs text-stone-500 dark:text-zinc-500 tabular-nums">
          ~{formatTime(tierData.estimatedTimeFor100Cards)}
        </span>
      </div>

      {/* Savings badge */}
      <div className="min-w-[50px] text-right">
        {isBetterTier && tierData.percentFaster > 0 && (
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
            "bg-emerald-50 text-emerald-700",
            "dark:bg-emerald-500/10 dark:text-emerald-400"
          )}>
            -{tierData.percentFaster}%
          </span>
        )}
      </div>
    </motion.div>
  );
}

/**
 * SpeedComparison Component
 * 
 * Refined tier speed comparison table with elegant styling.
 * Shows concurrency, delay, and time estimates for each tier.
 */
export function SpeedComparison({ gatewayId = 'auth', className, hideHeader = false }) {
  const { user } = useAuth();
  const { comparison, isLoading, error, getTimeSavings } = useSpeedComparison(gatewayId);
  
  const userTier = user?.tier || 'free';

  const comparisonWithSavings = useMemo(() => {
    return comparison.map(tierData => {
      const savings = getTimeSavings(userTier, tierData.tier);
      return { ...tierData, ...savings };
    });
  }, [comparison, userTier, getTimeSavings]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="w-6 h-6 animate-spin text-stone-400 dark:text-zinc-500" />
      </div>
    );
  }

  return (
    <div className={className}>
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-stone-500 dark:text-zinc-500" />
            <span className="text-sm font-medium text-stone-700 dark:text-zinc-300">
              Speed Comparison
            </span>
          </div>
          {error && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              Using defaults
            </span>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        {comparisonWithSavings.map((tierData, index) => {
          const isCurrentTier = tierData.tier === userTier;
          const isBetterTier = TIER_ORDER.indexOf(tierData.tier) > TIER_ORDER.indexOf(userTier);

          return (
            <TierRow
              key={tierData.tier}
              tierData={tierData}
              isCurrentTier={isCurrentTier}
              isBetterTier={isBetterTier}
              index={index}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-stone-200/50 dark:border-zinc-700/50 flex items-center justify-between text-[10px] text-stone-500 dark:text-zinc-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" /> Concurrent cards
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Delay between
          </span>
        </div>
        <span>Est. time for 100 cards</span>
      </div>
    </div>
  );
}

export default SpeedComparison;
