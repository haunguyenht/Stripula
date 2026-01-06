import * as React from "react"
import { Loader2, AlertCircle, Info, AlertTriangle, CheckCircle2, HelpCircle, ShieldAlert, Zap } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogSection,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/**
 * ConfirmationDialog - Premium Dual Theme Design System
 * 
 * ═══════════════════════════════════════════════════════════════════
 * A versatile confirmation dialog with:
 * - Multiple visual variants (danger, warning, success, info, default)
 * - Animated icon indicators with aurora glow (dark) / metallic shine (light)
 * - Loading states with spinner
 * - Optional custom content via children
 * - Responsive layout
 * ═══════════════════════════════════════════════════════════════════
 */

const VARIANT_CONFIG = {
  default: {
    icon: HelpCircle,
    // Light: Soft violet with gold undertone
    iconBg: "bg-gradient-to-br from-violet-100 via-violet-50 to-purple-50 dark:from-violet-500/20 dark:via-violet-500/15 dark:to-purple-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    iconRing: "ring-violet-200/60 dark:ring-violet-500/30",
    iconGlow: "dark:shadow-[0_0_24px_-4px_rgba(139,92,246,0.5)]",
    iconAnimation: { scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] },
  },
  danger: {
    icon: AlertCircle,
    // Light: Burgundy wax seal / Dark: Rose neon
    iconBg: "bg-gradient-to-br from-rose-100 via-rose-50 to-red-50 dark:from-rose-500/20 dark:via-rose-500/15 dark:to-red-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
    iconRing: "ring-rose-200/60 dark:ring-rose-500/30",
    iconGlow: "dark:shadow-[0_0_24px_-4px_rgba(244,63,94,0.6)]",
    iconAnimation: { scale: [1, 1.1, 1] },
  },
  warning: {
    icon: AlertTriangle,
    // Light: Amber/gold / Dark: Amber neon
    iconBg: "bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-50 dark:from-amber-500/20 dark:via-amber-500/15 dark:to-yellow-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconRing: "ring-amber-200/60 dark:ring-amber-500/30",
    iconGlow: "dark:shadow-[0_0_24px_-4px_rgba(251,191,36,0.6)]",
    iconAnimation: { y: [0, -2, 0], rotate: [0, -5, 5, 0] },
  },
  success: {
    icon: CheckCircle2,
    // Light: Emerald treasury / Dark: Emerald neon
    iconBg: "bg-gradient-to-br from-emerald-100 via-emerald-50 to-green-50 dark:from-emerald-500/20 dark:via-emerald-500/15 dark:to-green-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconRing: "ring-emerald-200/60 dark:ring-emerald-500/30",
    iconGlow: "dark:shadow-[0_0_24px_-4px_rgba(52,211,153,0.6)]",
    iconAnimation: { scale: [1, 1.15, 1] },
  },
  info: {
    icon: Info,
    // Light: Sky/copper / Dark: Cyan aurora
    iconBg: "bg-gradient-to-br from-sky-100 via-sky-50 to-cyan-50 dark:from-cyan-500/20 dark:via-cyan-500/15 dark:to-sky-500/10",
    iconColor: "text-sky-600 dark:text-cyan-400",
    iconRing: "ring-sky-200/60 dark:ring-cyan-500/30",
    iconGlow: "dark:shadow-[0_0_24px_-4px_rgba(34,211,238,0.6)]",
    iconAnimation: { rotate: [0, 360] },
    iconTransition: { duration: 8, repeat: Infinity, ease: "linear" },
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
  size = "default",
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
      <DialogContent size={size} className={cn(
        size === "default" && "sm:max-w-[440px]"
      )}>
        <DialogHeader>
          {/* Icon + Title Row */}
          <div className="flex items-start gap-3 xs:gap-4">
            {IconComponent && (
              <motion.div 
                className={cn(
                  "shrink-0 flex items-center justify-center",
                  "h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12",
                  "rounded-xl sm:rounded-2xl",
                  "ring-1",
                  variantConfig.iconBg,
                  variantConfig.iconRing,
                  variantConfig.iconGlow,
                  // Light mode: subtle inner shadow for depth
                  "shadow-[inset_0_-2px_4px_rgba(0,0,0,0.03)]",
                )}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  ...variantConfig.iconAnimation 
                }}
                transition={variantConfig.iconTransition || { 
                  type: "spring", 
                  duration: 0.5,
                  ...variantConfig.iconAnimation && { 
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  }
                }}
              >
                <IconComponent className={cn(
                  "h-5 w-5 xs:h-5.5 xs:w-5.5 sm:h-6 sm:w-6",
                  variantConfig.iconColor
                )} />
              </motion.div>
            )}
            <div className="flex-1 min-w-0 pt-0.5 space-y-1 xs:space-y-1.5">
              <DialogTitle className="pr-6">{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        
        {children && (
          <DialogBody className="py-1 xs:py-2">
            {children}
          </DialogBody>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isLoading}
            className={cn(
              "flex-1 sm:flex-none",
              "h-9 xs:h-10 sm:h-11",
              "text-[13px] xs:text-[14px] font-medium",
              // Light mode: Art Deco gold outline
              "bg-gradient-to-b from-[hsl(42,45%,97%)] to-[hsl(40,40%,93%)]",
              "border-[hsl(42,40%,75%)] text-[hsl(35,35%,30%)]",
              "shadow-[inset_0_1px_0_rgba(255,252,245,0.8),0_1px_3px_rgba(139,109,66,0.1)]",
              "hover:from-[hsl(42,50%,95%)] hover:to-[hsl(40,45%,90%)]",
              "hover:border-[hsl(42,55%,60%)]",
              // Dark mode: Obsidian glass
              "dark:bg-transparent dark:from-transparent dark:to-transparent",
              "dark:border-white/[0.1] dark:text-white/70",
              "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
              "dark:hover:bg-white/[0.06] dark:hover:text-white",
              "dark:hover:border-white/[0.15]",
              "dark:hover:shadow-[0_0_20px_-6px_rgba(139,92,246,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]"
            )}
          >
            {cancelText}
          </Button>
          <Button 
            variant={isDestructive ? "destructive" : "default"} 
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 sm:flex-none min-w-[100px] xs:min-w-[110px]",
              "h-9 xs:h-10 sm:h-11",
              "text-[13px] xs:text-[14px] font-medium",
              isDestructive && [
                // Light: Burgundy wax seal
                "bg-gradient-to-b from-[hsl(355,50%,50%)] via-[hsl(355,48%,46%)] to-[hsl(355,45%,40%)]",
                "border border-[hsl(355,40%,35%)]/30",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_16px_-2px_rgba(180,50,50,0.3)]",
                "hover:from-[hsl(355,55%,55%)] hover:via-[hsl(355,52%,50%)] hover:to-[hsl(355,48%,44%)]",
                // Dark: Rose neon
                "dark:from-rose-600 dark:via-rose-600 dark:to-rose-700",
                "dark:border-rose-500/30",
                "dark:shadow-[0_0_30px_-6px_rgba(244,63,94,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]",
                "dark:hover:shadow-[0_0_40px_-6px_rgba(244,63,94,0.7)]"
              ],
              !isDestructive && [
                // Light: Copper gold
                "bg-gradient-to-b from-[hsl(38,65%,50%)] via-[hsl(35,60%,46%)] to-[hsl(32,55%,40%)]",
                "border border-[hsl(32,50%,35%)]/30",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_16px_-2px_rgba(160,110,50,0.3)]",
                // Dark: Violet aurora
                "dark:from-violet-600 dark:via-violet-600 dark:to-violet-700",
                "dark:border-violet-500/30",
                "dark:shadow-[0_0_30px_-6px_rgba(139,92,246,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]"
              ]
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin" />
                <span className="hidden xs:inline">Please wait...</span>
                <span className="xs:hidden">Wait...</span>
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
