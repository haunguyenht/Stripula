import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

/**
 * Alert Component - Dual Theme Design System
 * 
 * LIGHT MODE: Vintage Banking - Certificate/Document Style
 * - Double-line engraved borders (certificate aesthetic)
 * - Aged parchment backgrounds with subtle texture
 * - Letterpress text shadows
 * - Wax seal-inspired icon styling
 * 
 * DARK MODE: Liquid Aurora
 * - Liquid glass with aurora neon accents
 * - Subtle ambient glow effects
 */

const alertVariants = cva(
  cn(
    "relative w-full rounded-xl px-4 py-3 text-sm",
    "[&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7",
    // Dark mode base: Liquid glass foundation
    "dark:backdrop-blur-[40px] dark:backdrop-saturate-[180%]",
    "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
  ),
  {
    variants: {
      variant: {
        // Light: Certificate-style with double-line border | Dark: Obsidian Aurora glass
        default: cn(
          // Light: Aged parchment with certificate border
          "bg-gradient-to-b from-[hsl(40,45%,97%)] to-[hsl(38,40%,95%)]",
          "text-[hsl(25,40%,25%)]",
          "border-2 border-[hsl(30,30%,78%)]",
          "shadow-[inset_0_0_0_1px_hsl(40,50%,97%),inset_0_0_0_3px_hsl(30,25%,85%),0_3px_12px_rgba(101,67,33,0.08)]",
          "[&>svg]:text-[hsl(25,55%,45%)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
          // ═══════════════════════════════════════════════════════════
          // DARK MODE: Obsidian Aurora - Default Alert
          // ═══════════════════════════════════════════════════════════
          "dark:bg-gradient-to-r dark:from-[rgba(255,255,255,0.03)] dark:via-[rgba(255,255,255,0.04)] dark:to-[rgba(255,255,255,0.03)]",
          "dark:backdrop-blur-[40px]",
          "dark:border dark:border-white/[0.1]",
          "dark:shadow-[0_0_20px_-10px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]",
          "dark:text-white/90 dark:[&>svg]:text-white/70",
          "dark:[text-shadow:none]"
        ),
        // Light: Burgundy wax seal destructive | Dark: Rose neon glow
        destructive: cn(
          // Light: Vintage burgundy with wax seal styling
          "bg-gradient-to-b from-[hsl(355,30%,96%)] to-[hsl(355,28%,93%)]",
          "text-[hsl(355,45%,32%)]",
          "border-2 border-[hsl(355,35%,65%)]",
          "shadow-[inset_0_0_0_1px_hsl(355,30%,96%),inset_0_0_0_3px_hsl(355,30%,75%),0_3px_12px_rgba(140,50,60,0.1)]",
          "[&>svg]:text-[hsl(355,50%,45%)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
          // ═══════════════════════════════════════════════════════════
          // DARK MODE: Obsidian Aurora - Rose Destructive Alert
          // ═══════════════════════════════════════════════════════════
          // Deep obsidian glass with rose tint
          "dark:bg-gradient-to-r dark:from-[rgba(244,63,94,0.08)] dark:via-[rgba(244,63,94,0.06)] dark:to-[rgba(244,63,94,0.08)]",
          "dark:backdrop-blur-[40px]",
          // Aurora rose border
          "dark:border dark:border-rose-500/30",
          // Rose aurora glow
          "dark:shadow-[0_0_30px_-10px_rgba(244,63,94,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]",
          // Text colors
          "dark:text-rose-200 dark:[&>svg]:text-rose-400",
          "dark:[text-shadow:none]"
        ),
        // Light: Brass/gold seal warning | Dark: Amber aurora glow
        warning: cn(
          // Light: Aged brass with embossed effect
          "bg-gradient-to-b from-[hsl(42,55%,95%)] to-[hsl(38,50%,92%)]",
          "text-[hsl(35,60%,26%)]",
          "border-2 border-[hsl(38,55%,58%)]",
          "shadow-[inset_0_0_0_1px_hsl(42,55%,95%),inset_0_0_0_3px_hsl(38,45%,70%),0_3px_12px_rgba(140,100,40,0.1)]",
          "[&>svg]:text-[hsl(38,70%,42%)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
          // ═══════════════════════════════════════════════════════════
          // DARK MODE: Obsidian Aurora - Amber Warning Alert
          // ═══════════════════════════════════════════════════════════
          "dark:bg-gradient-to-r dark:from-[rgba(251,191,36,0.08)] dark:via-[rgba(251,191,36,0.06)] dark:to-[rgba(251,191,36,0.08)]",
          "dark:backdrop-blur-[40px]",
          "dark:border dark:border-amber-500/30",
          "dark:shadow-[0_0_30px_-10px_rgba(251,191,36,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]",
          "dark:text-amber-200 dark:[&>svg]:text-amber-400",
          "dark:[text-shadow:none]"
        ),
        // Light: Antique green ink success | Dark: Emerald aurora glow
        success: cn(
          // Light: Vintage green ink with certificate styling
          "bg-gradient-to-b from-[hsl(145,40%,95%)] to-[hsl(145,38%,92%)]",
          "text-[hsl(145,50%,26%)]",
          "border-2 border-[hsl(145,40%,55%)]",
          "shadow-[inset_0_0_0_1px_hsl(145,40%,95%),inset_0_0_0_3px_hsl(145,35%,70%),0_3px_12px_rgba(45,100,70,0.08)]",
          "[&>svg]:text-[hsl(145,55%,38%)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
          // ═══════════════════════════════════════════════════════════
          // DARK MODE: Obsidian Aurora - Emerald Success Alert
          // ═══════════════════════════════════════════════════════════
          "dark:bg-gradient-to-r dark:from-[rgba(16,185,129,0.08)] dark:via-[rgba(16,185,129,0.06)] dark:to-[rgba(16,185,129,0.08)]",
          "dark:backdrop-blur-[40px]",
          "dark:border dark:border-emerald-500/30",
          "dark:shadow-[0_0_30px_-10px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]",
          "dark:text-emerald-200 dark:[&>svg]:text-emerald-400",
          "dark:[text-shadow:none]"
        ),
        // Light: Copper foil info | Dark: Cyan aurora glow
        info: cn(
          // Light: Premium copper with certificate border
          "bg-gradient-to-b from-[hsl(28,45%,96%)] to-[hsl(25,40%,93%)]",
          "text-[hsl(25,55%,26%)]",
          "border-2 border-[hsl(25,65%,55%)]",
          "shadow-[inset_0_0_0_1px_hsl(28,45%,96%),inset_0_0_0_3px_hsl(25,50%,70%),0_3px_12px_rgba(166,100,50,0.1)]",
          "[&>svg]:text-[hsl(25,70%,45%)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
          // ═══════════════════════════════════════════════════════════
          // DARK MODE: Obsidian Aurora - Cyan Info Alert
          // ═══════════════════════════════════════════════════════════
          "dark:bg-gradient-to-r dark:from-[rgba(34,211,238,0.08)] dark:via-[rgba(34,211,238,0.06)] dark:to-[rgba(34,211,238,0.08)]",
          "dark:backdrop-blur-[40px]",
          "dark:border dark:border-cyan-500/30",
          "dark:shadow-[0_0_30px_-10px_rgba(34,211,238,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]",
          "dark:text-cyan-200 dark:[&>svg]:text-cyan-400",
          "dark:[text-shadow:none]"
        ),
        // Aurora variant - special copper accent (light) / indigo glow (dark)
        aurora: cn(
          // Light: Premium copper with subtle shimmer
          "bg-gradient-to-b from-[hsl(30,50%,96%)] to-[hsl(28,45%,93%)]",
          "text-[hsl(25,55%,26%)]",
          "border-2 border-[hsl(25,70%,52%)]",
          "shadow-[inset_0_0_0_1px_hsl(30,50%,96%),inset_0_0_0_3px_hsl(25,55%,68%),0_3px_12px_rgba(166,100,50,0.12)]",
          "[&>svg]:text-[hsl(25,75%,48%)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
          // ═══════════════════════════════════════════════════════════
          // DARK MODE: Obsidian Aurora - Violet Aurora Alert
          // ═══════════════════════════════════════════════════════════
          "dark:bg-gradient-to-r dark:from-[rgba(139,92,246,0.08)] dark:via-[rgba(139,92,246,0.06)] dark:to-[rgba(139,92,246,0.08)]",
          "dark:backdrop-blur-[40px]",
          "dark:border dark:border-violet-500/30",
          "dark:shadow-[0_0_30px_-10px_rgba(139,92,246,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]",
          "dark:text-violet-200 dark:[&>svg]:text-violet-400",
          "dark:[text-shadow:none]"
        ),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props} />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      "mb-1 font-semibold leading-none tracking-tight",
      // Light mode: Slightly emphasized with subtle emboss
      "text-inherit",
      // Dark mode: Slightly brighter for contrast
      "dark:text-white/90",
      className
    )}
    {...props} />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-sm [&_p]:leading-relaxed",
      // Light mode: Inherit color with softer contrast
      "text-inherit opacity-90",
      // Dark mode: Inherit from parent alert variant for proper coloring
      "dark:opacity-100 dark:text-inherit",
      className
    )}
    {...props} />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription, alertVariants }
