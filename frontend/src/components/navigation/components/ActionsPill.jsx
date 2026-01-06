import { Coins, Sparkles, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * ActionsPill - Clean & Minimal Credit Display
 * 
 * LIGHT MODE: Clean Metal
 * - Subtle copper gradient with minimal bezel
 * - Clean typography
 * 
 * DARK MODE: Clean Glass
 * - Subtle glass morphism with inner glow
 * - Minimal aurora tint
 */
export function ActionsPill({ user, onNavigate }) {
  const credits = user?.credits ?? 0;
  const isLowCredits = credits < 20;

  const handleCreditsClick = () => {
    if (onNavigate) onNavigate('profile');
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button 
          onClick={handleCreditsClick}
          className={cn(
            // Base layout - mobile-first
            "group relative flex items-center cursor-pointer",
            "gap-2 md:gap-2.5",
            "px-2.5 md:px-3.5",
            "py-1.5 md:py-2",
            "rounded-full",
            "transition-all duration-300",
            
            // ═══════════════════════════════════════════════════════════
            // LIGHT MODE: Clean Copper Pill
            // ═══════════════════════════════════════════════════════════
            "bg-gradient-to-br from-[hsl(40,50%,98%)] to-[hsl(35,40%,94%)]",
            "border border-[hsl(30,30%,85%)]",
            "shadow-sm",
            "hover:bg-[hsl(40,60%,99%)]",
            "hover:border-[hsl(30,40%,80%)]",
            "hover:shadow-md",
            
            // ═══════════════════════════════════════════════════════════
            // DARK MODE: Clean Aurora Glass
            // ═══════════════════════════════════════════════════════════
            "dark:bg-none dark:bg-white/[0.04]",
            "dark:backdrop-blur-md",
            "dark:border dark:border-white/[0.08]",
            "dark:shadow-none",
            "dark:hover:bg-white/[0.08]",
            "dark:hover:border-white/[0.15]",
            
            // Low credits state
            isLowCredits && [
              "border-rose-200 bg-rose-50/50",
              "dark:border-rose-500/30 dark:bg-rose-500/10"
            ]
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Simple Clean Coin/Gem */}
          <div className="relative shrink-0">
            {/* Ambient Glow (very subtle) */}
            <div className={cn(
              "absolute inset-0 rounded-full blur-sm opacity-50",
              isLowCredits
                ? "bg-rose-400"
                : "bg-amber-400 dark:bg-cyan-400"
            )} />

            <div className={cn(
              "relative flex items-center justify-center rounded-full",
              "w-6 h-6 md:w-7 md:h-7",
              // Light: Clean copper/gold gradient
              "bg-gradient-to-br from-[hsl(40,80%,60%)] to-[hsl(30,70%,50%)]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
              
              // Dark: Deep glass gradient
              "dark:from-violet-600 dark:to-cyan-600",
              "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",

              isLowCredits && "from-rose-400 to-red-500 dark:from-rose-500 dark:to-red-600"
            )}>
              {isLowCredits ? (
                <AlertTriangle className="w-3.5 h-3.5 text-white" />
              ) : (
                <Coins className="w-3.5 h-3.5 text-white" />
              )}
            </div>
          </div>

          {/* Credit Amount */}
          <span className={cn(
            "font-bold tabular-nums text-sm",
            "text-[hsl(25,30%,30%)]",
            "dark:text-white",
            isLowCredits && "text-rose-600 dark:text-rose-300"
          )}>
            {credits.toLocaleString()}
          </span>

          {/* Subtle Sparkle on Hover */}
          <motion.div
            className="absolute -top-1 -right-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            initial={{ scale: 0.5, rotate: 0 }}
            animate={{ scale: 1, rotate: 180 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className={cn(
              "w-3 h-3 text-amber-500 dark:text-cyan-400"
            )} />
          </motion.div>
        </motion.button>
      </TooltipTrigger>
      
      <TooltipContent side="bottom" className="text-xs font-medium">
        <p>{isLowCredits ? "Low balance" : "Manage credits"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
