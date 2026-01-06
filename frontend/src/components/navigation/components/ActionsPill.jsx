import { Coins, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * ActionsPill - Holographic Crystal Coin Display
 * 
 * Premium floating credit counter featuring:
 * - 3D holographic coin with rotating aurora reflections
 * - Crystalline glass container with prismatic edges
 * - Animated sparkle effects on hover
 * - Pulsing warning glow when credits are low
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
            // Mobile-first: very compact on small screens
            "relative flex items-center",
            "gap-1 xs:gap-1.5 md:gap-2.5",
            "px-1.5 xs:px-2 md:px-3",
            "py-1 xs:py-1.5 md:py-2",
            "rounded-lg md:rounded-2xl cursor-pointer",
            "transition-all duration-400",
            // Light mode: Vintage copper coin aesthetic
            "bg-gradient-to-br from-[hsl(38,50%,96%)] to-[hsl(35,45%,92%)]",
            "border border-[hsl(30,40%,80%)]",
            "shadow-[0_2px_8px_rgba(101,67,33,0.1),inset_0_1px_0_rgba(255,255,255,0.8)]",
            "hover:shadow-[0_4px_16px_rgba(101,67,33,0.15)]",
            // ═══════════════════════════════════════════════════════════
            // DARK MODE: Holographic Crystal Container
            // ═══════════════════════════════════════════════════════════
            "dark:bg-gradient-to-br dark:from-[rgba(20,24,35,0.9)] dark:via-[rgba(25,30,45,0.85)] dark:to-[rgba(20,24,35,0.9)]",
            "dark:backdrop-blur-xl",
            // Prismatic aurora border
            "dark:border dark:border-transparent",
            "dark:[background-image:linear-gradient(135deg,rgba(20,24,35,0.9),rgba(25,30,45,0.85),rgba(20,24,35,0.9)),linear-gradient(135deg,rgba(251,191,36,0.4),rgba(245,158,11,0.3),rgba(251,191,36,0.4))]",
            "dark:[background-origin:border-box] dark:[background-clip:padding-box,border-box]",
            // Ambient glow
            "dark:shadow-[0_0_20px_-6px_rgba(251,191,36,0.25),inset_0_1px_0_rgba(255,255,255,0.06)]",
            // Hover: Intensify glow
            "dark:hover:shadow-[0_0_30px_-6px_rgba(251,191,36,0.4),0_0_15px_-4px_rgba(251,191,36,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]",
            // Low credits: Red warning pulse
            isLowCredits && [
              "dark:animate-pulse",
              "dark:[background-image:linear-gradient(135deg,rgba(20,24,35,0.9),rgba(25,30,45,0.85),rgba(20,24,35,0.9)),linear-gradient(135deg,rgba(244,63,94,0.5),rgba(239,68,68,0.4),rgba(244,63,94,0.5))]",
              "dark:shadow-[0_0_24px_-4px_rgba(244,63,94,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]"
            ]
          )}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Holographic Coin Icon - smaller on mobile */}
          <div className="relative shrink-0">
            {/* Rotating aurora reflection behind coin */}
            <motion.div
              className={cn(
                "absolute inset-0 rounded-full opacity-0 dark:opacity-100",
                isLowCredits 
                  ? "bg-gradient-to-r from-rose-500/40 via-red-400/30 to-rose-500/40"
                  : "bg-gradient-to-r from-amber-400/50 via-yellow-300/40 to-amber-400/50",
                "blur-md"
              )}
              animate={{ 
                rotate: [0, 360],
                scale: [0.8, 1.1, 0.8]
              }}
              transition={{ 
                rotate: { duration: 6, repeat: Infinity, ease: 'linear' },
                scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              }}
            />
            
            {/* The coin itself - mobile-first sizing */}
            <motion.div
              className={cn(
                "relative rounded-full flex items-center justify-center",
                "w-5 h-5 xs:w-6 xs:h-6 md:w-7 md:h-7",
                // Light mode: Copper coin
                "bg-gradient-to-br from-[hsl(25,75%,55%)] via-[hsl(30,80%,50%)] to-[hsl(25,70%,40%)]",
                "shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2),0_2px_6px_rgba(101,67,33,0.3)]",
                // Dark mode: Holographic gold coin
                "dark:bg-gradient-to-br dark:from-amber-400 dark:via-yellow-300 dark:to-amber-500",
                "dark:shadow-[inset_0_2px_6px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.3),0_0_12px_-2px_rgba(251,191,36,0.6)]",
                // Low credits: Red coin
                isLowCredits && "dark:from-rose-400 dark:via-red-300 dark:to-rose-500 dark:shadow-[inset_0_2px_6px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.3),0_0_12px_-2px_rgba(244,63,94,0.6)]"
              )}
              animate={isLowCredits ? {
                rotate: [0, -15, 15, -15, 0],
                scale: [1, 1.1, 1]
              } : {
                rotateY: [0, 180, 360]
              }}
              transition={isLowCredits ? {
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 3
              } : {
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {isLowCredits ? (
                <TrendingUp className="h-2.5 w-2.5 xs:h-3 xs:w-3 md:h-3.5 md:w-3.5 text-white drop-shadow-sm" style={{ transform: 'rotate(-45deg)' }} />
              ) : (
                <Coins className="h-2.5 w-2.5 xs:h-3 xs:w-3 md:h-3.5 md:w-3.5 text-amber-900 dark:text-amber-800 drop-shadow-sm" />
              )}
            </motion.div>
          </div>

          {/* Credit Amount - Holographic Text */}
          <div className="flex flex-col items-start">
            <motion.span 
              className={cn(
                "font-bold tabular-nums tracking-tight leading-none",
                "text-[11px] xs:text-xs md:text-sm",
                // Light mode
                "text-[hsl(25,50%,25%)]",
                // Dark mode: Holographic gold gradient
                isLowCredits
                  ? "dark:text-rose-300"
                  : "dark:bg-gradient-to-r dark:from-amber-200 dark:via-yellow-100 dark:to-amber-200 dark:bg-clip-text dark:text-transparent"
              )}
              style={{ fontFamily: 'var(--font-mono)' }}
              animate={isLowCredits ? { opacity: [1, 0.6, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {credits.toLocaleString()}
            </motion.span>
            {/* Hide "credits" label on mobile - show only on md+ */}
            <span className={cn(
              "text-[8px] md:text-[9px] font-medium uppercase tracking-wider",
              "text-[hsl(25,30%,50%)]",
              "dark:text-white/40",
              "hidden md:block"
            )}>
              credits
            </span>
          </div>

          {/* Sparkle effect on hover (dark mode only) */}
          <motion.div
            className="absolute -top-1 -right-1 opacity-0 dark:group-hover:opacity-100 pointer-events-none"
            animate={{ 
              scale: [0.8, 1.2, 0.8],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <Sparkles className="h-3 w-3 text-amber-300" />
          </motion.div>
        </motion.button>
      </TooltipTrigger>
      
      <TooltipContent 
        side="bottom" 
        className={cn(
          "text-xs font-medium px-3 py-2",
          // Dark mode: Premium tooltip
          "dark:bg-gradient-to-br dark:from-[rgba(20,24,35,0.98)] dark:to-[rgba(25,30,45,0.98)]",
          "dark:border-amber-500/20 dark:text-amber-100",
          "dark:shadow-[0_0_20px_-4px_rgba(251,191,36,0.3)]"
        )}
      >
        <p className="flex items-center gap-1.5">
          {isLowCredits ? (
            <>
              <TrendingUp className="h-3 w-3 text-rose-400" style={{ transform: 'rotate(-45deg)' }} />
              <span>Low balance! Tap to add credits</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Tap to manage credits</span>
            </>
          )}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
