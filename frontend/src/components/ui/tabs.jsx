import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils.js"

/**
 * Tabs Component - Dual Theme Design System
 * 
 * LIGHT MODE: Vintage Banking
 * - List: Aged parchment with decorative border
 * - Trigger: Copper foil active state with embossed effect
 * - Smooth transitions with vintage feel
 * 
 * DARK MODE: Liquid Aurora
 * - List: PREMIUM Liquid glass container with aurora tint
 * - Trigger: Aurora indigo glow on active state with neon pulse
 * - Active indicator: Multi-layer aurora glow effect
 */

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Base styles
      "inline-flex h-10 items-center justify-center p-1",
      // Light mode: Vintage Banking - aged parchment container
      "rounded-xl bg-gradient-to-b from-[hsl(38,35%,93%)] to-[hsl(38,30%,90%)]",
      "text-[hsl(25,35%,35%)]",
      "border border-[hsl(30,28%,80%)]",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(101,67,33,0.05),0_2px_6px_rgba(101,67,33,0.08)]",
      // Dark mode: PREMIUM Liquid glass container with aurora tint
      "dark:rounded-xl",
      "dark:bg-none dark:bg-[rgba(15,18,25,0.8)]",
      "dark:backdrop-blur-[60px] dark:backdrop-saturate-[200%]",
      "dark:border dark:border-[hsl(0_0%_100%/0.1)]",
      "dark:text-white/60",
      "dark:shadow-[0_0_0_1px_rgba(139,92,246,0.08),inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.3)]",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base styles
      "inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(25,75%,45%)]/20",
      "disabled:pointer-events-none disabled:opacity-50",
      // Light mode: Vintage Banking - copper foil active state
      "rounded-lg",
      "text-[hsl(25,35%,40%)]",
      "[text-shadow:0_1px_0_rgba(255,255,255,0.3)] dark:[text-shadow:none]",
      "hover:text-[hsl(25,70%,40%)] hover:bg-[hsl(38,40%,95%)]",
      "data-[state=active]:bg-gradient-to-b data-[state=active]:from-[hsl(40,50%,98%)] data-[state=active]:to-[hsl(38,45%,96%)]",
      "data-[state=active]:text-[hsl(25,55%,35%)]",
      "data-[state=active]:shadow-[0_1px_3px_rgba(101,67,33,0.12),inset_0_1px_0_rgba(255,255,255,0.8)]",
      "data-[state=active]:border data-[state=active]:border-[hsl(30,30%,78%)]",
      // Dark mode: PREMIUM Aurora active with enhanced neon glow
      "dark:text-white/60",
      "dark:hover:bg-white/[0.08] dark:hover:text-white/90",
      "dark:focus-visible:ring-violet-500/30",
      "dark:data-[state=active]:bg-none dark:data-[state=active]:bg-gradient-to-b dark:data-[state=active]:from-[rgba(139,92,246,0.25)] dark:data-[state=active]:to-[rgba(139,92,246,0.18)]",
      "dark:data-[state=active]:text-white",
      "dark:data-[state=active]:border-transparent",
      "dark:data-[state=active]:shadow-[0_0_20px_rgba(139,92,246,0.4),0_0_40px_-10px_rgba(34,211,238,0.2),inset_0_1px_0_rgba(255,255,255,0.12)]",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

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
