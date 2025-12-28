import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils.js";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Default - OrangeAI gradient button (light) / OPUX terracotta (dark)
        default: [
          // Light mode: Clean gradient button with minimal shadow
          "bg-gradient-to-b from-[rgb(255,64,23)] to-[rgb(220,50,15)]",
          "text-white font-semibold",
          "shadow-sm",
          "hover:from-[rgb(255,80,40)] hover:to-[rgb(235,60,25)]",
          "hover:shadow-md",
          "active:translate-y-[1px] active:shadow-sm",
          // Dark mode: OPUX terracotta button with subtle shadow
          "dark:from-[#AB726F] dark:to-[#9d5e5b] dark:border-none",
          "dark:hover:from-[#b4817e] dark:hover:to-[#a86b68]",
          "dark:shadow-md",
          "dark:hover:shadow-lg",
        ].join(" "),

        // Destructive - red accent (matches default button style)
        destructive: [
          // Light mode: Clean red gradient with minimal shadow
          "bg-gradient-to-b from-[rgb(239,68,68)] to-[rgb(200,45,45)]",
          "text-white font-semibold",
          "shadow-sm",
          "hover:from-[rgb(248,80,80)] hover:to-[rgb(220,55,55)]",
          "hover:shadow-md",
          "active:translate-y-[1px] active:shadow-sm",
          // Dark mode: Solid red button (matches default terracotta style)
          "dark:from-[#dc2626] dark:to-[#b91c1c] dark:border-none",
          "dark:hover:from-[#ef4444] dark:hover:to-[#dc2626]",
          "dark:shadow-md",
          "dark:hover:shadow-lg",
        ].join(" "),

        // Outline - OrangeAI outline (light) / OPUX glass outline (dark)
        outline: [
          // Light mode: OrangeAI warm outline
          "border border-[rgb(237,234,233)] bg-white text-[rgb(37,27,24)]",
          "hover:bg-[rgb(248,247,247)] hover:border-[rgb(220,215,213)]",
          "shadow-[0_1px_2px_rgba(37,27,24,0.04)]",
          // Dark mode: OPUX glass outline
          "dark:bg-transparent dark:text-white",
          "dark:[background:linear-gradient(135deg,#33333340,#2e2e2e35)]",
          "dark:[backdrop-filter:blur(12px)_saturate(150%)]",
          "dark:border-[hsl(0_0%_100%/0.2)]",
          "dark:hover:border-[hsl(0_0%_100%/0.3)]",
          "dark:hover:[box-shadow:0_8px_32px_#00000060]",
        ].join(" "),

        // Secondary - OrangeAI secondary (light) / OPUX glass (dark)
        secondary: [
          // Light mode: OrangeAI warm secondary
          "bg-[rgb(248,247,247)] text-[rgb(37,27,24)] border border-[rgb(237,234,233)]",
          "hover:bg-[rgb(245,245,245)] hover:border-[rgb(220,215,213)]",
          // Dark mode: OPUX glass
          "dark:bg-transparent dark:text-white",
          "dark:[background:linear-gradient(135deg,#33333355,#2e2e2e50)]",
          "dark:[backdrop-filter:blur(12px)_saturate(180%)]",
          "dark:border-[hsl(0_0%_100%/0.15)]",
          "dark:hover:border-[hsl(0_0%_100%/0.25)]",
          "dark:hover:[box-shadow:0_8px_32px_#00000060]",
        ].join(" "),

        // Ghost - minimal hover effect
        ghost: [
          // Light mode: OrangeAI ghost
          "text-[rgb(37,27,24)] hover:bg-[rgb(248,247,247)]",
          // Dark mode: OPUX subtle glass on hover
          "dark:text-white/80 dark:hover:text-white",
          "dark:hover:bg-white/10",
          "dark:hover:border dark:hover:border-white/10",
        ].join(" "),

        // Link - text only
        link: [
          // Light mode: OrangeAI link
          "text-[rgb(255,64,23)] underline-offset-4 hover:underline",
          // Dark mode: terracotta text
          "dark:text-[#AB726F] dark:hover:text-[#b4817e]",
        ].join(" "),

        // Success - green accent
        success: [
          // Light mode: Soft emerald with subtle gradient
          "bg-gradient-to-b from-emerald-50 to-emerald-100/80",
          "text-emerald-700 font-medium",
          "border border-emerald-200/60",
          "shadow-sm shadow-emerald-500/5",
          "hover:from-emerald-100 hover:to-emerald-150/80",
          "hover:border-emerald-300/60",
          "hover:shadow-md hover:shadow-emerald-500/10",
          "active:translate-y-[1px] active:shadow-sm",
          // Dark mode: OPUX glass with emerald accent
          "dark:from-transparent dark:to-transparent",
          "dark:[background:linear-gradient(135deg,#33333365,#2e2e2e60)]",
          "dark:[backdrop-filter:blur(12px)_saturate(180%)]",
          "dark:border dark:border-emerald-500/30",
          "dark:text-emerald-400",
          "dark:shadow-[0_8px_32px_#0000005e,inset_0_1px_0_#ffffff0d]",
          "dark:hover:border-emerald-500/50",
          "dark:hover:shadow-[0_8px_32px_#00000070,inset_0_1px_0_#ffffff14]",
        ].join(" "),

        // Warning - amber accent
        warning: [
          // Light mode: Soft amber with subtle gradient
          "bg-gradient-to-b from-amber-50 to-amber-100/80",
          "text-amber-700 font-medium",
          "border border-amber-200/60",
          "shadow-sm shadow-amber-500/5",
          "hover:from-amber-100 hover:to-amber-150/80",
          "hover:border-amber-300/60",
          "hover:shadow-md hover:shadow-amber-500/10",
          "active:translate-y-[1px] active:shadow-sm",
          // Dark mode: OPUX glass with amber
          "dark:from-transparent dark:to-transparent",
          "dark:[background:linear-gradient(135deg,#33333365,#2e2e2e60)]",
          "dark:[backdrop-filter:blur(12px)_saturate(180%)]",
          "dark:border dark:border-amber-500/30",
          "dark:text-amber-400",
          "dark:shadow-[0_8px_32px_#0000005e,inset_0_1px_0_#ffffff0d]",
          "dark:hover:border-amber-500/50",
          "dark:hover:shadow-[0_8px_32px_#00000070,inset_0_1px_0_#ffffff14]",
        ].join(" "),

        // Contrast - OrangeAI dark button (light) / white button (dark)
        contrast: [
          // Light mode: OrangeAI dark gradient button
          "bg-gradient-to-b from-[rgb(22,22,18)] to-[rgb(43,44,46)]",
          "text-white shadow-[0px_2px_6px_rgba(0,0,0,0.2)]",
          "hover:from-[rgb(35,35,30)] hover:to-[rgb(55,56,58)]",
          // Dark mode: white button
          "dark:from-[#f5f5f5] dark:to-[#f5f5f5] dark:text-[#000]",
          "dark:shadow-[#9e9e9eb0_0_0.706592px_0.706592px_-0.583333px,#9e9e9ead_0_1.80656px_1.80656px_-1.16667px,#fff_0_3px_1px_inset]",
          "dark:hover:opacity-95",
        ].join(" "),

        // Glass - OrangeAI glass (light) / OPUX glass (dark)
        glass: [
          // Light mode: OrangeAI glass button
          "bg-white/80 backdrop-blur-xl border border-[rgb(237,234,233)] text-[rgb(37,27,24)]",
          "hover:bg-white/90 hover:border-[rgb(220,215,213)]",
          "shadow-[0_1px_3px_rgba(37,27,24,0.04),0_4px_12px_rgba(37,27,24,0.06)]",
          // Dark mode: exact OPUX glass
          "dark:bg-transparent dark:text-white",
          "dark:[background:linear-gradient(135deg,#33333359,#2e2e2e52)]",
          "dark:[backdrop-filter:blur(16px)_saturate(180%)]",
          "dark:border-[0.5px] dark:border-[hsl(0_0%_100%/0.2)]",
          "dark:shadow-[0_8px_32px_#0000005e,inset_0_1px_0_#ffffff0d]",
          "dark:hover:border-[hsl(0_0%_100%/0.28)]",
          "dark:hover:shadow-[0_8px_32px_#00000070,inset_0_1px_0_#ffffff14]",
        ].join(" "),

        // Black - OrangeAI dark button (light) / OPUX black (dark)
        black: [
          // Light mode: OrangeAI dark gradient button
          "bg-gradient-to-b from-[rgb(22,22,18)] to-[rgb(43,44,46)]",
          "text-white shadow-[0px_2px_6px_rgba(0,0,0,0.2)]",
          "hover:from-[rgb(35,35,30)] hover:to-[rgb(55,56,58)]",
          "active:translate-y-[1px]",
          // Dark mode: OPUX black button
          "dark:from-[#000] dark:to-[#000]",
          "dark:shadow-[#3d3d3db8_0_0.602187px_1.08394px_-1.25px,#3d3d3da3_0_2.28853px_4.11936px_-2.5px,#3d3d3d40_0_10px_18px_-3.75px,#00000059_0_0.706592px_0.706592px_-0.583333px,#00000057_0_1.80656px_1.80656px_-1.16667px,#00000054_0_3.62176px_3.62176px_-1.75px,#0000004d_0_6.8656px_6.8656px_-2.33333px,#00000042_0_13.6468px_13.6468px_-2.91667px,#00000026_0_30px_30px_-3.5px]",
          "dark:hover:translate-y-[-1px] dark:hover:opacity-95",
        ].join(" "),

        // Terracotta - OPUX terracotta button
        terracotta: [
          // Light mode: OrangeAI orange button
          "bg-gradient-to-b from-[rgb(255,64,23)] to-[rgb(220,50,15)]",
          "text-white shadow-[0px_2px_6px_rgba(0,0,0,0.2)]",
          "hover:from-[rgb(255,80,40)] hover:to-[rgb(235,60,25)]",
          // Dark mode: OPUX terracotta button
          "dark:from-[#9d5e5b] dark:to-[#9d5e5b]",
          "dark:shadow-[#9d5e5bb8_0_0.602187px_1.08394px_-1.25px,#9d5e5ba3_0_2.28853px_4.11936px_-2.5px,#9d5e5b40_0_10px_18px_-3.75px,#00000059_0_0.706592px_0.706592px_-0.583333px,#00000057_0_1.80656px_1.80656px_-1.16667px,#00000054_0_3.62176px_3.62176px_-1.75px,#0000004d_0_6.8656px_6.8656px_-2.33333px,#00000042_0_13.6468px_13.6468px_-2.91667px,#00000026_0_30px_30px_-3.5px]",
          "dark:hover:translate-y-[-1px] dark:hover:opacity-95",
        ].join(" "),
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 rounded-[10px] px-4 text-xs",
        lg: "h-12 rounded-[12px] px-8 py-4",
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
