import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils.js"

/**
 * Select Component - Liquid Aurora Design System
 * 
 * Dark mode features:
 * - Trigger: Liquid glass with aurora focus ring
 * - Content: Liquid glass dropdown with specular highlight
 * - Items: Aurora indigo hover glow
 * - Smooth animations with backdrop blur
 */

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        // Base styles
        "flex h-9 w-full items-center justify-between whitespace-nowrap px-3 py-2 text-sm transition-all duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        // Light mode: Vintage Banking - cream parchment select
        "rounded-lg bg-[hsl(40,50%,97%)] border border-[hsl(30,30%,78%)]",
        "text-[hsl(25,35%,20%)] placeholder:text-[hsl(25,15%,55%)]",
        "shadow-[inset_0_1px_2px_rgba(101,67,33,0.06)]",
        "focus:outline-none focus:border-[hsl(25,70%,50%)] focus:ring-2 focus:ring-[hsl(25,70%,50%)]/15",
        // Dark mode: Liquid glass trigger with aurora focus
        "dark:rounded-lg",
        "dark:bg-[hsl(0_0%_100%/0.03)]",
        "dark:backdrop-blur-[40px] dark:backdrop-saturate-[180%]",
        "dark:border dark:border-[hsl(0_0%_100%/0.08)]",
        "dark:text-white",
        "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        // Aurora focus state
        "dark:focus:outline-none",
        "dark:focus:border-[hsl(250,90%,65%)/0.5]",
        "dark:focus:ring-2 dark:focus:ring-[hsl(250,90%,65%)/0.2]",
        "dark:focus:shadow-[0_0_16px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]",
        // Hover state
        "dark:hover:border-[hsl(0_0%_100%/0.12)]",
        "dark:hover:bg-[hsl(0_0%_100%/0.04)]",
        // Open state
        "dark:data-[state=open]:border-[hsl(250,90%,65%)/0.5]",
        "dark:data-[state=open]:shadow-[0_0_20px_rgba(139,92,246,0.25)]",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-60 transition-transform duration-200 dark:opacity-70 [[data-state=open]_&]:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
)
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef(
  ({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        "dark:text-white/60",
        className
      )}
      {...props}
    >
      <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  )
)
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef(
  ({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        "dark:text-white/60",
        className
      )}
      {...props}
    >
      <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  )
)
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef(
  ({ className, children, position = "popper", ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          // Base styles
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          // Light mode: Vintage Banking - cream paper dropdown
          "rounded-lg bg-gradient-to-b from-[hsl(40,50%,97%)] to-[hsl(38,45%,95%)] border border-[hsl(30,35%,75%)]/50",
          "text-[hsl(25,35%,20%)]",
          "shadow-[0_8px_32px_rgba(101,67,33,0.12)]",
          // Dark mode: Obsidian Aurora glass dropdown
          "dark:rounded-xl",
          "dark:bg-[rgb(15,18,28)]",
          "dark:from-transparent dark:to-transparent",
          "dark:backdrop-blur-[60px] dark:backdrop-saturate-[180%]",
          "dark:border dark:border-white/[0.1]",
          "dark:text-white",
          "dark:shadow-[0_16px_64px_rgba(0,0,0,0.6),0_0_40px_-10px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.08)]",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
)
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-medium text-muted-foreground",
      "dark:text-white/50",
      className
    )}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        // Base styles
        "relative flex w-full cursor-pointer select-none items-center py-1.5 pl-2 pr-8 text-sm outline-none transition-all duration-150",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // Light mode: Vintage Banking - warm hover item
        "rounded-lg focus:bg-[hsl(38,40%,92%)] focus:text-[hsl(25,35%,20%)]",
        // Dark mode: Aurora hover with glass effect
        "dark:rounded-lg",
        "dark:text-white/90",
        "dark:focus:bg-violet-500/20",
        "dark:focus:text-white",
        "dark:focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
        // Highlighted state (keyboard navigation)
        "dark:data-[highlighted]:bg-violet-500/15",
        "dark:data-[highlighted]:text-white",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4 text-primary dark:text-[hsl(250,90%,70%)] dark:drop-shadow-[0_0_4px_rgba(139,92,246,0.5)]" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
)
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn(
      "-mx-1 my-1 h-px bg-border",
      "dark:bg-white/10",
      className
    )}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
