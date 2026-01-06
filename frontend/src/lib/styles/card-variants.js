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
      // Default - Vintage parchment light / PREMIUM Liquid glass dark
      default: [
        // Light mode: Cream parchment with copper-tinted border
        'bg-[hsl(40,35%,97%)] border border-[hsl(30,25%,82%)]',
        'shadow-[0_2px_8px_rgba(139,90,43,0.06),0_1px_2px_rgba(139,90,43,0.04)]',
        'hover:shadow-[0_4px_16px_rgba(139,90,43,0.1),0_2px_4px_rgba(139,90,43,0.06)]',
        'hover:border-[hsl(25,35%,75%)]',
        // Dark mode: PREMIUM Liquid glass with aurora hint
        'dark:bg-white/[0.035] dark:backdrop-blur-[60px] dark:backdrop-saturate-[200%]',
        'dark:border dark:border-white/[0.08]',
        'dark:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_50px_-20px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.1)]',
        'dark:hover:bg-white/[0.05] dark:hover:border-white/[0.12]',
        'dark:hover:shadow-[0_16px_56px_rgba(0,0,0,0.55),0_0_70px_-20px_rgba(139,92,246,0.18),inset_0_1px_0_rgba(255,255,255,0.12)]',
      ].join(' '),
      
      // Elevated - Vintage certificate paper / PREMIUM elevated glass
      elevated: [
        // Light mode: Cream with warm shadow depth like engraved stationery
        'bg-[hsl(42,40%,98%)] border border-[hsl(30,25%,80%)]',
        'shadow-[0_4px_16px_rgba(139,90,43,0.08),0_8px_32px_rgba(139,90,43,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]',
        'hover:shadow-[0_8px_24px_rgba(139,90,43,0.12),0_12px_48px_rgba(139,90,43,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]',
        'hover:border-[hsl(25,40%,70%)]',
        // Dark mode: PREMIUM Elevated liquid glass with aurora
        'dark:bg-white/[0.04] dark:backdrop-blur-[80px] dark:backdrop-saturate-[220%]',
        'dark:border dark:border-white/[0.08]',
        'dark:shadow-[0_20px_60px_rgba(0,0,0,0.55),0_0_80px_-25px_rgba(139,92,246,0.15),0_0_60px_-25px_rgba(34,211,238,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]',
        'dark:hover:bg-white/[0.06] dark:hover:border-white/[0.12]',
        'dark:hover:shadow-[0_24px_80px_rgba(0,0,0,0.6),0_0_100px_-25px_rgba(139,92,246,0.22),0_0_80px_-25px_rgba(34,211,238,0.15),inset_0_1px_0_rgba(255,255,255,0.14)]',
      ].join(' '),
      
      // Result - Aged paper texture / PREMIUM subtle glass
      result: [
        // Light mode: Subtle parchment with fine border
        'bg-[hsl(38,30%,97%)] border border-[hsl(30,20%,85%)]',
        'shadow-[0_1px_4px_rgba(139,90,43,0.04),0_1px_2px_rgba(139,90,43,0.02)]',
        'hover:shadow-[0_2px_8px_rgba(139,90,43,0.08),0_2px_4px_rgba(139,90,43,0.04)]',
        'hover:bg-[hsl(40,35%,96%)] hover:border-[hsl(25,30%,78%)]',
        // Dark mode: PREMIUM Subtle liquid glass
        'dark:bg-white/[0.025] dark:backdrop-blur-[50px] dark:backdrop-saturate-[200%]',
        'dark:border dark:border-white/[0.06]',
        'dark:shadow-[0_6px_28px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]',
        'dark:hover:bg-white/[0.04] dark:hover:border-white/[0.1]',
        'dark:hover:shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_40px_-15px_rgba(139,92,246,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]',
      ].join(' '),
      
      // Flat - Muted parchment / PREMIUM minimal glass
      flat: [
        // Light mode: Warm off-white with subtle border
        'bg-[hsl(38,25%,95%)] border border-[hsl(30,20%,88%)] rounded-xl',
        'hover:border-[hsl(25,25%,82%)] hover:bg-[hsl(40,30%,94%)]',
        // Dark mode: PREMIUM Very subtle liquid glass
        'dark:bg-white/[0.02] dark:backdrop-blur-[40px] dark:backdrop-saturate-[180%]',
        'dark:border dark:border-white/[0.05]',
        'dark:hover:bg-white/[0.035] dark:hover:border-white/[0.08]',
      ].join(' '),
      
      // Ghost - transparent
      ghost: 'bg-transparent',
      
      // Panel - Premium vintage / PREMIUM main containers
      panel: [
        // Light mode: Rich cream with copper-tinted shadow
        'bg-[hsl(42,40%,98%)] border border-[hsl(30,25%,82%)]',
        'shadow-[0_2px_12px_rgba(139,90,43,0.06),0_4px_24px_rgba(139,90,43,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]',
        // Dark mode: PREMIUM Prominent liquid glass with specular edge
        'dark:bg-white/[0.035] dark:backdrop-blur-[60px] dark:backdrop-saturate-[200%]',
        'dark:border dark:border-white/[0.08]',
        'dark:shadow-[0_16px_50px_rgba(0,0,0,0.5),0_0_70px_-25px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.1)]',
      ].join(' '),

      // Glass - Translucent parchment / PREMIUM glass with aurora
      glass: [
        // Light mode: Semi-transparent cream with blur
        'bg-[hsl(40,35%,97%)]/80 backdrop-blur-2xl border border-[hsl(30,25%,85%)]/60',
        'shadow-[0_4px_16px_rgba(139,90,43,0.06)]',
        'hover:shadow-[0_8px_24px_rgba(139,90,43,0.1)]',
        'hover:bg-[hsl(40,35%,97%)]/90',
        // Dark mode: PREMIUM Maximum liquid glass with aurora ambient
        'dark:bg-white/[0.04] dark:backdrop-blur-[80px] dark:backdrop-saturate-[220%]',
        'dark:border dark:border-white/[0.1]',
        'dark:shadow-[0_20px_60px_rgba(0,0,0,0.55),0_0_100px_-30px_rgba(139,92,246,0.18),0_0_80px_-30px_rgba(34,211,238,0.12),inset_0_1px_0_rgba(255,255,255,0.12)]',
        'dark:hover:bg-white/[0.055] dark:hover:border-white/[0.14]',
        'dark:hover:shadow-[0_24px_80px_rgba(0,0,0,0.6),0_0_120px_-30px_rgba(139,92,246,0.25),0_0_100px_-30px_rgba(34,211,238,0.18),inset_0_1px_0_rgba(255,255,255,0.16)]',
      ].join(' '),

      // Liquid - Premium vintage / PREMIUM liquid with aurora rim
      liquid: [
        // Light mode: Fine stationery with warm undertones
        'bg-[hsl(42,38%,98%)] border border-[hsl(28,30%,80%)]',
        'shadow-[0_4px_20px_rgba(139,90,43,0.08),0_8px_40px_rgba(139,90,43,0.04)]',
        'hover:shadow-[0_8px_32px_rgba(139,90,43,0.12),0_16px_56px_rgba(139,90,43,0.06)]',
        'hover:border-[hsl(25,45%,65%)]',
        // Dark mode: PREMIUM Liquid glass with aurora rim glow
        'dark:bg-white/[0.035] dark:backdrop-blur-[60px] dark:backdrop-saturate-[200%]',
        'dark:border dark:border-white/[0.08]',
        'dark:shadow-[0_20px_60px_rgba(0,0,0,0.55),0_0_80px_-20px_rgba(139,92,246,0.2),0_0_60px_-20px_rgba(34,211,238,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]',
        'dark:hover:bg-white/[0.05] dark:hover:border-white/[0.12]',
        'dark:hover:shadow-[0_24px_80px_rgba(0,0,0,0.6),0_0_100px_-20px_rgba(139,92,246,0.28),0_0_80px_-20px_rgba(34,211,238,0.2),inset_0_1px_0_rgba(255,255,255,0.14)]',
      ].join(' '),

      // Aurora - Full aurora glow effect / PREMIUM maximum aurora
      aurora: [
        // Light mode: Premium cream with copper foil edge hint
        'bg-[hsl(42,40%,98%)] border border-[hsl(25,50%,70%)]',
        'shadow-[0_4px_20px_rgba(180,100,50,0.1),0_8px_40px_rgba(139,90,43,0.06)]',
        'hover:shadow-[0_8px_32px_rgba(180,100,50,0.15),0_16px_56px_rgba(139,90,43,0.08)]',
        'hover:border-[hsl(25,60%,60%)]',
        // Dark mode: PREMIUM Maximum aurora glow effect
        'dark:bg-white/[0.045] dark:backdrop-blur-[80px] dark:backdrop-saturate-[220%]',
        'dark:border dark:border-white/[0.1]',
        'dark:shadow-[0_20px_60px_rgba(0,0,0,0.55),0_0_100px_-25px_rgba(139,92,246,0.28),0_0_80px_-20px_rgba(34,211,238,0.2),0_0_60px_-15px_rgba(236,72,153,0.15),inset_0_1px_0_rgba(255,255,255,0.12)]',
        'dark:hover:bg-white/[0.06] dark:hover:border-white/[0.14]',
        'dark:hover:shadow-[0_24px_80px_rgba(0,0,0,0.6),0_0_120px_-25px_rgba(139,92,246,0.35),0_0_100px_-20px_rgba(34,211,238,0.28),0_0_80px_-15px_rgba(236,72,153,0.2),inset_0_1px_0_rgba(255,255,255,0.16)]',
      ].join(' '),

      // Ultra-tight - Compact vintage / PREMIUM compact glass
      'ultra-tight': [
        // Light mode: Compact parchment
        'bg-[hsl(38,25%,96%)]/80 backdrop-blur-sm border border-[hsl(30,20%,85%)] rounded-xl',
        'hover:bg-[hsl(40,30%,95%)]',
        // Dark mode: PREMIUM Compact liquid glass
        'dark:bg-white/[0.025] dark:backdrop-blur-[40px] dark:backdrop-saturate-[180%]',
        'dark:border dark:border-white/[0.06]',
        'dark:hover:bg-white/[0.04]',
      ].join(' '),
    },
      
      status: {
        // No status indicator
        none: '',
        
        // Live/Success status - PREMIUM emerald with enhanced neon glow
        live: [
          'border-l-2 border-l-success',
          'dark:border-l-[#34d399] dark:shadow-[0_0_30px_-8px_rgba(52,211,153,0.45),0_0_50px_-15px_rgba(34,211,238,0.2)]',
        ].join(' '),
        
        // Dead/Failed status - PREMIUM red with enhanced neon glow
        dead: [
          'border-l-2 border-l-destructive',
          'dark:border-l-[#f87171] dark:shadow-[0_0_30px_-8px_rgba(248,113,113,0.4)]',
        ].join(' '),
        
        // Approved/Primary status - PREMIUM indigo aurora accent
        approved: [
          'border-l-2 border-l-primary',
          'dark:border-l-[#a78bfa] dark:shadow-[0_0_30px_-8px_rgba(139,92,246,0.45),0_0_50px_-15px_rgba(34,211,238,0.15)]',
        ].join(' '),
        
        // Error/Warning status - PREMIUM amber with enhanced glow
        error: [
          'border-l-2 border-l-warning',
          'dark:border-l-[#fbbf24] dark:shadow-[0_0_30px_-8px_rgba(251,191,36,0.45)]',
        ].join(' '),
        
        // Declined status - PREMIUM rose with enhanced neon glow
        declined: [
          'border-l-2 border-l-[#f43f5e]',
          'dark:border-l-[#fb7185] dark:shadow-[0_0_30px_-8px_rgba(251,113,133,0.4),0_0_50px_-15px_rgba(236,72,153,0.2)]',
        ].join(' '),
      },
      
      interactive: {
        true: 'cursor-pointer',
        false: '',
      },
      
      selected: {
        true: [
          'ring-2 ring-primary/20 border-primary/30',
          'dark:ring-violet-500/30 dark:border-violet-500/40',
          'dark:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_30px_-5px_rgba(139,92,246,0.25)]',
        ].join(' '),
        false: '',
      },
    },
    
    compoundVariants: [
      // Flat variant when selected
      {
        variant: 'flat',
        selected: true,
        className: 'border-primary/40 dark:border-violet-500/40',
      },
      // Add hover state for interactive result cards
      {
        variant: 'result',
        interactive: true,
        className: 'hover:bg-accent/50 dark:hover:bg-white/[0.03]',
      },
      // Liquid variant when selected - enhanced aurora glow
      {
        variant: 'liquid',
        selected: true,
        className: 'dark:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_80px_-15px_rgba(139,92,246,0.25),0_0_60px_-15px_rgba(34,211,238,0.2)]',
      },
      // Aurora variant when selected - maximum aurora effect
      {
        variant: 'aurora',
        selected: true,
        className: 'dark:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_100px_-20px_rgba(139,92,246,0.3),0_0_80px_-15px_rgba(34,211,238,0.25),0_0_60px_-10px_rgba(236,72,153,0.2)]',
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
