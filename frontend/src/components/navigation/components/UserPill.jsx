import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { NavPill } from './NavPill';
import { getTierConfig } from '../config/tier-config';
import { LogOut, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * UserPill - Obsidian Aurora Design System
 * 
 * Premium user section featuring:
 * - Animated aurora ring around avatar
 * - Tier-based holographic effects
 * - Crystalline dropdown with aurora glow
 * - Prismatic hover effects
 */
export function UserPill({ user, onNavigate }) {
  const { logout, tierExpiration } = useAuth();
  const tier = getTierConfig(user?.tier);
  const TierIcon = tier.icon;
  const photoUrl = user?.photoUrl || user?.photo_url;
  const displayName = user?.name || 'User';
  const isAdmin = user?.isAdmin || user?.is_admin || false;
  const showExpirationWarning = tierExpiration?.isExpiringSoon && user?.tier !== 'free';

  const handleProfileClick = () => {
    if (onNavigate) onNavigate('profile');
  };

  const handleAdminClick = () => {
    if (onNavigate) onNavigate('admin');
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleOpenChange = (open) => {
    if (open) {
      handleProfileClick();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Theme Toggle with aurora styling */}
      <NavPill className="px-1" delay={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className={cn(
                "p-1.5 rounded-xl transition-all duration-300",
                // Dark mode: Aurora hover
                "dark:hover:bg-white/[0.06]",
                "dark:hover:shadow-[0_0_16px_-4px_rgba(139,92,246,0.4)]"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ThemeToggle />
            </motion.div>
          </TooltipTrigger>
          <TooltipContent 
            side="bottom" 
            className={cn(
              "text-xs",
              "dark:bg-[rgba(8,10,18,0.95)] dark:border-violet-500/20 dark:text-white",
              "dark:shadow-[0_0_20px_-4px_rgba(139,92,246,0.3)]"
            )}
          >
            <p>Toggle theme</p>
          </TooltipContent>
        </Tooltip>
      </NavPill>

      {/* User Dropdown */}
      <DropdownMenu onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <motion.div
            className={cn(
              "flex items-center gap-2.5 px-2 py-1.5 rounded-xl cursor-pointer transition-all duration-300",
              // Light mode
              "hover:bg-[hsl(38,40%,92%)]",
              // Dark mode: Aurora glass container
              "dark:bg-white/[0.02] dark:border dark:border-white/[0.06]",
              "dark:hover:bg-white/[0.06]",
              "dark:hover:border-cyan-400/20",
              "dark:hover:shadow-[0_0_24px_-6px_rgba(34,211,238,0.3),0_0_16px_-4px_rgba(139,92,246,0.2)]"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Avatar with Aurora Ring */}
            <div className="relative">
              {/* Animated aurora ring */}
              <motion.div
                className={cn(
                  "absolute -inset-1 rounded-full opacity-0 dark:opacity-100",
                  // Aurora gradient ring
                  "bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500",
                  "blur-[2px]"
                )}
                animate={{ 
                  rotate: [0, 360],
                  scale: [0.95, 1.05, 0.95],
                }}
                transition={{ 
                  rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                }}
                style={{ opacity: 0.6 }}
              />
              
              {/* Avatar image or initial */}
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt={displayName}
                  className={cn(
                    "relative h-8 w-8 rounded-full object-cover",
                    "ring-2 ring-[hsl(30,35%,85%)]",
                    // Dark mode: Crystalline border
                    "dark:ring-[rgba(255,255,255,0.15)]",
                    "shadow-lg"
                  )}
                />
              ) : (
                <div className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                  // Light mode
                  "bg-gradient-to-br from-[hsl(25,70%,48%)] to-[hsl(22,65%,38%)] text-[hsl(40,50%,96%)]",
                  "ring-2 ring-[hsl(30,35%,85%)]",
                  // Dark mode: Aurora gradient avatar
                  "dark:bg-gradient-to-br dark:from-cyan-500 dark:via-violet-500 dark:to-pink-500 dark:text-white",
                  "dark:ring-[rgba(255,255,255,0.15)]",
                  "shadow-lg"
                )}
                style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* Status indicator */}
              {showExpirationWarning ? (
                <motion.div 
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full",
                    "bg-amber-500 dark:bg-amber-400",
                    "ring-2 ring-background",
                    "flex items-center justify-center"
                  )}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Clock className="h-1.5 w-1.5 text-white" />
                </motion.div>
              ) : (
                <motion.div 
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full",
                    "bg-emerald-500 dark:bg-emerald-400",
                    "ring-2 ring-background",
                    // Aurora glow
                    "dark:shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]"
                  )}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </div>
            
            {/* Tier icon & name */}
            <div className={cn("flex items-center gap-1.5", tier.color)}>
              {TierIcon && (
                <motion.div
                  animate={tier.iconAnimation}
                  transition={tier.iconTransition}
                  className="dark:drop-shadow-[0_0_4px_currentColor]"
                >
                  <TierIcon className="h-3.5 w-3.5" />
                </motion.div>
              )}
              <span className={cn(
                "hidden lg:inline text-xs font-semibold truncate max-w-[70px]",
                "text-[hsl(25,35%,25%)] dark:text-white/90"
              )}>
                {displayName}
              </span>
            </div>
          </motion.div>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className={cn(
            "w-48 p-2 overflow-hidden",
            // Light mode: Vintage Banking
            "bg-gradient-to-b from-[hsl(40,50%,97%)] to-[hsl(38,45%,95%)]",
            "border-[hsl(30,35%,75%)]/50",
            "shadow-[0_8px_32px_rgba(101,67,33,0.12)]",
            // ═══════════════════════════════════════════════════════════
            // DARK MODE: Obsidian Aurora Dropdown
            // ═══════════════════════════════════════════════════════════
            "dark:bg-gradient-to-b dark:from-[rgba(8,10,18,0.98)] dark:to-[rgba(12,14,24,0.98)]",
            "dark:backdrop-blur-[60px] dark:backdrop-saturate-[180%]",
            // Aurora prismatic border
            "dark:border dark:border-transparent",
            "dark:[background-image:linear-gradient(to_bottom,rgba(8,10,18,0.98),rgba(12,14,24,0.98)),linear-gradient(135deg,rgba(34,211,238,0.3),rgba(139,92,246,0.25),rgba(236,72,153,0.25),rgba(34,211,238,0.3))]",
            "dark:[background-origin:border-box] dark:[background-clip:padding-box,border-box]",
            // Layered aurora glow
            "dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8),0_0_50px_-15px_rgba(139,92,246,0.25),0_0_30px_-10px_rgba(34,211,238,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]"
          )}
        >
          {isAdmin && (
            <DropdownMenuItem 
              onClick={handleAdminClick}
              className={cn(
                "gap-3 py-2.5 px-3 rounded-xl cursor-pointer transition-all duration-200",
                "hover:bg-[hsl(38,40%,92%)]",
                // Dark mode: Aurora hover
                "dark:hover:bg-gradient-to-r dark:hover:from-cyan-500/[0.1] dark:hover:to-violet-500/[0.08]",
                "dark:hover:shadow-[0_0_16px_-6px_rgba(34,211,238,0.4)]"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl",
                "bg-[hsl(38,35%,90%)]",
                // Dark mode: Aurora icon container
                "dark:bg-gradient-to-br dark:from-cyan-500/20 dark:to-violet-500/20",
                "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
              )}>
                <ShieldCheck className="h-4 w-4 text-[hsl(25,40%,40%)] dark:text-cyan-400" />
              </div>
              <span className="text-sm font-medium text-[hsl(25,35%,25%)] dark:text-white/90">Admin</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            onClick={handleLogout}
            className={cn(
              "gap-3 py-2.5 px-3 rounded-xl cursor-pointer transition-all duration-200",
              "text-[hsl(0,55%,45%)] hover:bg-[hsl(0,50%,95%)]",
              // Dark mode: Rose aurora hover
              "dark:text-rose-400",
              "dark:hover:bg-gradient-to-r dark:hover:from-rose-500/[0.12] dark:hover:to-pink-500/[0.08]",
              "dark:hover:shadow-[0_0_16px_-6px_rgba(244,63,94,0.5)]"
            )}
          >
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl",
              "bg-[hsl(0,45%,92%)]",
              // Dark mode: Rose glow container
              "dark:bg-rose-500/15",
              "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            )}>
              <LogOut className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
