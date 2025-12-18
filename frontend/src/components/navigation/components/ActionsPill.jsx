import { Coins, Plus } from 'lucide-react';
import { NavPill } from './NavPill';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UserProfileBadge } from '@/components/ui/user-profile-badge';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * ActionsPill - Right navbar section with credits, theme toggle, and profile menu
 * 
 * OPUX styled with clear interactive hints
 * 
 * @param {Object} user - User object { name, email, tier, credits }
 */
export function ActionsPill({ user }) {
  const credits = user?.credits ?? 100;
  const isLowCredits = credits < 20;

  return (
    <NavPill className="flex items-center gap-1 px-1.5" delay={0.1}>
      {/* Credits display with add button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            className={cn(
              "flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-all duration-300",
              // Light mode: OrangeAI hover style
              "hover:bg-[rgb(248,247,247)] dark:hover:bg-white/10",
              "group cursor-pointer",
              isLowCredits && "animate-pulse"
            )}
          >
            <Coins className={cn(
              "h-4 w-4 transition-colors",
              isLowCredits ? "text-red-400" : "text-amber-500 dark:text-amber-400"
            )} />
            <span className={cn(
              "text-sm font-semibold tabular-nums",
              // Light mode: OrangeAI dark text
              "text-[rgb(37,27,24)] dark:text-white/90",
              isLowCredits && "text-red-500 dark:text-red-400"
            )}>
              {credits.toLocaleString()}
            </span>
            <Plus className={cn(
              "h-3 w-3 transition-colors duration-300",
              "text-[rgb(145,134,131)] group-hover:text-[rgb(255,64,23)]",
              "dark:text-muted-foreground dark:group-hover:text-white"
            )} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p>{isLowCredits ? 'Low credits! Click to add more' : 'Click to add credits'}</p>
        </TooltipContent>
      </Tooltip>
      
      {/* Separator */}
      <div className="h-5 w-px bg-[rgb(237,234,233)] dark:bg-white/10" />
      
      {/* Theme Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <ThemeToggle />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p>Toggle theme</p>
        </TooltipContent>
      </Tooltip>
      
      {/* Profile Menu */}
      <UserProfileBadge user={user} />
    </NavPill>
  );
}



