import { motion } from 'motion/react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTierConfig } from '@/components/navigation/config/tier-config';

/**
 * ProfileHeader Component
 * 
 * Simplified header - just avatar with tier ring.
 * Name, tier, and credits are already visible in the nav bar.
 */
export function ProfileHeader({ profile, tier, className }) {
  const tierName = tier?.name || 'free';
  const config = getTierConfig(tierName);
  const TierIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex flex-col items-center py-4", className)}
    >
      {/* Avatar with tier ring */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative"
      >
        {/* Animated tier ring */}
        <motion.div
          className={cn(
            "absolute -inset-2 rounded-2xl opacity-60",
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
          "relative w-20 h-20 rounded-xl overflow-hidden",
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
              <User className="w-10 h-10 text-[hsl(25,25%,55%)] dark:text-zinc-500" />
            </div>
          )}
        </div>
        
        {/* Tier badge */}
        <motion.div 
          className={cn(
            "absolute -bottom-2 -right-2 p-2 rounded-xl",
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
            <TierIcon className={cn("w-4 h-4", config.color)} />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Name only - minimal */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "mt-4 text-lg font-semibold",
          "text-[hsl(25,35%,25%)] dark:text-white"
        )}
      >
        {profile?.firstName || 'User'} {profile?.lastName || ''}
      </motion.h2>
      
      {profile?.username && (
        <motion.p 
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          @{profile.username}
        </motion.p>
      )}
    </motion.div>
  );
}

export default ProfileHeader;
