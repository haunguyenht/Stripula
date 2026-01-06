import * as React from "react"
import { Loader2, AlertCircle, Info, AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/**
 * ConfirmationDialog - Liquid Aurora Design System
 * 
 * A modern, reusable confirmation dialog with:
 * - Optional icon indicators with aurora neon glow
 * - Liquid glass styling inherited from Dialog
 * - Aurora accent colors for variants
 * - Smooth loading states
 */

const VARIANT_CONFIG = {
  default: {
    icon: HelpCircle,
    // Light: Vintage neutral
    iconBg: "bg-neutral-100 dark:bg-white/[0.06]",
    iconColor: "text-neutral-500 dark:text-white/60",
    iconRing: "ring-neutral-200/50 dark:ring-white/[0.1]",
    // Aurora glow
    iconGlow: "dark:shadow-[0_0_12px_-4px_rgba(139,92,246,0.3)]",
  },
  danger: {
    icon: AlertCircle,
    // Light: Vintage burgundy
    iconBg: "bg-red-50 dark:bg-rose-500/[0.1]",
    iconColor: "text-red-600 dark:text-rose-400",
    iconRing: "ring-red-100 dark:ring-rose-500/25",
    // Aurora neon glow
    iconGlow: "dark:shadow-[0_0_16px_-4px_rgba(244,63,94,0.5)]",
  },
  warning: {
    icon: AlertTriangle,
    // Light: Sepia gold
    iconBg: "bg-amber-50 dark:bg-amber-500/[0.1]",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconRing: "ring-amber-100 dark:ring-amber-500/25",
    // Aurora neon glow
    iconGlow: "dark:shadow-[0_0_16px_-4px_rgba(245,158,11,0.5)]",
  },
  success: {
    icon: CheckCircle2,
    // Light: Antique green
    iconBg: "bg-emerald-50 dark:bg-emerald-500/[0.1]",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconRing: "ring-emerald-100 dark:ring-emerald-500/25",
    // Aurora neon glow
    iconGlow: "dark:shadow-[0_0_16px_-4px_rgba(16,185,129,0.5)]",
  },
  info: {
    icon: Info,
    // Light: Copper | Dark: Cyan aurora
    iconBg: "bg-blue-50 dark:bg-[var(--aurora-cyan)]/[0.1]",
    iconColor: "text-blue-600 dark:text-[var(--aurora-cyan)]",
    iconRing: "ring-blue-100 dark:ring-[var(--aurora-cyan)]/25",
    // Aurora neon glow - cyan
    iconGlow: "dark:shadow-[0_0_16px_-4px_rgba(34,211,238,0.5)]",
  },
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  title = "Confirm Action",
  description,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  destructive = false,
  isLoading = false,
  variant = "default",
  icon: customIcon,
}) {
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

  // Auto-set destructive for danger variant
  const isDestructive = destructive || variant === "danger";
  
  const variantConfig = VARIANT_CONFIG[variant] || VARIANT_CONFIG.default;
  const IconComponent = customIcon || variantConfig.icon;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          {/* Icon + Title Row */}
          <div className="flex items-start gap-4">
            {IconComponent && (
              <div className={cn(
                "shrink-0 p-2.5 rounded-xl",
                "ring-1",
                variantConfig.iconBg,
                variantConfig.iconRing,
                // Aurora neon glow in dark mode
                variantConfig.iconGlow
              )}>
                <IconComponent className={cn("h-5 w-5", variantConfig.iconColor)} />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        
        {children && (
          <DialogBody className="py-1">
            {children}
          </DialogBody>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isLoading}
            className={cn(
              "h-10 font-medium text-[14px]",
              // Light mode: Vintage banking
              "border-[hsl(30,25%,82%)] text-[hsl(25,35%,35%)]",
              "hover:bg-[hsl(38,30%,94%)] hover:text-[hsl(25,35%,25%)]",
              "hover:border-[hsl(25,75%,55%)]",
              // Dark mode: Liquid glass
              "dark:border-white/[0.1] dark:text-white/70",
              "dark:hover:bg-white/[0.08] dark:hover:text-white",
              "dark:hover:border-white/[0.2]",
              "dark:hover:shadow-[0_0_16px_-4px_rgba(139,92,246,0.2)]"
            )}
          >
            {cancelText}
          </Button>
          <Button 
            variant={isDestructive ? "destructive" : "default"} 
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "h-10 font-medium text-[14px] min-w-[100px]",
              isDestructive && [
                // Light mode: Burgundy ink
                "bg-[hsl(355,40%,45%)] hover:bg-[hsl(355,45%,40%)]",
                "shadow-[hsla(355,40%,45%,0.2)] hover:shadow-[hsla(355,40%,45%,0.3)]",
                // Dark mode: Rose with aurora neon glow
                "dark:bg-rose-600 dark:hover:bg-rose-500",
                "dark:shadow-[0_0_20px_-4px_rgba(244,63,94,0.5)]",
                "dark:hover:shadow-[0_0_28px_-4px_rgba(244,63,94,0.6)]"
              ]
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Please wait...</span>
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmationDialog;
