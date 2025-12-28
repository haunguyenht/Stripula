import { Coins, Plus } from 'lucide-react';
import { NavPill } from './NavPill';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * ActionsPill - Left navbar section with credits and theme toggle
 * 
 * OPUX styled with clear interactive hints
 * 
 * @param {Object} user - User object { name, email, tier, credits }
 * @param {Function} onNavigate - Navigation handler
 */
export function ActionsPill({ user, onNavigate }) {
  const credits = user?.credits ?? 0;
  const isLowCredits = credits < 20;

  const handleCreditsClick = () => {
    if (onNavigate) onNavigate('profile');
  };

  return (
    <NavPill className="flex items-center gap-1 px-1.5" delay={0.1}>
      {/* Credits display with add button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={handleCreditsClick}
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
      
    </NavPill>
  );
}



