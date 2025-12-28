import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/Button"

/**
 * ConfirmDialog - A confirmation dialog using the existing Dialog component
 * 
 * @param {boolean} open - Whether the dialog is open
 * @param {Function} onOpenChange - Callback when open state changes
 * @param {string} title - Dialog title
 * @param {string} description - Dialog description
 * @param {string} confirmLabel - Label for confirm button (default: "Continue")
 * @param {string} cancelLabel - Label for cancel button (default: "Cancel")
 * @param {Function} onConfirm - Callback when user confirms
 * @param {Function} onCancel - Callback when user cancels
 * @param {string} variant - Button variant for confirm button (default: "destructive")
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "destructive",
}) {
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
      <DialogContent className="sm:max-w-[440px] p-7">
        <DialogHeader className="space-y-2.5">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-[14px] leading-relaxed text-neutral-600 dark:text-white/60">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="mt-6 pt-0 gap-3 sm:gap-3">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className={cn(
              "flex-1 sm:flex-none",
              "font-medium",
              "border-neutral-200 dark:border-white/10",
              "text-neutral-700 dark:text-white/70",
              "hover:bg-neutral-100 dark:hover:bg-white/5",
              "hover:text-neutral-900 dark:hover:text-white"
            )}
          >
            {cancelLabel}
          </Button>
          <Button 
            variant={variant} 
            onClick={handleConfirm}
            className="flex-1 sm:flex-none min-w-[120px] font-medium"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
