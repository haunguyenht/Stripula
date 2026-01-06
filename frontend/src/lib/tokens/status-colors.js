/**
 * Status Color Tokens - Dual Theme Design System
 * 
 * Light mode: Vintage Banking - Antique ink tones, sepia warmth
 * Dark mode: Liquid Aurora - Neon glow pulse animations
 * 
 * Used across:
 * - Badge component (badge.jsx)
 * - Card variants (card-variants.js)
 * - Result cards (result-card.jsx)
 */

/**
 * Status type definitions
 */
export const STATUS_TYPES = {
  APPROVED: 'approved',
  LIVE: 'live',
  DEAD: 'dead',
  DECLINED: 'declined',
  ERROR: 'error',
  WARNING: 'warning',
  SUCCESS: 'success',
  CORAL: 'coral',
};

/**
 * Aurora Neon Glow Colors (Dark mode only)
 * RGB values for CSS box-shadow animations
 */
export const auroraGlowColors = {
  // Success states - emerald with cyan aurora tint
  emerald: {
    core: '16, 185, 129',      // Primary glow
    aurora: '34, 211, 238',    // Cyan aurora tint
    bright: '52, 211, 153',    // Highlight pulse
  },
  // Live states - electric cyan
  cyan: {
    core: '6, 182, 212',       // Primary glow
    aurora: '139, 92, 246',    // Indigo aurora tint
    bright: '34, 211, 238',    // Highlight pulse
  },
  // Error/warning states - amber with pink aurora tint
  amber: {
    core: '245, 158, 11',      // Primary glow
    aurora: '236, 72, 153',    // Pink aurora tint
    bright: '251, 191, 36',    // Highlight pulse
  },
  // Coral/3DS states - orange with pink aurora tint
  orange: {
    core: '249, 115, 22',      // Primary glow
    aurora: '236, 72, 153',    // Pink aurora tint
    bright: '251, 146, 60',    // Highlight pulse
  },
  // Dead/declined states - rose with muted glow
  rose: {
    core: '244, 63, 94',       // Primary glow
    aurora: '236, 72, 153',    // Pink aurora tint
    muted: '239, 68, 68',      // Subtle pulse
  },
};

/**
 * Neon glow animation intensity levels
 * Used for generating consistent pulse effects
 */
export const glowIntensity = {
  subtle: { min: 0.15, max: 0.25, blur: 12 },
  medium: { min: 0.25, max: 0.45, blur: 20 },
  bright: { min: 0.35, max: 0.55, blur: 28 },
  intense: { min: 0.45, max: 0.7, blur: 40 },
};

/**
 * Vintage Banking Light Theme Colors
 * Antique ink colors inspired by historical banking documents
 */
export const vintageBankingColors = {
  // Antique green ink - for success/approved
  antiqueGreen: {
    bg: 'hsl(145,45%,92%)',
    border: 'hsl(145,45%,70%)',
    text: 'hsl(145,45%,30%)',
    accent: 'hsl(145,45%,42%)',
  },
  // Teal ledger ink - for live status  
  ledgerTeal: {
    bg: 'hsl(175,40%,92%)',
    border: 'hsl(175,40%,65%)',
    text: 'hsl(175,40%,28%)',
    accent: 'hsl(175,40%,40%)',
  },
  // Burgundy ink - for declined/dead
  burgundyInk: {
    bg: 'hsl(355,35%,94%)',
    border: 'hsl(355,40%,75%)',
    text: 'hsl(355,40%,35%)',
    accent: 'hsl(355,40%,45%)',
  },
  // Sepia warning - for errors/warnings
  sepiaWarning: {
    bg: 'hsl(38,50%,93%)',
    border: 'hsl(38,60%,65%)',
    text: 'hsl(38,60%,30%)',
    accent: 'hsl(38,70%,50%)',
  },
  // Copper accent - for coral/special states
  copperAccent: {
    bg: 'hsl(25,45%,93%)',
    border: 'hsl(25,75%,55%)',
    text: 'hsl(25,35%,25%)',
    accent: 'hsl(25,75%,45%)',
  },
};

/**
 * Status color palette - Dual theme
 * Light: Vintage Banking antique inks
 * Dark: Liquid Aurora neon glows
 */
