import { useMemo } from 'react';
import { Coins, AlertTriangle, TrendingDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * CreditInfo Component
 * Displays credit cost information before and after batch operations.
 * Pricing is passed from parent via props (fetched from backend).
 * 
 * Requirements: 4.3, 4.4, 4.6
 * 
 * @param {Object} props
 * @param {number} props.cardCount - Number of cards in batch
 * @param {number} props.balance - Current credit balance
 * @param {number} props.effectiveRate - Credit rate per card (from backend config)
 * @param {number} props.creditsConsumed - Credits consumed so far (during/after batch)
 * @param {number} props.liveCardsCount - Number of LIVE cards found
 * @param {number} props.approvedCount - Number of APPROVED cards found
 * @param {boolean} props.isLoading - Whether operation is in progress
 * @param {boolean} props.showConsumed - Whether to show consumed credits (after batch)
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.pricing - Pricing config from backend { approved: {min,max}, live: {min,max} }
 * @param {'auth'|'charge'|'skbased'|'shopify'} props.gatewayType - Gateway type to determine which pricing to show
 */
export function CreditInfo({
  cardCount = 0,
  balance = 0,
  effectiveRate = 1,
  creditsConsumed = 0,
  liveCardsCount = 0,
  approvedCount = 0,
  isLoading = false,
  showConsumed = false,
  className,
  pricing = null,
  gatewayType = 'auth'
}) {
  // Normalize pricing config to handle both old format { approved: {min,max} } and new format { approved: number }
  const pricingConfig = useMemo(() => {
    if (!pricing) {
      return { approved: 5, live: 3 };
    }
    // New format: { approved: number, live: number }
    if (typeof pricing.approved === 'number') {
      return pricing;
    }
    // Old format: { approved: { min, max }, live: { min, max } }
    return {
      approved: pricing.approved?.max || 5,
      live: pricing.live?.max || 3
    };
  }, [pricing]);

  // Calculate estimated max cost using max rate (approved is typically higher)
  const estimatedCost = useMemo(() => {
    const maxRate = Math.max(pricingConfig.approved || 0, pricingConfig.live || 0) || effectiveRate;
    return Math.ceil(cardCount * maxRate);
  }, [cardCount, effectiveRate, pricingConfig]);

  // Check if sufficient credits
  const hasSufficientCredits = balance >= estimatedCost;
  const shortfall = hasSufficientCredits ? 0 : estimatedCost - balance;

  // Don't show if no cards
  if (cardCount === 0 && !showConsumed) {
    return null;
  }

  // Show consumed credits after batch
  if (showConsumed && (liveCardsCount > 0 || approvedCount > 0)) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
        "bg-emerald-500/10 dark:bg-emerald-500/20",
        "border border-emerald-500/20 dark:border-emerald-500/30",
        className
      )}>
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-emerald-700 dark:text-emerald-300">
          <span className="font-semibold">{Math.ceil(creditsConsumed)}</span> credits used
          {approvedCount > 0 && (
            <span> · <span className="font-semibold">{approvedCount}</span> Approved</span>
          )}
          {liveCardsCount > 0 && (
            <span> · <span className="font-semibold">{liveCardsCount}</span> Live</span>
          )}
        </span>
      </div>
    );
  }

  // Show estimated cost before batch
  const percentage = Math.min((balance / estimatedCost) * 100, 100);
  
  return (
    <div className={cn("space-y-2", className)}>
      {/* Compact stats row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Cost card */}
        <div className="relative p-2.5 rounded-lg bg-muted/40 dark:bg-white/[0.04] overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Cost</span>
          </div>
          <p className="text-lg font-bold tabular-nums text-foreground">
            {estimatedCost.toLocaleString()}
          </p>
        </div>
        
        {/* Balance card */}
        <div className="relative p-2.5 rounded-lg bg-muted/40 dark:bg-white/[0.04] overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn(
              "h-2 w-2 rounded-full",
              hasSufficientCredits ? "bg-emerald-500" : "bg-amber-500"
            )} />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Balance</span>
          </div>
          <p className={cn(
            "text-lg font-bold tabular-nums",
            hasSufficientCredits ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
          )}>
            {balance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="space-y-1">
        <div className="h-1.5 rounded-full bg-muted dark:bg-white/[0.08] overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              hasSufficientCredits 
                ? "bg-gradient-to-r from-emerald-500 to-teal-400" 
                : "bg-gradient-to-r from-amber-500 to-orange-400"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {!hasSufficientCredits && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {shortfall} credits short
          </p>
        )}
      </div>

      {/* Pricing row */}
      {(pricingConfig.approved || pricingConfig.live) && (
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Approved: {pricingConfig.approved}
          </span>
          {(gatewayType === 'charge' || gatewayType === 'skbased') && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              Live: {pricingConfig.live}
            </span>
          )}
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
            Dead: Free
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * CreditWarningBanner Component
 * Shows a prominent warning when credits are insufficient
 */
export function CreditWarningBanner({
  balance,
  requiredCredits,
  className
}) {
  if (balance >= requiredCredits) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg",
      "bg-amber-500/10 dark:bg-amber-500/20",
      "border border-amber-500/30",
      className
    )}>
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
          Low credit balance
        </p>
        <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80">
          You have {balance} credits. Operation may stop early if all cards are LIVE.
        </p>
      </div>
    </div>
  );
}

/**
 * CreditSummary Component
 * Shows a summary of credits consumed after batch completion
 * Themed for both OrangeAI (light) and OPUX glass (dark)
 */
export function CreditSummary({
  liveCardsCount,
  creditsConsumed,
  newBalance,
  className
}) {
  if (liveCardsCount === 0) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs",
      // Light mode: OrangeAI warm gradient
      "bg-gradient-to-r from-amber-50 to-orange-50",
      "border border-amber-200/60",
      "shadow-sm",
      // Dark mode: OPUX glass morphism
      "dark:from-amber-500/10 dark:to-orange-500/10",
      "dark:border-amber-500/20",
      "dark:backdrop-blur-sm dark:shadow-none",
      className
    )}>
      {/* Left side: Credits used with icon */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex items-center justify-center w-6 h-6 rounded-lg",
          // Light: warm amber background
          "bg-amber-100",
          // Dark: glass effect
          "dark:bg-amber-500/20"
        )}>
          <TrendingDown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-amber-700 dark:text-amber-300">
            {Math.ceil(creditsConsumed)} credits used
          </span>
          <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">
            {liveCardsCount} LIVE card{liveCardsCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Right side: New balance */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Balance
          </span>
          <span className="font-bold text-sm tabular-nums text-emerald-600 dark:text-emerald-400">
            {newBalance.toLocaleString()}
          </span>
        </div>
        <Coins className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
      </div>
    </div>
  );
}

export default CreditInfo;
