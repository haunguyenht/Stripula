import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const TELEGRAM_ADMIN_USERNAME = 'kennjkute';

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

function SendIcon({ className }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
}

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
      {/* Tooltip - Refined design with vintage certificate styling */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute bottom-full mb-3 px-4 py-2 rounded-xl whitespace-nowrap",
              "text-sm font-medium font-serif",
              // Light mode: Vintage Banking - cream parchment with double-line certificate border
              "bg-gradient-to-b from-[hsl(42,50%,98%)] to-[hsl(40,45%,96%)]",
              "text-[hsl(25,35%,18%)]",
              "border border-[hsl(30,25%,82%)]",
              "shadow-[0_4px_20px_hsl(25,35%,25%,0.12),0_0_0_1px_hsl(30,25%,85%),0_0_0_3px_hsl(42,45%,97%),0_0_0_4px_hsl(30,20%,80%)]",
              // Dark mode: Glass tooltip (bg-none resets light gradient)
              "dark:bg-none dark:bg-white/[0.08] dark:text-white dark:border-white/[0.12]",
              "dark:backdrop-blur-xl",
              "dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
              isRight ? "right-0" : "left-0"
            )}
          >
            <div className="flex items-center gap-2">
              <SendIcon className="w-3.5 h-3.5 opacity-70" />
              <span className={cn(
                "[text-shadow:0_1px_0_rgba(255,255,255,0.6),0_-1px_0_rgba(101,67,33,0.08)] dark:[text-shadow:none]"
              )}>
                Contact Admin
              </span>
            </div>
            {/* Tooltip arrow */}
            <div className={cn(
              "absolute -bottom-1.5 w-3 h-3 rotate-45",
              // Light: matches cream parchment (no gradient - no fix needed)
              "bg-[hsl(40,45%,97%)] border-b border-r border-[hsl(30,25%,82%)]",
              "dark:bg-white/[0.08] dark:border-white/[0.12]",
              isRight ? "right-5" : "left-5"
            )} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button - Vintage wax seal / copper coin styling */}
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
          "w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl",
          // Light mode: Vintage Banking - copper coin with wax seal embossing
          "bg-gradient-to-br from-[hsl(25,65%,48%)] via-[hsl(28,60%,52%)] to-[hsl(32,55%,55%)]",
          // Wax seal / embossed coin shadow effect
          "shadow-[0_4px_20px_hsl(25,50%,35%,0.35),0_8px_40px_hsl(25,45%,30%,0.2),inset_0_2px_0_hsl(38,65%,65%,0.4),inset_0_-2px_0_hsl(20,60%,35%,0.4)]",
          "border border-[hsl(25,50%,60%)]/30",
          // Dark mode: Glass morphism with Telegram blue
          "dark:bg-gradient-to-br dark:from-[#0088cc]/90 dark:via-[#0099dd]/80 dark:to-[#00aaee]/70",
          "dark:backdrop-blur-xl dark:border-white/[0.15]",
          "dark:shadow-[0_8px_32px_rgba(0,136,204,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]",
          // Text color
          "text-white",
          // Focus state
          "focus:outline-none focus:ring-2 focus:ring-[hsl(25,60%,50%)]/50 focus:ring-offset-2",
          "dark:focus:ring-[#0088cc]/50 dark:focus:ring-offset-[hsl(201,44%,14%)]",
          // Transition
          "transition-shadow duration-300"
        )}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          y: isHovered ? -3 : 0,
        }}
        whileTap={{ scale: 0.92 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 22,
        }}
      >
        {/* Shimmer effect on hover */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-2xl overflow-hidden",
            "before:absolute before:inset-0",
            "before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent",
            "before:-translate-x-full"
          )}
          animate={isHovered ? {
            '--shimmer-x': ['100%', '-100%'],
          } : {}}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            '--shimmer-x': '-100%',
          }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            animate={isHovered ? {
              x: ['-100%', '100%'],
            } : { x: '-100%' }}
            transition={{
              duration: 0.8,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Glow ring effect */}
        <motion.div
          className={cn(
            "absolute -inset-1 rounded-[20px] -z-10",
            // Light: copper glow | Dark: telegram blue glow
            "bg-gradient-to-br from-[hsl(25,60%,45%)] to-[hsl(32,50%,50%)]",
            "dark:from-[#0088cc] dark:to-[#00aaee]",
            "opacity-0 blur-lg"
          )}
          animate={{
            opacity: isHovered ? 0.5 : 0,
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Subtle pulse ring */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-2xl",
            // Light: copper pulse | Dark: telegram blue pulse
            "border-2 border-[hsl(25,60%,50%)]/50",
            "dark:border-[#0088cc]/50"
          )}
          animate={{
            scale: [1, 1.3, 1.3],
            opacity: [0.6, 0, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />

        {/* Icon with fly animation */}
        <motion.div
          className="relative z-10"
          animate={isHovered ? {
            y: [0, -2, 0],
            x: [0, 2, 0],
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
          <TelegramIcon className="w-5 h-5 sm:w-7 sm:h-7 drop-shadow-sm" />
        </motion.div>

        {/* Inner highlight for depth */}
        <div className="absolute inset-[2px] rounded-[14px] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      </motion.button>

      {/* Floating dots decoration */}
      <div>
        <motion.div
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[hsl(25,60%,50%)]/60 dark:bg-[#0088cc]/60"
          animate={{
            y: [0, -4, 0],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full bg-[hsl(32,55%,55%)]/50 dark:bg-[#00aaee]/50"
          animate={{
            y: [0, -3, 0],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
      </div>
    </div>
  );
}
