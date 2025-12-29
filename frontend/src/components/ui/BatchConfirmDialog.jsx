import * as React from "react"
import { useMemo } from "react"
import { AlertTriangle, CreditCard, Wallet, Calculator, ChevronRight, Loader2, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * BatchConfirmDialog - Redesigned for OrangeAI/OPUX Design System
 * 
 * Modern confirmation dialog for large validation batches with:
 * - Glass morphism cards for cost breakdown
 * - Clear visual hierarchy
 * - Tier-aware styling
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */

// Threshold for showing batch confirmation dialog
export const BATCH_CONFIRM_THRESHOLD = 10;

export function BatchConfirmDialog({
  open,
  onOpenChange,
  cardCount = 0,
  balance = 0,
  effectiveRate = 1.0,
  gatewayLabel = "Gateway",
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  // Calculate estimated cost (worst case: all cards are LIVE)
  const estimatedCost = Math.ceil(cardCount * effectiveRate);
  const hasInsufficientCredits = balance < estimatedCost;
  const remainingAfter = Math.max(0, balance - estimatedCost);
  const shortfall = hasInsufficientCredits ? estimatedCost - balance : 0;

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange?.(false);
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
        {/* Header */}
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn(
              "shrink-0 p-2.5 rounded-xl ring-1",
              "bg-primary/10 dark:bg-primary/15",
              "ring-primary/20 dark:ring-primary/25"
            )}>
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
              <DialogTitle>Confirm Batch Validation</DialogTitle>
              <DialogDescription>
                Review details before starting validation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Batch Info Card */}
          <div className={cn(
            "rounded-xl p-4",
            "bg-neutral-50 dark:bg-white/[0.03]",
            "border border-neutral-200/60 dark:border-white/[0.06]"
          )}>
            {/* Cards count - prominent */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg",
                  "bg-gradient-to-br from-primary/15 to-primary/5",
                  "dark:from-primary/20 dark:to-primary/10",
                  "border border-primary/10 dark:border-primary/20"
                )}>
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[13px] font-medium text-neutral-600 dark:text-white/70">
                  Cards to validate
                </span>
              </div>
              <span className="text-xl font-bold text-neutral-900 dark:text-white font-mono tabular-nums">
                {cardCount.toLocaleString()}
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-200/60 dark:bg-white/[0.06] mb-3" />

            {/* Gateway info */}
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-neutral-500 dark:text-white/50">Gateway</span>
              <span className="font-medium text-neutral-700 dark:text-white/80">{gatewayLabel}</span>
            </div>
          </div>

          {/* Cost Calculator Card */}
          <div className={cn(
            "rounded-xl overflow-hidden",
            hasInsufficientCredits
              ? "bg-amber-50 dark:bg-amber-500/[0.08] border border-amber-200/80 dark:border-amber-500/20"
              : "bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.06]"
          )}>
            {/* Header */}
            <div className={cn(
              "flex items-center gap-2 px-4 py-2.5",
              hasInsufficientCredits
                ? "bg-amber-100/50 dark:bg-amber-500/10 border-b border-amber-200/60 dark:border-amber-500/20"
                : "bg-neutral-100/50 dark:bg-white/[0.02] border-b border-neutral-200/40 dark:border-white/[0.04]"
            )}>
              <Calculator className={cn(
                "h-4 w-4",
                hasInsufficientCredits ? "text-amber-600 dark:text-amber-400" : "text-neutral-500 dark:text-white/50"
              )} />
              <span className={cn(
                "text-[13px] font-semibold",
                hasInsufficientCredits ? "text-amber-700 dark:text-amber-300" : "text-neutral-700 dark:text-white/80"
              )}>
                Cost Estimate
              </span>
            </div>

            <div className="p-4 space-y-3">
              {/* Formula */}
              <div className={cn(
                "flex items-center justify-center gap-2 py-3 px-4 rounded-lg",
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
                  hasInsufficientCredits ? "text-amber-700 dark:text-amber-300" : "text-neutral-900 dark:text-white"
                )}>
                  {estimatedCost}
                </span>
                <span className="text-[11px] text-neutral-400 dark:text-white/40 ml-0.5">max</span>
              </div>

              {/* Current balance */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className={cn(
                    "h-4 w-4",
                    hasInsufficientCredits ? "text-amber-500" : "text-emerald-500 dark:text-emerald-400"
                  )} />
                  <span className="text-[13px] text-neutral-600 dark:text-white/60">Your balance</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={cn(
                    "text-[15px] font-bold font-mono tabular-nums",
                    hasInsufficientCredits ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                  )}>
                    {balance.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-neutral-400 dark:text-white/40">credits</span>
                </div>
              </div>

              {/* Remaining after (only when sufficient) */}
              {!hasInsufficientCredits && (
                <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-white/[0.06]">
                  <span className="text-[12px] text-neutral-500 dark:text-white/50">
                    Remaining after (est.)
                  </span>
                  <span className="text-[13px] font-medium font-mono text-neutral-600 dark:text-white/60">
                    ~{remainingAfter.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Insufficient credits warning */}
          {hasInsufficientCredits && (
            <div className={cn(
              "rounded-xl p-3",
              "bg-amber-50 dark:bg-amber-500/[0.08]",
              "border border-amber-200/80 dark:border-amber-500/20"
            )}>
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[13px] font-semibold text-amber-700 dark:text-amber-300">
                    Insufficient Credits
                  </p>
                  <p className="text-[12px] leading-relaxed text-amber-600/90 dark:text-amber-400/80">
                    You may be <span className="font-semibold">{shortfall}</span> credits short if all cards are LIVE. 
                    You can still proceed — only LIVE cards are charged.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info note */}
          <p className="text-[11px] text-center text-neutral-400 dark:text-white/40">
            Credits are only charged for LIVE/approved cards
          </p>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isLoading}
            className={cn(
              "h-10 font-medium text-[14px]",
              "border-neutral-200 text-neutral-700",
              "hover:bg-neutral-100 hover:border-neutral-300",
              "dark:border-white/10 dark:text-white/70",
              "dark:hover:bg-white/[0.06] dark:hover:border-white/20"
            )}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading}
            variant={hasInsufficientCredits ? "warning" : "default"}
            className={cn(
              "h-10 font-medium text-[14px] min-w-[140px] gap-1.5",
              !hasInsufficientCredits && "shadow-sm shadow-primary/20"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                {hasInsufficientCredits ? "Proceed Anyway" : "Start Validation"}
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
 * Hook for managing batch confirmation dialog
 */
export function useBatchConfirmation() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState(null);
  const resolveRef = React.useRef(null);

  const showBatchConfirm = React.useCallback((confirmConfig) => {
    return new Promise((resolve) => {
      setConfig(confirmConfig);
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = React.useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
    setIsOpen(false);
    setConfig(null);
  }, []);

  const handleCancel = React.useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    setIsOpen(false);
    setConfig(null);
  }, []);

  const handleOpenChange = React.useCallback((open) => {
    if (!open && resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    setIsOpen(open);
    if (!open) {
      setConfig(null);
    }
  }, []);

  const dialogProps = React.useMemo(() => ({
    open: isOpen,
    onOpenChange: handleOpenChange,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
    ...config
  }), [isOpen, handleOpenChange, handleConfirm, handleCancel, config]);

  const needsConfirmation = React.useCallback((cardCount) => {
    return cardCount > BATCH_CONFIRM_THRESHOLD;
  }, []);

  return {
    showBatchConfirm,
    needsConfirmation,
    dialogProps,
    isOpen
  };
}

export default BatchConfirmDialog;
