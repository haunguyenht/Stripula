import { Coins, Sparkles, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * ActionsPill - Cyberpunk Credit Display
 * 
 * LIGHT MODE: Vintage Banking
 * - Frosted cream glass with copper/amber accents
 * - Metallic coin icon with warm glow
 * 
 * DARK MODE: Cyberpunk Neon
 * - Deep glass with neon cyan edge glow
 * - Electric pulse animation on coin
 * - Tech-styled credit counter
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
            // LIGHT MODE: Vintage Banking Glass
            // ═══════════════════════════════════════════════════════════
            "bg-gradient-to-br from-white/90 to-[hsl(40,30%,96%)]/80",
            "border border-[hsl(30,20%,82%)]",
            "shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]",
            "hover:bg-gradient-to-br hover:from-white hover:to-[hsl(38,35%,95%)]/90",
            "hover:border-[hsl(25,40%,70%)]",
            "hover:shadow-[0_4px_16px_rgba(180,120,70,0.12)]",
            
            // ═══════════════════════════════════════════════════════════
            // DARK MODE: Cyberpunk Neon
            // ═══════════════════════════════════════════════════════════
            "dark:bg-none dark:bg-[rgba(8,12,20,0.85)]",
            "dark:backdrop-blur-xl dark:backdrop-saturate-150",
            "dark:border dark:border-[rgba(0,240,255,0.2)]",
            "dark:shadow-[0_0_1px_rgba(0,240,255,0.4),inset_0_1px_0_rgba(0,240,255,0.05)]",
            // Hover: Neon glow
            "dark:hover:bg-[rgba(0,240,255,0.08)]",
            "dark:hover:border-[rgba(0,240,255,0.5)]",
            "dark:hover:shadow-[0_0_20px_-4px_rgba(0,240,255,0.5),0_0_30px_-6px_rgba(255,0,128,0.2),inset_0_1px_0_rgba(0,240,255,0.1)]",
            
            // Low credits state
            isLowCredits && [
              "border-rose-300/60 bg-gradient-to-br from-rose-50/50 to-white/80",
              "dark:border-[rgba(255,50,100,0.4)] dark:bg-[rgba(255,50,100,0.1)]",
              "dark:shadow-[0_0_15px_-4px_rgba(255,50,100,0.5)]"
            ]
          )}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Coin/Gem Icon */}
          <div className="relative shrink-0">
            {/* Neon glow ring */}
            <motion.div 
              className={cn(
                "absolute -inset-0.5 rounded-full blur-sm",
                isLowCredits
                  ? "bg-[rgba(255,50,100,0.6)]"
                  : "bg-amber-400/40 dark:bg-[rgba(0,240,255,0.6)]"
              )}
              animate={{
                opacity: [0.4, 0.8, 0.4],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            <div className={cn(
              "relative flex items-center justify-center rounded-full",
              "w-6 h-6 md:w-7 md:h-7",
              // Light: Copper/gold gradient
              "bg-gradient-to-br from-[hsl(40,75%,55%)] to-[hsl(30,65%,45%)]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.1)]",
              
              // Dark: Neon cyan gradient
              "dark:from-[rgba(0,240,255,1)] dark:to-[rgba(0,180,220,0.9)]",
              "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_0_12px_-2px_rgba(0,240,255,0.8)]",

              isLowCredits && "from-rose-400 to-red-500 dark:from-[rgba(255,80,120,1)] dark:to-[rgba(255,50,80,0.9)] dark:shadow-[0_0_12px_-2px_rgba(255,50,100,0.8)]"
            )}>
              {isLowCredits ? (
                <AlertTriangle className="w-3.5 h-3.5 text-white dark:text-[rgba(20,10,15,1)]" />
              ) : (
                <Coins className="w-3.5 h-3.5 text-white dark:text-[rgba(10,20,25,1)]" />
              )}
            </div>
          </div>

          {/* Credit Amount - Tech Counter */}
          <span className={cn(
            "font-bold tabular-nums text-sm tracking-wider",
            "text-[hsl(25,30%,30%)]",
            "dark:text-[rgba(180,255,255,0.95)]",
            "dark:[text-shadow:0_0_8px_rgba(0,240,255,0.4)]",
            isLowCredits && "text-rose-600 dark:text-[rgba(255,150,160,1)] dark:[text-shadow:0_0_8px_rgba(255,50,100,0.4)]"
          )}>
            {credits.toLocaleString()}
          </span>

          {/* Hover sparkle effect */}
          <motion.div
            className="absolute -top-1 -right-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={{ scale: 0.5, rotate: 0 }}
            animate={{ scale: 1, rotate: 180 }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className={cn(
              "w-3 h-3",
              "text-amber-500 dark:text-[rgba(0,240,255,1)] dark:drop-shadow-[0_0_4px_rgba(0,240,255,0.8)]"
            )} />
          </motion.div>
          
          {/* Tech scan line - dark mode only */}
          <div className="absolute inset-0 hidden dark:block rounded-full overflow-hidden pointer-events-none opacity-30">
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,240,255,0.15)] to-transparent h-[200%]"
              animate={{ y: ['-100%', '0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </motion.button>
      </TooltipTrigger>
      
      <TooltipContent 
        side="bottom" 
        className={cn(
          "text-xs font-medium tracking-wide",
          "bg-white border-[hsl(30,20%,85%)] text-[hsl(25,30%,30%)]",
          "dark:bg-[rgba(8,12,20,0.97)] dark:border-[rgba(0,240,255,0.3)] dark:text-[rgba(180,255,255,0.95)]",
          "dark:shadow-[0_0_15px_-4px_rgba(0,240,255,0.4)]"
        )}
      >
        <p>{isLowCredits ? "Low balance" : "Manage credits"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
