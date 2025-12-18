import { cn } from '@/lib/utils';
import { NavPill } from './NavPill';
import { getTierConfig } from '../config/tier-config';

/**
 * UserPill - Left navbar section with user avatar and tier
 * 
 * OPUX compact design: Avatar with tier indicator
 * Shows name only on larger screens
 * 
 * @param {Object} user - User object { name, email, tier, credits }
 */
export function UserPill({ user }) {
  const tier = getTierConfig(user?.tier);
  const TierIcon = tier.icon;

  return (
    <NavPill className="flex items-center gap-2 px-2" delay={0}>
      {/* User Avatar with tier ring */}
      <div className="relative">
        <div className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
          // Light mode: OrangeAI orange gradient
          "bg-gradient-to-br from-[rgb(255,64,23)] to-[rgb(220,50,15)] text-white",
          // Dark mode: keep original
          "dark:from-primary/60 dark:to-primary/40 dark:text-white",
          "ring-2 ring-offset-1 ring-offset-transparent",
          tier.borderColor
        )}>
          {(user?.name || 'U').charAt(0).toUpperCase()}
        </div>
        {/* Online indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-[#2e2e2e]" />
      </div>
      
      {/* Tier icon - always visible, compact */}
      <div className={cn(
        "flex items-center gap-1",
        tier.color
      )}>
        {TierIcon && <TierIcon className="h-3.5 w-3.5" />}
        {/* Name - hidden on small screens */}
        <span className="hidden lg:inline text-xs font-semibold truncate max-w-[60px] text-[rgb(37,27,24)] dark:text-white/90">
          {user?.name || 'User'}
        </span>
      </div>
    </NavPill>
  );
}



