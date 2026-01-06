import { useMemo } from 'react';
import { Zap, Timer, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GatewayStatusIndicator } from '@/components/ui/GatewayStatusIndicator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * BatchConfigCard - Unified Gateway + Cost card
 * 
 * Combines gateway selection and credit cost estimation in one clean card.
 * Consistent styling for all validation panels.
 * 
 * Light mode: Clean gray card
 * Dark mode: OPUX glass effect
 */
export function BatchConfigCard({
  // Gateway props
  sites = [],
  selectedSite,
  onSiteChange,
  getGateway,
  isLoading = false,
  speedConfig,
  // Credit props
  cardCount = 0,
  balance = 0,
  effectiveRate = 1,
  isAuthenticated = false,
  pricing = null,
  className,
}) {
  // Get selected gateway status
  const selectedGatewayStatus = useMemo(() => {
    return getGateway?.(selectedSite);
  }, [getGateway, selectedSite]);

  // Normalize pricing - use API values only, no fallbacks
  const pricingConfig = useMemo(() => {
    if (!pricing) return { approved: 0, live: 0 };
    if (typeof pricing.approved === 'number') return pricing;
    return {
      approved: pricing.approved?.max || 0,
      live: pricing.live?.max || 0
    };
  }, [pricing]);

  // Calculate cost
  const estimatedCost = useMemo(() => {
    const maxRate = Math.max(pricingConfig.approved || 0, pricingConfig.live || 0) || effectiveRate;
    return Math.ceil(cardCount * maxRate);
  }, [cardCount, effectiveRate, pricingConfig]);

  const hasSufficientCredits = balance >= estimatedCost;
  const shortfall = hasSufficientCredits ? 0 : estimatedCost - balance;
  const percentage = estimatedCost > 0 ? Math.min((balance / estimatedCost) * 100, 100) : 100;

  // Speed config
  const concurrency = speedConfig?.concurrency || 1;
  const delay = speedConfig?.delay || 2000;

  return (
    <div className={cn(
      "rounded-lg sm:rounded-xl overflow-hidden",
      // Light mode
      "bg-gray-50 border border-gray-100",
      // Dark mode - glass
      "dark:bg-white/[0.02] dark:border-white/[0.06]",
      className
    )}>
      {/* Gateway Section */}
      {sites.length > 0 && (
        <div className="p-2 sm:p-3 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[9px] sm:text-[10px] font-medium text-gray-400 dark:text-white/40 uppercase tracking-wide">
              Gateway
            </span>
            {selectedGatewayStatus && (
              <GatewayStatusIndicator
                state={selectedGatewayStatus.state}
                healthStatus={selectedGatewayStatus.healthStatus}
                reason={selectedGatewayStatus.maintenanceReason}
                size="sm"
              />
            )}
          </div>

          <Select value={selectedSite} onValueChange={onSiteChange} disabled={isLoading}>
            <SelectTrigger className={cn(
              "h-7 sm:h-8 w-full text-[11px] sm:text-[13px]",
              "bg-white border-gray-200",
              "dark:bg-white/[0.04] dark:border-white/10",
              // Show warning border if selected gateway is unavailable
              selectedGatewayStatus && !selectedGatewayStatus.isAvailable && "border-amber-500/50"
            )}>
              <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                <SelectValue placeholder="Select gateway" />
                {/* Show maintenance text in trigger when selected gateway is disabled */}
                {selectedGatewayStatus?.state === 'maintenance' && (
                  <span className="text-amber-500 text-[9px] sm:text-[10px] font-medium">(Maintained)</span>
                )}
                {selectedGatewayStatus?.healthStatus === 'offline' && selectedGatewayStatus?.state !== 'maintenance' && (
                  <span className="text-red-500 text-[9px] sm:text-[10px] font-medium">(Offline)</span>
                )}
                {selectedGatewayStatus && !selectedGatewayStatus.isAvailable && selectedGatewayStatus?.state !== 'maintenance' && selectedGatewayStatus?.healthStatus !== 'offline' && (
                  <span className="text-gray-500 text-[9px] sm:text-[10px] font-medium">(Disabled)</span>
                )}
              </div>
            </SelectTrigger>
            <SelectContent>
              {sites.map(site => {
                const gatewayStatus = getGateway?.(site.id);
                const isAvailable = gatewayStatus?.isAvailable ?? true;

                return (
                  <SelectItem
                    key={site.id}
                    value={site.id}
                    disabled={!isAvailable}
                    className={cn(!isAvailable && "opacity-60")}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {gatewayStatus && (
                        <GatewayStatusIndicator
                          state={gatewayStatus.state}
                          healthStatus={gatewayStatus.healthStatus}
                          size="sm"
                        />
                      )}
                      <span className="text-[11px] sm:text-sm">{site.label}</span>
                      {/* Shopify: show domain or not configured */}
                      {site.configured !== undefined && (
                        site.configured ? (
                          <span className="hidden sm:inline text-gray-400 dark:text-white/40 text-[10px]">({site.domain})</span>
                        ) : (
                          <span className="text-amber-500 text-[9px] sm:text-[10px]">(not configured)</span>
                        )
                      )}
                      {/* Status indicators */}
                      {gatewayStatus?.state === 'maintenance' && (
                        <span className="text-amber-500 text-[9px] sm:text-[10px]">(maintenance)</span>
                      )}
                      {gatewayStatus?.healthStatus === 'offline' && gatewayStatus?.state !== 'maintenance' && (
                        <span className="text-red-500 text-[9px] sm:text-[10px]">(offline)</span>
                      )}
                      {/* Fallback for disabled gateways without specific reason */}
                      {!isAvailable && gatewayStatus?.state !== 'maintenance' && gatewayStatus?.healthStatus !== 'offline' && (
                        <span className="text-gray-500 text-[9px] sm:text-[10px]">(disabled)</span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Speed info */}
          <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] text-gray-400 dark:text-white/40">
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500" />
              {concurrency}x
            </span>
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Timer className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-500" />
              {delay >= 1000 ? `${(delay / 1000).toFixed(1)}s` : `${delay}ms`}
            </span>
          </div>
        </div>
      )}

      {/* Cost Section - Only show if authenticated and has cards */}
      {isAuthenticated && cardCount > 0 && (
        <div className="p-2 sm:p-3">
          {/* Stats row */}
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <div className="flex items-center gap-3 sm:gap-4">
              <div>
                <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-white/40 uppercase tracking-wide">Cost</p>
                <p className="text-xs sm:text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                  {estimatedCost.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-white/40 uppercase tracking-wide">Balance</p>
                <p className={cn(
                  "text-xs sm:text-sm font-bold tabular-nums",
                  hasSufficientCredits ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                )}>
                  {balance.toLocaleString()}
                </p>
              </div>
            </div>
            {/* Status badge */}
            <div className={cn(
              "px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-medium",
              hasSufficientCredits 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            )}>
              {hasSufficientCredits ? "Ready" : `-${shortfall.toLocaleString()}`}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 rounded-full bg-gray-200 dark:bg-white/[0.08] overflow-hidden mb-1.5 sm:mb-2">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                hasSufficientCredits ? "bg-emerald-500" : "bg-amber-500"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400 dark:text-white/40">
              <span className="flex items-center gap-0.5 sm:gap-1">
                <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-emerald-500" />
                Live: {pricingConfig.live || pricingConfig.approved}
              </span>
              <span className="flex items-center gap-0.5 sm:gap-1">
                <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-gray-300 dark:bg-white/20" />
                Dead: 0
              </span>
            </div>
            {!hasSufficientCredits && (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5 sm:gap-1">
                <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="hidden xs:inline">May stop early</span>
                <span className="xs:hidden">Low</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Show just gateway if no cards or not authenticated */}
      {(!isAuthenticated || cardCount === 0) && sites.length === 0 && (
        <div className="p-3 text-center text-[11px] text-gray-400 dark:text-white/40">
          No gateway configured
        </div>
      )}
    </div>
  );
}

export default BatchConfigCard;
