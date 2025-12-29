import { motion } from 'motion/react';
import { User, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTierConfig } from '@/components/navigation/config/tier-config';

/**
 * ProfileHeader Component
 * 
 * Compact header displaying user avatar, name, tier badge, and credit balance.
 * Follows OrangeAI (light) and OPUX glass (dark) design system.
 * 
 * @param {Object} props
 * @param {Object} props.profile - User profile data from API
 * @param {Object} props.tier - Tier info from API { name, multiplier, dailyClaim }
 * @param {number} props.balance - Credit balance
 * @param {string} props.className - Additional CSS classes
 */
export function ProfileHeader({ profile, tier, balance = 0, className }) {
  const tierName = tier?.name || 'free';
  const config = getTierConfig(tierName);
  const TierIcon = config.icon;

  return (
    <Card 
      variant="elevated" 
      className={cn(
        "overflow-hidden relative",
        // Light mode: warm elevated card
        "bg-white border-gray-100",
        // Dark mode: glass morphism
        "dark:opux-glass",
        className
      )}
    >
      {/* Tier gradient background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-60",
        config.bgGradient
      )} />
      
      <CardContent className="p-4 relative">
        <div className="flex items-center gap-4">
          {/* Avatar with tier ring & animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="relative flex-shrink-0"
          >
            {/* Animated glow ring */}
            <motion.div
              className={cn(
                "absolute inset-0 rounded-full",
                "ring-2",
                config.ringColor
              )}
              animate={config.ringAnimation}
              transition={config.ringTransition}
            />
            
            {/* Avatar container with gradient border */}
            <div className={cn(
              "p-0.5 rounded-full bg-gradient-to-br relative",
              config.bgGradient
            )}>
              {profile?.photoUrl ? (
                <img 
                  src={profile.photoUrl} 
                  alt="" 
                  className={cn(
                    "w-12 h-12 rounded-full object-cover border-2 border-background",
                    "shadow-lg",
                    config.glowColor
                  )} 
                />
              ) : (
                <div className={cn(
                  "w-12 h-12 rounded-full bg-background flex items-center justify-center",
                  "shadow-lg",
                  config.glowColor
                )}>
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Tier icon badge with animation */}
            <motion.div 
              className={cn(
                "absolute -bottom-0.5 -right-0.5 p-1.5 rounded-full shadow-lg",
                "bg-background/90 dark:bg-background/80 backdrop-blur-sm",
                config.glowColor
              )}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.25 }}
            >
              <motion.div
                animate={config.iconAnimation}
                transition={config.iconTransition}
              >
                <TierIcon className={cn("w-3.5 h-3.5", config.color)} />
              </motion.div>
            </motion.div>
          </motion.div>
          
          {/* Name & Badge with animation */}
          <motion.div 
            className="flex-1 min-w-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-base truncate text-foreground">
                {profile?.firstName} {profile?.lastName}
              </span>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
              >
                <Badge 
                  variant={config.badgeVariant} 
                  className="text-[10px] px-1.5 py-0 h-5 gap-1"
                >
                  <motion.span
                    className="inline-flex"
                    animate={config.iconAnimation}
                    transition={config.iconTransition}
                  >
                    <TierIcon className="w-3 h-3" />
                  </motion.span>
                  {config.label}
                </Badge>
              </motion.div>
            </div>
            {profile?.username && (
              <p className="text-xs text-muted-foreground mt-0.5">
                @{profile.username}
              </p>
            )}
          </motion.div>
          
          {/* Credits display with animation */}
          <motion.div 
            className="text-right flex-shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
          >
            <div className="flex items-center justify-end gap-1.5">
              <Coins className="w-4 h-4 text-amber-500" />
              <motion.span 
                className="text-xl font-bold text-amber-500 tabular-nums"
                key={balance}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                {balance.toLocaleString()}
              </motion.span>
            </div>
            <span className="text-[10px] text-muted-foreground">credits</span>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileHeader;
