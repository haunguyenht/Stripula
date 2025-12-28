import { Shield, Award, Crown, Gem, LogOut, User, Coins, Mail, ChevronRight, Menu, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// Tier config with gradients and animations
const tierConfig = {
  free: {
    label: 'Free',
    icon: Sparkles,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    headerGradient: 'from-violet-100/80 via-purple-50/50 to-white dark:from-violet-500/15 dark:via-purple-500/5 dark:to-transparent',
    ringColor: 'ring-violet-500/40',
    glowColor: 'shadow-violet-500/20',
    iconAnimation: { rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] },
    iconTransition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  },
  bronze: {
    label: 'Bronze',
    icon: Shield,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    headerGradient: 'from-amber-100/80 via-orange-50/50 to-white dark:from-amber-500/15 dark:via-orange-500/5 dark:to-transparent',
    ringColor: 'ring-amber-500/40',
    glowColor: 'shadow-amber-500/20',
    iconAnimation: { scale: [1, 1.15, 1], opacity: [1, 0.8, 1] },
    iconTransition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
  },
  silver: {
    label: 'Silver',
    icon: Award,
    color: 'text-slate-500 dark:text-slate-300',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
    headerGradient: 'from-slate-200/80 via-gray-100/50 to-white dark:from-slate-400/15 dark:via-slate-400/5 dark:to-transparent',
    ringColor: 'ring-slate-400/40',
    glowColor: 'shadow-slate-400/20',
    iconAnimation: { rotateY: [0, 180, 360] },
    iconTransition: { duration: 3, repeat: Infinity, ease: "linear" }
  },
  gold: {
    label: 'Gold',
    icon: Crown,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    headerGradient: 'from-yellow-100/80 via-amber-50/50 to-white dark:from-yellow-500/15 dark:via-amber-500/5 dark:to-transparent',
    ringColor: 'ring-yellow-500/40',
    glowColor: 'shadow-yellow-500/30',
    iconAnimation: { y: [0, -2, 0], scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] },
    iconTransition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  },
  diamond: {
    label: 'Diamond',
    icon: Gem,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    headerGradient: 'from-cyan-100/80 via-sky-50/50 to-white dark:from-cyan-500/15 dark:via-sky-500/5 dark:to-transparent',
    ringColor: 'ring-cyan-500/40',
    glowColor: 'shadow-cyan-500/40',
    iconAnimation: { rotate: [0, 360], scale: [1, 1.2, 1] },
    iconTransition: { duration: 4, repeat: Infinity, ease: "linear" }
  },
};

/**
 * UserProfileBadge - User avatar with dropdown menu
 */
