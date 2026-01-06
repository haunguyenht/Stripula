import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const TELEGRAM_ADMIN_USERNAME = 'kennjkute';

/**
 * Telegram Icon - Paper plane style
 */
function TelegramIcon({ className }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

/**
 * TelegramContactButton - Dual Theme Design
 * 
 * ═══════════════════════════════════════════════════════════════
 * LIGHT THEME: Vintage Banking - Copper wax seal aesthetic
 * DARK THEME: Obsidian Nebula - Deep glass with violet aurora glow
 * ═══════════════════════════════════════════════════════════════
 */
export function TelegramContactButton({ 
  adminUsername = TELEGRAM_ADMIN_USERNAME,
  position = 'right' 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    window.open(`https://t.me/${adminUsername}`, '_blank', 'noopener,noreferrer');
  };

  const isRight = position === 'right';

  return (
    <div 
      className={cn(
        "fixed bottom-4 sm:bottom-6 z-50",
        isRight ? "right-4 sm:right-6" : "left-4 sm:left-6"
      )}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute bottom-full mb-3 px-3 py-1.5 sm:px-4 sm:py-2",
              "rounded-lg sm:rounded-xl whitespace-nowrap",
              "text-xs sm:text-sm font-medium",
              // Light mode: Vintage cream parchment
              "bg-gradient-to-b from-[hsl(42,50%,98%)] to-[hsl(40,45%,96%)]",
              "text-[hsl(25,35%,20%)]",
              "border border-[hsl(30,25%,82%)]",
              "shadow-[0_4px_16px_hsl(25,35%,25%,0.1)]",
              // Dark mode: Deep obsidian glass with violet tint
              "dark:bg-none dark:bg-[hsl(260,30%,8%)]/95",
              "dark:text-violet-300",
              "dark:border-violet-500/25",
              "dark:backdrop-blur-xl",
              "dark:shadow-[0_4px_24px_rgba(0,0,0,0.6),0_0_24px_-6px_rgba(139,92,246,0.4)]",
              isRight ? "right-0" : "left-0"
            )}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span>Contact Admin</span>
            </div>
            {/* Tooltip arrow */}
            <div className={cn(
              "absolute -bottom-1.5 w-3 h-3 rotate-45",
              "bg-[hsl(40,45%,97%)] border-b border-r border-[hsl(30,25%,82%)]",
              "dark:bg-[hsl(260,30%,8%)]/95 dark:border-violet-500/25",
              isRight ? "right-5" : "left-5"
            )} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => {
          setIsHovered(true);
          setShowTooltip(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowTooltip(false);
        }}
        className={cn(
          "relative flex items-center justify-center",
          "w-11 h-11 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl",
          // Light mode: Copper wax seal
          "bg-gradient-to-br from-[hsl(25,65%,48%)] via-[hsl(28,60%,52%)] to-[hsl(32,55%,55%)]",
          "shadow-[0_4px_16px_hsl(25,50%,35%,0.3),inset_0_1px_0_hsl(38,65%,65%,0.3)]",
          "border border-[hsl(25,50%,60%)]/20",
          // Dark mode: Deep obsidian with violet aurora - MUST reset gradient first
          "dark:bg-none dark:from-transparent dark:via-transparent dark:to-transparent",
          "dark:bg-[hsl(260,20%,10%)]",
          "dark:border-violet-500/40",
          "dark:shadow-[0_0_40px_-8px_rgba(139,92,246,0.6),0_8px_32px_rgba(0,0,0,0.5)]",
          // Text
          "text-white",
          // Focus
          "focus:outline-none focus:ring-2 focus:ring-[hsl(25,60%,50%)]/40",
          "dark:focus:ring-violet-500/50",
          // Transition
          "transition-all duration-300"
        )}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          y: isHovered ? -3 : 0,
        }}
        whileTap={{ scale: 0.94 }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 25,
        }}
      >
        {/* Aurora glow effect behind button - dark mode only */}
        <motion.div
          className={cn(
            "absolute -inset-1.5 rounded-2xl -z-10 hidden dark:block",
            "bg-gradient-to-br from-violet-600/60 via-fuchsia-500/40 to-indigo-600/50",
            "blur-xl"
          )}
          animate={{
            opacity: isHovered ? 0.8 : 0.5,
            scale: isHovered ? 1.2 : 1,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Pulse ring - violet aurora */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-xl sm:rounded-2xl",
            "border-2 border-[hsl(25,60%,50%)]/40",
            "dark:border-violet-400/60"
          )}
          animate={{
            scale: [1, 1.5, 1.5],
            opacity: [0.6, 0, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />

        {/* Inner gradient overlay - different for light/dark */}
        <div className={cn(
          "absolute inset-0 rounded-xl sm:rounded-2xl overflow-hidden pointer-events-none",
          // Light: copper shine
          "bg-gradient-to-b from-[hsl(38,65%,70%)]/20 to-transparent",
          // Dark: reset and apply violet aurora
          "dark:bg-none dark:from-transparent dark:to-transparent"
        )} />
        {/* Dark mode only: violet aurora inner glow */}
        <div className="absolute inset-0 rounded-xl sm:rounded-2xl overflow-hidden pointer-events-none hidden dark:block bg-gradient-to-br from-violet-500/25 via-transparent to-fuchsia-500/15" />

        {/* Icon with subtle animation */}
        <motion.div
          className="relative z-10"
          animate={isHovered ? {
            y: [0, -2, 0],
            rotate: [0, 8, 0],
          } : {
            y: [0, -1, 0],
          }}
          transition={{
            duration: isHovered ? 0.5 : 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <TelegramIcon className={cn(
            "w-5 h-5 sm:w-6 sm:h-6",
            "drop-shadow-sm",
            "dark:drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]"
          )} />
        </motion.div>

        {/* Specular highlight - top edge, light mode only */}
        <div className="absolute inset-x-0 top-0 h-1/3 rounded-t-xl sm:rounded-t-2xl pointer-events-none bg-gradient-to-b from-[hsl(38,70%,75%)]/30 to-transparent dark:hidden" />
        {/* Dark mode specular - violet tinted */}
        <div className="absolute inset-x-0 top-0 h-1/3 rounded-t-xl sm:rounded-t-2xl pointer-events-none hidden dark:block bg-gradient-to-b from-violet-400/20 to-transparent" />
      </motion.button>

      {/* Floating aurora particles - violet themed */}
      <motion.div
        className={cn(
          "absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full",
          "bg-[hsl(25,60%,50%)]/70",
          "dark:bg-violet-400/80"
        )}
        animate={{
          y: [0, -4, 0],
          opacity: [0.7, 1, 0.7],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className={cn(
          "absolute -bottom-0.5 -left-1 w-1 h-1 rounded-full",
          "bg-[hsl(32,55%,55%)]/60",
          "dark:bg-fuchsia-400/70"
        )}
        animate={{
          y: [0, -3, 0],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
      <motion.div
        className={cn(
          "absolute top-1/2 -right-1.5 w-1 h-1 rounded-full hidden dark:block",
          "bg-indigo-400/60"
        )}
        animate={{
          x: [0, 2, 0],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
    </div>
  );
}
