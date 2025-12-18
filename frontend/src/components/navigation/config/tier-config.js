import { Shield, Award, Crown, Gem } from 'lucide-react';

/**
 * User tier configuration with icons and styling
 */
export const tierConfig = {
  bronze: { 
    icon: Shield, 
    label: 'Bronze',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  silver: { 
    icon: Award, 
    label: 'Silver',
    color: 'text-slate-500 dark:text-slate-300',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
  },
  gold: { 
    icon: Crown, 
    label: 'Gold',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
  },
  diamond: { 
    icon: Gem, 
    label: 'Diamond',
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
  },
};

/**
 * Get tier config for a user, with fallback to bronze
 */
export function getTierConfig(tierName) {
  return tierConfig[tierName] || tierConfig.bronze;
}


