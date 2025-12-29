import { Shield, Award, Crown, Gem, Sparkles } from 'lucide-react';

/**
 * User tier configuration with icons, styling, and animations
 * 
 * This is the single source of truth for tier styling across the app.
 * Used by: ProfilePage, DailyClaimCard, SpeedComparison, UserPill, etc.
 */
export const tierConfig = {
  free: {
    // Identity
    icon: Sparkles,
    label: 'Starter',
    
    // Text colors
    color: 'text-violet-600 dark:text-violet-400',
    
    // Background colors
    bgColor: 'bg-violet-500/10',
    bgGradient: 'from-violet-500/20 via-purple-500/10 to-fuchsia-500/20',
    
    // Border & ring colors
    borderColor: 'ring-violet-500/40',
    ringColor: 'ring-violet-500/50',
    
    // Shadow/glow effects
    glowColor: 'shadow-violet-500/30',
    
    // Header gradient (for profile cards)
    headerGradient: 'from-violet-100/80 via-purple-50/50 to-white dark:from-violet-500/15 dark:via-violet-500/5 dark:to-transparent',
    
    // Badge variant for shadcn Badge component
    badgeVariant: 'secondary',
    
    // Progress bar gradient colors (for daily claim, etc.)
    progressGradient: {
      from: '#8b5cf6', // violet-500
      to: '#a78bfa',   // violet-400
    },
    
    // Icon animations
    iconAnimation: { rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] },
    iconTransition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    
    // Ring pulse animation (for avatar)
    ringAnimation: { 
      scale: [1, 1.15, 1],
      opacity: [0.5, 0.8, 0.5]
    },
    ringTransition: { 
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
  
  bronze: { 
    icon: Shield, 
    label: 'Bronze',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    bgGradient: 'from-amber-500/20 via-orange-500/10 to-yellow-500/20',
    borderColor: 'ring-amber-500/40',
    ringColor: 'ring-amber-500/50',
    glowColor: 'shadow-amber-500/30',
    headerGradient: 'from-amber-100/80 via-orange-50/50 to-white dark:from-amber-500/15 dark:via-orange-500/5 dark:to-transparent',
    badgeVariant: 'warning',
    progressGradient: {
      from: '#d97706', // amber-600
      to: '#f59e0b',   // amber-500
    },
    iconAnimation: { scale: [1, 1.15, 1], opacity: [1, 0.8, 1] },
    iconTransition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
    ringAnimation: { 
      scale: [1, 1.12, 1],
      opacity: [0.5, 0.75, 0.5]
    },
    ringTransition: { 
      duration: 1.8,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
  
  silver: { 
    icon: Award, 
    label: 'Silver',
    color: 'text-slate-500 dark:text-slate-300',
    bgColor: 'bg-slate-500/10',
    bgGradient: 'from-slate-400/20 via-gray-400/10 to-zinc-400/20',
    borderColor: 'ring-slate-400/40',
    ringColor: 'ring-slate-400/50',
    glowColor: 'shadow-slate-400/30',
    headerGradient: 'from-slate-200/80 via-gray-100/50 to-white dark:from-slate-400/15 dark:via-slate-400/5 dark:to-transparent',
    badgeVariant: 'outline',
    progressGradient: {
      from: '#94a3b8', // slate-400
      to: '#64748b',   // slate-500
    },
    iconAnimation: { rotateY: [0, 180, 360] },
    iconTransition: { duration: 3, repeat: Infinity, ease: "linear" },
    ringAnimation: { 
      scale: [1, 1.1, 1],
      opacity: [0.4, 0.7, 0.4]
    },
    ringTransition: { 
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
  
  gold: { 
    icon: Crown, 
    label: 'Gold',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    bgGradient: 'from-yellow-500/20 via-amber-400/10 to-orange-400/20',
    borderColor: 'ring-yellow-500/40',
    ringColor: 'ring-yellow-500/50',
    glowColor: 'shadow-yellow-500/40',
    headerGradient: 'from-yellow-100/80 via-amber-50/50 to-white dark:from-yellow-500/15 dark:via-amber-500/5 dark:to-transparent',
    badgeVariant: 'warning',
    progressGradient: {
      from: '#facc15', // yellow-400
      to: '#ca8a04',   // yellow-600
    },
    iconAnimation: { y: [0, -2, 0], scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] },
    iconTransition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    ringAnimation: { 
      scale: [1, 1.18, 1],
      opacity: [0.5, 0.85, 0.5]
    },
    ringTransition: { 
      duration: 1.6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
  
  diamond: { 
    icon: Gem, 
    label: 'Diamond',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    bgGradient: 'from-cyan-500/20 via-sky-400/10 to-blue-500/20',
    borderColor: 'ring-cyan-500/40',
    ringColor: 'ring-cyan-500/50',
    glowColor: 'shadow-cyan-500/50',
    headerGradient: 'from-cyan-100/80 via-sky-50/50 to-white dark:from-cyan-500/15 dark:via-sky-500/5 dark:to-transparent',
    badgeVariant: 'live',
    progressGradient: {
      from: '#22d3ee', // cyan-400
      to: '#3b82f6',   // blue-500
    },
    iconAnimation: { rotate: [0, 360], scale: [1, 1.2, 1] },
    iconTransition: { duration: 4, repeat: Infinity, ease: "linear" },
    ringAnimation: { 
      scale: [1, 1.2, 1],
      opacity: [0.6, 0.9, 0.6]
    },
    ringTransition: { 
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
};

/**
 * Get tier config for a user, with fallback to free
 * @param {string} tierName - Tier name (free, bronze, silver, gold, diamond)
 * @returns {Object} Tier configuration object
 */
export function getTierConfig(tierName) {
  return tierConfig[tierName] || tierConfig.free;
}

/**
 * Get all tier names in order (for iteration)
 */
export const TIER_ORDER = ['free', 'bronze', 'silver', 'gold', 'diamond'];

/**
 * Check if a tier is higher than another
 * @param {string} tier1 - First tier name
 * @param {string} tier2 - Second tier name
 * @returns {boolean} True if tier1 is higher than tier2
 */
export function isTierHigher(tier1, tier2) {
  return TIER_ORDER.indexOf(tier1) > TIER_ORDER.indexOf(tier2);
}
