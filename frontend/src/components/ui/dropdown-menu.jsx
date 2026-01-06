import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils.js"

/**
 * Dropdown Menu Component - Dual Theme Design System
 * 
 * LIGHT MODE: Vintage Banking - Ledger/Menu Card Style
 * - Aged parchment with paper texture
 * - Double-line decorative borders
 * - Copper foil accents on hover
 * - Embossed text shadows
 * 
 * DARK MODE: Liquid Aurora
 * - Glass panel with aurora edge glow
 * - Liquid glass with specular highlights
 */

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef(
  ({ className, inset, children, ...props }, ref) => (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        "flex cursor-default select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none",
        // Light mode: Vintage banking hover
        "text-[hsl(25,35%,25%)]",
        "focus:bg-[hsl(38,30%,92%)] data-[state=open]:bg-[hsl(38,30%,92%)]",
        // Dark mode: Aurora hover
        "dark:text-white/90",
        "dark:focus:bg-[hsl(250,90%,65%)/0.12]",
        "dark:data-[state=open]:bg-[hsl(250,90%,65%)/0.12]",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
    </DropdownMenuPrimitive.SubTrigger>
  )
)
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef(
  ({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-xl border p-1 shadow-lg",
        // Light mode: Vintage banking cream paper
        "bg-[hsl(38,45%,98%)] text-[hsl(25,35%,25%)]",
        "border-[hsl(30,25%,82%)]",
        "shadow-[0_4px_16px_hsla(25,35%,18%,0.12)]",
        // Dark mode: Liquid glass
        "dark:bg-[hsl(220,20%,10%)]/95",
        "dark:backdrop-blur-[60px] dark:backdrop-saturate-[180%]",
        "dark:border-[hsl(0_0%_100%/0.1)]",
        "dark:shadow-[0_0_0_1px_rgba(139,92,246,0.08),0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]",
        // Animations
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  )
)
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef(
  ({ className, sideOffset = 4, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-[100] min-w-[8rem] overflow-hidden rounded-xl p-1.5",
          // Light mode: Vintage ledger with decorative border
          "bg-gradient-to-b from-[hsl(40,48%,98%)] to-[hsl(38,42%,96%)]",
          "text-[hsl(25,40%,25%)]",
          "border-2 border-[hsl(30,35%,75%)]",
          "shadow-[inset_0_0_0_1px_hsl(40,50%,97%),inset_0_0_0_3px_hsl(30,28%,88%),0_8px_32px_rgba(101,67,33,0.15),0_2px_8px_rgba(101,67,33,0.1)]",
          // Dark mode: Liquid glass with aurora edge (bg-none resets gradient)
          "dark:bg-none dark:bg-[rgba(15,18,25,0.95)]",
          "dark:backdrop-blur-[60px] dark:backdrop-saturate-[180%]",
          "dark:border-[0.5px] dark:border-[hsl(0_0%_100%/0.1)]",
          "dark:text-white/90",
          "dark:shadow-[0_0_0_1px_rgba(139,92,246,0.08),0_0_32px_rgba(139,92,246,0.08),0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]",
          // Animations
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
)
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef(
  ({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-sm outline-none transition-all duration-150",
        // Light mode: Vintage ledger item with embossed hover
        "text-[hsl(25,40%,28%)]",
        "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
        "hover:bg-gradient-to-r hover:from-[hsl(38,45%,92%)] hover:to-[hsl(40,40%,94%)]",
        "hover:text-[hsl(25,70%,38%)]",
        "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(101,67,33,0.05)]",
        "focus:bg-gradient-to-r focus:from-[hsl(38,45%,92%)] focus:to-[hsl(40,40%,94%)]",
        "focus:text-[hsl(25,70%,38%)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // Dark mode: Aurora hover glow (bg-none resets light gradient)
        "dark:text-white/90 dark:[text-shadow:none]",
        "dark:hover:bg-none dark:hover:bg-[rgba(139,92,246,0.12)] dark:hover:text-white",
        "dark:focus:bg-none dark:focus:bg-[rgba(139,92,246,0.12)] dark:focus:text-white",
        "dark:data-[highlighted]:bg-none dark:data-[highlighted]:bg-[rgba(139,92,246,0.12)]",
        "dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
)
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef(
  ({ className, children, checked, ...props }, ref) => (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none transition-all duration-150",
        // Light mode: Vintage banking
        "text-[hsl(25,35%,25%)]",
        "focus:bg-[hsl(38,30%,92%)] focus:text-[hsl(25,75%,40%)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // Dark mode: Aurora focus
        "dark:text-white/90",
        "dark:focus:bg-[hsl(250,90%,65%)/0.12] dark:focus:text-white",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="h-4 w-4 text-[hsl(25,75%,45%)] dark:text-[hsl(250,90%,70%)] dark:drop-shadow-[0_0_4px_rgba(139,92,246,0.5)]" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
)
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none transition-all duration-150",
        // Light mode: Vintage banking
        "text-[hsl(25,35%,25%)]",
        "focus:bg-[hsl(38,30%,92%)] focus:text-[hsl(25,75%,40%)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // Dark mode: Aurora focus
        "dark:text-white/90",
        "dark:focus:bg-[hsl(250,90%,65%)/0.12] dark:focus:text-white",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className="h-2 w-2 fill-current text-[hsl(25,75%,45%)] dark:text-[hsl(250,90%,70%)] dark:drop-shadow-[0_0_4px_rgba(139,92,246,0.5)]" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
)
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef(
  ({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn(
        "px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider",
        // Light: Copper foil label with embossed effect
        "text-[hsl(25,50%,42%)]",
        "[text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
        // Dark: White muted
        "dark:text-white/50 dark:[text-shadow:none]",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
)
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef(
  ({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn(
        "-mx-1 my-1.5 h-px",
        // Light: Decorative double-line style (simulated)
        "bg-gradient-to-r from-transparent via-[hsl(30,35%,75%)] to-transparent",
        "shadow-[0_1px_0_rgba(255,255,255,0.5)]",
        // Dark: Subtle aurora tint
        "dark:bg-gradient-to-r dark:from-transparent dark:via-white/10 dark:to-transparent",
        "dark:shadow-none",
        className
      )}
      {...props}
    />
  )
)
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({ className, ...props }) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest opacity-60",
        "dark:opacity-50",
        className
      )}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
