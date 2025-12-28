import { memo } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils.js";

const badgeVariants = cva(
  "inline-flex items-center rounded-[6px] border px-2 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
  {
    variants: {
      variant: {
        default: [
          // Light mode: OrangeAI orange badge
          "border-transparent bg-[rgb(255,64,23)] text-white hover:bg-[rgb(255,80,40)]",
          // Dark mode: OPUX glass with terracotta accent
          "dark:bg-white/5 dark:border-[0.5px] dark:border-primary/30",
          "dark:text-primary dark:hover:border-primary/50",
        ].join(" "),
        secondary: [
          // Light mode: OrangeAI warm secondary badge
          "border-[rgb(237,234,233)] bg-[rgb(248,247,247)] text-[rgb(90,74,69)]",
          "hover:bg-[rgb(245,245,245)]",
          // Dark mode: OPUX subtle glass
          "dark:bg-white/5 dark:border-[0.5px] dark:border-white/10",
          "dark:text-white/70 dark:hover:border-white/20",
        ].join(" "),
        destructive: [
          // Light mode: OrangeAI destructive badge
          "border-transparent bg-[rgb(239,68,68)] text-white hover:bg-[rgb(248,80,80)]",
          // Dark mode: OPUX glass with red accent
          "dark:bg-white/5 dark:border-[0.5px] dark:border-red-500/30",
          "dark:text-red-400 dark:hover:border-red-500/50",
        ].join(" "),
        outline: [
          // Light mode: OrangeAI warm outline badge
          "border-[rgb(237,234,233)] text-[rgb(37,27,24)] bg-transparent",
          "hover:bg-[rgb(248,247,247)]",
          // Dark mode: OPUX outline
          "dark:border-white/15 dark:text-white/70 dark:hover:border-white/25",
        ].join(" "),
        success: [
          // Light mode: OrangeAI success badge
          "border-[rgb(34,197,94)]/20 bg-[rgb(34,197,94)]/10 text-[rgb(22,163,74)]",
          // Dark mode: OPUX glass with green accent
          "dark:bg-white/5 dark:border-[0.5px] dark:border-emerald-500/25",
          "dark:text-emerald-400",
        ].join(" "),
        warning: [
          // Light mode: OrangeAI warning badge
          "border-[rgb(245,158,11)]/20 bg-[rgb(245,158,11)]/10 text-[rgb(217,119,6)]",
          // Dark mode: OPUX glass with amber accent
          "dark:bg-white/5 dark:border-[0.5px] dark:border-amber-500/25",
          "dark:text-amber-400",
        ].join(" "),
        // ✅ APPROVED/CHARGED - Vibrant green with pulse glow effect
        approved: [
          // Light mode: Bold green with gradient and glow
          "relative overflow-hidden",
          "border-emerald-400/50 bg-gradient-to-r from-emerald-500 to-green-500 text-white",
          "shadow-[0_0_12px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "hover:shadow-[0_0_18px_rgba(16,185,129,0.5)]",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-60",
          // Dark mode: Glowing emerald with glass effect
          "dark:bg-gradient-to-r dark:from-emerald-500/90 dark:to-green-500/80",
          "dark:border-emerald-400/60 dark:text-white",
          "dark:shadow-[0_0_20px_rgba(52,211,153,0.35),0_0_40px_rgba(16,185,129,0.15)]",
          "dark:hover:shadow-[0_0_25px_rgba(52,211,153,0.45),0_0_50px_rgba(16,185,129,0.2)]",
        ].join(" "),
        // 🔵 LIVE - Electric cyan with shimmer effect
        live: [
          // Light mode: Vibrant cyan with inner glow
          "relative overflow-hidden",
          "border-cyan-400/50 bg-gradient-to-r from-cyan-500 to-teal-500 text-white",
          "shadow-[0_0_12px_rgba(6,182,212,0.4),inset_0_1px_0_rgba(255,255,255,0.25)]",
          "hover:shadow-[0_0_18px_rgba(6,182,212,0.5)]",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/25 before:via-transparent before:to-white/10",
          "animate-badge-shimmer",
          // Dark mode: Electric cyan glow
          "dark:bg-gradient-to-r dark:from-cyan-500/90 dark:to-teal-500/80",
          "dark:border-cyan-400/60 dark:text-white",
          "dark:shadow-[0_0_20px_rgba(34,211,238,0.4),0_0_40px_rgba(6,182,212,0.2)]",
          "dark:hover:shadow-[0_0_25px_rgba(34,211,238,0.5),0_0_50px_rgba(6,182,212,0.25)]",
        ].join(" "),
        // 🔴 DEAD - Muted red with subtle effect
        dead: [
          // Light mode: Soft red
          "border-red-300/40 bg-gradient-to-r from-red-100 to-red-50 text-red-600",
          "shadow-sm",
          // Dark mode: Dark red glass
          "dark:bg-gradient-to-r dark:from-red-500/15 dark:to-red-600/10",
          "dark:border-red-500/30 dark:text-red-400",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
        ].join(" "),
        // ⚠️ ERROR - Amber with warning pulse
        error: [
          // Light mode: Warm amber glow
          "relative",
          "border-amber-400/40 bg-gradient-to-r from-amber-100 to-orange-50 text-amber-700",
          "shadow-[0_0_8px_rgba(245,158,11,0.2)]",
          "animate-badge-pulse-soft",
          // Dark mode: Amber glass with glow
          "dark:bg-gradient-to-r dark:from-amber-500/20 dark:to-orange-500/15",
          "dark:border-amber-500/40 dark:text-amber-400",
          "dark:shadow-[0_0_12px_rgba(251,191,36,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]",
        ].join(" "),
        // ❌ DECLINED - Rose/red with strikethrough feel
        declined: [
          // Light mode: Soft rose
          "border-rose-300/40 bg-gradient-to-r from-rose-100 to-pink-50 text-rose-600",
          "shadow-sm",
          // Dark mode: Rose glass
          "dark:bg-gradient-to-r dark:from-rose-500/15 dark:to-pink-500/10",
          "dark:border-rose-500/35 dark:text-rose-400",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
        ].join(" "),
        // 🔶 CORAL/LIVE 3DS - Orange with energy effect
        coral: [
          // Light mode: Energetic orange gradient
          "relative overflow-hidden",
          "border-orange-400/50 bg-gradient-to-r from-orange-500 to-amber-500 text-white",
          "shadow-[0_0_10px_rgba(249,115,22,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "hover:shadow-[0_0_15px_rgba(249,115,22,0.45)]",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent",
          // Dark mode: Fiery orange glow
          "dark:bg-gradient-to-r dark:from-orange-500/90 dark:to-amber-500/80",
          "dark:border-orange-400/60 dark:text-white",
          "dark:shadow-[0_0_18px_rgba(251,146,60,0.35),0_0_35px_rgba(249,115,22,0.15)]",
          "dark:hover:shadow-[0_0_22px_rgba(251,146,60,0.45),0_0_45px_rgba(249,115,22,0.2)]",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * Badge Component
 * Memoized for performance (Requirements 5.5)
 */
const Badge = memo(function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
});

export { Badge, badgeVariants };
