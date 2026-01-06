import { motion } from 'motion/react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTierConfig } from '@/components/navigation/config/tier-config';

/**
 * ProfileHeader Component
 * 
 * Simplified header - just avatar with tier ring.
 * Name, tier, and credits are already visible in the nav bar.
 * 
 * @param {boolean} compact - More compact layout for mobile
 */
export function ProfileHeader({ profile, tier, className, compact = false }) {
  const tierName = tier?.name || 'free';
  const config = getTierConfig(tierName);
  const TierIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex items-center gap-3 sm:flex-col sm:gap-0",
        compact ? "py-1 sm:py-4" : "py-2 sm:py-4",
        className
      )}
    >
      {/* Avatar with tier ring */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative shrink-0"
      >
        {/* Animated tier ring */}
        <motion.div
          className={cn(
            "absolute rounded-lg sm:rounded-2xl opacity-60",
            compact ? "-inset-1 sm:-inset-2" : "-inset-1.5 sm:-inset-2",
            "bg-gradient-to-br",
            config.bgGradient
          )}
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.03, 1]
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
        />
        
        {/* Avatar */}
        <div className={cn(
          "relative rounded-lg sm:rounded-xl overflow-hidden",
          compact ? "w-12 h-12 sm:w-20 sm:h-20" : "w-16 h-16 sm:w-20 sm:h-20",
          "bg-gradient-to-br from-[hsl(40,40%,96%)] to-[hsl(35,35%,94%)]",
          // Dark mode (reset gradient)
          "dark:bg-none dark:bg-zinc-800",
          "border-2 border-[hsl(38,45%,92%)] dark:border-white/10",
          "shadow-lg"
        )}>
          {profile?.photoUrl ? (
            <img 
              src={profile.photoUrl} 
              alt="" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className={cn(
                compact ? "w-6 h-6 sm:w-10 sm:h-10" : "w-8 h-8 sm:w-10 sm:h-10",
                "text-[hsl(25,25%,55%)] dark:text-zinc-500"
              )} />
            </div>
          )}
        </div>
        
        {/* Tier badge */}
        <motion.div 
          className={cn(
            "absolute rounded-md sm:rounded-xl",
            compact 
              ? "-bottom-1 -right-1 p-1 sm:-bottom-2 sm:-right-2 sm:p-2" 
              : "-bottom-1.5 -right-1.5 p-1.5 sm:-bottom-2 sm:-right-2 sm:p-2",
            "bg-gradient-to-b from-[hsl(40,45%,97%)] to-[hsl(38,40%,94%)]",
            // Dark mode (reset gradient)
            "dark:bg-none dark:bg-zinc-800",
            "border border-[hsl(30,25%,80%)] dark:border-white/10",
            "shadow-md"
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.3 }}
        >
          <motion.div
            animate={config.iconAnimation}
            transition={config.iconTransition}
          >
            <TierIcon className={cn(
              compact ? "w-3 h-3 sm:w-4 sm:h-4" : "w-3.5 h-3.5 sm:w-4 sm:h-4",
              config.color
            )} />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Name and username - horizontal on mobile when compact */}
      <div className={cn(
        compact ? "text-left sm:text-center sm:mt-4" : "text-center mt-3 sm:mt-4"
      )}>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "font-semibold",
            compact ? "text-sm sm:text-lg" : "text-base sm:text-lg",
            "text-[hsl(25,35%,25%)] dark:text-white"
          )}
        >
          {profile?.firstName || 'User'} {profile?.lastName || ''}
        </motion.h2>
        
        {profile?.username && (
          <motion.p 
            className={cn(
              "text-muted-foreground",
              compact ? "text-[10px] sm:text-sm" : "text-xs sm:text-sm"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            @{profile.username}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

export default ProfileHeader;
