import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Avatar Component - Liquid Aurora Design System
 * 
 * Light Theme: Vintage Banking with copper foil ring
 * Dark Theme: Liquid glass with aurora rim glow
 */

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-[10px]",
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
        "2xl": "h-20 w-20 text-xl",
      },
      variant: {
        default: "",
        ring: cn(
          // Light mode: Copper foil ring - vintage banking
          "ring-2 ring-[hsl(25,65%,55%)]/40",
          "shadow-[0_2px_8px_rgba(180,100,50,0.15)]",
          // Dark mode: Aurora rim glow
          "dark:ring-[var(--aurora-indigo)]/40",
          "dark:shadow-[0_0_20px_-4px_rgba(139,92,246,0.4),0_0_40px_-8px_rgba(34,211,238,0.2)]"
        ),
        glow: cn(
          // Light mode: Subtle copper halo
          "ring-2 ring-[hsl(25,70%,55%)]/50",
          "shadow-[0_0_16px_-2px_rgba(180,100,50,0.3)]",
          // Dark mode: Full aurora glow
          "dark:ring-[var(--aurora-cyan)]/50",
          "dark:shadow-[0_0_24px_-4px_rgba(34,211,238,0.5),0_0_48px_-8px_rgba(139,92,246,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]"
        ),
        glass: cn(
          // Light mode: Vintage parchment ring
          "ring-1 ring-[hsl(30,25%,75%)]/60",
          // Dark mode: Liquid glass rim
          "dark:ring-white/[0.15]",
          "dark:shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]"
        ),
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
)

const Avatar = React.forwardRef(({ className, size, variant, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ size, variant }), className)}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full",
      "font-medium uppercase tracking-wide",
      // Light mode: Vintage cream with copper text
      "bg-[hsl(38,35%,93%)] text-[hsl(25,55%,40%)]",
      // Dark mode: Liquid glass with aurora text
      "dark:bg-white/[0.06] dark:text-[var(--aurora-cyan)]",
      "dark:backdrop-blur-sm",
      // Specular highlight
      "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

/**
 * AvatarGroup - Stack multiple avatars with overlap
 */
const AvatarGroup = React.forwardRef(({ className, children, max = 5, ...props }, ref) => {
  const avatars = React.Children.toArray(children)
  const visible = avatars.slice(0, max)
  const overflow = avatars.length - max

  return (
    <div
      ref={ref}
      className={cn("flex -space-x-2", className)}
      {...props}
    >
      {visible}
      {overflow > 0 && (
        <div className={cn(
          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          "text-xs font-medium",
          // Light mode
          "bg-[hsl(38,35%,93%)] text-[hsl(25,55%,40%)] ring-2 ring-white",
          // Dark mode: Liquid glass
          "dark:bg-white/[0.08] dark:text-white/70 dark:ring-[var(--liquid-glass-bg)]",
          "dark:backdrop-blur-sm",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
        )}>
          +{overflow}
        </div>
      )}
    </div>
  )
})
AvatarGroup.displayName = "AvatarGroup"

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, avatarVariants }
