import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils.js"

/**
 * Tabs Component - Liquid Glass Design System
 * 
 * LIGHT MODE: Vintage Parchment
 * - List: Aged parchment with subtle border
 * - Trigger: Cream active state with embossed effect
 * 
 * DARK MODE: Liquid Glass
 * - List: Frosted glass container
 * - Trigger: Aurora glow on active with subtle animation
 */

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Base styles
      "inline-flex h-9 sm:h-10 items-center justify-center p-1 gap-0.5",
      "rounded-xl",
      // Light mode: Vintage parchment style (bg-none resets light gradient)
      "bg-gradient-to-b from-[hsl(38,30%,94%)] to-[hsl(35,25%,90%)]",
      "border border-[hsl(30,25%,78%)]",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(101,67,33,0.08)]",
      // Dark mode: Liquid glass (bg-none resets light gradient)
      "dark:bg-none dark:from-transparent dark:to-transparent",
      "dark:bg-[rgba(255,255,255,0.03)] dark:backdrop-blur-xl",
      "dark:border-[rgba(255,255,255,0.06)]",
      "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.3)]",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        // Base styles
        "relative inline-flex items-center justify-center whitespace-nowrap",
        "px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium tracking-wide",
        "rounded-lg transition-all duration-300 ease-out",
        "focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        // Light mode inactive - very muted
        "[text-shadow:0_1px_0_rgba(255,255,255,0.3)]",
        "opacity-60 hover:opacity-80",
        // Light active state - border and shadow only (bg in CSS)
        "data-[state=active]:opacity-100",
        "data-[state=active]:border data-[state=active]:border-[hsl(30,35%,78%)]",
        "data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(101,67,33,0.12),0_0_0_1px_rgba(180,130,70,0.1)]",
        // Dark mode overrides
        "dark:[text-shadow:none]",
        "dark:opacity-40 dark:hover:opacity-60",
        // Dark active state - border and shadow only (bg in CSS)
        "dark:data-[state=active]:opacity-100",
        "dark:data-[state=active]:border-[rgba(139,92,246,0.3)]",
        "dark:data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_20px_-5px_rgba(139,92,246,0.35),0_0_8px_-2px_rgba(34,211,238,0.15)]",
        // Use custom class for text colors and backgrounds
        "tabs-trigger-text",
        className
      )}
      {...props}
    />
  );
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

// Add global styles for tabs (injected once) - handles colors and backgrounds to avoid tailwind-merge
if (typeof document !== 'undefined') {
  const styleId = 'tabs-trigger-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Light mode text colors */
      .tabs-trigger-text {
        color: hsl(25, 25%, 50%);
        background: transparent;
      }
      .tabs-trigger-text:hover {
        color: hsl(25, 35%, 40%);
        background: hsl(40, 30%, 91%);
      }
      .tabs-trigger-text[data-state="active"] {
        color: hsl(25, 50%, 28%);
        font-weight: 600;
        background: linear-gradient(to bottom, hsl(42, 50%, 98%), hsl(40, 45%, 95%));
      }
      
      /* Dark mode text colors and cyber background */
      .dark .tabs-trigger-text {
        color: rgba(255, 255, 255, 0.35);
        background: transparent;
      }
      .dark .tabs-trigger-text:hover {
        color: rgba(255, 255, 255, 0.55);
        background: rgba(255, 255, 255, 0.03);
      }
      .dark .tabs-trigger-text[data-state="active"] {
        color: rgba(255, 255, 255, 0.95);
        font-weight: 500;
        text-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
        background: 
          linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(34, 211, 238, 0.06) 50%, rgba(139, 92, 246, 0.08) 100%),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(139, 92, 246, 0.03) 2px,
            rgba(139, 92, 246, 0.03) 4px
          );
        background-size: 100% 100%, 100% 100%;
      }
    `;
    document.head.appendChild(style);
  }
}

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 focus-visible:outline-none",
      // Animation for content transition
      "data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1",
      "duration-200",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
