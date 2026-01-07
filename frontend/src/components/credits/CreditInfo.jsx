import { useMemo } from 'react';
import { Coins, AlertTriangle, TrendingDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  // Normalize pricing config - use API values only, no fallbacks
  const pricingConfig = useMemo(() => {
    if (!pricing) {
      return { approved: 0, live: 0 };
    }
    // New format: { approved: number, live: number }
    if (typeof pricing.approved === 'number') {
      return pricing;
    }
    // Old format: { approved: { min, max }, live: { min, max } }
    return {
      approved: pricing.approved?.max || 0,
      live: pricing.live?.max || 0
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
    <div className={cn(
      "p-3 rounded-xl space-y-3",
      // Light mode
      "bg-gray-50 border border-gray-100",
      // Dark mode - glass
      "dark:bg-white/[0.02] dark:border-white/[0.06]",
      className
    )}>
      {/* Stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Cost */}
          <div>
            <p className="text-[10px] text-gray-400 dark:text-white/40 uppercase tracking-wide mb-0.5">Est. Cost</p>
            <p className="text-base font-bold tabular-nums text-gray-900 dark:text-white">
              {estimatedCost.toLocaleString()}
            </p>
          </div>
          {/* Balance */}
          <div>
            <p className="text-[10px] text-gray-400 dark:text-white/40 uppercase tracking-wide mb-0.5">Balance</p>
            <p className={cn(
              "text-base font-bold tabular-nums",
              hasSufficientCredits ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
            )}>
              {balance.toLocaleString()}
            </p>
          </div>
        </div>
        {/* Status indicator */}
        <div className={cn(
          "px-2 py-1 rounded-md text-[10px] font-medium",
          hasSufficientCredits 
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        )}>
          {hasSufficientCredits ? "Ready" : `-${shortfall}`}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-gray-200 dark:bg-white/[0.08] overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500",
            hasSufficientCredits 
              ? "bg-emerald-500" 
              : "bg-amber-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-3 text-gray-400 dark:text-white/40">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live: {pricingConfig.approved || pricingConfig.live}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-white/20" />
            Dead: 0
          </span>
        </div>
        {!hasSufficientCredits && (
          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            May stop early
          </span>
        )}
      </div>
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
      // Light mode: OrangeAI warm gradient (bg-none resets light gradient)
      "bg-gradient-to-r from-amber-50 to-orange-50",
      "border border-amber-200/60",
      "shadow-sm",
      // Dark mode: OPUX glass morphism (bg-none resets light gradient)
      "dark:bg-none dark:bg-gradient-to-r dark:from-amber-500/10 dark:to-orange-500/10",
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
