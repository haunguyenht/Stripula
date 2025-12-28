import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { NavPill } from './NavPill';
import { getTierConfig } from '../config/tier-config';
import { LogOut, ShieldCheck, ChevronRight, Coins } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * UserPill - Right navbar section with user avatar and tier
 * 
 * OPUX compact design: Avatar with tier indicator
 * Dropdown menu with profile, admin (if admin), and logout
 * 
 * @param {Object} user - User object { name, email, tier, credits, photoUrl }
 * @param {Function} onNavigate - Navigation handler
 */
export function UserPill({ user, onNavigate }) {
  const { logout } = useAuth();
  const tier = getTierConfig(user?.tier);
  const TierIcon = tier.icon;
  const photoUrl = user?.photoUrl || user?.photo_url;
  const displayName = user?.name || 'User';
  const isAdmin = user?.isAdmin || user?.is_admin || false;
  const credits = user?.credits ?? 0;

  const handleProfileClick = () => {
    if (onNavigate) onNavigate('profile');
  };

  const handleAdminClick = () => {
    if (onNavigate) onNavigate('admin');
  };

  const handleLogout = async () => {
    await logout();
  };

  // Navigate to profile when dropdown opens
  const handleOpenChange = (open) => {
    if (open) {
      handleProfileClick();
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Theme Toggle */}
      <NavPill className="px-1.5" delay={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <ThemeToggle />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <p>Toggle theme</p>
          </TooltipContent>
        </Tooltip>
      </NavPill>

      {/* User Dropdown */}
      <DropdownMenu onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <NavPill 
            className="flex items-center gap-2 px-2 cursor-pointer hover:opacity-80 transition-opacity" 
            delay={0}
          >
          {/* User Avatar with tier ring and glow */}
          <div className="relative">
            {/* Animated glow ring */}
            <motion.div
              className={cn(
                "absolute inset-0 rounded-full ring-2",
                tier.borderColor
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
            {photoUrl ? (
              <img 
                src={photoUrl} 
                alt={displayName}
                className={cn(
                  "h-7 w-7 rounded-full object-cover relative",
                  "shadow-md",
                  tier.glowColor
                )}
              />
            ) : (
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold relative",
                "bg-gradient-to-br from-[rgb(255,64,23)] to-[rgb(220,50,15)] text-white",
                "dark:from-primary/60 dark:to-primary/40 dark:text-white",
                "shadow-md",
                tier.glowColor
              )}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {/* Online indicator */}
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500",
              "ring-1 ring-background"
            )} />
          </div>
          
          {/* Tier icon & name with animation */}
          <div className={cn("flex items-center gap-1", tier.color)}>
            {TierIcon && (
              <motion.div
                animate={tier.iconAnimation}
                transition={tier.iconTransition}
              >
                <TierIcon className="h-3.5 w-3.5" />
              </motion.div>
            )}
            <span className="hidden lg:inline text-xs font-semibold truncate max-w-[60px] text-[rgb(37,27,24)] dark:text-white/90">
              {displayName}
            </span>
          </div>
        </NavPill>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className={cn(
          "w-56 p-0 overflow-hidden",
          "bg-white border-gray-200/80 shadow-lg",
          "dark:bg-[#1a1a1a]/95 dark:border-white/5 dark:backdrop-blur-xl"
        )}
      >
        {/* Header with tier gradient */}
        <div 
          onClick={handleProfileClick}
          className={cn(
            "p-3 bg-gradient-to-br cursor-pointer hover:opacity-90 transition-opacity",
            tier.headerGradient || 'from-gray-50 to-white dark:from-white/5 dark:to-transparent'
          )}
        >
          <div className="flex items-center gap-2">
            {photoUrl ? (
              <div className="relative shrink-0">
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-lg ring-2",
                    tier.borderColor
                  )}
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.4, 0.7, 0.4]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <img 
                  src={photoUrl} 
                  alt="" 
                  className={cn(
                    "h-9 w-9 rounded-lg object-cover relative",
                    "shadow-md",
                    tier.glowColor
                  )} 
                />
              </div>
            ) : (
              <div className={cn(
                "h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold",
                "shadow-md",
                tier.glowColor
              )}>
                {displayName.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <motion.div
                  animate={tier.iconAnimation}
                  transition={tier.iconTransition}
                >
                  <TierIcon className={cn("h-3 w-3", tier.color)} />
                </motion.div>
                <span className={tier.color}>{tier.label}</span>
                <span>•</span>
                <Coins className="h-3 w-3 text-amber-500" />
                <span className="font-medium text-amber-600 dark:text-amber-400">{credits.toLocaleString()}</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        <DropdownMenuSeparator className="m-0 bg-gray-100 dark:bg-white/10" />
        
        {/* Menu Items */}
        <div className="p-1.5">
          {isAdmin && (
            <DropdownMenuItem 
              onClick={handleAdminClick}
              className={cn(
                "gap-3 py-2 px-2.5 rounded-lg cursor-pointer",
                "hover:bg-gray-100 dark:hover:bg-white/[0.08]"
              )}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/[0.08]">
                <ShieldCheck className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
              </div>
              <span className="text-sm font-medium">Admin Dashboard</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            onClick={handleLogout}
            className={cn(
              "gap-3 py-2 px-2.5 rounded-lg cursor-pointer",
              "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            )}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/15">
              <LogOut className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-medium">Sign out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
}



