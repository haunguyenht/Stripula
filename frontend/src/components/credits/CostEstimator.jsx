import { useMemo } from 'react';
import { Calculator, AlertTriangle, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * CostEstimator Component
 * 
 * Calculates and displays estimated cost based on card count and effective rate.
 * Updates in real-time as card count changes.
 * Shows formula: cards × effective rate = estimated cost
 * 
 * Requirements: 11.2
 * 
 * @param {Object} props
 * @param {number} props.cardCount - Number of cards in batch
 * @param {number} props.effectiveRate - Credit rate per LIVE card
 * @param {number} props.balance - Current credit balance (optional, for warning)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showFormula - Whether to show the calculation formula
 * @param {boolean} props.compact - Use compact layout
 */
export function CostEstimator({
  cardCount = 0,
  effectiveRate = 1,
  balance,
  className,
  showFormula = true,
  compact = false
}) {
  // Calculate estimated max cost (worst case: all cards LIVE)
  const estimatedCost = useMemo(() => {
    return Math.ceil(cardCount * effectiveRate);
  }, [cardCount, effectiveRate]);

  // Check if sufficient credits (if balance provided)
  const hasSufficientCredits = useMemo(() => {
    if (balance === undefined || balance === null) return true;
    return balance >= estimatedCost;
  }, [balance, estimatedCost]);

  // Calculate shortfall
  const shortfall = useMemo(() => {
    if (hasSufficientCredits || balance === undefined) return 0;
    return estimatedCost - balance;
  }, [hasSufficientCredits, estimatedCost, balance]);

  // Don't show if no cards
  if (cardCount === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-xs",
        !hasSufficientCredits && "text-amber-600 dark:text-amber-400",
        className
      )}>
        <Calculator className="h-3 w-3 text-muted-foreground" />
        <span>
          Est. cost: <span className="font-semibold">{estimatedCost}</span> credits
        </span>
        {!hasSufficientCredits && (
          <AlertTriangle className="h-3 w-3" />
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-lg p-3 space-y-2",
      hasSufficientCredits
        ? "bg-muted/50 dark:bg-white/5 border border-border/50"
        : "bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calculator className={cn(
          "h-4 w-4",
          hasSufficientCredits 
            ? "text-muted-foreground" 
            : "text-amber-600 dark:text-amber-400"
        )} />
        <span className="text-xs font-medium">Cost Estimate</span>
      </div>

      {/* Formula display */}
      {showFormula && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{cardCount}</span>
          <span>cards</span>
          <span>×</span>
          <span className="font-mono">{effectiveRate.toFixed(2)}</span>
          <span>/card</span>
          <span>=</span>
          <span className={cn(
            "font-mono font-semibold",
            hasSufficientCredits 
              ? "text-foreground" 
              : "text-amber-700 dark:text-amber-300"
          )}>
            {estimatedCost}
          </span>
          <span>credits</span>
        </div>
      )}

      {/* Cost summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Coins className={cn(
            "h-3.5 w-3.5",
            hasSufficientCredits 
              ? "text-muted-foreground" 
              : "text-amber-600 dark:text-amber-400"
          )} />
          <span className="text-xs text-muted-foreground">Max cost:</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-semibold",
            hasSufficientCredits 
              ? "text-foreground" 
              : "text-amber-700 dark:text-amber-300"
          )}>
            {estimatedCost} credits
          </span>
          <Badge variant="secondary" className="text-[9px] h-4">
            {effectiveRate.toFixed(2)}/card
          </Badge>
        </div>
      </div>

      {/* Balance comparison (if provided) */}
      {balance !== undefined && (
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">Your balance:</span>
          <span className={cn(
            "text-xs font-semibold",
            hasSufficientCredits 
              ? "text-emerald-600 dark:text-emerald-400" 
              : "text-amber-700 dark:text-amber-300"
          )}>
            {balance.toLocaleString()} credits
          </span>
        </div>
      )}

      {/* Warning for insufficient credits */}
      {!hasSufficientCredits && shortfall > 0 && (
        <div className="flex items-center gap-1.5 pt-2 border-t border-amber-500/20">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-300">
            {shortfall} credits short if all cards are LIVE
          </span>
        </div>
      )}

      {/* Info note */}
      <p className="text-[10px] text-muted-foreground">
        Credits only charged for LIVE cards
      </p>
    </div>
  );
}

/**
 * CostEstimatorInline Component
 * 
 * Inline version for use in headers or compact spaces.
 * 
 * @param {Object} props
 * @param {number} props.cardCount - Number of cards
 * @param {number} props.effectiveRate - Credit rate per card
 * @param {string} props.className - Additional CSS classes
 */
export function CostEstimatorInline({ cardCount, effectiveRate, className }) {
  const estimatedCost = useMemo(() => {
    return Math.ceil(cardCount * effectiveRate);
  }, [cardCount, effectiveRate]);

  if (cardCount === 0) {
    return null;
  }

  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      Est. <span className="font-semibold text-foreground">{estimatedCost}</span> credits
    </span>
  );
}

export default CostEstimator;
