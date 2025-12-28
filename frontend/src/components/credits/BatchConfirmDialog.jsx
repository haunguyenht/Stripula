import * as React from "react";
import { useMemo } from "react";
import { AlertTriangle, Coins, Calculator, CreditCard, Loader2, Zap, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * BatchConfirmDialog Component - Redesigned
 * 
 * Modern confirmation dialog for batch validation with:
 * - Clean card-based layout
 * - Visual cost calculator
 * - Clear balance indicators
 * - Improved typography throughout
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */
export function BatchConfirmDialog({
  open,
  onOpenChange,
  cardCount = 0,
  balance = 0,
  effectiveRate = 1,
  gatewayName = "Gateway",
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  // Calculate estimated max cost (worst case: all cards LIVE)
  const estimatedCost = useMemo(() => {
    return Math.ceil(cardCount * effectiveRate);
  }, [cardCount, effectiveRate]);

  // Check if sufficient credits
  const hasSufficientCredits = useMemo(() => {
    return balance >= estimatedCost;
  }, [balance, estimatedCost]);

  // Calculate shortfall
  const shortfall = useMemo(() => {
    if (hasSufficientCredits) return 0;
    return estimatedCost - balance;
  }, [hasSufficientCredits, estimatedCost, balance]);

  // Calculate remaining after
  const remainingAfter = useMemo(() => {
    return Math.max(0, balance - estimatedCost);
  }, [balance, estimatedCost]);

  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleCancel = () => {
    if (isLoading) return;
    onCancel?.();
    onOpenChange?.(false);
  };

  const handleOpenChange = (newOpen) => {
    if (isLoading && !newOpen) return;
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        {/* Header with icon */}
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={cn(
              "shrink-0 p-2.5 rounded-xl",
              "bg-primary/10 dark:bg-primary/15"
            )}>
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <DialogTitle>Confirm Batch Validation</DialogTitle>
              <DialogDescription>
                Review the details before starting validation.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Batch Summary Card */}
          <div className={cn(
            "rounded-xl p-4",
            "bg-neutral-50 dark:bg-white/[0.03]",
            "border border-neutral-200/60 dark:border-white/[0.06]"
          )}>
            <div className="space-y-3">
              {/* Card Count - Prominent */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-xl border",
                    "bg-gradient-to-br from-primary/10 to-primary/5",
                    "dark:from-primary/20 dark:to-primary/10",
                    "border-primary/20 dark:border-primary/30"
                  )}>
                    <Zap className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-[13px] font-medium text-neutral-600 dark:text-white/70">
                    Cards to validate
                  </span>
                </div>
                <span className="text-lg font-bold text-neutral-900 dark:text-white font-mono tabular-nums">
                  {cardCount.toLocaleString()}
                </span>
              </div>

              {/* Divider */}
              <div className="h-px bg-neutral-200/60 dark:bg-white/[0.06]" />

              {/* Gateway & Rate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-white/40 mb-1">
                    Gateway
                  </p>
                  <p className="text-[13px] font-medium text-neutral-700 dark:text-white/80">
                    {gatewayName}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-white/40 mb-1">
                    Rate/LIVE
                  </p>
                  <p className="text-[13px] font-medium text-neutral-700 dark:text-white/80 font-mono">
                    {effectiveRate.toFixed(2)} cr
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Calculator Card */}
          <div className={cn(
            "rounded-xl p-4",
            hasSufficientCredits
              ? "bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.06]"
              : "bg-amber-50 dark:bg-amber-500/[0.08] border border-amber-200 dark:border-amber-500/20"
          )}>
            {/* Calculator Header */}
            <div className="flex items-center gap-2 mb-3">
              <Calculator className={cn(
                "h-4 w-4",
                hasSufficientCredits 
                  ? "text-neutral-500 dark:text-white/50" 
                  : "text-amber-600 dark:text-amber-400"
              )} />
              <span className={cn(
                "text-[13px] font-semibold",
                hasSufficientCredits
                  ? "text-neutral-700 dark:text-white/80"
                  : "text-amber-700 dark:text-amber-300"
              )}>
                Cost Estimate
              </span>
            </div>

            {/* Formula Display */}
            <div className={cn(
              "flex items-center justify-center gap-2 py-3 px-4 rounded-lg mb-3",
              "bg-white dark:bg-black/20",
              "border border-neutral-200/60 dark:border-white/[0.04]"
            )}>
              <span className="text-sm font-mono font-medium text-neutral-600 dark:text-white/60">
                {cardCount}
              </span>
              <span className="text-neutral-400 dark:text-white/30">×</span>
              <span className="text-sm font-mono font-medium text-neutral-600 dark:text-white/60">
                {effectiveRate.toFixed(2)}
              </span>
              <span className="text-neutral-400 dark:text-white/30">=</span>
              <span className={cn(
                "text-lg font-bold font-mono",
                hasSufficientCredits 
                  ? "text-neutral-900 dark:text-white" 
                  : "text-amber-700 dark:text-amber-300"
              )}>
                {estimatedCost}
              </span>
              <span className="text-xs text-neutral-400 dark:text-white/40">max</span>
            </div>

            {/* Balance Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className={cn(
                  "h-4 w-4",
                  hasSufficientCredits 
                    ? "text-emerald-500 dark:text-emerald-400" 
                    : "text-amber-500 dark:text-amber-400"
                )} />
                <span className="text-[13px] text-neutral-600 dark:text-white/60">
                  Your balance
                </span>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-[15px] font-bold font-mono tabular-nums",
                  hasSufficientCredits 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : "text-amber-600 dark:text-amber-400"
                )}>
                  {balance.toLocaleString()}
                </span>
                <span className="text-xs text-neutral-400 dark:text-white/40 ml-1">credits</span>
              </div>
            </div>

            {/* After estimate (only if sufficient) */}
            {hasSufficientCredits && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-200/60 dark:border-white/[0.06]">
                <span className="text-[12px] text-neutral-500 dark:text-white/50">
                  Remaining after (est.)
                </span>
                <span className="text-[13px] font-medium font-mono text-neutral-600 dark:text-white/60">
                  ~{remainingAfter.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Warning for insufficient credits */}
          {!hasSufficientCredits && (
            <div className={cn(
              "rounded-xl p-3",
              "bg-amber-50 dark:bg-amber-500/[0.08]",
              "border border-amber-200 dark:border-amber-500/20"
            )}>
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[13px] font-semibold text-amber-700 dark:text-amber-300">
                    Insufficient Credits
                  </p>
                  <p className="text-[12px] leading-relaxed text-amber-600 dark:text-amber-400/80">
                    You may be <span className="font-semibold">{shortfall}</span> credits short if all cards are LIVE. 
                    You can still proceed — only LIVE cards are charged.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info note */}
          <p className="text-[11px] text-center text-neutral-400 dark:text-white/40">
            Credits are only charged for LIVE/approved cards, not declined ones.
          </p>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isLoading}
            className={cn(
              "font-medium",
              "border-neutral-200 dark:border-white/10",
              "text-neutral-700 dark:text-white/70",
              "hover:bg-neutral-100 dark:hover:bg-white/5"
            )}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading}
            className="font-medium min-w-[140px] gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                Start Validation
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Batch confirmation threshold - show dialog for batches larger than this
 */
export const BATCH_CONFIRM_THRESHOLD = 10;

/**
 * Hook for managing batch confirmation dialog
 * 
 * @param {Object} options
 * @param {number} options.cardCount - Number of cards
 * @param {number} options.balance - Current credit balance
 * @param {number} options.effectiveRate - Credit rate per card
 * @param {string} options.gatewayName - Gateway name for display
 * @returns {Object} Dialog state and methods
 */
export function useBatchConfirmation({ cardCount, balance, effectiveRate, gatewayName }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [resolveRef, setResolveRef] = React.useState(null);

  const needsConfirmation = React.useMemo(() => {
    return cardCount > BATCH_CONFIRM_THRESHOLD;
  }, [cardCount]);

  const confirm = React.useCallback(() => {
    if (!needsConfirmation) {
      // No confirmation needed, proceed immediately
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      setResolveRef(() => resolve);
      setIsOpen(true);
    });
  }, [needsConfirmation]);

  const handleConfirm = React.useCallback(() => {
    if (resolveRef) {
      resolveRef(true);
    }
    setIsOpen(false);
    setResolveRef(null);
  }, [resolveRef]);

  const handleCancel = React.useCallback(() => {
    if (resolveRef) {
      resolveRef(false);
    }
    setIsOpen(false);
    setResolveRef(null);
  }, [resolveRef]);

  const dialogProps = React.useMemo(() => ({
    open: isOpen,
    onOpenChange: setIsOpen,
    cardCount,
    balance,
    effectiveRate,
    gatewayName,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  }), [isOpen, cardCount, balance, effectiveRate, gatewayName, handleConfirm, handleCancel]);

  return {
    isOpen,
    needsConfirmation,
    confirm,
    handleConfirm,
    handleCancel,
    dialogProps,
  };
}

export default BatchConfirmDialog;
