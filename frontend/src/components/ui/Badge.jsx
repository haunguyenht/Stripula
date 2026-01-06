import { memo, forwardRef } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils.js";

/**
 * Badge Component - Dual Theme Design System
 * 
 * LIGHT MODE: Vintage Banking / Wax Seal
 * - Embossed/debossed text effects (letterpress shadows)
 * - Wax seal styling for status badges
 * - Certificate-style engraved borders
 * - Copper and sepia metallic accents
 * 
 * DARK MODE: Liquid Aurora
 * - Neon glow pulse animations
 * - Aurora color palette: cyan, indigo, pink accents
 * - Liquid glass backgrounds with specular highlights
 * - Multi-layered shadow effects
 */

const badgeVariants = cva(
  "inline-flex items-center rounded-[6px] border px-2 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 tracking-wide",
  {
    variants: {
      variant: {
        default: [
          // Light mode: Copper foil badge with embossed effect
          "border border-[hsl(22,60%,38%)]",
          "bg-gradient-to-b from-[hsl(25,70%,52%)] via-[hsl(28,72%,48%)] to-[hsl(22,68%,42%)]",
          "text-[hsl(42,60%,95%)]",
          "shadow-[0_2px_6px_rgba(166,100,50,0.3),inset_0_1px_0_rgba(255,200,150,0.35)]",
          "[text-shadow:0_1px_0_rgba(100,50,20,0.3)]",
          "hover:opacity-95 hover:shadow-[0_3px_8px_rgba(166,100,50,0.4)]",
          // Dark mode: Liquid Aurora glass with indigo accent (bg-none resets gradient)
          "dark:bg-none dark:bg-[rgba(15,18,25,0.8)] dark:border-[0.5px] dark:border-[hsl(var(--aurora-indigo))]/30",
          "dark:text-[hsl(var(--aurora-indigo))] dark:hover:border-[hsl(var(--aurora-indigo))]/50",
          "dark:[text-shadow:none]",
        ].join(" "),
        secondary: [
          // Light mode: Aged parchment with double-line border
          "border border-[hsl(30,25%,72%)]",
          "bg-gradient-to-b from-[hsl(40,40%,94%)] to-[hsl(38,35%,90%)]",
          "text-[hsl(25,35%,35%)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(101,67,33,0.05)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
          "hover:bg-gradient-to-b hover:from-[hsl(38,42%,92%)] hover:to-[hsl(36,38%,87%)]",
          // Dark mode: Liquid Aurora subtle glass (bg-none resets gradient)
          "dark:bg-none dark:bg-[rgba(15,18,25,0.8)] dark:border-[0.5px] dark:border-white/10",
          "dark:text-white/70 dark:hover:border-white/20",
          "dark:[text-shadow:none]",
        ].join(" "),
        destructive: [
          // Light mode: Burgundy wax seal badge
          "border border-[hsl(355,40%,35%)]",
          "bg-gradient-to-b from-[hsl(355,50%,48%)] via-[hsl(355,48%,44%)] to-[hsl(355,45%,38%)]",
          "text-[hsl(40,60%,95%)]",
          "shadow-[0_2px_6px_rgba(140,50,60,0.3),inset_0_1px_0_rgba(255,180,180,0.25)]",
          "[text-shadow:0_1px_0_rgba(100,30,40,0.3)]",
          "hover:opacity-95",
          // Dark mode: Liquid Aurora glass with rose accent (bg-none resets gradient)
          "dark:bg-none dark:bg-[rgba(15,18,25,0.8)] dark:border-[0.5px] dark:border-rose-500/30",
          "dark:text-rose-400 dark:hover:border-rose-500/50",
          "dark:[text-shadow:none]",
        ].join(" "),
        outline: [
          // Light mode: Engraved copper outline
          "border-2 border-[hsl(25,50%,55%)]",
          "bg-transparent text-[hsl(25,40%,32%)]",
          "shadow-[inset_0_0_0_1px_hsl(40,50%,97%),0_1px_2px_rgba(101,67,33,0.1)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
          "hover:bg-[hsl(40,45%,95%)] hover:border-[hsl(25,55%,50%)]",
          // Dark mode: Liquid Aurora outline (explicit bg override)
          "dark:bg-transparent dark:border-white/20 dark:text-white/80",
          "dark:shadow-none dark:hover:bg-white/[0.08] dark:hover:border-white/30",
          "dark:[text-shadow:none]",
        ].join(" "),
        success: [
          // Light mode: Antique green ink with embossed effect
          "border border-[hsl(145,40%,55%)]",
          "bg-gradient-to-b from-[hsl(145,35%,92%)] to-[hsl(145,32%,86%)]",
          "text-[hsl(145,55%,28%)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_3px_rgba(45,100,70,0.12)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
          // Dark mode: Liquid Aurora glass with emerald glow (bg-none resets gradient)
          "dark:bg-none dark:bg-[rgba(15,18,25,0.8)] dark:border-[0.5px] dark:border-emerald-500/30",
          "dark:text-emerald-400 dark:shadow-[0_0_12px_rgba(16,185,129,0.2)]",
          "dark:[text-shadow:none]",
        ].join(" "),
        warning: [
          // Light mode: Brass/gold ink badge
          "border border-[hsl(38,50%,55%)]",
          "bg-gradient-to-b from-[hsl(42,50%,92%)] to-[hsl(38,45%,86%)]",
          "text-[hsl(35,65%,30%)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_3px_rgba(140,100,40,0.12)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
          // Dark mode: Liquid Aurora glass with amber glow (bg-none resets gradient)
          "dark:bg-none dark:bg-[rgba(15,18,25,0.8)] dark:border-[0.5px] dark:border-amber-500/30",
          "dark:text-amber-400 dark:shadow-[0_0_10px_rgba(251,191,36,0.2)]",
          "dark:[text-shadow:none]",
        ].join(" "),
        
        // ✅ APPROVED/CHARGED - Vintage green wax seal (light) / Emerald neon (dark)
        approved: [
          // Light mode: Antique green wax seal with embossed stamp effect
          "relative overflow-hidden",
          "border border-[hsl(145,50%,35%)]",
          "bg-gradient-to-b from-[hsl(145,55%,42%)] via-[hsl(145,52%,38%)] to-[hsl(145,48%,32%)]",
          "text-[hsl(100,80%,96%)]",
          "shadow-[0_3px_10px_rgba(45,100,70,0.35),0_1px_2px_rgba(30,80,50,0.25),inset_0_1px_0_rgba(200,255,200,0.25)]",
          "[text-shadow:0_1px_0_rgba(30,60,40,0.35)]",
          "hover:shadow-[0_4px_14px_rgba(45,100,70,0.45)]",
          // Dark mode: Neon emerald with aurora cyan glow pulse
          "dark:bg-gradient-to-r dark:from-emerald-500/90 dark:to-emerald-400/85",
          "dark:border-emerald-400/50 dark:text-white",
          "dark:shadow-[0_0_20px_rgba(16,185,129,0.5),0_0_40px_rgba(34,211,238,0.2),0_0_60px_rgba(16,185,129,0.15),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "dark:hover:shadow-[0_0_28px_rgba(52,211,153,0.6),0_0_50px_rgba(34,211,238,0.3),0_0_75px_rgba(16,185,129,0.2)]",
          "dark:[text-shadow:none]",
          "animate-neon-pulse-emerald",
        ].join(" "),
        
        // 🔵 LIVE - Polished copper coin (light) / Electric cyan (dark)
        live: [
          // Light mode: Polished copper with premium metallic shine
          "relative overflow-hidden",
          "border border-[hsl(25,65%,40%)]",
          "bg-gradient-to-b from-[hsl(28,75%,55%)] via-[hsl(25,72%,50%)] to-[hsl(22,68%,42%)]",
          "text-[hsl(45,80%,96%)]",
          "shadow-[0_3px_10px_rgba(166,100,50,0.4),0_1px_2px_rgba(139,69,19,0.3),inset_0_1px_0_rgba(255,210,170,0.4)]",
          "[text-shadow:0_1px_0_rgba(100,50,20,0.35)]",
          "hover:shadow-[0_4px_14px_rgba(166,100,50,0.5)]",
          // Dark mode: Electric cyan neon with indigo aurora pulse
          "dark:bg-gradient-to-r dark:from-cyan-400/95 dark:to-cyan-500/90",
          "dark:border-cyan-300/60 dark:text-white",
          "dark:shadow-[0_0_24px_rgba(34,211,238,0.55),0_0_48px_rgba(139,92,246,0.25),0_0_72px_rgba(34,211,238,0.15),inset_0_1px_0_rgba(255,255,255,0.18)]",
          "dark:hover:shadow-[0_0_32px_rgba(34,211,238,0.7),0_0_64px_rgba(139,92,246,0.4),0_0_96px_rgba(34,211,238,0.25)]",
          "dark:[text-shadow:none]",
          "animate-neon-pulse-cyan dark:animate-aurora-shimmer",
        ].join(" "),
        
        // 🔴 DEAD - Faded stamp (light) / Muted rose glass (dark)
        dead: [
          // Light mode: Faded ink stamp appearance
          "border border-[hsl(0,30%,70%)]",
          "bg-gradient-to-b from-[hsl(0,25%,92%)] to-[hsl(0,22%,88%)]",
          "text-[hsl(0,45%,45%)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.3)]",
          // Dark mode: Muted liquid glass with rose tint
          "dark:bg-gradient-to-r dark:from-red-500/12 dark:to-red-600/08",
          "dark:border-red-500/25 dark:text-red-400",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_8px_rgba(239,68,68,0.1)]",
          "dark:[text-shadow:none]",
        ].join(" "),
        
        // ⚠️ ERROR - Brass warning seal (light) / Amber neon (dark)
        error: [
          // Light mode: Aged brass warning with engraved effect
          "relative",
          "border border-[hsl(38,55%,50%)]",
          "bg-gradient-to-b from-[hsl(42,60%,88%)] to-[hsl(38,55%,82%)]",
          "text-[hsl(30,70%,30%)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_6px_rgba(140,100,40,0.15)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
          // Dark mode: Amber neon with pink aurora pulse
          "dark:bg-gradient-to-r dark:from-amber-500/20 dark:to-orange-500/15",
          "dark:border-amber-500/40 dark:text-amber-400",
          "dark:shadow-[0_0_16px_rgba(251,191,36,0.35),0_0_32px_rgba(236,72,153,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]",
          "dark:[text-shadow:none]",
          "animate-neon-pulse-amber",
        ].join(" "),
        
        // ❌ DECLINED - Faded burgundy (light) / Muted rose (dark)
        declined: [
          // Light mode: Faded burgundy stamp
          "border border-[hsl(355,30%,68%)]",
          "bg-gradient-to-b from-[hsl(355,30%,92%)] to-[hsl(355,28%,87%)]",
          "text-[hsl(355,50%,42%)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.3)]",
          // Dark mode: Muted rose liquid glass
          "dark:bg-gradient-to-r dark:from-rose-500/12 dark:to-pink-500/08",
          "dark:border-rose-500/30 dark:text-rose-400",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_10px_rgba(244,63,94,0.12)]",
          "dark:[text-shadow:none]",
        ].join(" "),
        
        // 🔶 CORAL/LIVE 3DS - Bronze medallion (light) / Orange neon (dark)
        coral: [
          // Light mode: Bronze medallion with radiant shine
          "relative overflow-hidden",
          "border border-[hsl(30,60%,38%)]",
          "bg-gradient-to-b from-[hsl(32,70%,52%)] via-[hsl(30,68%,48%)] to-[hsl(28,65%,40%)]",
          "text-[hsl(45,80%,96%)]",
          "shadow-[0_3px_10px_rgba(180,110,40,0.35),0_1px_2px_rgba(140,80,30,0.25),inset_0_1px_0_rgba(255,220,180,0.35)]",
          "[text-shadow:0_1px_0_rgba(100,60,20,0.35)]",
          "hover:shadow-[0_4px_14px_rgba(180,110,40,0.45)]",
          // Dark mode: Orange neon with pink aurora pulse
          "dark:bg-gradient-to-r dark:from-orange-500/90 dark:to-amber-500/85",
          "dark:border-orange-400/55 dark:text-white",
          "dark:shadow-[0_0_22px_rgba(251,146,60,0.5),0_0_44px_rgba(236,72,153,0.2),0_0_66px_rgba(249,115,22,0.12),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "dark:hover:shadow-[0_0_32px_rgba(251,146,60,0.65),0_0_60px_rgba(236,72,153,0.35),0_0_88px_rgba(249,115,22,0.22)]",
          "dark:[text-shadow:none]",
          "animate-neon-pulse-orange",
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
 * Memoized and forwardRef for compatibility with Tooltip
 */
const Badge = memo(forwardRef(function Badge({ className, variant, ...props }, ref) {
  return (
    <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}));

export { Badge, badgeVariants };
