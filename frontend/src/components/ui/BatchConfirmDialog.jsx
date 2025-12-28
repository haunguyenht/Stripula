import * as React from "react"
import { AlertTriangle, CreditCard, Wallet, Calculator } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * BatchConfirmDialog - Confirmation dialog for large validation batches
 * 
 * Shows for batches > 10 cards (configurable via BATCH_CONFIRM_THRESHOLD)
 * Displays current balance, estimated cost, and warns if insufficient credits
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 * 
 * @param {boolean} open - Whether the dialog is open
 * @param {Function} onOpenChange - Callback when open state changes
 * @param {number} cardCount - Number of cards in the batch
 * @param {number} balance - User's current credit balance
 * @param {number} effectiveRate - Effective credit rate for user's tier
 * @param {string} gatewayLabel - Display name of the selected gateway
 * @param {Function} onConfirm - Callback when user confirms
 * @param {Function} onCancel - Callback when user cancels
 */

// Threshold for showing batch confirmation dialog - Requirement: 13.1
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
}) {
  // Calculate estimated cost (worst case: all cards are LIVE)
  const estimatedCost = Math.ceil(cardCount * effectiveRate);
  const hasInsufficientCredits = balance < estimatedCost;
  const remainingAfter = Math.max(0, balance - estimatedCost);

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange?.(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Confirm Batch Validation
          </DialogTitle>
          <DialogDescription>
            You're about to validate {cardCount} cards on {gatewayLabel}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Cost breakdown - Requirement: 13.2, 13.3 */}
          <div className={cn(
            "rounded-lg p-4 space-y-3",
            "bg-muted/50 border",
            hasInsufficientCredits && "border-amber-500/50 bg-amber-500/5"
          )}>
            {/* Current Balance */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Current Balance
              </span>
              <span className="font-medium">{balance.toFixed(2)} credits</span>
            </div>
            
            {/* Estimated Cost */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Estimated Cost
              </span>
              <span className="font-medium text-primary">
                {estimatedCost.toFixed(2)} credits
              </span>
            </div>
            
            {/* Formula explanation */}
            <div className="text-xs text-muted-foreground border-t pt-2">
              {cardCount} cards × {effectiveRate.toFixed(2)} rate = {estimatedCost.toFixed(2)} credits (max)
            </div>
            
            {/* Remaining balance after */}
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm text-muted-foreground">Balance After</span>
              <span className={cn(
                "font-medium",
                hasInsufficientCredits ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
              )}>
                {remainingAfter.toFixed(2)} credits
              </span>
            </div>
          </div>

          {/* Insufficient credits warning - Requirement: 13.2 */}
          {hasInsufficientCredits && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Insufficient Credits
                </p>
                <p className="text-xs text-muted-foreground">
                  You may not have enough credits if all cards are approved. 
                  The batch will stop when credits run out.
                </p>
              </div>
            </div>
          )}

          {/* Info note */}
          <p className="text-xs text-muted-foreground">
            Credits are only charged for LIVE (approved) cards. 
            Declined and error cards are free.
          </p>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            variant={hasInsufficientCredits ? "warning" : "default"}
          >
            {hasInsufficientCredits ? "Proceed Anyway" : "Start Validation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook for managing batch confirmation dialog
 * Returns a function that shows the dialog and returns a promise
 * 
 * @returns {{
 *   showBatchConfirm: (config: BatchConfirmConfig) => Promise<boolean>,
 *   dialogProps: object
 * }}
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

  /**
   * Check if batch confirmation is needed based on card count
   * @param {number} cardCount - Number of cards
   * @returns {boolean} - Whether confirmation is needed
   */
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
