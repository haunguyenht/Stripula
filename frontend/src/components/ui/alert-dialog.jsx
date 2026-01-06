import * as React from "react"
import { AlertTriangle, AlertCircle, Info, CheckCircle2, XCircle } from "lucide-react"
import { motion } from "motion/react"
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
 * ConfirmDialog - Premium Dual Theme Design System
 * 
 * ═══════════════════════════════════════════════════════════════════
 * LIGHT THEME: "Art Deco Treasury"
 * - Warm ivory canvas with gold accents
 * - Elegant icon containers with metallic finish
 * - Copper/burgundy action buttons
 * ═══════════════════════════════════════════════════════════════════
 * 
 * ═══════════════════════════════════════════════════════════════════
 * DARK THEME: "Obsidian Nebula"
 * - Deep space glass with aurora glow
 * - Neon-lit icon containers
 * - Prismatic action buttons
 * ═══════════════════════════════════════════════════════════════════
 */

const VARIANT_CONFIG = {
  destructive: {
    icon: AlertCircle,
    iconBg: "bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-500/20 dark:to-rose-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
    iconRing: "ring-rose-200/60 dark:ring-rose-500/30",
    iconGlow: "dark:shadow-[0_0_20px_-4px_rgba(244,63,94,0.5)]",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-500/20 dark:to-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconRing: "ring-amber-200/60 dark:ring-amber-500/30",
    iconGlow: "dark:shadow-[0_0_20px_-4px_rgba(251,191,36,0.5)]",
  },
  info: {
    icon: Info,
    iconBg: "bg-gradient-to-br from-sky-100 to-sky-50 dark:from-cyan-500/20 dark:to-cyan-500/10",
    iconColor: "text-sky-600 dark:text-cyan-400",
    iconRing: "ring-sky-200/60 dark:ring-cyan-500/30",
    iconGlow: "dark:shadow-[0_0_20px_-4px_rgba(34,211,238,0.5)]",
  },
  success: {
    icon: CheckCircle2,
    iconBg: "bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/20 dark:to-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconRing: "ring-emerald-200/60 dark:ring-emerald-500/30",
    iconGlow: "dark:shadow-[0_0_20px_-4px_rgba(52,211,153,0.5)]",
  },
  default: {
    icon: Info,
    iconBg: "bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-500/20 dark:to-violet-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    iconRing: "ring-violet-200/60 dark:ring-violet-500/30",
    iconGlow: "dark:shadow-[0_0_20px_-4px_rgba(139,92,246,0.5)]",
  },
}

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
  icon: customIcon,
  isLoading = false,
}) {
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

  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.default;
  const IconComponent = customIcon || config.icon;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="sm" className="sm:max-w-[420px]">
        <DialogHeader>
          {/* Icon + Content Layout */}
          <div className="flex items-start gap-3 xs:gap-4">
            {/* Animated Icon Container */}
            <motion.div 
              className={cn(
                "shrink-0 flex items-center justify-center",
                "h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12",
                "rounded-xl sm:rounded-2xl",
                "ring-1",
                config.iconBg,
                config.iconRing,
                config.iconGlow
              )}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5, delay: 0.1 }}
            >
              <IconComponent className={cn(
                "h-5 w-5 xs:h-5.5 xs:w-5.5 sm:h-6 sm:w-6",
                config.iconColor
              )} />
            </motion.div>

            {/* Title & Description */}
            <div className="flex-1 min-w-0 pt-0.5">
              <DialogTitle className="pr-6">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1.5">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <DialogFooter>
          {/* Cancel Button */}
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
              "hover:shadow-[inset_0_1px_0_rgba(255,252,245,0.8),0_2px_8px_rgba(139,109,66,0.15)]",
              // Dark mode: Obsidian glass
              "dark:bg-transparent dark:from-transparent dark:to-transparent",
              "dark:border-white/[0.1] dark:text-white/70",
              "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
              "dark:hover:bg-white/[0.06] dark:hover:text-white",
              "dark:hover:border-white/[0.15]",
              "dark:hover:shadow-[0_0_20px_-6px_rgba(139,92,246,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]"
            )}
          >
            {cancelLabel}
          </Button>

          {/* Confirm Button */}
          <Button 
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 sm:flex-none min-w-[100px] xs:min-w-[120px]",
              "h-9 xs:h-10 sm:h-11",
              "text-[13px] xs:text-[14px] font-medium",
              variant === "destructive" && [
                // Light: Burgundy wax seal
                "bg-gradient-to-b from-[hsl(355,50%,50%)] via-[hsl(355,48%,46%)] to-[hsl(355,45%,40%)]",
                "border border-[hsl(355,40%,35%)]/30",
                "text-white",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_16px_-2px_rgba(180,50,50,0.3)]",
                "hover:from-[hsl(355,55%,55%)] hover:via-[hsl(355,52%,50%)] hover:to-[hsl(355,48%,44%)]",
                "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_6px_24px_-2px_rgba(180,50,50,0.4)]",
                // Dark: Rose neon
                "dark:from-rose-600 dark:via-rose-600 dark:to-rose-700",
                "dark:border-rose-500/30",
                "dark:shadow-[0_0_30px_-6px_rgba(244,63,94,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]",
                "dark:hover:from-rose-500 dark:hover:via-rose-500 dark:hover:to-rose-600",
                "dark:hover:shadow-[0_0_40px_-6px_rgba(244,63,94,0.7),inset_0_1px_0_rgba(255,255,255,0.15)]"
              ],
              variant === "warning" && [
                // Light: Amber seal
                "bg-gradient-to-b from-[hsl(40,85%,52%)] via-[hsl(38,80%,48%)] to-[hsl(35,75%,42%)]",
                "border border-[hsl(35,70%,35%)]/30",
                "text-white",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_16px_-2px_rgba(180,120,30,0.3)]",
                "hover:from-[hsl(40,90%,56%)] hover:via-[hsl(38,85%,52%)] hover:to-[hsl(35,80%,46%)]",
                // Dark: Amber neon
                "dark:from-amber-600 dark:via-amber-600 dark:to-amber-700",
                "dark:border-amber-500/30",
                "dark:shadow-[0_0_30px_-6px_rgba(251,191,36,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]",
                "dark:hover:from-amber-500 dark:hover:via-amber-500 dark:hover:to-amber-600"
              ],
              variant === "success" && [
                // Light: Emerald seal
                "bg-gradient-to-b from-[hsl(155,60%,42%)] via-[hsl(155,55%,38%)] to-[hsl(155,50%,32%)]",
                "border border-[hsl(155,45%,28%)]/30",
                "text-white",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_16px_-2px_rgba(50,150,100,0.3)]",
                // Dark: Emerald neon
                "dark:from-emerald-600 dark:via-emerald-600 dark:to-emerald-700",
                "dark:border-emerald-500/30",
                "dark:shadow-[0_0_30px_-6px_rgba(52,211,153,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]"
              ],
              (variant === "default" || variant === "info") && [
                // Light: Copper gold
                "bg-gradient-to-b from-[hsl(38,65%,50%)] via-[hsl(35,60%,46%)] to-[hsl(32,55%,40%)]",
                "border border-[hsl(32,50%,35%)]/30",
                "text-white",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_16px_-2px_rgba(160,110,50,0.3)]",
                // Dark: Violet aurora
                "dark:from-violet-600 dark:via-violet-600 dark:to-violet-700",
                "dark:border-violet-500/30",
                "dark:shadow-[0_0_30px_-6px_rgba(139,92,246,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]"
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

export default ConfirmDialog;
