import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  cardVariants, 
  cardHeaderVariants, 
  cardContentVariants, 
  cardFooterVariants 
} from "@/lib/styles/card-variants";

/**
 * Card Component
 * 
 * A versatile card component with multiple variants and status indicators.
 * Uses CVA for variant management - variants are defined in lib/styles/card-variants.js
 * 
 * @param {string} variant - Visual style: default, elevated, result, glass, flat, ghost
 * @param {string} status - Status indicator: none, live, dead, approved, error
 * @param {boolean} interactive - Whether card has cursor pointer
 * @param {boolean} selected - Whether card is in selected state
 */
const Card = React.forwardRef(
  ({ className, variant, status, interactive, selected, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, status, interactive, selected }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

/**
 * CardHeader Component
 * 
 * @param {string} size - Padding size: default, sm, lg
 */
const CardHeader = React.forwardRef(
  ({ className, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardHeaderVariants({ size }), className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

/**
 * CardTitle Component
 */
const CardTitle = React.forwardRef(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

/**
 * CardDescription Component
 */
const CardDescription = React.forwardRef(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

/**
 * CardContent Component
 * 
 * @param {string} size - Padding size: default, sm, lg
 * @param {boolean} noPadding - Remove all padding
 */
const CardContent = React.forwardRef(
  ({ className, size, noPadding, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(cardContentVariants({ size, noPadding }), className)} 
      {...props} 
    />
  )
);
CardContent.displayName = "CardContent";

/**
 * CardFooter Component
 * 
 * @param {string} size - Padding size: default, sm, lg
 */
const CardFooter = React.forwardRef(
  ({ className, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardFooterVariants({ size }), className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

// Re-export variants for external use
export { cardVariants } from "@/lib/styles/card-variants";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
