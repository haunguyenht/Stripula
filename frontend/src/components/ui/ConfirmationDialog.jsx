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
import { Button } from "@/components/ui/Button"

/**
 * ConfirmationDialog - Redesigned for OrangeAI/OPUX Design System
 * 
 * A modern, reusable confirmation dialog with:
 * - Optional icon indicators with proper theming
 * - Improved typography and spacing
 * - Better visual hierarchy
 * - Smooth loading states
 * 
 * @param {boolean} open - Whether the dialog is open
 * @param {Function} onOpenChange - Callback when open state changes
 * @param {string} title - Dialog title
 * @param {string} description - Dialog description
 * @param {React.ReactNode} children - Custom content to render in the dialog body
 * @param {string} confirmText - Label for confirm button (default: "Confirm")
 * @param {string} cancelText - Label for cancel button (default: "Cancel")
 * @param {Function} onConfirm - Callback when user confirms
 * @param {Function} onCancel - Callback when user cancels (optional)
 * @param {boolean} destructive - Use destructive button style (default: false)
 * @param {boolean} isLoading - Loading state - disables buttons and shows spinner
 * @param {string} variant - Dialog variant: "default" | "danger" | "warning" | "success" | "info"
 * @param {React.ReactNode} icon - Custom icon to display (overrides variant icon)
 */

const VARIANT_CONFIG = {
  default: {
    icon: HelpCircle,
    iconBg: "bg-neutral-100 dark:bg-white/10",
    iconColor: "text-neutral-500 dark:text-white/60",
    iconRing: "ring-neutral-200/50 dark:ring-white/10",
  },
  danger: {
    icon: AlertCircle,
    iconBg: "bg-red-50 dark:bg-red-500/15",
    iconColor: "text-red-600 dark:text-red-400",
    iconRing: "ring-red-100 dark:ring-red-500/20",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50 dark:bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconRing: "ring-amber-100 dark:ring-amber-500/20",
  },
  success: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-50 dark:bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconRing: "ring-emerald-100 dark:ring-emerald-500/20",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-50 dark:bg-blue-500/15",
    iconColor: "text-blue-600 dark:text-blue-400",
    iconRing: "ring-blue-100 dark:ring-blue-500/20",
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
                variantConfig.iconRing
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
            {cancelText}
          </Button>
          <Button 
            variant={isDestructive ? "destructive" : "default"} 
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "h-10 font-medium text-[14px] min-w-[100px]",
              isDestructive && [
                "bg-red-600 hover:bg-red-700",
                "dark:bg-red-600 dark:hover:bg-red-500",
                "shadow-sm hover:shadow-md",
                "shadow-red-600/20 hover:shadow-red-600/30"
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
