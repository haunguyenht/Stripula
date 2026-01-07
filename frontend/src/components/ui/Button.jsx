import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils.js";

/**
 * Button Component - Dual Theme Design System
 * 
 * LIGHT MODE: Vintage Banking / Copper Foil
 * - Letterpress shadow effects (embossed text appearance)
 * - Copper foil gradients with metallic shimmer
 * - Inset shadow for pressed/debossed appearance
 * - Paper texture integration
 * 
 * DARK MODE: Liquid Aurora
 * - Indigo aurora glow with neon pulse on hover
 * - Liquid glass with specular highlights
 * - Consistent blur(40px) and saturation(180%)
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        // Default/Primary - Vintage copper (light) / PREMIUM Aurora indigo neon (dark)
        default: [
          // Light mode: Copper foil gradient with letterpress effect
          "bg-gradient-to-b from-[hsl(25,70%,52%)] via-[hsl(28,72%,48%)] to-[hsl(22,68%,38%)]",
          "text-[hsl(42,60%,95%)] font-semibold tracking-wide",
          "border border-[hsl(22,60%,35%)]",
          // Embossed text shadow + outer glow + inner highlight
          "shadow-[0_4px_16px_rgba(166,100,50,0.35),0_1px_2px_rgba(139,69,19,0.3),inset_0_1px_0_rgba(255,220,180,0.4),inset_0_-1px_0_rgba(100,50,20,0.2)]",
          "[text-shadow:0_1px_0_rgba(100,50,20,0.3),0_-1px_0_rgba(255,200,150,0.2)]",
          // Hover: Shimmer effect
          "hover:from-[hsl(25,72%,56%)] hover:via-[hsl(30,75%,52%)] hover:to-[hsl(22,70%,42%)]",
          "hover:shadow-[0_6px_24px_rgba(166,100,50,0.45),0_2px_4px_rgba(139,69,19,0.25),inset_0_1px_0_rgba(255,220,180,0.5)]",
          "hover:translate-y-[-1px]",
          // Active: Pressed/debossed
          "active:translate-y-[1px] active:shadow-[inset_0_2px_4px_rgba(100,50,20,0.3),0_1px_2px_rgba(166,100,50,0.2)]",
          // Dark mode: PREMIUM Aurora indigo with enhanced neon glow
          "dark:bg-gradient-to-b dark:from-[hsl(252,95%,68%)] dark:to-[hsl(252,90%,58%)]",
          "dark:text-white dark:border-none",
          "dark:shadow-[0_0_25px_rgba(139,92,246,0.5),0_0_50px_rgba(34,211,238,0.2),0_0_80px_rgba(139,92,246,0.15),inset_0_1px_0_rgba(255,255,255,0.25)]",
          "dark:hover:shadow-[0_0_35px_rgba(139,92,246,0.65),0_0_70px_rgba(34,211,238,0.3),0_0_100px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.3)]",
          "dark:hover:translate-y-[-2px]",
          "dark:active:translate-y-[1px] dark:active:shadow-[0_0_15px_rgba(139,92,246,0.35)]",
          "dark:[text-shadow:none]",
        ].join(" "),

        // Destructive - Burgundy ink (light) / Aurora rose neon (dark)
        destructive: [
          // Light mode: Vintage burgundy with wax seal effect
          "bg-gradient-to-b from-[hsl(355,50%,48%)] via-[hsl(355,48%,42%)] to-[hsl(355,45%,35%)]",
          "text-[hsl(40,60%,95%)] font-semibold tracking-wide",
          "border border-[hsl(355,40%,30%)]",
          "shadow-[0_4px_14px_rgba(140,50,60,0.3),0_1px_2px_rgba(100,30,40,0.25),inset_0_1px_0_rgba(255,180,180,0.3)]",
          "[text-shadow:0_1px_0_rgba(100,30,40,0.3)]",
          "hover:from-[hsl(355,52%,52%)] hover:via-[hsl(355,50%,46%)] hover:to-[hsl(355,48%,38%)]",
          "hover:shadow-[0_6px_20px_rgba(140,50,60,0.4),inset_0_1px_0_rgba(255,200,200,0.35)]",
          "hover:translate-y-[-1px]",
          "active:translate-y-[1px] active:shadow-[inset_0_2px_4px_rgba(100,30,40,0.3)]",
          // Dark mode: Rose neon with pink aurora
          "dark:bg-gradient-to-b dark:from-rose-500 dark:to-rose-600",
          "dark:text-white dark:border-none",
          "dark:shadow-[0_0_18px_rgba(244,63,94,0.4),0_0_36px_rgba(236,72,153,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "dark:hover:shadow-[0_0_24px_rgba(244,63,94,0.55),0_0_48px_rgba(236,72,153,0.3)]",
          "dark:hover:translate-y-[-1px]",
          "dark:[text-shadow:none]",
        ].join(" "),

        // Outline - Engraved border (light) / PREMIUM Liquid glass (dark)
        outline: [
          // Light mode: Double-line engraved border like vintage certificates
          "border-2 border-[hsl(25,55%,55%)] bg-[hsl(40,50%,97%)] text-[hsl(25,40%,30%)]",
          "shadow-[inset_0_0_0_1px_hsl(40,50%,97%),inset_0_0_0_3px_hsl(25,45%,65%),0_2px_8px_rgba(101,67,33,0.08)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
          "hover:bg-[hsl(38,48%,94%)] hover:border-[hsl(25,60%,50%)]",
          "hover:shadow-[inset_0_0_0_1px_hsl(38,48%,94%),inset_0_0_0_3px_hsl(25,50%,60%),0_4px_12px_rgba(101,67,33,0.12)]",
          "active:shadow-[inset_0_2px_4px_rgba(101,67,33,0.15)]",
          // Dark mode: PREMIUM Liquid glass with aurora rim
          "dark:bg-[hsl(0_0%_100%/0.035)] dark:text-white",
          "dark:backdrop-blur-[60px] dark:backdrop-saturate-[200%]",
          "dark:border dark:border-[hsl(0_0%_100%/0.12)]",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_24px_rgba(0,0,0,0.25)]",
          "dark:hover:border-[hsl(252,95%,68%)/0.5]",
          "dark:hover:shadow-[0_0_25px_rgba(139,92,246,0.3),inset_0_1px_0_rgba(255,255,255,0.14)]",
          "dark:hover:bg-[hsl(0_0%_100%/0.05)]",
          "dark:[text-shadow:none]",
        ].join(" "),

        // Secondary - Aged parchment (light) / PREMIUM Liquid glass (dark)
        secondary: [
          // Light mode: Aged parchment with subtle texture
          "bg-gradient-to-b from-[hsl(40,45%,94%)] to-[hsl(38,35%,90%)]",
          "text-[hsl(25,40%,28%)] border border-[hsl(30,30%,78%)]",
          "shadow-[0_2px_8px_rgba(101,67,33,0.08),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(101,67,33,0.05)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
          "hover:from-[hsl(38,48%,92%)] hover:to-[hsl(36,38%,87%)]",
          "hover:border-[hsl(30,35%,70%)]",
          "active:shadow-[inset_0_2px_4px_rgba(101,67,33,0.1)]",
          // Dark mode: PREMIUM Enhanced liquid glass (bg-none resets light gradient)
          "dark:bg-none dark:bg-[hsl(0_0%_100%/0.05)] dark:text-white",
          "dark:backdrop-blur-[60px] dark:backdrop-saturate-[200%]",
          "dark:border dark:border-[hsl(0_0%_100%/0.1)]",
          "dark:shadow-[0_10px_36px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.1)]",
          "dark:hover:bg-[hsl(0_0%_100%/0.07)]",
          "dark:hover:border-[hsl(0_0%_100%/0.18)]",
          "dark:hover:shadow-[0_14px_48px_rgba(0,0,0,0.45),0_0_40px_-15px_rgba(139,92,246,0.15),inset_0_1px_0_rgba(255,255,255,0.14)]",
          "dark:[text-shadow:none]",
        ].join(" "),

        // Ghost - Subtle vintage hover (light) / PREMIUM Aurora tint (dark)
        ghost: [
          // Light mode: Subtle copper tint on hover
          "text-[hsl(25,40%,30%)]",
          "hover:bg-[hsl(38,45%,92%)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.3)]",
          // Dark mode: PREMIUM Aurora tint on hover - NO white backgrounds
          "dark:text-white/85 dark:hover:text-white",
          "dark:hover:bg-violet-500/12",
          "dark:[text-shadow:none]",
        ].join(" "),

        // Link - Copper foil (light) / Aurora indigo (dark)
        link: [
          // Light mode: Copper foil link with subtle underline
          "text-copper-foil bg-clip-text",
          "bg-gradient-to-r from-[hsl(25,70%,45%)] via-[hsl(30,75%,50%)] to-[hsl(22,65%,42%)]",
          "underline-offset-4 hover:underline",
          "hover:from-[hsl(25,75%,42%)] hover:via-[hsl(30,80%,48%)] hover:to-[hsl(22,70%,38%)]",
          // Dark mode: Aurora indigo text with glow on hover
          "dark:text-[hsl(250,90%,70%)] dark:bg-none",
          "dark:hover:text-[hsl(250,95%,75%)]",
          "dark:hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]",
        ].join(" "),

        // Success - Antique green ink (light) / PREMIUM Emerald aurora (dark)
        success: [
          // Light mode: Vintage green ink with embossed effect
          "bg-gradient-to-b from-[hsl(145,40%,92%)] via-[hsl(145,38%,88%)] to-[hsl(145,35%,85%)]",
          "text-[hsl(145,55%,28%)] font-medium",
          "border border-[hsl(145,35%,70%)]",
          "shadow-[0_2px_8px_rgba(45,100,70,0.1),inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(45,100,70,0.08)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
          "hover:from-[hsl(145,42%,90%)] hover:to-[hsl(145,38%,82%)]",
          "hover:border-[hsl(145,40%,60%)]",
          "active:shadow-[inset_0_2px_4px_rgba(45,100,70,0.15)]",
          // Dark mode: PREMIUM Liquid glass with emerald neon accent (bg-none resets light gradient)
          "dark:bg-none dark:bg-[hsl(0_0%_100%/0.04)]",
          "dark:backdrop-blur-[60px] dark:backdrop-saturate-[200%]",
          "dark:border dark:border-emerald-500/40",
          "dark:text-emerald-400",
          "dark:shadow-[0_0_20px_rgba(16,185,129,0.25),0_0_40px_rgba(16,185,129,0.1),inset_0_1px_0_rgba(255,255,255,0.08)]",
          "dark:hover:border-emerald-400/60",
          "dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.4),0_0_60px_rgba(34,211,238,0.15),inset_0_1px_0_rgba(255,255,255,0.12)]",
          "dark:[text-shadow:none]",
        ].join(" "),

        // Warning - Brass/gold ink (light) / PREMIUM Amber aurora (dark)
        warning: [
          // Light mode: Vintage brass/gold with embossed effect
          "bg-gradient-to-b from-[hsl(42,55%,92%)] via-[hsl(40,50%,88%)] to-[hsl(38,45%,84%)]",
          "text-[hsl(35,70%,32%)] font-medium",
          "border border-[hsl(38,45%,70%)]",
          "shadow-[0_2px_8px_rgba(140,100,40,0.12),inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(140,100,40,0.08)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
          "hover:from-[hsl(42,58%,90%)] hover:to-[hsl(38,48%,81%)]",
          "hover:border-[hsl(38,50%,60%)]",
          "active:shadow-[inset_0_2px_4px_rgba(140,100,40,0.15)]",
          // Dark mode: PREMIUM Liquid glass with amber neon + pink aurora (bg-none resets light gradient)
          "dark:bg-none dark:bg-[hsl(0_0%_100%/0.04)]",
          "dark:backdrop-blur-[60px] dark:backdrop-saturate-[200%]",
          "dark:border dark:border-amber-500/40",
          "dark:text-amber-400",
          "dark:shadow-[0_0_20px_rgba(251,191,36,0.25),0_0_40px_rgba(251,191,36,0.1),inset_0_1px_0_rgba(255,255,255,0.08)]",
          "dark:hover:border-amber-400/60",
          "dark:hover:shadow-[0_0_30px_rgba(251,191,36,0.4),0_0_60px_rgba(236,72,153,0.15),inset_0_1px_0_rgba(255,255,255,0.12)]",
          "dark:[text-shadow:none]",
        ].join(" "),

        // Contrast - Sepia ink (light) / White (dark)
        contrast: [
          // Light mode: Deep sepia/walnut with letterpress
          "bg-gradient-to-b from-[hsl(25,35%,22%)] via-[hsl(25,30%,18%)] to-[hsl(25,28%,14%)]",
          "text-[hsl(42,50%,92%)] font-semibold tracking-wide",
          "border border-[hsl(25,25%,10%)]",
          "shadow-[0_4px_16px_rgba(40,30,20,0.35),inset_0_1px_0_rgba(100,80,60,0.2)]",
          "[text-shadow:0_1px_0_rgba(30,20,10,0.4),0_-1px_0_rgba(100,80,60,0.15)]",
          "hover:from-[hsl(25,33%,26%)] hover:via-[hsl(25,28%,22%)] hover:to-[hsl(25,26%,18%)]",
          "hover:translate-y-[-1px]",
          "active:translate-y-[1px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
          // Dark mode: Bright white with aurora shadow (bg-none resets light gradient)
          "dark:bg-none dark:bg-white dark:text-[hsl(220,18%,7%)]",
          "dark:shadow-[0_0_20px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.3)]",
          "dark:hover:shadow-[0_0_28px_rgba(255,255,255,0.2),0_6px_24px_rgba(0,0,0,0.4)]",
          "dark:hover:translate-y-[-1px]",
          "dark:[text-shadow:none]",
        ].join(" "),

        // Glass - Frosted parchment (light) / PREMIUM Liquid glass (dark)
        glass: [
          // Light mode: Frosted vellum with subtle grain
          "bg-gradient-to-b from-[hsl(40,50%,97%)]/90 to-[hsl(38,45%,95%)]/85",
          "backdrop-blur-xl border border-[hsl(30,30%,75%)]/60",
          "text-[hsl(25,40%,28%)]",
          "shadow-[0_4px_16px_rgba(101,67,33,0.08),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(101,67,33,0.05)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
          "hover:from-[hsl(40,52%,96%)]/95 hover:to-[hsl(38,48%,94%)]/90",
          "hover:border-[hsl(30,35%,68%)]",
          // Dark mode: PREMIUM Pure liquid glass (bg-none resets light gradient)
          "dark:bg-none dark:bg-[hsl(0_0%_100%/0.04)] dark:text-white",
          "dark:backdrop-blur-[80px] dark:backdrop-saturate-[220%]",
          "dark:border dark:border-[hsl(0_0%_100%/0.12)]",
          "dark:shadow-[0_12px_40px_rgba(0,0,0,0.45),0_0_50px_-20px_rgba(139,92,246,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]",
          "dark:hover:bg-[hsl(0_0%_100%/0.06)]",
          "dark:hover:border-[hsl(0_0%_100%/0.18)]",
          "dark:hover:shadow-[0_16px_56px_rgba(0,0,0,0.55),0_0_70px_-20px_rgba(139,92,246,0.22),inset_0_1px_0_rgba(255,255,255,0.14)]",
          "dark:[text-shadow:none]",
        ].join(" "),

        // Black - Deep walnut (light) / PREMIUM Cosmic black (dark)
        black: [
          // Light mode: Deep walnut with premium feel
          "bg-gradient-to-b from-[hsl(25,35%,16%)] via-[hsl(25,30%,12%)] to-[hsl(25,25%,8%)]",
          "text-[hsl(42,55%,94%)] font-semibold",
          "border border-[hsl(25,20%,6%)]",
          "shadow-[0_6px_24px_rgba(30,20,10,0.4),inset_0_1px_0_rgba(80,60,40,0.15)]",
          "[text-shadow:0_1px_0_rgba(20,15,10,0.5)]",
          "hover:from-[hsl(25,33%,20%)] hover:via-[hsl(25,28%,16%)] hover:to-[hsl(25,23%,12%)]",
          "hover:translate-y-[-1px]",
          "active:translate-y-[1px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]",
          // Dark mode: PREMIUM Pure black with aurora edge glow
          "dark:bg-[hsl(222,20%,4%)] dark:text-white",
          "dark:border dark:border-[hsl(0_0%_100%/0.1)]",
          "dark:shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_12px_40px_rgba(0,0,0,0.65),0_0_60px_-20px_rgba(139,92,246,0.1)]",
          "dark:hover:border-[hsl(252,95%,68%)/0.25]",
          "dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.2),0_16px_56px_rgba(0,0,0,0.75)]",
          "dark:hover:translate-y-[-2px]",
          "dark:[text-shadow:none]",
        ].join(" "),

        // Aurora - Full aurora gradient button / PREMIUM enhanced
        aurora: [
          // Light mode: Subtle aurora tint
          "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
          "text-white font-semibold",
          "shadow-[0_4px_16px_rgba(139,92,246,0.3)]",
          "hover:shadow-[0_6px_24px_rgba(139,92,246,0.4)]",
          "active:translate-y-[1px]",
          // Dark mode: PREMIUM Full neon aurora with enhanced animated glow
          "dark:bg-gradient-to-r dark:from-[hsl(252,95%,68%)] dark:via-[hsl(282,95%,68%)] dark:to-[hsl(322,95%,68%)]",
          "dark:text-white",
          "dark:shadow-[0_0_30px_rgba(139,92,246,0.6),0_0_60px_rgba(236,72,153,0.35),0_0_90px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.25)]",
          "dark:hover:shadow-[0_0_40px_rgba(139,92,246,0.75),0_0_80px_rgba(236,72,153,0.5),0_0_120px_rgba(139,92,246,0.3),inset_0_1px_0_rgba(255,255,255,0.3)]",
          "dark:hover:translate-y-[-2px]",
        ].join(" "),

        // Cyan - Electric cyan neon / PREMIUM enhanced
        cyan: [
          // Light mode: Cyan gradient
          "bg-gradient-to-b from-cyan-500 to-cyan-600",
          "text-white font-semibold",
          "shadow-[0_2px_8px_rgba(6,182,212,0.3)]",
          "hover:from-cyan-400 hover:to-cyan-500",
          "active:translate-y-[1px]",
          // Dark mode: PREMIUM Electric cyan neon
          "dark:bg-gradient-to-b dark:from-cyan-400 dark:to-cyan-500",
          "dark:text-white",
          "dark:shadow-[0_0_25px_rgba(34,211,238,0.6),0_0_50px_rgba(139,92,246,0.25),0_0_80px_rgba(34,211,238,0.15),inset_0_1px_0_rgba(255,255,255,0.25)]",
          "dark:hover:shadow-[0_0_35px_rgba(34,211,238,0.75),0_0_70px_rgba(139,92,246,0.35),0_0_100px_rgba(34,211,238,0.2)]",
          "dark:hover:translate-y-[-2px]",
        ].join(" "),
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 rounded-[10px] px-4 text-xs",
        lg: "h-12 rounded-[14px] px-8 py-4",
        icon: "h-10 w-10 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
