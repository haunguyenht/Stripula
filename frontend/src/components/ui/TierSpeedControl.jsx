import { Zap, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSpeedConfig } from '@/hooks/useSpeedConfig';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * SpeedBadge - Compact speed display styled like APPR/LIVE badges
 * For use inside select triggers, next to EffectiveRateBadge
 * 
 * Requirements: 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3
 * 
 * @param {string} gatewayId - Gateway ID to fetch speed config (only used if config not provided)
 * @param {Object} config - Pre-fetched config to avoid re-fetching (optional)
 * @param {boolean} disabled - Disable the badge
 * @param {boolean} showTooltip - Whether to show tooltip (disable in dropdowns)
 */
export function SpeedBadge({
  gatewayId = 'auth',
  config: providedConfig = null,
  disabled = false,
  showTooltip = false,
  className
}) {
  const { user } = useAuth();
  const userTier = user?.tier || 'free';
  
  // Only fetch if config not provided - prevents re-fetching on dropdown open
  const { config: fetchedConfig, isLoading } = useSpeedConfig(
    providedConfig ? null : gatewayId, 
    providedConfig ? null : userTier
  );

  const config = providedConfig || fetchedConfig;
  const concurrency = config?.concurrency || 1;
  const delay = config?.delay || 2000;

  // Only show loading if we're fetching (not using provided config)
  if (!providedConfig && isLoading) {
    return <div className="h-4 w-16 bg-muted/50 rounded animate-pulse" />;
  }

  const badgeContent = (
    <div className={cn(
      "flex items-center gap-1.5",
      showTooltip && "cursor-help",
      disabled && "opacity-50",
      className
    )}>
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
        <Zap className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
        <span className="text-[10px] font-bold font-mono text-amber-700 dark:text-amber-400">{concurrency}</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/10 border border-sky-200/60 dark:border-sky-500/20">
        <Timer className="w-2.5 h-2.5 text-sky-600 dark:text-sky-400" />
        <span className="text-[10px] font-bold font-mono text-sky-700 dark:text-sky-400">{delay >= 1000 ? `${(delay / 1000).toFixed(1)}s` : `${delay}ms`}</span>
      </div>
    </div>
  );

  // Don't show tooltip inside dropdowns - causes positioning issues
  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[180px]">
          <div className="space-y-1.5 text-xs">
            <p className="font-medium">Speed Settings</p>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between gap-3">
                <span className="text-amber-600 dark:text-amber-400">Parallel:</span>
                <span className="font-mono font-medium">{concurrency} cards</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-sky-600 dark:text-sky-400">Delay:</span>
                <span className="font-mono font-medium">{delay}ms</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * SpeedIndicator - Ultra compact inline speed display
 * For use inside gateway selectors: ⚡ 4 • ⏱️ 700ms
 * 
 * Requirements: 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3
 */
export function SpeedIndicator({
  gatewayId = 'auth',
  disabled = false,
  className
}) {
  const { user } = useAuth();
  const userTier = user?.tier || 'free';
  const { config, isLoading } = useSpeedConfig(gatewayId, userTier);

  const concurrency = config?.concurrency || 1;
  const delay = config?.delay || 2000;

  if (isLoading) {
    return <div className="h-3 w-12 bg-muted/50 rounded animate-pulse" />;
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 text-[10px] text-muted-foreground",
      disabled && "opacity-50",
      className
    )}>
      <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400" />
      <span className="font-medium">{concurrency}</span>
      <span className="text-muted-foreground/40">•</span>
      <Timer className="w-3 h-3 text-sky-500 dark:text-sky-400" />
      <span className="font-medium">{delay}ms</span>
    </div>
  );
}

/**
 * TierSpeedControl - Compact standalone display for SK-based panels
 * Shows: ⚡ Parallel • ⏱️ Delay with subtle background
 */
export function TierSpeedControl({
  gatewayId = 'auth',
  disabled = false,
  className
}) {
  const { user } = useAuth();
  const userTier = user?.tier || 'free';
  const { config, isLoading } = useSpeedConfig(gatewayId, userTier);

  const concurrency = config?.concurrency || 1;
  const delay = config?.delay || 2000;

  if (isLoading) {
    return (
      <div className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-md",
        "bg-muted/30 dark:bg-white/5",
        className
      )}>
        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-2.5 py-1 rounded-md",
      "bg-muted/40 dark:bg-white/5",
      "text-[11px] text-muted-foreground",
      disabled && "opacity-50",
      className
    )}>
      <div className="flex items-center gap-1">
        <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400" />
        <span className="font-medium text-foreground/70 dark:text-white/60">{concurrency}</span>
      </div>
      <span className="text-muted-foreground/30">•</span>
      <div className="flex items-center gap-1">
        <Timer className="w-3 h-3 text-sky-500 dark:text-sky-400" />
        <span className="font-medium text-foreground/70 dark:text-white/60">{delay}ms</span>
      </div>
    </div>
  );
}

export default TierSpeedControl;