export function UserProfileBadge({ 
  user,
  onSettingsClick,
  onAdminClick,
  onLogoutClick,
  className,
}) {
  const { user: authUser, isAuthenticated, logout } = useAuth();
  
  // Use auth user if available, otherwise fall back to prop
  const displayUser = isAuthenticated && authUser ? {
    name: authUser.firstName || authUser.first_name || authUser.username || 'User',
    email: authUser.username ? `@${authUser.username}` : null,
    tier: authUser.tier || 'free',
    credits: authUser.creditBalance ?? authUser.credit_balance ?? 0,
    photoUrl: authUser.photoUrl || authUser.photo_url,
    isAdmin: authUser.isAdmin || authUser.is_admin || false
  } : user;

  const tier = tierConfig[displayUser?.tier] || tierConfig.free;
  const TierIcon = tier.icon;
  const isAdmin = displayUser?.isAdmin || false;

  const handleLogout = async () => {
    if (onLogoutClick) {
      onLogoutClick();
    } else if (isAuthenticated) {
      await logout();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-xl hover:bg-muted/50 relative", className)}>
          {displayUser?.photoUrl ? (
            <div className="relative">
              {/* Animated ring */}
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-full ring-2",
                  tier.ringColor
                )}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <img 
                src={displayUser.photoUrl} 
                alt={displayUser.name}
                className={cn(
                  "h-6 w-6 rounded-full object-cover relative",
                  "shadow-md",
                  tier.glowColor
                )}
              />
            </div>
          ) : (
            <Menu className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={cn(
          "w-72 p-0 overflow-hidden",
          // Light mode: clean white with subtle shadow
          "bg-white border-gray-200/80 shadow-lg shadow-black/5",
          // Dark mode: glass morphism effect
          "dark:bg-[#1a1a1a]/95 dark:border-white/10 dark:backdrop-blur-xl dark:shadow-2xl dark:shadow-black/40"
        )}
      >
        {/* User Info Header - Tier colored gradient - Clickable for profile */}
        <div 
          onClick={onSettingsClick}
          className={cn(
            "p-4 bg-gradient-to-br cursor-pointer transition-opacity hover:opacity-90",
            tier.headerGradient
          )}
        >
          <div className="flex items-start gap-3">
            {displayUser?.photoUrl ? (
              <div className="relative shrink-0">
                {/* Animated glow ring */}
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-xl ring-2",
                    tier.ringColor
                  )}
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <img 
                  src={displayUser.photoUrl} 
                  alt={displayUser.name}
                  className={cn(
                    "h-11 w-11 rounded-xl object-cover relative",
                    "shadow-lg",
                    tier.glowColor
                  )}
                />
              </div>
            ) : (
              <div className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl shrink-0",
                "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm"
              )}>
                <User className="h-5 w-5" />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-sm font-semibold truncate text-foreground">{displayUser?.name || 'User'}</p>
              {displayUser?.email && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <Mail className="h-3 w-3 shrink-0" />
                  {displayUser.email}
                </p>
              )}
            </div>
          </div>
          
          {/* Tier & Credits Badge */}
          <div className={cn(
            "mt-3 flex items-center justify-between p-2.5 rounded-xl",
            // Light: subtle tier background
            "bg-white/80 shadow-sm",
            // Dark: glass effect - no border
            "dark:bg-white/[0.06]"
          )}>
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-lg relative", tier.bgColor)}>
                <motion.div
                  animate={tier.iconAnimation}
                  transition={tier.iconTransition}
                >
                  <TierIcon className={cn("h-3.5 w-3.5", tier.color)} />
                </motion.div>
              </div>
              <span className={cn("text-sm font-medium", tier.color)}>{tier.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {(displayUser?.credits ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        <DropdownMenuSeparator className="m-0 bg-gray-100 dark:bg-white/10" />
        
        {/* Menu Items */}
        <div className="p-2">
          {isAdmin && onAdminClick && (
            <DropdownMenuItem 
              onClick={onAdminClick} 
              className={cn(
                "gap-3 py-2.5 px-3 rounded-xl cursor-pointer transition-all duration-200",
                "hover:bg-gray-100 focus:bg-gray-100",
                "dark:hover:bg-white/[0.08] dark:focus:bg-white/[0.08]"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                "bg-gray-100 dark:bg-white/[0.08]"
              )}>
                <ShieldCheck className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-white">Admin Dashboard</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Manage users & keys</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </DropdownMenuItem>
          )}
        </div>
        
        <DropdownMenuSeparator className="m-0 bg-gray-100 dark:bg-white/10" />
        
        {/* Logout */}
        <div className="p-2">
          <DropdownMenuItem 
            onClick={handleLogout} 
            className={cn(
              "gap-3 py-2.5 px-3 rounded-xl cursor-pointer transition-all duration-200",
              "text-red-600 hover:bg-red-50 focus:bg-red-50",
              "dark:text-red-400 dark:hover:bg-red-500/10 dark:focus:bg-red-500/10"
            )}
          >
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              "bg-red-100 dark:bg-red-500/15"
            )}>
              <LogOut className="h-4 w-4" />
            </div>
            <span className="font-medium">Sign out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { tierConfig };

