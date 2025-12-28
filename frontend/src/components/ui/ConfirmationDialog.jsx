import * as React from "react"
import { Loader2, AlertCircle, Info, AlertTriangle, CheckCircle2 } from "lucide-react"
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
 * ConfirmationDialog - Redesigned
 * 
 * A modern, reusable confirmation dialog with:
 * - Optional icon indicators
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
    icon: null,
    iconBg: "bg-neutral-100 dark:bg-white/10",
    iconColor: "text-neutral-600 dark:text-white/70",
  },
  danger: {
    icon: AlertCircle,
    iconBg: "bg-red-50 dark:bg-red-500/10",
    iconColor: "text-red-600 dark:text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50 dark:bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  success: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-50 dark:bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
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
          <div className="flex items-start gap-3">
            {IconComponent && (
              <div className={cn(
                "shrink-0 p-2 rounded-xl",
                variantConfig.iconBg
              )}>
                <IconComponent className={cn("h-5 w-5", variantConfig.iconColor)} />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-1">
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
              "font-medium",
              "border-neutral-200 dark:border-white/10",
              "text-neutral-700 dark:text-white/70",
              "hover:bg-neutral-100 dark:hover:bg-white/5",
              "hover:text-neutral-900 dark:hover:text-white"
            )}
          >
            {cancelText}
          </Button>
          <Button 
            variant={isDestructive ? "destructive" : "default"} 
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "font-medium min-w-[100px]",
              isDestructive && "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
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
