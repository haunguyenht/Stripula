import { useMemo } from 'react';
import { Zap, Clock, Gauge } from 'lucide-react';
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
 * Speed mode configuration - maps tiers to speed modes
 */
const SPEED_MODES = {
  free: { name: 'Slow', description: 'Slowest but still kills', color: 'text-slate-400' },
  bronze: { name: 'Normal', description: 'Balanced speed and stability', color: 'text-amber-500' },
  silver: { name: 'Fast', description: 'High speed checking', color: 'text-orange-500' },
  gold: { name: 'Turbo', description: 'Maximum speed', color: 'text-red-500' },
  diamond: { name: 'Turbo', description: 'Maximum speed', color: 'text-red-500' }
};

/**
 * SpeedDisplay Component
 * 
 * Shows current speed settings (concurrency and delay) for a gateway
 * Displays speed mode name (Slow/Normal/Fast/Turbo) based on tier
 * 
 * Requirements: 4.1, 4.2, 4.4
 * 
 * @param {string} gatewayId - Gateway ID (auth, charge, shopify)
 * @param {string} tier - Optional tier override (uses user's tier if not provided)
 * @param {string} className - Additional CSS classes
 * @param {boolean} showLabels - Whether to show text labels (default: false)
 * @param {string} size - Size variant: 'sm' | 'default' (default: 'default')
 */
export function SpeedDisplay({ 
  gatewayId = 'auth', 
  tier = null,
  className,
  showLabels = false,
  size = 'default'
}) {
  const { user } = useAuth();
  const effectiveTier = tier || user?.tier || 'free';
  const { concurrency, delay, isLoading, isCustom } = useSpeedConfig(gatewayId, effectiveTier);

  // Size-based classes
  const sizeClasses = useMemo(() => ({
    sm: {
      container: 'gap-2 text-[10px]',
      icon: 'h-3 w-3',
      text: 'text-[10px]'
    },
    default: {
      container: 'gap-3 text-xs',
      icon: 'h-3.5 w-3.5',
      text: 'text-xs'
    }
  }), []);

  const classes = sizeClasses[size] || sizeClasses.default;

  // Speed mode info
  const speedMode = useMemo(() => {
    return SPEED_MODES[effectiveTier] || SPEED_MODES.free;
  }, [effectiveTier]);

  // Tier display name
  const tierLabel = useMemo(() => {
    const labels = {
      free: 'Starter',
      bronze: 'Bronze',
      silver: 'Silver',
      gold: 'Gold',
      diamond: 'Diamond'
    };
    return labels[effectiveTier] || effectiveTier;
  }, [effectiveTier]);

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center text-muted-foreground animate-pulse",
        classes.container,
        className
      )}>
        <div className="flex items-center gap-1">
          <Zap className={cn(classes.icon, "text-muted-foreground/50")} />
          <span className={classes.text}>--</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className={cn(classes.icon, "text-muted-foreground/50")} />
          <span className={classes.text}>--</span>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn(
        "flex items-center text-muted-foreground",
        classes.container,
        className
      )}>
        {/* Speed Mode Name */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-help hover:text-foreground transition-colors">
              <Gauge className={cn(classes.icon, speedMode.color)} />
              <span className={cn(classes.text, "font-semibold", speedMode.color)}>
                {speedMode.name}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px]">
            <p className="font-medium">{speedMode.name} Mode</p>
            <p className="text-muted-foreground text-[10px] mt-0.5">
              {speedMode.description}
            </p>
            <div className="text-muted-foreground text-[10px] mt-1 pt-1 border-t border-border">
              <span className="text-amber-500">{concurrency} concurrent</span>
              <span className="mx-1">·</span>
              <span className="text-blue-500">{delay / 1000}s delay</span>
            </div>
            <p className="text-muted-foreground/70 text-[10px] mt-1">
              {tierLabel} tier {isCustom ? '(custom)' : ''}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Concurrency */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-help hover:text-foreground transition-colors">
              <Zap className={cn(classes.icon, "text-amber-500")} />
              <span className={cn(classes.text, "font-mono tabular-nums")}>
                {concurrency}x
              </span>
              {showLabels && (
                <span className={cn(classes.text, "text-muted-foreground/70")}>
                  concurrent
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px]">
            <p className="font-medium">Concurrency: {concurrency}</p>
            <p className="text-muted-foreground text-[10px] mt-0.5">
              Processing {concurrency} card{concurrency > 1 ? 's' : ''} simultaneously
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Delay */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-help hover:text-foreground transition-colors">
              <Clock className={cn(classes.icon, "text-blue-500")} />
              <span className={cn(classes.text, "font-mono tabular-nums")}>
                {delay / 1000}s
              </span>
              {showLabels && (
                <span className={cn(classes.text, "text-muted-foreground/70")}>
                  delay
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px]">
            <p className="font-medium">Delay: {delay / 1000}s</p>
            <p className="text-muted-foreground text-[10px] mt-0.5">
              {delay / 1000}s pause between card validations
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

/**
 * SpeedDisplayCompact Component
 * 
 * A more compact version showing speed mode name with stats
 * Useful for tight spaces like button areas
 */
export function SpeedDisplayCompact({ 
  gatewayId = 'auth', 
  tier = null,
  className 
}) {
  const { user } = useAuth();
  const effectiveTier = tier || user?.tier || 'free';
  const { concurrency, delay, isLoading } = useSpeedConfig(gatewayId, effectiveTier);
  const speedMode = SPEED_MODES[effectiveTier] || SPEED_MODES.free;

  if (isLoading) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "inline-flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-help",
            className
          )}>
            <Gauge className={cn("h-2.5 w-2.5", speedMode.color)} />
            <span className={cn("font-semibold", speedMode.color)}>{speedMode.name}</span>
            <span className="text-muted-foreground/50">·</span>
            <span className="font-mono text-amber-500">{concurrency}x</span>
            <span className="font-mono text-blue-500">{delay / 1000}s</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-[10px] font-medium">{speedMode.name} Mode</p>
          <p className="text-[10px] text-muted-foreground">
            {concurrency} concurrent · {delay / 1000}s delay
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default SpeedDisplay;
