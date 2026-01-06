import * as React from "react"
import { useMemo } from "react"
import { 
  AlertTriangle, 
  CreditCard, 
  Wallet, 
  Calculator, 
  ChevronRight, 
  Loader2, 
  Sparkles,
  Zap,
  TrendingUp,
  Coins
} from "lucide-react"
import { motion } from "motion/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogSection,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * BatchConfirmDialog - Premium Dual Theme Design System
 * 
 * ═══════════════════════════════════════════════════════════════════
 * Modern confirmation dialog for large validation batches with:
 * - Art Deco treasury styling (light) / Obsidian nebula glass (dark)
 * - Animated stat cards with metallic/aurora effects
 * - Clear cost breakdown with visual hierarchy
 * - Responsive layout for all screen sizes
 * ═══════════════════════════════════════════════════════════════════
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
      <DialogContent size="default" className="sm:max-w-[460px]">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-start gap-3 xs:gap-4">
            <motion.div 
              className={cn(
                "shrink-0 flex items-center justify-center",
                "h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12",
                "rounded-xl sm:rounded-2xl",
                "ring-1",
                // Light: Gold/copper gradient
                "bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-50",
                "ring-amber-200/60",
                "shadow-[inset_0_-2px_4px_rgba(0,0,0,0.03)]",
                // Dark: Aurora gradient with glow
                "dark:from-violet-500/20 dark:via-cyan-500/15 dark:to-violet-500/10",
                "dark:ring-violet-500/30",
                "dark:shadow-[0_0_24px_-4px_rgba(139,92,246,0.5)]"
              )}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <CreditCard className="h-5 w-5 xs:h-5.5 xs:w-5.5 sm:h-6 sm:w-6 text-amber-600 dark:text-violet-400" />
            </motion.div>
            <div className="flex-1 min-w-0 pt-0.5 space-y-1 xs:space-y-1.5">
              <DialogTitle className="pr-6">Confirm Batch Validation</DialogTitle>
              <DialogDescription>
                Review details before starting validation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-3 xs:space-y-4">
          {/* Cards Count - Hero Stat */}
          <motion.div 
            className={cn(
              "rounded-xl sm:rounded-2xl p-3 xs:p-4",
              // Light: Gold certificate panel
              "bg-gradient-to-br from-[hsl(45,60%,96%)] via-[hsl(42,50%,94%)] to-[hsl(38,45%,92%)]",
              "ring-1 ring-inset ring-[hsl(42,50%,80%)]",
              "shadow-[inset_0_2px_4px_rgba(180,140,60,0.06)]",
              // Dark: Aurora glass panel
              "dark:bg-gradient-to-br dark:from-violet-500/[0.08] dark:via-cyan-500/[0.04] dark:to-violet-500/[0.06]",
              "dark:ring-violet-500/20",
              "dark:shadow-[0_0_30px_-10px_rgba(139,92,246,0.25),inset_0_1px_0_rgba(255,255,255,0.05)]"
            )}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 xs:gap-3">
                <div className={cn(
                  "flex items-center justify-center",
                  "w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10",
                  "rounded-lg sm:rounded-xl",
                  // Light: Metallic gold
                  "bg-gradient-to-br from-amber-200/80 to-yellow-100/60",
                  "ring-1 ring-amber-300/50",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
                  // Dark: Aurora glow
                  "dark:from-violet-500/30 dark:to-cyan-500/20",
                  "dark:ring-violet-400/30",
                  "dark:shadow-[0_0_16px_-4px_rgba(139,92,246,0.4)]"
                )}>
                  <Sparkles className="h-4 w-4 xs:h-4.5 xs:w-4.5 text-amber-600 dark:text-violet-300" />
                </div>
                <span className={cn(
                  "text-xs xs:text-[13px] font-medium",
                  "text-[hsl(35,30%,40%)] dark:text-white/70"
                )}>
                  Cards to validate
                </span>
              </div>
              <motion.span 
                className={cn(
                  "text-xl xs:text-2xl sm:text-3xl font-bold font-mono tabular-nums",
                  "text-[hsl(35,40%,25%)] dark:text-white",
                  // Light: Gold text shadow
                  "[text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
                  "dark:[text-shadow:0_0_20px_rgba(139,92,246,0.3)]"
                )}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                {cardCount.toLocaleString()}
              </motion.span>
            </div>

            {/* Gateway info */}
            <div className={cn(
              "flex items-center justify-between mt-3 pt-3",
              "border-t border-[hsl(42,40%,82%)] dark:border-white/[0.08]"
            )}>
              <span className="text-[11px] xs:text-xs text-[hsl(35,25%,50%)] dark:text-white/50">Gateway</span>
              <span className="text-xs xs:text-[13px] font-medium text-[hsl(35,35%,35%)] dark:text-white/80">{gatewayLabel}</span>
            </div>
          </motion.div>

          {/* Cost Calculator Card */}
          <motion.div 
            className={cn(
              "rounded-xl sm:rounded-2xl overflow-hidden",
              hasInsufficientCredits
                ? [
                    // Light: Amber warning
                    "bg-gradient-to-br from-amber-50 to-yellow-50/80",
                    "ring-1 ring-inset ring-amber-300/50",
                    // Dark: Amber aurora
                    "dark:from-amber-500/[0.1] dark:to-amber-500/[0.05]",
                    "dark:ring-amber-500/25"
                  ]
                : [
                    // Light: Neutral panel
                    "bg-gradient-to-br from-[hsl(40,30%,96%)] to-[hsl(38,25%,94%)]",
                    "ring-1 ring-inset ring-[hsl(38,25%,85%)]",
                    // Dark: Subtle glass
                    "dark:from-white/[0.03] dark:to-white/[0.02]",
                    "dark:ring-white/[0.08]"
                  ]
            )}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {/* Header */}
            <div className={cn(
              "flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5",
              hasInsufficientCredits
                ? "bg-amber-100/60 dark:bg-amber-500/[0.08] border-b border-amber-200/60 dark:border-amber-500/20"
                : "bg-[hsl(40,35%,94%)]/60 dark:bg-white/[0.02] border-b border-[hsl(38,30%,88%)] dark:border-white/[0.06]"
            )}>
              <Calculator className={cn(
                "h-3.5 w-3.5 xs:h-4 xs:w-4",
                hasInsufficientCredits ? "text-amber-600 dark:text-amber-400" : "text-[hsl(35,30%,45%)] dark:text-white/50"
              )} />
              <span className={cn(
                "text-xs xs:text-[13px] font-semibold",
                hasInsufficientCredits ? "text-amber-700 dark:text-amber-300" : "text-[hsl(35,35%,35%)] dark:text-white/80"
              )}>
                Cost Estimate
              </span>
            </div>

            <div className="p-3 xs:p-4 space-y-3">
              {/* Formula */}
              <div className={cn(
                "flex items-center justify-center gap-1.5 xs:gap-2 py-2.5 xs:py-3 px-3 xs:px-4 rounded-lg sm:rounded-xl",
                // Light: Cream inset
                "bg-[hsl(42,40%,98%)] dark:bg-black/20",
                "ring-1 ring-inset ring-[hsl(40,35%,88%)] dark:ring-white/[0.06]"
              )}>
                <span className="text-sm xs:text-base font-mono font-medium text-[hsl(35,30%,40%)] dark:text-white/60">
                  {cardCount}
                </span>
                <span className="text-[hsl(35,20%,60%)] dark:text-white/30">×</span>
                <span className="text-sm xs:text-base font-mono font-medium text-[hsl(35,30%,40%)] dark:text-white/60">
                  {effectiveRate.toFixed(2)}
                </span>
                <span className="text-[hsl(35,20%,60%)] dark:text-white/30">=</span>
                <span className={cn(
                  "text-lg xs:text-xl font-bold font-mono",
                  hasInsufficientCredits ? "text-amber-700 dark:text-amber-300" : "text-[hsl(35,40%,25%)] dark:text-white"
                )}>
                  {estimatedCost}
                </span>
                <span className="text-[10px] xs:text-[11px] text-[hsl(35,20%,55%)] dark:text-white/40 ml-0.5">max</span>
              </div>

              {/* Current balance */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className={cn(
                    "h-3.5 w-3.5 xs:h-4 xs:w-4",
                    hasInsufficientCredits ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"
                  )} />
                  <span className="text-xs xs:text-[13px] text-[hsl(35,25%,45%)] dark:text-white/60">Your balance</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={cn(
                    "text-sm xs:text-[15px] font-bold font-mono tabular-nums",
                    hasInsufficientCredits ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                  )}>
                    {balance.toLocaleString()}
                  </span>
                  <span className="text-[10px] xs:text-[11px] text-[hsl(35,20%,55%)] dark:text-white/40">credits</span>
                </div>
              </div>

              {/* Remaining after (only when sufficient) */}
              {!hasInsufficientCredits && (
                <div className={cn(
                  "flex items-center justify-between pt-2 xs:pt-3",
                  "border-t border-[hsl(40,30%,88%)] dark:border-white/[0.06]"
                )}>
                  <span className="text-[11px] xs:text-[12px] text-[hsl(35,20%,50%)] dark:text-white/50">
                    Remaining after (est.)
                  </span>
                  <span className="text-xs xs:text-[13px] font-medium font-mono text-[hsl(35,30%,40%)] dark:text-white/60">
                    ~{remainingAfter.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Insufficient credits warning */}
          {hasInsufficientCredits && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <DialogSection variant="warning">
                <div className="flex items-start gap-2 xs:gap-2.5">
                  <AlertTriangle className="h-4 w-4 xs:h-4.5 xs:w-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-xs xs:text-[13px] font-semibold text-amber-700 dark:text-amber-300">
                      Insufficient Credits
                    </p>
                    <p className="text-[11px] xs:text-[12px] leading-relaxed text-amber-600/90 dark:text-amber-400/80">
                      You may be <span className="font-semibold">{shortfall}</span> credits short if all cards are LIVE. 
                      You can still proceed — only LIVE cards are charged.
                    </p>
                  </div>
                </div>
              </DialogSection>
            </motion.div>
          )}

          {/* Info note */}
          <p className="text-[10px] xs:text-[11px] text-center text-[hsl(35,20%,55%)] dark:text-white/40">
            Credits are only charged for LIVE/approved cards
          </p>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isLoading}
            className={cn(
              "flex-1 sm:flex-none",
              "h-9 xs:h-10 sm:h-11",
              "text-[13px] xs:text-[14px] font-medium",
              // Light mode
              "bg-gradient-to-b from-[hsl(42,45%,97%)] to-[hsl(40,40%,93%)]",
              "border-[hsl(42,40%,75%)] text-[hsl(35,35%,30%)]",
              "hover:from-[hsl(42,50%,95%)] hover:to-[hsl(40,45%,90%)]",
              // Dark mode
              "dark:bg-transparent dark:from-transparent dark:to-transparent",
              "dark:border-white/[0.1] dark:text-white/70",
              "dark:hover:bg-white/[0.06] dark:hover:text-white"
            )}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 sm:flex-none min-w-[130px] xs:min-w-[150px]",
              "h-9 xs:h-10 sm:h-11",
              "text-[13px] xs:text-[14px] font-medium gap-1 xs:gap-1.5",
              hasInsufficientCredits 
                ? [
                    // Amber warning button
                    "bg-gradient-to-b from-[hsl(40,85%,52%)] via-[hsl(38,80%,48%)] to-[hsl(35,75%,42%)]",
                    "border border-[hsl(35,70%,35%)]/30 text-white",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_16px_-2px_rgba(180,120,30,0.3)]",
                    "dark:from-amber-600 dark:via-amber-600 dark:to-amber-700",
                    "dark:shadow-[0_0_30px_-6px_rgba(251,191,36,0.6)]"
                  ]
                : [
                    // Primary button
                    "bg-gradient-to-b from-[hsl(38,65%,50%)] via-[hsl(35,60%,46%)] to-[hsl(32,55%,40%)]",
                    "border border-[hsl(32,50%,35%)]/30 text-white",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_16px_-2px_rgba(160,110,50,0.3)]",
                    "dark:from-violet-600 dark:via-violet-600 dark:to-violet-700",
                    "dark:shadow-[0_0_30px_-6px_rgba(139,92,246,0.6)]"
                  ]
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin" />
                <span className="hidden xs:inline">Starting...</span>
              </>
            ) : (
              <>
                {hasInsufficientCredits ? "Proceed Anyway" : "Start Validation"}
                <ChevronRight className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
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
