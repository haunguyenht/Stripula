import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils.js"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Base styles
      "inline-flex h-10 items-center justify-center p-1",
      // Light mode: OrangeAI warm tabs container
      "rounded-[10px] bg-[rgb(245,245,245)]",
      "text-[rgb(90,74,69)]",
      // Dark mode: OPUX glass tabs
      "dark:rounded-lg dark:bg-white/5 dark:border dark:border-white/10",
      "dark:text-white/60",
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
      "inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
      "disabled:pointer-events-none disabled:opacity-50",
      // Light mode: OrangeAI warm tab trigger
      "rounded-[8px]",
      "data-[state=active]:bg-white data-[state=active]:text-[rgb(37,27,24)]",
      "data-[state=active]:shadow-[0_1px_3px_rgba(37,27,24,0.08)]",
      "hover:text-[rgb(37,27,24)]",
      // Dark mode: OPUX glass tab trigger
      "dark:rounded-md",
      "dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white dark:data-[state=active]:shadow-none",
      "dark:hover:bg-white/5 dark:hover:text-white/90",
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
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
