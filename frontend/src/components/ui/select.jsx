import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils.js"

/**
 * Select Component - Apple-style Inset Field
 * 
 * Dark mode features:
 * - Trigger: Darker inset background for contrast
 * - Content: Clean glass dropdown
 * - Items: Subtle white hover states
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
        "flex h-10 w-full items-center justify-between whitespace-nowrap px-3.5 py-2 text-sm transition-all duration-200 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        // Light mode: Vintage Banking - cream parchment select
        "rounded-xl bg-[hsl(40,50%,97%)] border border-[hsl(30,30%,78%)]",
        "text-[hsl(25,35%,20%)] placeholder:text-[hsl(25,15%,55%)]",
        "shadow-[inset_0_1px_2px_rgba(101,67,33,0.06)]",
        "focus:outline-none focus:border-[hsl(25,70%,50%)] focus:ring-2 focus:ring-[hsl(25,70%,50%)]/15",
        // Dark mode: Apple-style inset trigger
        "dark:rounded-xl",
        "dark:bg-[rgba(0,0,0,0.25)]",
        "dark:backdrop-blur-[20px]",
        "dark:border dark:border-[rgba(255,255,255,0.1)]",
        "dark:text-white/95",
        // Inset shadow for depth
        "dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05),0_1px_0_rgba(255,255,255,0.05)]",
        // Clean focus state
        "dark:focus:outline-none",
        "dark:focus:border-[rgba(255,255,255,0.25)]",
        "dark:focus:ring-2 dark:focus:ring-white/15",
        "dark:focus:shadow-[inset_0_2px_6px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_4px_rgba(255,255,255,0.05)]",
        // Hover state
        "dark:hover:border-[rgba(255,255,255,0.15)]",
        "dark:hover:bg-[rgba(0,0,0,0.28)]",
        // Open state
        "dark:data-[state=open]:border-[rgba(255,255,255,0.25)]",
        "dark:data-[state=open]:bg-[rgba(0,0,0,0.3)]",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200 dark:opacity-60 [[data-state=open]_&]:rotate-180" />
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
          // Dark mode: Apple-style glass dropdown
          "dark:rounded-xl",
          "dark:bg-[rgba(20,20,25,0.92)]",
          "dark:from-transparent dark:to-transparent",
          "dark:backdrop-blur-[60px] dark:backdrop-saturate-[180%]",
          "dark:border dark:border-white/[0.15]",
          "dark:text-white/95",
          "dark:shadow-[0_16px_64px_rgba(0,0,0,0.5),0_8px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]",
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
        "relative flex w-full cursor-pointer select-none items-center py-2 pl-3 pr-8 text-sm outline-none transition-all duration-150",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // Light mode: Vintage Banking - warm hover item
        "rounded-lg focus:bg-[hsl(38,40%,92%)] focus:text-[hsl(25,35%,20%)]",
        // Dark mode: Clean white hover
        "dark:rounded-lg",
        "dark:text-white/85",
        "dark:focus:bg-white/10",
        "dark:focus:text-white",
        // Highlighted state (keyboard navigation)
        "dark:data-[highlighted]:bg-white/10",
        "dark:data-[highlighted]:text-white",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4 text-primary dark:text-white/90" />
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
