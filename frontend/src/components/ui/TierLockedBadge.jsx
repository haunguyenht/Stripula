import { Lock, Crown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Get tier display info
 */
function getTierInfo(tier) {
  switch (tier?.toLowerCase()) {
    case 'diamond':
      return { 
        label: 'Diamond', 
        color: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
        icon: Crown
      };
    case 'gold':
      return { 
        label: 'Gold', 
        color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
        icon: Crown
      };
    case 'silver':
      return { 
        label: 'Silver', 
        color: 'bg-slate-400/20 text-slate-600 dark:text-slate-300 border-slate-400/30',
        icon: Shield
      };
    case 'bronze':
      return { 
        label: 'Bronze', 
        color: 'bg-amber-600/20 text-amber-700 dark:text-amber-400 border-amber-600/30',
        icon: Shield
      };
    default:
      return { 
        label: tier, 
        color: 'bg-muted text-muted-foreground',
        icon: Shield
      };
  }
}

/**
 * TierLockedBadge Component
 * Shows a lock icon with tier requirement for restricted gateways
 */
export function TierLockedBadge({ minTier, size = 'sm', showTooltip = true }) {
  if (!minTier) return null;
  
  const tierInfo = getTierInfo(minTier);
  const TierIcon = tierInfo.icon;
  
  const badge = (
    <Badge 
      variant="outline" 
      className={cn(
        'gap-1',
        size === 'xs' ? 'text-[10px] px-1.5 py-0' : 'text-xs',
        tierInfo.color
      )}
    >
      <Lock className={cn(size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      <span>{tierInfo.label}+</span>
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Requires {tierInfo.label} tier or higher to access
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * TierLockedMessage Component
 * Shows a message when user cannot access a gateway due to tier restriction
 */
export function TierLockedMessage({ minTier, className }) {
  if (!minTier) return null;
  
  const tierInfo = getTierInfo(minTier);
  
  return (
    <div className={cn(
      "flex items-center gap-2 p-3 rounded-lg",
      "bg-amber-500/10 border border-amber-500/20",
      className
    )}>
      <Lock className="h-4 w-4 text-amber-500 flex-shrink-0" />
      <div className="text-xs">
        <span className="text-amber-600 dark:text-amber-400 font-medium">
          Tier Restricted
        </span>
        <span className="text-muted-foreground ml-1">
          — Requires {tierInfo.label} tier or higher
        </span>
      </div>
    </div>
  );
}

export default TierLockedBadge;
