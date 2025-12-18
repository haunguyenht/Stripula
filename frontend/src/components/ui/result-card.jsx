import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

/**
 * ResultCard Component
 * 
 * A specialized card component for displaying validation results.
 * Composes the base Card component with result-specific defaults and animations.
 * 
 * @param {string} status - Status indicator: live, dead, approved, error, or undefined
 * @param {boolean} isSelected - Whether the card is selected
 * @param {boolean} isLoading - Whether the card is in loading state
 * @param {function} onClick - Click handler (makes card interactive)
 * @param {boolean} animate - Whether to use motion animations (default: true)
 */
const ResultCard = React.forwardRef(
  ({ 
    className, 
    status, 
    isSelected = false, 
    isLoading = false,
    onClick,
    animate = true,
    children, 
    ...props 
  }, ref) => {
    const isInteractive = !!onClick;
    
    // Map status string to card status prop
    const cardStatus = React.useMemo(() => {
      if (!status) return 'none';
      const statusLower = status.toLowerCase();
      if (statusLower === 'approved') return 'approved';
      if (statusLower === 'live' || statusLower.startsWith('live')) return 'live';
      if (statusLower === 'die' || statusLower === 'dead') return 'dead';
      if (statusLower === 'error' || statusLower === 'retry') return 'error';
      return 'none';
    }, [status]);

    const cardProps = {
      ref,
      variant: "result",
      status: cardStatus,
      interactive: isInteractive,
      selected: isSelected,
      onClick,
      className: cn(
        "group relative",
        isLoading && "opacity-50 pointer-events-none",
        className
      ),
      ...props,
    };

    // Render with or without motion wrapper
    if (animate) {
      return (
        <motion.div
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <Card {...cardProps}>
            {children}
          </Card>
        </motion.div>
      );
    }

    return (
      <Card {...cardProps}>
        {children}
      </Card>
    );
  }
);
ResultCard.displayName = "ResultCard";

/**
 * ResultCardContent Component
 * 
 * Content wrapper for ResultCard with compact padding.
 */
const ResultCardContent = React.forwardRef(
  ({ className, ...props }, ref) => (
    <CardContent 
      ref={ref} 
      size="sm"
      className={cn("p-3", className)} 
      {...props} 
    />
  )
);
ResultCardContent.displayName = "ResultCardContent";

/**
 * ResultCardRow Component
 * 
 * A flex row within ResultCard for consistent spacing.
 */
const ResultCardRow = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("flex items-center gap-2", className)} 
      {...props} 
    />
  )
);
ResultCardRow.displayName = "ResultCardRow";

/**
 * ResultCardActions Component
 * 
 * Container for action buttons, positioned at top-right.
 * Visible on hover by default.
 */
const ResultCardActions = React.forwardRef(
  ({ className, alwaysVisible = false, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "absolute top-2 right-2 flex items-center gap-0.5 transition-opacity",
        !alwaysVisible && "opacity-0 group-hover:opacity-100",
        className
      )} 
      {...props} 
    />
  )
);
ResultCardActions.displayName = "ResultCardActions";

/**
 * ResultCardLoadingOverlay Component
 * 
 * Overlay for loading/refreshing state.
 */
const ResultCardLoadingOverlay = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-background/50 rounded-2xl",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
);
ResultCardLoadingOverlay.displayName = "ResultCardLoadingOverlay";

export { 
  ResultCard, 
  ResultCardContent, 
  ResultCardRow, 
  ResultCardActions,
  ResultCardLoadingOverlay 
};

