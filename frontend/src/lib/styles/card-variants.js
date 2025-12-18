/**
 * Card Variants (CVA)
 * 
 * OPUX Design System card styling
 * Glass effects with noise texture overlays
 */

import { cva } from 'class-variance-authority';

/**
 * Card component variants
 * 
 * @variant variant - Visual style (default, elevated, result, flat, ghost, panel, glass)
 * @variant status - Status indicator border (none, live, dead, approved, error)
 * @variant interactive - Whether card has hover effects
 */
export const cardVariants = cva(
  // Base styles - always applied (OrangeAI uses 20px radius)
  'rounded-[20px] text-card-foreground transition-all duration-200 relative',
  {
    variants: {
    variant: {
      // Default - OrangeAI exact shadow (light) / OPUX glass (dark)
      default: [
        // Light mode: OrangeAI card with exact shadow
        'bg-white border border-[rgb(237,234,233)] rounded-[20px]',
        'shadow-[0_10px_30px_rgba(0,0,0,0.1)]',
        'hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]',
        // Dark mode: exact OPUX glass
        'dark:bg-transparent dark:border-[0.5px]',
        'dark:[background:linear-gradient(135deg,#33333359,#2e2e2e52)]',
        'dark:[backdrop-filter:blur(16px)_saturate(180%)] dark:[-webkit-backdrop-filter:blur(16px)_saturate(180%)]',
        'dark:border-[hsl(0_0%_100%/0.12)]',
        'dark:shadow-[0_8px_32px_#0000005e,inset_0_1px_0_#ffffff0d]',
        'dark:hover:border-[hsl(0_0%_100%/0.2)]',
        'dark:hover:shadow-[0_8px_32px_#00000070,inset_0_1px_0_#ffffff14]',
      ].join(' '),
      
      // Elevated - OrangeAI elevated (light) / OPUX glass elevated (dark)
      elevated: [
        // Light mode: OrangeAI elevated card
        'bg-white border border-[rgb(237,234,233)] rounded-[20px]',
        'shadow-[0_20px_40px_rgba(0,0,0,0.1)]',
        'hover:shadow-[0_25px_50px_rgba(0,0,0,0.12)]',
        // Dark mode: OPUX glass elevated
        'dark:bg-transparent dark:border-[0.5px]',
        'dark:[background:linear-gradient(135deg,#4747476e,#40404066)]',
        'dark:[backdrop-filter:blur(16px)_saturate(180%)] dark:[-webkit-backdrop-filter:blur(16px)_saturate(180%)]',
        'dark:border-[hsl(0_0%_100%/0.15)]',
        'dark:shadow-[0_8px_32px_#0000005e,inset_0_1px_0_#ffffff14]',
        'dark:hover:shadow-[0_12px_40px_#00000070,inset_0_1px_0_#ffffff1a]',
      ].join(' '),
      
      // Result - OrangeAI result card (light) / OPUX subtle glass (dark)
      result: [
        // Light mode: OrangeAI result card
        'bg-white border border-[rgb(237,234,233)] rounded-[20px]',
        'shadow-[0_10px_30px_rgba(0,0,0,0.1)]',
        'hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]',
        // Dark mode: OPUX subtle glass
        'dark:bg-transparent dark:border-[0.5px]',
        'dark:[background:linear-gradient(135deg,#33333359,#2e2e2e52)]',
        'dark:[backdrop-filter:blur(16px)_saturate(180%)] dark:[-webkit-backdrop-filter:blur(16px)_saturate(180%)]',
        'dark:border-[hsl(0_0%_100%/0.12)]',
        'dark:shadow-[0_8px_32px_#0000005e,inset_0_1px_0_#ffffff0d]',
        'dark:hover:border-[hsl(0_0%_100%/0.2)]',
      ].join(' '),
      
      // Flat - OrangeAI flat (light) / minimal OPUX glass (dark)
      flat: [
        // Light mode: OrangeAI flat card
        'bg-[rgb(248,247,247)] border border-[rgb(237,234,233)] rounded-[16px]',
        'hover:border-[rgb(220,215,213)]',
        // Dark mode: minimal OPUX glass
        'dark:bg-transparent dark:border-[0.5px]',
        'dark:[background:linear-gradient(135deg,#33333340,#2e2e2e35)]',
        'dark:[backdrop-filter:blur(12px)_saturate(150%)]',
        'dark:border-[hsl(0_0%_100%/0.08)]',
      ].join(' '),
      
      // Ghost - minimal styling for nested cards
      ghost: 'bg-transparent',
      
      // Panel - OrangeAI panel (light) / OPUX panel (dark)
      panel: [
        // Light mode: OrangeAI panel
        'bg-white border border-[rgb(237,234,233)] rounded-[20px]',
        'shadow-[0_10px_30px_rgba(0,0,0,0.1)]',
        // Dark mode: OPUX panel
        'dark:bg-transparent dark:border-[0.5px]',
        'dark:[background:linear-gradient(135deg,#33333380,#2e2e2e75)]',
        'dark:[backdrop-filter:blur(24px)_saturate(180%)] dark:[-webkit-backdrop-filter:blur(24px)_saturate(180%)]',
        'dark:border-[hsl(0_0%_100%/0.12)]',
        'dark:shadow-[0_8px_32px_#0000005e,inset_0_1px_0_#ffffff0d]',
      ].join(' '),

      // Glass - OrangeAI glass (light) / OPUX glass (dark)
      glass: [
        // Light mode: OrangeAI glass card
        'bg-white/80 backdrop-blur-xl border border-[rgb(237,234,233)] rounded-[20px]',
        'shadow-[0_10px_30px_rgba(0,0,0,0.1)]',
        'hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]',
        // Dark mode: OPUX glass
        'dark:bg-transparent dark:border-[0.5px]',
        'dark:[background:linear-gradient(135deg,#33333359,#2e2e2e52)]',
        'dark:[backdrop-filter:blur(16px)_saturate(180%)] dark:[-webkit-backdrop-filter:blur(16px)_saturate(180%)]',
        'dark:border-[hsl(0_0%_100%/0.12)]',
        'dark:shadow-[0_8px_32px_#0000005e,inset_0_1px_0_#ffffff0d]',
        'dark:hover:border-[hsl(0_0%_100%/0.2)]',
        'dark:hover:shadow-[0_8px_32px_#00000070,inset_0_1px_0_#ffffff14]',
      ].join(' '),

      // Ultra-tight - OrangeAI ultra-tight (light) / OPUX ultra-tight (dark)
      'ultra-tight': [
        // Light mode: OrangeAI ultra-tight
        'bg-[rgb(248,247,247)]/60 backdrop-blur-sm border border-[rgb(237,234,233)] rounded-[16px]',
        // Dark mode: OPUX ultra-tight
        'dark:bg-transparent dark:border-[0.5px]',
        'dark:[background:#7070704a]',
        'dark:[backdrop-filter:blur(4px)_saturate(180%)] dark:[-webkit-backdrop-filter:blur(4px)_saturate(180%)]',
        'dark:border-[hsl(0_0%_100%/0.1)]',
        'dark:shadow-[0_8px_32px_#0000005e,inset_0_1px_0_#ffffff0d]',
      ].join(' '),
    },
      
      status: {
        // No status indicator
        none: '',
        
        // Live/Success status - green accent
        live: [
          'border-l-2 border-l-success',
          'dark:border-l-[#22c55e]',
        ].join(' '),
        
        // Dead/Failed status - red accent
        dead: [
          'border-l-2 border-l-destructive',
          'dark:border-l-[#ef4444]',
        ].join(' '),
        
        // Approved/Primary status - terracotta accent
        approved: [
          'border-l-2 border-l-primary',
          'dark:border-l-[#AB726F]',
        ].join(' '),
        
        // Error/Warning status - amber accent
        error: [
          'border-l-2 border-l-warning',
          'dark:border-l-[#f59e0b]',
        ].join(' '),
      },
      
      interactive: {
        true: 'cursor-pointer',
        false: '',
      },
      
      selected: {
        true: [
          'ring-2 ring-primary/20 border-primary/30',
          'dark:ring-[hsl(3_26%_55%/0.3)] dark:border-[hsl(3_26%_55%/0.4)]',
          'dark:shadow-[0_8px_32px_#00000070,0_0_20px_hsl(3_26%_55%/0.15)]',
        ].join(' '),
        false: '',
      },
    },
    
    compoundVariants: [
      // Flat variant when selected
      {
        variant: 'flat',
        selected: true,
        className: 'border-primary/40 dark:border-[hsl(3_26%_55%/0.4)]',
      },
      // Add hover state for interactive result cards
      {
        variant: 'result',
        interactive: true,
        className: 'hover:bg-accent/50 dark:hover:bg-[#ffffff08]',
      },
    ],
    
    defaultVariants: {
      variant: 'default',
      status: 'none',
      interactive: false,
      selected: false,
    },
  }
);

/**
 * Card header variants
 */
export const cardHeaderVariants = cva(
  'flex flex-col space-y-1.5 p-6',
  {
    variants: {
      size: {
        default: 'p-6',
        sm: 'p-4',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

/**
 * Card content variants
 */
export const cardContentVariants = cva(
  'p-6 pt-0',
  {
    variants: {
      size: {
        default: 'p-6 pt-0',
        sm: 'p-4 pt-0',
        lg: 'p-8 pt-0',
      },
      noPadding: {
        true: 'p-0',
        false: '',
      },
    },
    defaultVariants: {
      size: 'default',
      noPadding: false,
    },
  }
);

/**
 * Card footer variants
 */
export const cardFooterVariants = cva(
  'flex items-center p-6 pt-0',
  {
    variants: {
      size: {
        default: 'p-6 pt-0',
        sm: 'p-4 pt-0',
        lg: 'p-8 pt-0',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);
