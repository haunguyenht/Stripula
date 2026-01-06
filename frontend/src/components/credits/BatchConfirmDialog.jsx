import * as React from "react";
import { useMemo } from "react";
import { AlertTriangle, CreditCard, Loader2, ChevronRight, Wallet, Zap, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

/**
 * BatchConfirmDialog Component - Clean Redesign
 * 
 * Light mode: Minimal, warm shadows, clean cards
 * Dark mode: OPUX glass with subtle glows
 */
export function BatchConfirmDialog({
  open,
  onOpenChange,
  cardCount = 0,
  balance = 0,
  effectiveRate: effectiveRateProp,
  gatewayName = "Gateway",
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  // Handle null/undefined effectiveRate (default param doesn't handle null)
  const effectiveRate = effectiveRateProp ?? 1;
  const estimatedCost = useMemo(() => Math.ceil(cardCount * effectiveRate), [cardCount, effectiveRate]);
  const hasSufficientCredits = useMemo(() => balance >= estimatedCost, [balance, estimatedCost]);
  const shortfall = useMemo(() => hasSufficientCredits ? 0 : estimatedCost - balance, [hasSufficientCredits, estimatedCost, balance]);

  const handleConfirm = () => onConfirm?.();
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
      <DialogContent 
        className={cn(
          "sm:max-w-[400px] p-0 gap-0 overflow-hidden",
          // Light mode
          "bg-white border-gray-200/80",
          "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)]",
          // Dark mode - glass
          "dark:bg-[#161a1f]/90 dark:border-white/10",
          "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_25px_60px_-15px_rgba(0,0,0,0.5)]",
          "dark:backdrop-blur-xl"
        )}
      >
        {/* Accessibility: Hidden title and description for screen readers */}
        <VisuallyHidden.Root>
          <DialogTitle>Confirm Validation</DialogTitle>
          <DialogDescription>
            Confirm validation of {cardCount} cards using {gatewayName}. Estimated cost: {Math.ceil(cardCount * effectiveRate)} credits.
          </DialogDescription>
        </VisuallyHidden.Root>
        {/* Header */}
        <div className={cn(
          "px-5 pt-5 pb-4",
          "border-b border-gray-100 dark:border-white/[0.06]"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl",
              // Light
              "bg-gradient-to-br from-orange-500 to-red-500",
              "shadow-[0_4px_12px_-2px_rgba(255,64,23,0.4)]",
              // Dark - terracotta glow
              "dark:from-[#AB726F] dark:to-[#8B5A57]",
              "dark:shadow-[0_4px_16px_-2px_rgba(171,114,111,0.5)]"
            )}>
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                Confirm Validation
              </h2>
              <p className="text-[13px] text-gray-500 dark:text-white/50">
                {cardCount.toLocaleString()} cards • {gatewayName}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Card Count */}
            <div className={cn(
              "p-3 rounded-xl",
              "bg-gray-50 dark:bg-white/[0.03]",
              "border border-gray-100 dark:border-white/[0.06]"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-3.5 w-3.5 text-gray-400 dark:text-white/40" />
                <span className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-white/40">
                  Cards
                </span>
              </div>
              <p className="text-lg font-bold font-mono text-gray-900 dark:text-white">
                {cardCount.toLocaleString()}
              </p>
            </div>

            {/* Rate */}
            <div className={cn(
              "p-3 rounded-xl",
              "bg-gray-50 dark:bg-white/[0.03]",
              "border border-gray-100 dark:border-white/[0.06]"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-white/40">
                  Rate/Live
                </span>
              </div>
              <p className="text-lg font-bold font-mono text-gray-900 dark:text-white">
                {effectiveRate.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Cost Calculation */}
          <div className={cn(
            "p-4 rounded-xl",
            hasSufficientCredits 
              ? "bg-emerald-50 dark:bg-emerald-500/[0.08] border border-emerald-200/60 dark:border-emerald-500/20"
              : "bg-amber-50 dark:bg-amber-500/[0.08] border border-amber-200/60 dark:border-amber-500/20"
          )}>
            {/* Formula */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-sm font-mono text-gray-600 dark:text-white/60">{cardCount}</span>
              <span className="text-gray-400 dark:text-white/30">×</span>
              <span className="text-sm font-mono text-gray-600 dark:text-white/60">{effectiveRate.toFixed(2)}</span>
              <span className="text-gray-400 dark:text-white/30">=</span>
              <span className={cn(
                "text-xl font-bold font-mono",
                hasSufficientCredits 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : "text-amber-600 dark:text-amber-400"
              )}>
                {estimatedCost.toLocaleString()}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-white/40">max</span>
            </div>

            {/* Balance */}
            <div className={cn(
              "flex items-center justify-between py-2 px-3 rounded-lg",
              "bg-white/60 dark:bg-black/20"
            )}>
              <div className="flex items-center gap-2">
                <Wallet className={cn(
                  "h-4 w-4",
                  hasSufficientCredits ? "text-emerald-500" : "text-amber-500"
                )} />
                <span className="text-[13px] text-gray-600 dark:text-white/60">Balance</span>
              </div>
              <span className={cn(
                "font-bold font-mono",
                hasSufficientCredits 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : "text-amber-600 dark:text-amber-400"
              )}>
                {balance.toLocaleString()}
              </span>
            </div>

            {/* Status */}
            {hasSufficientCredits ? (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" />
                <span className="text-[12px] font-medium">Sufficient credits</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-amber-100/50 dark:bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  May need <span className="font-semibold">{shortfall.toLocaleString()}</span> more credits if all LIVE
                </p>
              </div>
            )}
          </div>

          {/* Note */}
          <p className="text-[11px] text-center text-gray-400 dark:text-white/40">
            Only LIVE cards are charged. Declined cards are free.
          </p>
        </div>

        {/* Footer */}
        <DialogFooter className={cn(
          "px-5 py-4 gap-2",
          "border-t border-gray-100 dark:border-white/[0.06]",
          "bg-gray-50/50 dark:bg-white/[0.02]"
        )}>
          <Button 
            variant="ghost" 
            onClick={handleCancel}
            disabled={isLoading}
            className="h-9 px-4 text-[13px] text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "h-9 px-5 text-[13px] font-medium gap-1.5",
              hasSufficientCredits
                ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 dark:from-[#AB726F] dark:to-[#9d5e5b] dark:hover:from-[#b4817e] dark:hover:to-[#a86b68]"
                : "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                {hasSufficientCredits ? "Start" : "Proceed"}
                <ChevronRight className="h-3.5 w-3.5" />
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
 */
export function useBatchConfirmation({ cardCount, balance, effectiveRate, gatewayName }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [resolveRef, setResolveRef] = React.useState(null);

  const needsConfirmation = React.useMemo(() => {
    return cardCount > BATCH_CONFIRM_THRESHOLD;
  }, [cardCount]);

  const confirm = React.useCallback(() => {
    if (!needsConfirmation) {
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
