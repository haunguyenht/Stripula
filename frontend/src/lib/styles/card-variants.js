/**
 * Card Variants (CVA)
 * 
 * Light Theme: Vintage Banking / Cream Paper + Copper Foil
 * Dark Theme: Liquid Aurora Design System (2025)
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
  // Base styles - always applied
  'rounded-2xl text-card-foreground transition-all duration-300 ease-out relative',
  {
    variants: {
    variant: {
      // Default - Vintage parchment light / Cyberpunk glass dark
      default: [
        // Light mode: Cream parchment with copper-tinted border (rgba format for tailwind-merge)
        'bg-[rgba(250,248,244,1)] border border-[hsl(30,25%,82%)]',
        'shadow-[0_2px_8px_rgba(139,90,43,0.06),0_1px_2px_rgba(139,90,43,0.04)]',
        'hover:shadow-[0_4px_16px_rgba(139,90,43,0.1),0_2px_4px_rgba(139,90,43,0.06)]',
        'hover:border-[hsl(25,35%,75%)]',
        // Dark mode: Cyberpunk glass with subtle neon edge
        'dark:bg-[rgba(8,12,20,0.85)] dark:backdrop-blur-[50px] dark:backdrop-saturate-[150%]',
        'dark:border dark:border-[rgba(0,240,255,0.08)]',
        'dark:shadow-[0_8px_32px_rgba(0,0,0,0.45),0_2px_8px_rgba(0,0,0,0.25),0_0_1px_rgba(0,240,255,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]',
        'dark:hover:bg-[rgba(10,15,25,0.9)] dark:hover:border-[rgba(0,240,255,0.15)]',
        'dark:hover:shadow-[0_12px_48px_rgba(0,0,0,0.55),0_4px_12px_rgba(0,0,0,0.3),0_0_20px_-6px_rgba(0,240,255,0.12),inset_0_1px_0_rgba(255,255,255,0.06)]',
      ].join(' '),
      
      // Elevated - Vintage certificate paper / Cyberpunk glass panel
      elevated: [
        // Light mode: Cream with warm shadow depth (rgba format for tailwind-merge)
        'bg-[rgba(252,250,247,1)] border border-[hsl(30,25%,80%)]',
        'shadow-[0_4px_16px_rgba(139,90,43,0.08),0_8px_32px_rgba(139,90,43,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]',
        'hover:shadow-[0_8px_24px_rgba(139,90,43,0.12),0_12px_48px_rgba(139,90,43,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]',
        'hover:border-[hsl(25,40%,70%)]',
        // Dark mode: Cyberpunk glass panel with subtle neon accents
        'dark:bg-[rgba(8,12,20,0.88)] dark:backdrop-blur-[50px] dark:backdrop-saturate-[160%]',
        'dark:border dark:border-[rgba(0,240,255,0.12)]',
        'dark:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.3),0_0_1px_rgba(0,240,255,0.2),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.1)]',
        'dark:hover:bg-[rgba(10,15,25,0.92)] dark:hover:border-[rgba(0,240,255,0.2)]',
        'dark:hover:shadow-[0_20px_64px_rgba(0,0,0,0.6),0_6px_20px_rgba(0,0,0,0.35),0_0_25px_-8px_rgba(0,240,255,0.15),0_0_15px_-4px_rgba(255,0,128,0.1),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.12)]',
      ].join(' '),
      
      // Result - Aged paper texture for list items / Cyberpunk card dark
      result: [
        // Light mode: Subtle parchment with fine border (rgba format)
        'bg-[rgba(250,248,246,1)] border border-[hsl(30,20%,85%)]',
        'shadow-[0_1px_4px_rgba(139,90,43,0.04),0_1px_2px_rgba(139,90,43,0.02)]',
        'hover:shadow-[0_2px_8px_rgba(139,90,43,0.08),0_2px_4px_rgba(139,90,43,0.04)]',
        'hover:bg-[rgba(249,246,241,1)] hover:border-[hsl(25,30%,78%)]',
        // Dark mode: Cyberpunk result card with subtle neon
        'dark:bg-[rgba(8,12,20,0.75)] dark:backdrop-blur-[32px] dark:backdrop-saturate-[180%]',
        'dark:border dark:border-[rgba(0,240,255,0.06)]',
        'dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]',
        'dark:hover:bg-[rgba(10,15,25,0.85)] dark:hover:border-[rgba(0,240,255,0.12)]',
        'dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_15px_-5px_rgba(0,240,255,0.1),inset_0_1px_0_rgba(255,255,255,0.06)]',
      ].join(' '),
      
      // Flat - Muted parchment / Subtle cyberpunk
      flat: [
        // Light mode: Warm off-white with subtle border (rgba format)
        'bg-[rgba(246,243,238,1)] border border-[hsl(30,20%,88%)] rounded-xl',
        'hover:border-[hsl(25,25%,82%)] hover:bg-[rgba(245,241,234,1)]',
        // Dark mode: Subtle cyberpunk glass
        'dark:bg-[rgba(8,12,20,0.6)] dark:backdrop-blur-[24px]',
        'dark:border dark:border-[rgba(0,240,255,0.05)]',
        'dark:hover:bg-[rgba(10,15,25,0.7)] dark:hover:border-[rgba(0,240,255,0.1)]',
      ].join(' '),
      
      // Ghost - transparent
      ghost: 'bg-transparent',
      
      // Panel - Premium vintage stationery / Cyberpunk glass panel
      panel: [
        // Light mode: Rich cream with copper-tinted shadow (rgba format)
        'bg-[rgba(252,250,247,1)] border border-[hsl(30,25%,82%)]',
        'shadow-[0_2px_12px_rgba(139,90,43,0.06),0_4px_24px_rgba(139,90,43,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]',
        // Dark mode: Cyberpunk glass panel
        'dark:bg-[rgba(8,12,20,0.85)] dark:backdrop-blur-[50px] dark:backdrop-saturate-[150%]',
        'dark:border dark:border-[rgba(0,240,255,0.1)]',
        'dark:shadow-[0_12px_40px_rgba(0,0,0,0.45),0_4px_12px_rgba(0,0,0,0.25),0_0_1px_rgba(0,240,255,0.15),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.08)]',
      ].join(' '),

      // Glass - Translucent parchment / Cyberpunk frosted glass
      glass: [
        // Light mode: Semi-transparent cream with blur (rgba format)
        'bg-[rgba(250,248,244,0.8)] backdrop-blur-2xl border border-[rgba(214,205,195,0.6)]',
        'shadow-[0_4px_16px_rgba(139,90,43,0.06)]',
        'hover:shadow-[0_8px_24px_rgba(139,90,43,0.1)]',
        'hover:bg-[rgba(250,248,244,0.9)]',
        // Dark mode: Cyberpunk frosted glass with neon accents
        'dark:bg-[rgba(8,12,20,0.8)] dark:backdrop-blur-[60px] dark:backdrop-saturate-[150%]',
        'dark:border dark:border-[rgba(0,240,255,0.12)]',
        'dark:shadow-[0_16px_48px_rgba(0,0,0,0.45),0_4px_16px_rgba(0,0,0,0.25),0_0_1px_rgba(0,240,255,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]',
        'dark:hover:bg-[rgba(10,15,25,0.88)] dark:hover:border-[rgba(0,240,255,0.2)]',
        'dark:hover:shadow-[0_20px_64px_rgba(0,0,0,0.55),0_6px_20px_rgba(0,0,0,0.3),0_0_25px_-8px_rgba(0,240,255,0.15),inset_0_1px_0_rgba(255,255,255,0.08)]',
      ].join(' '),

      // Liquid - Premium vintage / Cyberpunk liquid glass
      liquid: [
        // Light mode: Fine stationery with warm undertones (rgba format)
        'bg-[rgba(252,250,246,1)] border border-[hsl(28,30%,80%)]',
        'shadow-[0_4px_20px_rgba(139,90,43,0.08),0_8px_40px_rgba(139,90,43,0.04)]',
        'hover:shadow-[0_8px_32px_rgba(139,90,43,0.12),0_16px_56px_rgba(139,90,43,0.06)]',
        'hover:border-[hsl(25,45%,65%)]',
        // Dark mode: Cyberpunk liquid glass
        'dark:bg-[rgba(8,12,20,0.85)] dark:backdrop-blur-[50px] dark:backdrop-saturate-[150%]',
        'dark:border dark:border-[rgba(0,240,255,0.1)]',
        'dark:shadow-[0_16px_48px_rgba(0,0,0,0.45),0_4px_16px_rgba(0,0,0,0.25),0_0_1px_rgba(0,240,255,0.18),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.08)]',
        'dark:hover:bg-[rgba(10,15,25,0.9)] dark:hover:border-[rgba(0,240,255,0.18)]',
        'dark:hover:shadow-[0_20px_64px_rgba(0,0,0,0.55),0_6px_20px_rgba(0,0,0,0.3),0_0_25px_-8px_rgba(0,240,255,0.12),0_0_15px_-4px_rgba(255,0,128,0.08),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.1)]',
      ].join(' '),

      // Aurora - Full neon glow effect (dark) / Copper foil highlight (light)
      aurora: [
        // Light mode: Premium cream with copper foil edge hint (rgba format)
        'bg-[rgba(252,250,247,1)] border border-[hsl(25,50%,70%)]',
        'shadow-[0_4px_20px_rgba(180,100,50,0.1),0_8px_40px_rgba(139,90,43,0.06)]',
        'hover:shadow-[0_8px_32px_rgba(180,100,50,0.15),0_16px_56px_rgba(139,90,43,0.08)]',
        'hover:border-[hsl(25,60%,60%)]',
        // Dark mode: Cyberpunk neon glow effect
        'dark:bg-[rgba(8,12,20,0.88)] dark:backdrop-blur-[40px] dark:backdrop-saturate-[180%]',
        'dark:border dark:border-[rgba(0,240,255,0.15)]',
        'dark:shadow-[0_16px_48px_rgba(0,0,0,0.55),0_0_60px_-15px_rgba(0,240,255,0.2),0_0_40px_-10px_rgba(255,0,128,0.12),0_0_1px_rgba(0,240,255,0.25),inset_0_1px_0_rgba(255,255,255,0.06)]',
        'dark:hover:bg-[rgba(10,15,25,0.92)] dark:hover:border-[rgba(0,240,255,0.25)]',
        'dark:hover:shadow-[0_20px_64px_rgba(0,0,0,0.65),0_0_80px_-15px_rgba(0,240,255,0.25),0_0_50px_-10px_rgba(255,0,128,0.18),0_0_1px_rgba(0,240,255,0.35),inset_0_1px_0_rgba(255,255,255,0.1)]',
      ].join(' '),

      // Ultra-tight - Compact vintage
      'ultra-tight': [
        // Light mode: Compact parchment (rgba format)
        'bg-[rgba(247,244,239,0.8)] backdrop-blur-sm border border-[hsl(30,20%,85%)] rounded-xl',
        'hover:bg-[rgba(246,242,235,1)]',
        // Dark mode: Compact liquid glass (rgba format)
        'dark:bg-[rgba(255,255,255,0.02)] dark:backdrop-blur-[24px]',
        'dark:border dark:border-white/[0.05]',
      ].join(' '),
    },
      
      status: {
        // No status indicator
        none: '',
        
        // Live/Success status - emerald with neon glow
        live: [
          'border-l-2 border-l-success',
          'dark:border-l-[#34d399] dark:shadow-[0_0_20px_-5px_rgba(52,211,153,0.3)]',
        ].join(' '),
        
        // Dead/Failed status - red with neon glow
        dead: [
          'border-l-2 border-l-destructive',
          'dark:border-l-[#f87171] dark:shadow-[0_0_20px_-5px_rgba(248,113,113,0.3)]',
        ].join(' '),
        
        // Approved/Primary status - indigo aurora accent
        approved: [
          'border-l-2 border-l-primary',
          'dark:border-l-[#a78bfa] dark:shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)]',
        ].join(' '),
        
        // Error/Warning status - amber with glow
        error: [
          'border-l-2 border-l-warning',
          'dark:border-l-[#fbbf24] dark:shadow-[0_0_20px_-5px_rgba(251,191,36,0.3)]',
        ].join(' '),
        
        // Declined status - rose with neon glow
        declined: [
          'border-l-2 border-l-[#f43f5e]',
          'dark:border-l-[#fb7185] dark:shadow-[0_0_20px_-5px_rgba(251,113,133,0.3)]',
        ].join(' '),
      },
      
      interactive: {
        true: 'cursor-pointer',
        false: '',
      },
      
      selected: {
        true: [
          'ring-2 ring-primary/20 border-primary/30',
          'dark:ring-[rgba(0,240,255,0.3)] dark:border-[rgba(0,240,255,0.4)]',
          'dark:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_30px_-5px_rgba(0,240,255,0.25),0_0_20px_-4px_rgba(255,0,128,0.15)]',
        ].join(' '),
        false: '',
      },
    },
    
    compoundVariants: [
      // Flat variant when selected
      {
        variant: 'flat',
        selected: true,
        className: 'border-primary/40 dark:border-[rgba(0,240,255,0.35)]',
      },
      // Add hover state for interactive result cards
      {
        variant: 'result',
        interactive: true,
        className: 'hover:bg-accent/50 dark:hover:bg-[rgba(0,240,255,0.04)]',
      },
      // Liquid variant when selected - enhanced neon glow
      {
        variant: 'liquid',
        selected: true,
        className: 'dark:shadow-[0_16px_48px_rgba(0,0,0,0.55),0_0_60px_-12px_rgba(0,240,255,0.25),0_0_40px_-10px_rgba(255,0,128,0.18)]',
      },
      // Aurora variant when selected - maximum neon effect
      {
        variant: 'aurora',
        selected: true,
        className: 'dark:shadow-[0_16px_48px_rgba(0,0,0,0.6),0_0_80px_-15px_rgba(0,240,255,0.3),0_0_50px_-10px_rgba(255,0,128,0.22),0_0_1px_rgba(0,240,255,0.4)]',
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
