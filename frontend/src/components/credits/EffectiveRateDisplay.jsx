import { useMemo } from 'react';
import { Coins, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Get gateway subType from gateway ID
 * @param {string} gatewayId - Gateway ID (e.g., 'auth-1', 'charge-2', 'shopify-05', 'skbased-auth-1')
 * @returns {'auth'|'charge'|'skbased'|'shopify'} Gateway subType
 */
function getGatewaySubType(gatewayId) {
  if (!gatewayId) return null;
  if (gatewayId.startsWith('auth-')) return 'auth';
  if (gatewayId.startsWith('charge-')) return 'charge';
  // SK-based auth gateways are auth gateways (only LIVE, no APPROVED)
  if (gatewayId.startsWith('skbased-auth-')) return 'auth';
  // SK-based charge gateways show both APPROVED and LIVE
  if (gatewayId.startsWith('sk-') || gatewayId.startsWith('skbased-')) return 'skbased';
  // Shopify gateways (including auto-shopify)
  if (gatewayId.startsWith('shopify-') || gatewayId.startsWith('auto-shopify-')) return 'shopify';
  return null;
}

/**
 * Get pricing display config based on gateway subType
 * - Auth: only APPROVED (card authenticated successfully)
 * - Charge: both APPROVED (charge success) and LIVE (card live but charge failed)
 * - SKbased: both CHARGED and LIVE
 * - Shopify: only APPROVED
 * 
 * @param {'auth'|'charge'|'skbased'|'shopify'|null} subType - Gateway subType
 * @returns {{ showApproved: boolean, showLive: boolean, approvedLabel: string }}
 */
function getPricingDisplayConfig(subType) {
  switch (subType) {
    case 'charge':
      return { showApproved: true, showLive: true, approvedLabel: 'Appr' };
    case 'skbased':
      return { showApproved: true, showLive: true, approvedLabel: 'Chgd' };
    case 'auth':
      return { showApproved: true, showLive: false, approvedLabel: 'Appr' };
    case 'shopify':
      // Shopify only has APPROVED status (no LIVE distinction)
      return { showApproved: true, showLive: false, approvedLabel: 'Appr' };
    default:
      // If no gatewayId provided, show approved only (safer default)
      return { showApproved: true, showLive: false, approvedLabel: 'Appr' };
  }
}

/**
 * EffectiveRateDisplay Component
 * 
 * Shows effective rate for selected gateway with tooltip.
 * Same rate for all tiers (no tier multiplier).
 * 
 * Requirements: 11.1, 11.4
 * 
 * @param {Object} props
 * @param {number} props.baseRate - Base credit rate for the gateway
 * @param {number} props.effectiveRate - Effective rate (same as base, no multiplier)
 * @param {string} props.userTier - User's current tier
 * @param {boolean} props.isCustom - Whether the rate is custom (different from default)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.size - Size variant: 'sm' | 'default' | 'lg'
 * @param {boolean} props.showTooltip - Whether to show the calculation tooltip
 * @param {boolean} props.inline - Use inline layout
 */
export function EffectiveRateDisplay({
  baseRate,
  effectiveRate,
  userTier = 'free',
  isCustom = false,
  className,
  size = 'default',
  showTooltip = true,
  inline = false
}) {
  // Calculate effective rate if not provided (same as base rate - no tier multiplier)
  const displayRate = useMemo(() => {
    if (effectiveRate !== undefined && effectiveRate !== null) {
      return effectiveRate;
    }
    if (baseRate !== undefined && baseRate !== null) {
      return baseRate;
    }
    return null;
  }, [effectiveRate, baseRate]);

  // Format tier name for display
  const tierLabel = useMemo(() => {
    return userTier.charAt(0).toUpperCase() + userTier.slice(1);
  }, [userTier]);

  // Size classes
  const sizeClasses = {
    sm: {
      container: 'text-xs',
      icon: 'h-3 w-3',
      rate: 'text-xs font-medium',
      badge: 'text-[9px] h-4'
    },
    default: {
      container: 'text-sm',
      icon: 'h-3.5 w-3.5',
      rate: 'text-sm font-semibold',
      badge: 'text-[10px] h-5'
    },
    lg: {
      container: 'text-base',
      icon: 'h-4 w-4',
      rate: 'text-base font-bold',
      badge: 'text-xs h-6'
    }
  };

  const classes = sizeClasses[size] || sizeClasses.default;

  if (displayRate === null) {
    return null;
  }

  const content = (
    <div className={cn(
      "flex items-center gap-1.5",
      inline ? "inline-flex" : "",
      classes.container,
      className
    )}>
      <Coins className={cn(classes.icon, "text-muted-foreground")} />
      <span className={cn(classes.rate, "text-foreground")}>
        {displayRate.toFixed(2)}
      </span>
      <span className="text-muted-foreground">/card</span>
      {isCustom && (
        <Badge 
          variant="outline" 
          className={cn(
            classes.badge,
            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
          )}
        >
          Custom
        </Badge>
      )}
      {showTooltip && (
        <Info className={cn(classes.icon, "text-muted-foreground/60")} />
      )}
    </div>
  );

  if (!showTooltip) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2 text-xs">
            <p className="font-medium">Credit Rate</p>
            <div className="space-y-1 text-muted-foreground">
              <div className="flex justify-between gap-4">
                <span className="font-medium text-foreground">Rate:</span>
                <span className="font-mono font-medium text-foreground">
                  {displayRate?.toFixed(2) ?? '—'}/card
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/80 pt-1">
              Same rate for all tiers. Credits charged for Approved/Live cards only.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * EffectiveRateBadge Component
 * 
 * Compact badge showing credit costs for approved and live cards.
 * Automatically filters which badges to show based on gateway type.
 * 
 * @param {Object} props
 * @param {number} props.rate - Effective rate to display (legacy)
 * @param {Object} props.pricing - Pricing config { approved: number, live: number }
 * @param {string} props.gatewayId - Gateway ID to determine which badges to show
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.compact - Show compact format (default: false)
 * @param {boolean} props.showTooltip - Whether to show tooltip (disable in dropdowns)
 */
export function EffectiveRateBadge({ rate, pricing, gatewayId, className, compact = false, showTooltip = false }) {
  // Get display config based on gateway type
  const subType = getGatewaySubType(gatewayId);
  const displayConfig = getPricingDisplayConfig(subType);
  
  // If pricing is provided, show badges based on gateway type
  if (pricing?.approved !== undefined || pricing?.live !== undefined) {
    const approvedRate = pricing.approved ?? 0;
    const liveRate = pricing.live ?? 0;
    
    if (compact) {
      // Compact format based on what's shown
      const parts = [];
      if (displayConfig.showApproved) parts.push(approvedRate);
      if (displayConfig.showLive) parts.push(liveRate);
      
      return (
        <Badge 
          variant="secondary" 
          className={cn(
            "text-[9px] h-4 font-mono",
            className
          )}
        >
          {parts.join('|')}
        </Badge>
      );
    }
    
    // Badge content without tooltip
    const badgeContent = (
      <div className={cn("flex items-center gap-1.5", showTooltip && "cursor-help", className)}>
        {displayConfig.showApproved && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20">
            <span className="text-[9px] font-medium text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wide">{displayConfig.approvedLabel}</span>
            <span className="text-[10px] font-bold font-mono text-emerald-700 dark:text-emerald-400">{approvedRate}</span>
          </div>
        )}
        {displayConfig.showLive && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/10 border border-sky-200/60 dark:border-sky-500/20">
            <span className="text-[9px] font-medium text-sky-600/70 dark:text-sky-400/70 uppercase tracking-wide">Live</span>
            <span className="text-[10px] font-bold font-mono text-sky-700 dark:text-sky-400">{liveRate}</span>
          </div>
        )}
      </div>
    );

    // Don't show tooltip inside dropdowns - causes positioning issues
    if (!showTooltip) {
      return badgeContent;
    }
    
    // Full format with tooltip explanation
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badgeContent}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <div className="space-y-1.5 text-xs">
              <p className="font-medium">Credit Cost per Card</p>
              <div className="space-y-1 text-[11px]">
                {displayConfig.showApproved && (
                  <div className="flex justify-between gap-3">
                    <span className="text-emerald-600 dark:text-emerald-400">{subType === 'skbased' ? 'Charged:' : 'Approved:'}</span>
                    <span className="font-mono font-medium">{approvedRate} credits</span>
                  </div>
                )}
                {displayConfig.showLive && (
                  <div className="flex justify-between gap-3">
                    <span className="text-sky-600 dark:text-sky-400">Live:</span>
                    <span className="font-mono font-medium">{liveRate} credits</span>
                  </div>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Fallback to single rate
  if (rate === undefined || rate === null) {
    return null;
  }

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "text-[9px] h-4 font-mono",
        className
      )}
    >
      {rate.toFixed(0)}/card
    </Badge>
  );
}

export default EffectiveRateDisplay;
