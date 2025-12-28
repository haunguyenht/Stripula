import { Shield, Award, Crown, Gem, Sparkles } from 'lucide-react';

/**
 * User tier configuration with icons, styling, and animations
 */
export const tierConfig = {
  free: {
    icon: Sparkles,
    label: 'Starter',
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'ring-violet-500/40',
    glowColor: 'shadow-violet-500/30',
    headerGradient: 'from-violet-100/80 via-purple-50/50 to-white dark:from-violet-500/15 dark:via-violet-500/5 dark:to-transparent',
    iconAnimation: { rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] },
    iconTransition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  },
  bronze: { 
    icon: Shield, 
    label: 'Bronze',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'ring-amber-500/40',
    glowColor: 'shadow-amber-500/30',
    headerGradient: 'from-amber-100/80 via-orange-50/50 to-white dark:from-amber-500/15 dark:via-orange-500/5 dark:to-transparent',
    iconAnimation: { scale: [1, 1.15, 1], opacity: [1, 0.8, 1] },
    iconTransition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
  },
  silver: { 
    icon: Award, 
    label: 'Silver',
    color: 'text-slate-500 dark:text-slate-300',
    bgColor: 'bg-slate-500/10',
    borderColor: 'ring-slate-400/40',
    glowColor: 'shadow-slate-400/30',
    headerGradient: 'from-slate-200/80 via-gray-100/50 to-white dark:from-slate-400/15 dark:via-slate-400/5 dark:to-transparent',
    iconAnimation: { rotateY: [0, 180, 360] },
    iconTransition: { duration: 3, repeat: Infinity, ease: "linear" }
  },
  gold: { 
    icon: Crown, 
    label: 'Gold',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'ring-yellow-500/40',
    glowColor: 'shadow-yellow-500/40',
    headerGradient: 'from-yellow-100/80 via-amber-50/50 to-white dark:from-yellow-500/15 dark:via-amber-500/5 dark:to-transparent',
    iconAnimation: { y: [0, -2, 0], scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] },
    iconTransition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  },
  diamond: { 
    icon: Gem, 
    label: 'Diamond',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'ring-cyan-500/40',
    glowColor: 'shadow-cyan-500/50',
    headerGradient: 'from-cyan-100/80 via-sky-50/50 to-white dark:from-cyan-500/15 dark:via-sky-500/5 dark:to-transparent',
    iconAnimation: { rotate: [0, 360], scale: [1, 1.2, 1] },
    iconTransition: { duration: 4, repeat: Infinity, ease: "linear" }
  },
};

/**
 * Get tier config for a user, with fallback to free
 */
export function getTierConfig(tierName) {
  return tierConfig[tierName] || tierConfig.free;
}


