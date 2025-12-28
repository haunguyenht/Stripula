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

export function TelegramContactButton({ 
  adminUsername = TELEGRAM_ADMIN_USERNAME,
  position = 'left' 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    window.open(`https://t.me/${adminUsername}`, '_blank', 'noopener,noreferrer');
  };

  const isLeft = position === 'left';

  return (
    <div 
      className={cn(
        "fixed bottom-6 z-50",
        isLeft ? "left-6" : "right-6"
      )}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: isLeft ? -10 : 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: isLeft ? -10 : 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute bottom-full mb-2 px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap text-sm",
              "bg-card text-card-foreground border border-border",
              isLeft ? "left-0" : "right-0"
            )}
          >
            Contact Admin
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button with fly animation */}
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
          "w-14 h-14 rounded-full",
          "bg-primary hover:bg-primary/90",
          "dark:bg-[#0088cc] dark:hover:bg-[#0077b5]",
          "text-primary-foreground dark:text-white",
          "shadow-lg dark:shadow-[0_4px_20px_rgba(0,136,204,0.3)]",
          "transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          "dark:focus:ring-[#0088cc]"
        )}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ 
          scale: 1, 
          rotate: 0,
          y: isHovered ? -4 : 0,
        }}
        whileTap={{ scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
      >
        {/* Pulse effect */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-primary dark:bg-[#0088cc]"
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Flying animation wrapper */}
        <motion.div
          animate={isHovered ? {
            y: [0, -3, 0],
            x: [0, 2, 0],
            rotate: [0, 5, 0],
          } : {
            y: [0, -2, 0],
          }}
          transition={{
            duration: isHovered ? 0.6 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <TelegramIcon className="w-7 h-7" />
        </motion.div>
      </motion.button>
    </div>
  );
}
