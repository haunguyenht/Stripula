/**
 * Shadow Token Definitions
 * 
 * Light mode: Vintage Banking - warm copper/sepia tinted shadows
 * Dark mode: OPUX glass shadow system
 */

// Vintage Banking shadows - warm sepia-tinted (light mode)
export const shadows = {
  // Subtle shadows for light surfaces - sepia tinted
  subtle: {
    sm: '0 1px 2px hsla(25,35%,18%,0.04)',
    DEFAULT: '0 1px 3px hsla(25,35%,18%,0.05), 0 1px 2px hsla(25,35%,18%,0.04)',
    md: '0 2px 4px hsla(25,35%,18%,0.05), 0 1px 2px hsla(25,35%,18%,0.04)',
  },

  // Elevated shadows for cards and panels - copper warmth
  elevated: {
    sm: '0 2px 6px hsla(25,50%,30%,0.06)',
    DEFAULT: '0 4px 12px hsla(25,50%,30%,0.08), 0 2px 4px hsla(25,35%,18%,0.04)',
    lg: '0 8px 24px hsla(25,50%,30%,0.10), 0 4px 8px hsla(25,35%,18%,0.05)',
  },

  // Hover state shadows - copper accent
  hover: {
    DEFAULT: '0 4px 16px hsla(25,75%,45%,0.12)',
    lg: '0 8px 24px hsla(25,75%,45%,0.15)',
  },

  // Primary accent shadow - copper foil glow
  primaryAccent: '0 0 0 3px hsla(25,75%,45%,0.15)',

  // Card shadow - vintage parchment depth
  card: '0 1px 3px hsla(25,35%,18%,0.05), 0 1px 2px hsla(25,50%,30%,0.03)',
  cardHover: '0 4px 12px hsla(25,75%,45%,0.10), 0 2px 4px hsla(25,35%,18%,0.05)',

  // Popover shadow - deeper sepia
  popover: '0 4px 16px hsla(25,35%,18%,0.12), 0 2px 4px hsla(25,50%,30%,0.06)',

  // Inset shadow for engraved effect
  inset: 'inset 0 1px 2px hsla(25,35%,18%,0.06)',

  // No shadow
  none: 'none',
};

// OPUX glass shadows (dark mode) - unchanged
export const glassShadows = {
  // Standard glass shadow
  glass: 'inset 0 1px 0 hsl(0 0% 100% / 0.05), 0 4px 24px hsl(0 0% 0% / 0.3)',
  glassHover: 'inset 0 1px 0 hsl(0 0% 100% / 0.08), 0 8px 32px hsl(0 0% 0% / 0.4)',
  
  // Elevated glass
  glassElevated: 'inset 0 1px 0 hsl(0 0% 100% / 0.08), 0 8px 32px hsl(0 0% 0% / 0.5)',
  
  // Subtle glass
  glassSubtle: 'inset 0 1px 0 hsl(0 0% 100% / 0.03), 0 2px 12px hsl(0 0% 0% / 0.2)',
};

// Status shadows - vintage banking palette
export const statusShadows = {
  // Antique green for success
  success: '0 0 8px hsla(145,45%,38%,0.20)',
  // Aged gold for warning  
  warning: '0 0 8px hsla(38,70%,50%,0.20)',
  // Burgundy ink for error
  error: '0 0 8px hsla(355,40%,45%,0.20)',
  // Copper for primary/info
  primary: '0 0 8px hsla(25,75%,45%,0.20)',
};

// Tailwind-compatible shadow config (for tailwind.config.js)
export const shadowConfig = {
  // Light mode shadows - vintage banking
  'subtle-sm': shadows.subtle.sm,
  'subtle': shadows.subtle.DEFAULT,
  'subtle-md': shadows.subtle.md,
  'elevated-sm': shadows.elevated.sm,
  'elevated': shadows.elevated.DEFAULT,
  'elevated-lg': shadows.elevated.lg,
  'hover': shadows.hover.DEFAULT,
  'hover-lg': shadows.hover.lg,
  'primary-accent': shadows.primaryAccent,
  'card': shadows.card,
  'card-hover': shadows.cardHover,
  'popover': shadows.popover,
  'inset': shadows.inset,

  // Glass shadows (dark mode)
  'glass': glassShadows.glass,
  'glass-hover': glassShadows.glassHover,
  'glass-elevated': glassShadows.glassElevated,
  'glass-subtle': glassShadows.glassSubtle,
  
  // Status shadows
  'status-success': statusShadows.success,
  'status-warning': statusShadows.warning,
  'status-error': statusShadows.error,
  'status-primary': statusShadows.primary,
};
