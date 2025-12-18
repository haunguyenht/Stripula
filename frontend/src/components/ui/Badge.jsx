import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils.js";

const badgeVariants = cva(
  "inline-flex items-center rounded-[6px] border px-2 py-0.5 text-xs font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
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
        approved: [
          // Light mode: OrangeAI approved badge (orange tinted)
          "border-[rgb(255,64,23)]/20 bg-[rgb(255,64,23)]/10 text-[rgb(255,64,23)]",
          // Dark mode: OPUX glass with terracotta accent
          "dark:bg-white/5 dark:border-[0.5px] dark:border-primary/25",
          "dark:text-primary",
        ].join(" "),
        live: [
          // Light mode: OrangeAI live badge (green)
          "border-[rgb(34,197,94)]/20 bg-[rgb(34,197,94)]/10 text-[rgb(22,163,74)]",
          // Dark mode: OPUX glass with green accent
          "dark:bg-emerald-500/10 dark:border-[0.5px] dark:border-emerald-500/30",
          "dark:text-emerald-400",
        ].join(" "),
        dead: [
          // Light mode: OrangeAI dead badge (red)
          "border-[rgb(239,68,68)]/20 bg-[rgb(239,68,68)]/10 text-[rgb(239,68,68)]",
          // Dark mode: OPUX glass with red accent
          "dark:bg-red-500/10 dark:border-[0.5px] dark:border-red-500/30",
          "dark:text-red-400",
        ].join(" "),
        error: [
          // Light mode: OrangeAI error badge (amber)
          "border-[rgb(245,158,11)]/20 bg-[rgb(245,158,11)]/10 text-[rgb(217,119,6)]",
          // Dark mode: OPUX glass with amber accent
          "dark:bg-amber-500/10 dark:border-[0.5px] dark:border-amber-500/30",
          "dark:text-amber-400",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
