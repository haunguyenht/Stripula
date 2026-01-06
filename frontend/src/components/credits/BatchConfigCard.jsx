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
 * Light mode: Vintage Banking aesthetic - cream paper with copper accents
 * Dark mode: OPUX liquid aurora glass effect
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
      "rounded-lg sm:rounded-xl overflow-hidden relative",
      // Light mode - Vintage Banking: cream paper with engraved border
      "bg-gradient-to-b from-[hsl(40,50%,97%)] to-[hsl(35,40%,94%)]",
      "border-2 border-[hsl(30,35%,75%)]",
      "shadow-[inset_0_0_0_3px_hsl(38,45%,96%),inset_0_0_0_4px_hsl(30,30%,80%),0_4px_12px_rgba(101,67,33,0.08)]",
      // Dark mode - OPUX glass
      "dark:bg-none dark:bg-white/[0.02] dark:border dark:border-white/[0.06]",
      "dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]",
      className
    )}>
      {/* Gateway Section */}
      {sites.length > 0 && (
        <div className={cn(
          "p-2 sm:p-3",
          // Light mode - vintage divider
          "border-b border-[hsl(30,25%,80%)]",
          "dark:border-white/[0.06]"
        )}>
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className={cn(
              "text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider",
              // Light mode - sepia copper text with emboss
              "text-[hsl(25,50%,40%)] [text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
              "dark:text-white/40 dark:[text-shadow:none]"
            )}>
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
              // Light mode - vintage paper with engraved border
              "bg-[hsl(40,45%,98%)] border-[hsl(30,30%,78%)]",
              "shadow-[inset_0_1px_2px_rgba(101,67,33,0.08),0_1px_0_rgba(255,255,255,0.7)]",
              "text-[hsl(25,40%,25%)] font-medium",
              "hover:bg-[hsl(40,50%,96%)] hover:border-[hsl(25,50%,60%)]",
              "focus:ring-[hsl(25,60%,55%)] focus:border-[hsl(25,60%,55%)]",
              // Dark mode - glass
              "dark:bg-white/[0.04] dark:border-white/10 dark:text-white/80",
              "dark:shadow-none dark:hover:bg-white/[0.06]",
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

          {/* Speed info - vintage coin badges */}
          <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-2.5">
            {/* Concurrency badge */}
            <span className={cn(
              "inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full",
              "text-[9px] sm:text-[10px] font-semibold",
              // Light mode - copper coin style
              "bg-gradient-to-b from-[hsl(35,60%,92%)] to-[hsl(30,45%,88%)]",
              "border border-[hsl(30,40%,75%)]",
              "text-[hsl(25,55%,38%)]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(101,67,33,0.1)]",
              // Dark mode - MUST reset gradient with dark:bg-none first
              "dark:bg-none dark:bg-white/[0.06] dark:border-white/10 dark:text-amber-400",
              "dark:shadow-none"
            )}>
              <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[hsl(25,65%,50%)] dark:text-amber-500" />
              {concurrency}x
            </span>
            {/* Delay badge */}
            <span className={cn(
              "inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full",
              "text-[9px] sm:text-[10px] font-semibold",
              // Light mode - copper coin style
              "bg-gradient-to-b from-[hsl(35,60%,92%)] to-[hsl(30,45%,88%)]",
              "border border-[hsl(30,40%,75%)]",
              "text-[hsl(25,55%,38%)]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(101,67,33,0.1)]",
              // Dark mode - MUST reset gradient with dark:bg-none first
              "dark:bg-none dark:bg-white/[0.06] dark:border-white/10 dark:text-sky-400",
              "dark:shadow-none"
            )}>
              <Timer className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[hsl(200,50%,45%)] dark:text-sky-500" />
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
                <p className={cn(
                  "text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider",
                  "text-[hsl(25,50%,40%)] [text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
                  "dark:text-white/40 dark:[text-shadow:none]"
                )}>Cost</p>
                <p className={cn(
                  "text-xs sm:text-sm font-bold tabular-nums",
                  "text-[hsl(25,40%,25%)] dark:text-white"
                )}>
                  {estimatedCost.toLocaleString()}
                </p>
              </div>
              <div>
                <p className={cn(
                  "text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider",
                  "text-[hsl(25,50%,40%)] [text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
                  "dark:text-white/40 dark:[text-shadow:none]"
                )}>Balance</p>
                <p className={cn(
                  "text-xs sm:text-sm font-bold tabular-nums",
                  hasSufficientCredits 
                    ? "text-emerald-700 dark:text-emerald-400" 
                    : "text-amber-700 dark:text-amber-400"
                )}>
                  {balance.toLocaleString()}
                </p>
              </div>
            </div>
            {/* Status badge - treasury seal style */}
            <div className={cn(
              "px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wide",
              hasSufficientCredits 
                // Light mode - emerald wax seal
                ? "bg-gradient-to-b from-emerald-600 to-emerald-700 text-white shadow-[0_2px_4px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]"
                // Light mode - amber wax seal
                : "bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-[0_2px_4px_rgba(217,119,6,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]",
              // Dark mode - MUST reset gradient with dark:bg-none first
              "dark:bg-none dark:shadow-none",
              hasSufficientCredits
                ? "dark:bg-emerald-500/20 dark:text-emerald-400"
                : "dark:bg-amber-500/20 dark:text-amber-400"
            )}>
              {hasSufficientCredits ? "Ready" : `-${shortfall.toLocaleString()}`}
            </div>
          </div>

          {/* Progress bar - vintage ledger style */}
          <div className={cn(
            "h-1.5 sm:h-2 rounded-full overflow-hidden mb-1.5 sm:mb-2",
            // Light mode - inset paper effect
            "bg-[hsl(35,30%,88%)] border border-[hsl(30,25%,80%)]",
            "shadow-[inset_0_1px_2px_rgba(101,67,33,0.15)]",
            // Dark mode - reset light styles
            "dark:bg-white/[0.08] dark:border-transparent dark:shadow-none"
          )}>
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                hasSufficientCredits 
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-500 dark:to-emerald-400" 
                  : "bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-500 dark:to-amber-400"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
            <div className={cn(
              "flex items-center gap-1.5 sm:gap-2",
              "text-[hsl(25,35%,45%)] dark:text-white/40"
            )}>
              <span className="flex items-center gap-0.5 sm:gap-1">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]" />
                Live: {pricingConfig.live || pricingConfig.approved}
              </span>
              <span className="flex items-center gap-0.5 sm:gap-1">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[hsl(30,20%,70%)] dark:bg-white/20" />
                Dead: 0
              </span>
            </div>
            {!hasSufficientCredits && (
              <span className="text-amber-700 dark:text-amber-400 flex items-center gap-0.5 sm:gap-1 font-medium">
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
        <div className={cn(
          "p-3 text-center text-[11px] italic",
          "text-[hsl(25,35%,50%)] dark:text-white/40"
        )}>
          No gateway configured
        </div>
      )}
    </div>
  );
}

export default BatchConfigCard;
