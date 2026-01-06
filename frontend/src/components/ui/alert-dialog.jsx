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
import { Button } from "@/components/ui/button"

/**
 * ConfirmDialog - Dual Theme Design System
 * 
 * Light Theme (Vintage Banking):
 * - Cream parchment background inherited from Dialog
 * - Copper foil accents on cancel button hover
 * - Burgundy wax seal effect on destructive button
 * - Embossed text shadows
 * 
 * Dark Theme (Liquid Aurora):
 * - Liquid glass with aurora accents
 * - Neon glow on destructive button
 * - Smooth transitions
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
          <DialogTitle className={cn(
            "text-lg font-semibold tracking-tight",
            // Light: copper ink with emboss
            "[text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
            "dark:[text-shadow:none]"
          )}>
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className={cn(
              "text-[14px] leading-relaxed",
              // Light: sepia ink
              "text-[hsl(25,20%,45%)]",
              "dark:text-white/60"
            )}>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="pt-2 gap-3 sm:gap-3">
          {/* Cancel button - vintage banking outline style */}
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className={cn(
              "flex-1 sm:flex-none h-10",
              "font-medium text-[14px]",
              // Light mode: Vintage banking - engraved outline
              "bg-gradient-to-b from-[hsl(38,40%,96%)] to-[hsl(35,35%,92%)]",
              "border-[hsl(30,30%,75%)] text-[hsl(25,35%,35%)]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(101,67,33,0.1)]",
              "hover:from-[hsl(38,45%,94%)] hover:to-[hsl(35,40%,90%)]",
              "hover:text-[hsl(25,40%,28%)]",
              "hover:border-[hsl(25,55%,55%)]",
              "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_4px_rgba(101,67,33,0.15)]",
              // Dark mode: Liquid glass button
              "dark:bg-transparent dark:from-transparent dark:to-transparent",
              "dark:border-white/[0.1] dark:text-white/70",
              "dark:shadow-none",
              "dark:hover:bg-white/[0.08] dark:hover:text-white",
              "dark:hover:border-white/[0.2]",
              "dark:hover:shadow-[0_0_16px_-4px_rgba(139,92,246,0.2)]"
            )}
          >
            {cancelLabel}
          </Button>
          {/* Confirm button - wax seal destructive style */}
          <Button 
            variant={variant} 
            onClick={handleConfirm}
            className={cn(
              "flex-1 sm:flex-none min-w-[120px] h-10",
              "font-medium text-[14px]",
              variant === "destructive" && [
                // Light mode: Burgundy wax seal button
                "bg-gradient-to-b from-[hsl(355,45%,48%)] via-[hsl(355,42%,45%)] to-[hsl(355,38%,40%)]",
                "border border-[hsl(355,35%,32%)]/40",
                "text-white",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_12px_rgba(150,50,50,0.25)]",
                "hover:from-[hsl(355,48%,52%)] hover:via-[hsl(355,45%,48%)] hover:to-[hsl(355,40%,42%)]",
                "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_6px_16px_rgba(150,50,50,0.3)]",
                // Dark mode: Rose with aurora neon glow
                "dark:from-rose-600 dark:via-rose-600 dark:to-rose-700",
                "dark:border-transparent",
                "dark:hover:from-rose-500 dark:hover:via-rose-500 dark:hover:to-rose-600",
                "dark:shadow-[0_0_20px_-4px_rgba(244,63,94,0.5)]",
                "dark:hover:shadow-[0_0_28px_-4px_rgba(244,63,94,0.6)]"
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
