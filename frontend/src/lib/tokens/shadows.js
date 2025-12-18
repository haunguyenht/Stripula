/**
 * Shadow Token Definitions
 * 
 * Minimal shadow system for light mode
 * OPUX glass shadow system for dark mode
 */

// Minimal shadows - subtle and refined (light mode)
export const shadows = {
  // Subtle shadows for light surfaces
  subtle: {
    sm: '0 1px 2px rgba(0,0,0,0.03)',
    DEFAULT: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
    md: '0 2px 4px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
  },

  // Elevated shadows for cards and panels
  elevated: {
    sm: '0 2px 6px rgba(0,0,0,0.04)',
    DEFAULT: '0 4px 12px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)',
    lg: '0 8px 24px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.03)',
  },

  // Hover state shadows
  hover: {
    DEFAULT: '0 4px 16px rgba(0,0,0,0.06)',
    lg: '0 8px 24px rgba(0,0,0,0.08)',
  },

  // Primary accent shadow
  primaryAccent: '0 0 0 3px hsl(var(--primary) / 0.1)',

  // Card shadow - minimal
  card: '0 1px 3px rgba(0,0,0,0.04)',
  cardHover: '0 4px 12px rgba(0,0,0,0.06)',

  // Popover shadow
  popover: '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',

  // No shadow
  none: 'none',
};

// OPUX glass shadows (dark mode)
export const glassShadows = {
  // Standard glass shadow
  glass: 'inset 0 1px 0 hsl(0 0% 100% / 0.05), 0 4px 24px hsl(0 0% 0% / 0.3)',
  glassHover: 'inset 0 1px 0 hsl(0 0% 100% / 0.08), 0 8px 32px hsl(0 0% 0% / 0.4)',
  
  // Elevated glass
  glassElevated: 'inset 0 1px 0 hsl(0 0% 100% / 0.08), 0 8px 32px hsl(0 0% 0% / 0.5)',
  
  // Subtle glass
  glassSubtle: 'inset 0 1px 0 hsl(0 0% 100% / 0.03), 0 2px 12px hsl(0 0% 0% / 0.2)',
};

// Status shadows for badges/indicators
export const statusShadows = {
  success: '0 0 8px hsl(142 71% 45% / 0.15)',
  warning: '0 0 8px hsl(38 92% 50% / 0.15)',
  error: '0 0 8px hsl(0 62% 30% / 0.15)',
};

// Tailwind-compatible shadow config (for tailwind.config.js)
export const shadowConfig = {
  // Light mode shadows
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

  // Glass shadows (dark mode)
  'glass': glassShadows.glass,
  'glass-hover': glassShadows.glassHover,
  'glass-elevated': glassShadows.glassElevated,
  'glass-subtle': glassShadows.glassSubtle,
  
  // Status shadows
  'status-success': statusShadows.success,
  'status-warning': statusShadows.warning,
  'status-error': statusShadows.error,
};
