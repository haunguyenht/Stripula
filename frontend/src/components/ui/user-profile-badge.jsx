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
// Light mode: Vintage Banking (copper/sepia tones) | Dark mode: Liquid Aurora
const tierConfig = {
  free: {
    label: 'Free',
    icon: Sparkles,
    // Light: muted sepia | Dark: violet aurora
    color: 'text-[hsl(25,30%,45%)] dark:text-violet-400',
    bgColor: 'bg-[hsl(30,25%,88%)] dark:bg-violet-500/10',
    borderColor: 'border-[hsl(30,20%,78%)] dark:border-violet-500/30',
    headerGradient: 'from-[hsl(38,35%,92%)] via-[hsl(35,30%,95%)] to-[hsl(40,45%,97%)] dark:from-violet-500/15 dark:via-purple-500/5 dark:to-transparent',
    ringColor: 'ring-[hsl(25,30%,55%)] dark:ring-violet-500/40',
    glowColor: 'shadow-[hsl(25,30%,50%)]/20 dark:shadow-violet-500/20',
    iconAnimation: { rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] },
    iconTransition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  },
  bronze: {
    label: 'Bronze',
    icon: Shield,
    // Light: warm copper bronze | Dark: amber aurora
    color: 'text-[hsl(25,55%,42%)] dark:text-amber-400',
    bgColor: 'bg-[hsl(28,40%,85%)] dark:bg-amber-500/10',
    borderColor: 'border-[hsl(28,35%,70%)] dark:border-amber-500/30',
    headerGradient: 'from-[hsl(30,45%,88%)] via-[hsl(32,35%,92%)] to-[hsl(38,45%,96%)] dark:from-amber-500/15 dark:via-orange-500/5 dark:to-transparent',
    ringColor: 'ring-[hsl(25,50%,50%)] dark:ring-amber-500/40',
    glowColor: 'shadow-[hsl(25,50%,45%)]/25 dark:shadow-amber-500/20',
    iconAnimation: { scale: [1, 1.15, 1], opacity: [1, 0.8, 1] },
    iconTransition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
  },
  silver: {
    label: 'Silver',
    icon: Award,
    // Light: aged pewter/silver | Dark: slate aurora
    color: 'text-[hsl(30,10%,40%)] dark:text-slate-300',
    bgColor: 'bg-[hsl(35,15%,88%)] dark:bg-slate-500/10',
    borderColor: 'border-[hsl(35,12%,75%)] dark:border-slate-500/30',
    headerGradient: 'from-[hsl(38,18%,90%)] via-[hsl(40,15%,93%)] to-[hsl(40,20%,96%)] dark:from-slate-400/15 dark:via-slate-400/5 dark:to-transparent',
    ringColor: 'ring-[hsl(30,12%,55%)] dark:ring-slate-400/40',
    glowColor: 'shadow-[hsl(30,10%,45%)]/20 dark:shadow-slate-400/20',
    iconAnimation: { rotateY: [0, 180, 360] },
    iconTransition: { duration: 3, repeat: Infinity, ease: "linear" }
  },
  gold: {
    label: 'Gold',
    icon: Crown,
    // Light: polished brass/gold | Dark: yellow aurora
    color: 'text-[hsl(38,70%,38%)] dark:text-yellow-400',
    bgColor: 'bg-[hsl(42,50%,85%)] dark:bg-yellow-500/10',
    borderColor: 'border-[hsl(40,45%,68%)] dark:border-yellow-500/30',
    headerGradient: 'from-[hsl(42,55%,88%)] via-[hsl(40,45%,92%)] to-[hsl(38,40%,96%)] dark:from-yellow-500/15 dark:via-amber-500/5 dark:to-transparent',
    ringColor: 'ring-[hsl(38,60%,48%)] dark:ring-yellow-500/40',
    glowColor: 'shadow-[hsl(38,65%,42%)]/30 dark:shadow-yellow-500/30',
    iconAnimation: { y: [0, -2, 0], scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] },
    iconTransition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  },
  diamond: {
    label: 'Diamond',
    icon: Gem,
    // Light: premium copper patina | Dark: cyan aurora
    color: 'text-[hsl(25,75%,45%)] dark:text-cyan-400',
    bgColor: 'bg-[hsl(25,35%,88%)] dark:bg-cyan-500/10',
    borderColor: 'border-[hsl(25,40%,72%)] dark:border-cyan-500/30',
    headerGradient: 'from-[hsl(28,45%,90%)] via-[hsl(30,38%,93%)] to-[hsl(38,45%,96%)] dark:from-cyan-500/15 dark:via-sky-500/5 dark:to-transparent',
    ringColor: 'ring-[hsl(25,70%,50%)] dark:ring-cyan-500/40',
    glowColor: 'shadow-[hsl(25,70%,45%)]/35 dark:shadow-cyan-500/40',
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
        <Button variant="ghost" size="icon" className={cn(
          "h-8 w-8 rounded-xl hover:bg-muted/50 relative",
          // Light: coin-like border effect
          "shadow-[0_1px_2px_hsl(25,30%,35%,0.12),inset_0_1px_0_hsl(45,40%,98%,0.8)] dark:shadow-none",
          className
        )}>
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
          // Light mode: Vintage Banking - currency note styling with double-line certificate border
          "bg-gradient-to-b from-[hsl(42,50%,98%)] via-[hsl(40,45%,97%)] to-[hsl(38,40%,95%)]",
          "border-[hsl(30,25%,82%)]",
          "shadow-[0_4px_20px_hsl(25,30%,25%,0.12),0_0_0_1px_hsl(30,25%,85%),0_0_0_3px_hsl(42,45%,97%),0_0_0_4px_hsl(30,20%,78%)]",
          // Dark mode: glass morphism effect (bg-none resets light gradient)
          "dark:bg-none dark:bg-[#1a1a1a]/95 dark:border-white/10 dark:backdrop-blur-xl dark:shadow-2xl dark:shadow-black/40"
        )}
      >
        {/* User Info Header - Tier colored gradient - Clickable for profile */}
        {/* Light: Currency note header with guilloche pattern hint */}
        <div 
          onClick={onSettingsClick}
          className={cn(
            "p-4 bg-gradient-to-br cursor-pointer transition-opacity hover:opacity-90 relative",
            tier.headerGradient
          )}
        >
          {/* Subtle guilloche pattern overlay for light mode */}
          <div 
            className="absolute inset-0 opacity-[0.015] dark:opacity-0 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 3px),
                               repeating-linear-gradient(90deg, transparent, transparent 2px, currentColor 2px, currentColor 3px)`,
              backgroundSize: '8px 8px'
            }}
          />
          
          <div className="flex items-start gap-3 relative">
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
                    // Light: coin-like photo frame
                    "ring-1 ring-[hsl(30,25%,75%)] dark:ring-0",
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
              <p className={cn(
                "text-sm font-semibold truncate text-foreground",
                // Light: letterpress embossed effect
                "[text-shadow:0_1px_0_rgba(255,255,255,0.6),0_-1px_0_rgba(101,67,33,0.08)] dark:[text-shadow:none]"
              )}>
                {displayUser?.name || 'User'}
              </p>
              {displayUser?.email && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <Mail className="h-3 w-3 shrink-0" />
                  {displayUser.email}
                </p>
              )}
            </div>
          </div>
          
          {/* Tier & Credits Badge - Currency denomination styling */}
          <div className={cn(
            "mt-3 flex items-center justify-between p-2.5 rounded-xl",
            // Light: Vintage Banking - aged paper inset with engraved border effect
            "bg-gradient-to-b from-[hsl(44,45%,97%)] to-[hsl(40,40%,94%)]",
            "shadow-[inset_0_1px_2px_hsl(25,30%,35%,0.08),0_1px_0_hsl(45,50%,98%,0.8)]",
            "border border-[hsl(30,25%,80%)]",
            // Dark: glass effect - no border (bg-none resets light gradient)
            "dark:bg-none dark:bg-white/[0.06] dark:border-transparent dark:shadow-none"
          )}>
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-1.5 rounded-lg relative",
                tier.bgColor,
                // Light: wax seal effect for tier icon
                "shadow-[0_1px_2px_hsl(25,30%,35%,0.15),inset_0_1px_0_hsl(45,50%,98%,0.5)] dark:shadow-none"
              )}>
                <motion.div
                  animate={tier.iconAnimation}
                  transition={tier.iconTransition}
                >
                  <TierIcon className={cn("h-3.5 w-3.5", tier.color)} />
                </motion.div>
              </div>
              <span className={cn(
                "text-sm font-medium",
                tier.color,
                // Light: embossed text
                "[text-shadow:0_1px_0_rgba(255,255,255,0.5)] dark:[text-shadow:none]"
              )}>
                {tier.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-[hsl(25,75%,45%)] dark:text-amber-500" />
              <span className={cn(
                "text-sm font-bold text-[hsl(25,70%,40%)] dark:text-amber-400",
                // Light: copper foil text effect
                "[text-shadow:0_1px_0_rgba(255,255,255,0.6)] dark:[text-shadow:none]"
              )}>
                {(displayUser?.credits ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        <DropdownMenuSeparator className="m-0 bg-[hsl(30,25%,88%)] dark:bg-white/10" />
        
        {/* Menu Items */}
        <div className="p-2">
          {isAdmin && onAdminClick && (
            <DropdownMenuItem 
              onClick={onAdminClick} 
              className={cn(
                "gap-3 py-2.5 px-3 rounded-xl cursor-pointer transition-all duration-200",
                // Light: Vintage Banking hover with ledger line effect
                "hover:bg-gradient-to-r hover:from-[hsl(38,35%,93%)] hover:to-[hsl(40,40%,95%)]",
                "focus:bg-gradient-to-r focus:from-[hsl(38,35%,93%)] focus:to-[hsl(40,40%,95%)]",
                "dark:hover:bg-white/[0.08] dark:focus:bg-white/[0.08]"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                // Light: warm sepia background with coin shadow (dark:bg-none resets light gradient)
                "bg-gradient-to-b from-[hsl(38,35%,93%)] to-[hsl(35,30%,90%)]",
                "shadow-[0_1px_2px_hsl(25,30%,35%,0.1),inset_0_1px_0_hsl(45,50%,98%,0.6)]",
                "dark:bg-none dark:bg-white/[0.08] dark:shadow-none"
              )}>
                <ShieldCheck className="h-4 w-4 text-[hsl(25,35%,35%)] dark:text-gray-300" />
              </div>
              <div className="flex-1">
                <span className={cn(
                  "font-medium text-[hsl(25,35%,18%)] dark:text-white",
                  "[text-shadow:0_1px_0_rgba(255,255,255,0.5)] dark:[text-shadow:none]"
                )}>
                  Admin Dashboard
                </span>
                <p className="text-xs text-[hsl(25,20%,45%)] dark:text-gray-400">Manage users & keys</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[hsl(25,20%,55%)] dark:text-gray-500" />
            </DropdownMenuItem>
          )}
        </div>
        
        <DropdownMenuSeparator className="m-0 bg-[hsl(30,25%,88%)] dark:bg-white/10" />
        
        {/* Logout */}
        <div className="p-2">
          <DropdownMenuItem 
            onClick={handleLogout} 
            className={cn(
              "gap-3 py-2.5 px-3 rounded-xl cursor-pointer transition-all duration-200",
              // Light: Vintage Banking burgundy ink with hover effect
              "text-[hsl(355,45%,42%)]",
              "hover:bg-gradient-to-r hover:from-[hsl(355,30%,94%)] hover:to-[hsl(355,25%,92%)]",
              "focus:bg-gradient-to-r focus:from-[hsl(355,30%,94%)] focus:to-[hsl(355,25%,92%)]",
              "dark:text-red-400 dark:hover:bg-red-500/10 dark:focus:bg-red-500/10"
            )}
          >
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              // Light: aged burgundy background with wax seal shadow (dark:bg-none resets light gradient)
              "bg-gradient-to-b from-[hsl(355,28%,92%)] to-[hsl(355,30%,88%)]",
              "shadow-[0_1px_2px_hsl(355,30%,40%,0.1),inset_0_1px_0_hsl(355,25%,95%,0.6)]",
              "dark:bg-none dark:bg-red-500/15 dark:shadow-none"
            )}>
              <LogOut className="h-4 w-4" />
            </div>
            <span className={cn(
              "font-medium",
              "[text-shadow:0_1px_0_rgba(255,255,255,0.4)] dark:[text-shadow:none]"
            )}>
              Sign out
            </span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { tierConfig };

