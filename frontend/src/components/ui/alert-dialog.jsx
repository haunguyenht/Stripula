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
 * ConfirmDialog - Redesigned Confirmation Dialog
 * 
 * Clean, modern confirmation dialog using the Dialog component
 * with improved visual hierarchy and styling for both themes.
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
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-[14px] leading-relaxed">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="pt-2 gap-3 sm:gap-3">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className={cn(
              "flex-1 sm:flex-none h-10",
              "font-medium text-[14px]",
              // Light mode
              "border-neutral-200 text-neutral-700",
              "hover:bg-neutral-100 hover:text-neutral-900",
              "hover:border-neutral-300",
              // Dark mode
              "dark:border-white/10 dark:text-white/70",
              "dark:hover:bg-white/[0.06] dark:hover:text-white",
              "dark:hover:border-white/20"
            )}
          >
            {cancelLabel}
          </Button>
          <Button 
            variant={variant} 
            onClick={handleConfirm}
            className={cn(
              "flex-1 sm:flex-none min-w-[120px] h-10",
              "font-medium text-[14px]",
              variant === "destructive" && [
                "bg-red-600 hover:bg-red-700",
                "dark:bg-red-600 dark:hover:bg-red-500",
                "shadow-sm hover:shadow-md",
                "shadow-red-600/20 hover:shadow-red-600/30"
              ]
            )}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
