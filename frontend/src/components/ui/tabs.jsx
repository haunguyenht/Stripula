import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils.js"

/**
 * Tabs Component - Liquid Aurora Design System
 * 
 * Dark mode features:
 * - List: Liquid glass container with subtle aurora tint
 * - Trigger: Aurora indigo glow on active state
 * - Active indicator: Neon glow effect
 * - Smooth transitions
 */

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Base styles
      "inline-flex h-10 items-center justify-center p-1",
      // Light mode: Vintage Banking
      "rounded-[10px] bg-[hsl(38,30%,92%)]",
      "text-[hsl(25,35%,35%)]",
      "border border-[hsl(30,25%,82%)]",
      // Dark mode: Liquid glass container
      "dark:rounded-xl",
      "dark:bg-[hsl(0_0%_100%/0.04)]",
      "dark:backdrop-blur-[40px] dark:backdrop-saturate-[180%]",
      "dark:border dark:border-[hsl(0_0%_100%/0.08)]",
      "dark:text-white/60",
      "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
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
      // Light mode: Vintage Banking
      "rounded-lg",
      "data-[state=active]:bg-[hsl(38,45%,98%)] data-[state=active]:text-[hsl(25,35%,18%)]",
      "data-[state=active]:shadow-sm data-[state=active]:shadow-[hsl(25,75%,45%)]/10",
      "data-[state=active]:border data-[state=active]:border-[hsl(30,25%,82%)]",
      "hover:text-[hsl(25,75%,45%)]",
      // Dark mode: Aurora active with neon glow - must reset light mode styles
      "dark:text-white/60",
      "dark:hover:bg-white/[0.06] dark:hover:text-white/90",
      "dark:focus-visible:ring-violet-500/30",
      "dark:data-[state=active]:bg-violet-500/20",
      "dark:data-[state=active]:text-white",
      "dark:data-[state=active]:border-transparent",
      "dark:data-[state=active]:shadow-[0_0_16px_rgba(139,92,246,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]",
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