export const statusColors = {
  // ✅ APPROVED/CHARGED - Antique green ink / Emerald neon
  approved: {
    light: {
      bg: 'from-[hsl(145,45%,92%)] to-[hsl(145,40%,95%)]',
      border: 'border-[hsl(145,45%,70%)]',
      text: 'text-[hsl(145,45%,30%)]',
      shadow: 'shadow-[0_0_8px_hsla(145,45%,42%,0.15)]',
    },
    dark: {
      bg: 'from-emerald-500/90 to-emerald-400/85',
      border: 'border-emerald-400/50',
      text: 'text-white',
      shadow: `shadow-[0_0_20px_rgba(16,185,129,0.5),0_0_40px_rgba(34,211,238,0.2),0_0_60px_rgba(16,185,129,0.15)]`,
      animation: 'animate-neon-pulse-emerald',
      glow: auroraGlowColors.emerald,
    },
  },
  
  // 🔵 LIVE - Ledger teal ink / Electric cyan neon
  live: {
    light: {
      bg: 'from-[hsl(175,40%,92%)] to-[hsl(175,35%,95%)]',
      border: 'border-[hsl(175,40%,65%)]',
      text: 'text-[hsl(175,40%,28%)]',
      shadow: 'shadow-[0_0_8px_hsla(175,40%,40%,0.15)]',
    },
    dark: {
      bg: 'from-cyan-400/95 to-cyan-500/90',
      border: 'border-cyan-300/60',
      text: 'text-white',
      shadow: `shadow-[0_0_24px_rgba(34,211,238,0.55),0_0_48px_rgba(139,92,246,0.25),0_0_72px_rgba(34,211,238,0.15)]`,
      animation: 'animate-neon-pulse-cyan',
      glow: auroraGlowColors.cyan,
    },
  },
  
  // 🔴 DEAD - Burgundy ink / Muted rose
  dead: {
    light: {
      bg: 'from-[hsl(355,35%,94%)] to-[hsl(355,30%,96%)]',
      border: 'border-[hsl(355,40%,75%)]',
      text: 'text-[hsl(355,40%,35%)]',
      shadow: 'shadow-sm',
    },
    dark: {
      bg: 'from-red-500/12 to-red-600/08',
      border: 'border-red-500/25',
      text: 'text-red-400',
      shadow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_8px_rgba(239,68,68,0.1)]',
      animation: null,
    },
  },
  
  // ❌ DECLINED - Burgundy ink (lighter) / Rose muted
  declined: {
    light: {
      bg: 'from-[hsl(355,35%,95%)] to-[hsl(355,30%,97%)]',
      border: 'border-[hsl(355,35%,80%)]',
      text: 'text-[hsl(355,40%,40%)]',
      shadow: 'shadow-sm',
    },
    dark: {
      bg: 'from-rose-500/12 to-pink-500/08',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      shadow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_10px_rgba(244,63,94,0.12)]',
      animation: null,
    },
  },
  
  // ⚠️ ERROR - Sepia warning ink / Amber neon
  error: {
    light: {
      bg: 'from-[hsl(38,50%,93%)] to-[hsl(38,45%,96%)]',
      border: 'border-[hsl(38,60%,65%)]',
      text: 'text-[hsl(38,60%,30%)]',
      shadow: 'shadow-[0_0_6px_hsla(38,70%,50%,0.15)]',
    },
    dark: {
      bg: 'from-amber-500/20 to-orange-500/15',
      border: 'border-amber-500/40',
      text: 'text-amber-400',
      shadow: `shadow-[0_0_16px_rgba(251,191,36,0.35),0_0_32px_rgba(236,72,153,0.15)]`,
      animation: 'animate-neon-pulse-amber',
      glow: auroraGlowColors.amber,
    },
  },

  // 🔶 CORAL - Copper accent ink / Orange neon
  coral: {
    light: {
      bg: 'from-[hsl(25,45%,93%)] to-[hsl(25,40%,96%)]',
      border: 'border-[hsl(25,75%,55%)]',
      text: 'text-[hsl(25,35%,25%)]',
      shadow: 'shadow-[0_0_8px_hsla(25,75%,45%,0.15)]',
    },
    dark: {
      bg: 'from-orange-500/90 to-amber-500/85',
      border: 'border-orange-400/55',
      text: 'text-white',
      shadow: `shadow-[0_0_22px_rgba(251,146,60,0.5),0_0_44px_rgba(236,72,153,0.2),0_0_66px_rgba(249,115,22,0.12)]`,
      animation: 'animate-neon-pulse-orange',
      glow: auroraGlowColors.orange,
    },
  },
};

/**
 * Card left-border status colors
 * Light: Vintage banking ink colors
 * Dark: Aurora glow colors
 */
export const cardStatusBorders = {
  live: 'border-l-[hsl(175,40%,40%)] dark:border-l-[#22d3ee]',
  dead: 'border-l-[hsl(355,40%,45%)] dark:border-l-[#ef4444]',
  approved: 'border-l-[hsl(145,45%,42%)] dark:border-l-[#10b981]',
  error: 'border-l-[hsl(38,70%,50%)] dark:border-l-[#fbbf24]',
  declined: 'border-l-[hsl(355,40%,50%)] dark:border-l-[#fb7185]',
};

/**
 * Get Tailwind classes for a status badge
 * @param {string} status - The status type
 * @returns {string} Tailwind classes for badge styling
 */
export function getStatusBadgeClasses(status) {
  const colors = statusColors[status];
  if (!colors) return '';
  
  const baseClasses = [
    // Light mode
    `bg-gradient-to-r ${colors.light.bg}`,
    colors.light.border,
    colors.light.text,
    colors.light.shadow,
    // Dark mode
    `dark:bg-gradient-to-r dark:${colors.dark.bg}`,
    `dark:${colors.dark.border}`,
    `dark:${colors.dark.text}`,
    `dark:${colors.dark.shadow}`,
  ];
  
  // Add animation class if defined
  if (colors.dark.animation) {
    baseClasses.push(`dark:${colors.dark.animation}`);
  }
  
  return baseClasses.join(' ');
}

/**
 * Status dot colors for indicators
 * Light: Vintage banking colors
 * Dark: Neon glow
 */
export const statusDotColors = {
  online: 'bg-[hsl(145,45%,42%)] dark:bg-emerald-500 dark:shadow-[0_0_8px_rgba(16,185,129,0.6)]',
  offline: 'bg-[hsl(355,40%,45%)] dark:bg-rose-500 dark:shadow-[0_0_6px_rgba(244,63,94,0.4)]',
  degraded: 'bg-[hsl(38,70%,50%)] dark:bg-amber-500 dark:shadow-[0_0_6px_rgba(245,158,11,0.5)]',
  maintenance: 'bg-[hsl(38,60%,55%)] dark:bg-amber-400 dark:shadow-[0_0_6px_rgba(251,191,36,0.4)]',
  disabled: 'bg-[hsl(25,20%,60%)] dark:bg-muted-foreground',
};

/**
 * Neon glow CSS custom properties for animations (Dark mode)
 * These are injected via CSS variables for dynamic glow effects
 */
export const neonGlowProperties = {
  emerald: {
    '--neon-core': 'rgba(16, 185, 129, 0.5)',
    '--neon-aurora': 'rgba(34, 211, 238, 0.2)',
    '--neon-outer': 'rgba(16, 185, 129, 0.15)',
    '--neon-core-intense': 'rgba(52, 211, 153, 0.65)',
    '--neon-aurora-intense': 'rgba(34, 211, 238, 0.35)',
    '--neon-outer-intense': 'rgba(16, 185, 129, 0.25)',
  },
  cyan: {
    '--neon-core': 'rgba(34, 211, 238, 0.55)',
    '--neon-aurora': 'rgba(139, 92, 246, 0.25)',
    '--neon-outer': 'rgba(34, 211, 238, 0.15)',
    '--neon-core-intense': 'rgba(34, 211, 238, 0.7)',
    '--neon-aurora-intense': 'rgba(139, 92, 246, 0.4)',
    '--neon-outer-intense': 'rgba(34, 211, 238, 0.25)',
  },
  amber: {
    '--neon-core': 'rgba(251, 191, 36, 0.35)',
    '--neon-aurora': 'rgba(236, 72, 153, 0.15)',
    '--neon-outer': 'rgba(245, 158, 11, 0.1)',
    '--neon-core-intense': 'rgba(251, 191, 36, 0.5)',
    '--neon-aurora-intense': 'rgba(236, 72, 153, 0.25)',
    '--neon-outer-intense': 'rgba(245, 158, 11, 0.2)',
  },
  orange: {
    '--neon-core': 'rgba(251, 146, 60, 0.5)',
    '--neon-aurora': 'rgba(236, 72, 153, 0.2)',
    '--neon-outer': 'rgba(249, 115, 22, 0.12)',
    '--neon-core-intense': 'rgba(251, 146, 60, 0.65)',
    '--neon-aurora-intense': 'rgba(236, 72, 153, 0.35)',
    '--neon-outer-intense': 'rgba(249, 115, 22, 0.22)',
  },
};

export default statusColors;
