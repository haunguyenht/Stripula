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
            "w-52 p-2.5 overflow-hidden relative",
            // Light mode: Vintage Banking
            "bg-gradient-to-b from-[hsl(40,50%,97%)] to-[hsl(38,45%,95%)]",
            "border-[hsl(30,35%,75%)]/50",
            "shadow-[0_8px_32px_rgba(101,67,33,0.12)]",
            // ═══════════════════════════════════════════════════════════
            // DARK MODE: Obsidian Aurora Crystalline Dropdown
            // ═══════════════════════════════════════════════════════════
            "dark:bg-[rgba(6,8,16,0.96)]",
            "dark:backdrop-blur-[80px] dark:backdrop-saturate-[200%]",
            // Premium prismatic animated border
            "dark:border-2 dark:border-transparent dark:rounded-2xl",
            "dark:[background-image:linear-gradient(to_bottom,rgba(6,8,16,0.96),rgba(10,12,22,0.96)),linear-gradient(135deg,rgba(34,211,238,0.5),rgba(139,92,246,0.4),rgba(236,72,153,0.4),rgba(34,211,238,0.5))]",
            "dark:[background-origin:border-box] dark:[background-clip:padding-box,border-box]",
            // Multi-layered deep aurora glow
            "dark:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.9),0_0_80px_-20px_rgba(139,92,246,0.35),0_0_50px_-15px_rgba(34,211,238,0.25),0_0_30px_-8px_rgba(236,72,153,0.2),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(139,92,246,0.1)]"
          )}
        >
          {/* Inner aurora shimmer effect */}
          <div className="absolute inset-0 hidden dark:block overflow-hidden rounded-xl pointer-events-none">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full"
              animate={{ translateX: ['0%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
            />
            {/* Subtle aurora glow spots */}
            <div className="absolute top-0 left-1/4 w-16 h-16 bg-cyan-500/10 blur-2xl rounded-full" />
            <div className="absolute bottom-0 right-1/4 w-16 h-16 bg-violet-500/10 blur-2xl rounded-full" />
          </div>

          {isAdmin && (
            <DropdownMenuItem 
              onClick={handleAdminClick}
              className={cn(
                "gap-3 py-3 px-3.5 rounded-xl cursor-pointer transition-all duration-300 relative",
                "hover:bg-[hsl(38,40%,92%)]",
                // Dark mode: Enhanced aurora hover with glow
                "dark:hover:bg-gradient-to-r dark:hover:from-cyan-500/[0.15] dark:hover:via-violet-500/[0.1] dark:hover:to-transparent",
                "dark:hover:shadow-[0_0_24px_-6px_rgba(34,211,238,0.5),inset_0_0_0_1px_rgba(34,211,238,0.2)]",
                "group"
              )}
            >
              <motion.div 
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl relative",
                  "bg-[hsl(38,35%,90%)]",
                  // Dark mode: Crystalline icon container with aurora gradient
                  "dark:bg-gradient-to-br dark:from-cyan-500/25 dark:via-violet-500/20 dark:to-cyan-500/25",
                  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_20px_-4px_rgba(34,211,238,0.4)]",
                  "dark:ring-1 dark:ring-cyan-400/20"
                )}
                whileHover={{ scale: 1.08, rotate: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <ShieldCheck className="h-4.5 w-4.5 text-[hsl(25,40%,40%)] dark:text-cyan-400 dark:drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
              </motion.div>
              <span className={cn(
                "text-sm font-semibold text-[hsl(25,35%,25%)]",
                "dark:text-white/95 dark:group-hover:text-cyan-100",
                "transition-colors duration-200"
              )}>
                Admin
              </span>
              {/* Hover arrow indicator */}
              <motion.div 
                className="ml-auto opacity-0 dark:group-hover:opacity-100 transition-opacity duration-200"
                initial={{ x: -4 }}
                whileHover={{ x: 0 }}
              >
                <Sparkles className="h-3.5 w-3.5 text-cyan-400/70" />
              </motion.div>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            onClick={handleLogout}
            className={cn(
              "gap-3 py-3 px-3.5 rounded-xl cursor-pointer transition-all duration-300 relative mt-1",
              "text-[hsl(0,55%,45%)] hover:bg-[hsl(0,50%,95%)]",
              // Dark mode: Rose aurora hover with pulsing glow
              "dark:text-rose-400",
              "dark:hover:bg-gradient-to-r dark:hover:from-rose-500/[0.18] dark:hover:via-pink-500/[0.12] dark:hover:to-transparent",
              "dark:hover:shadow-[0_0_24px_-6px_rgba(244,63,94,0.6),inset_0_0_0_1px_rgba(244,63,94,0.25)]",
              "group"
            )}
          >
            <motion.div 
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl relative",
                "bg-[hsl(0,45%,92%)]",
                // Dark mode: Rose crystalline container
                "dark:bg-gradient-to-br dark:from-rose-500/25 dark:via-pink-500/20 dark:to-rose-500/25",
                "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_20px_-4px_rgba(244,63,94,0.4)]",
                "dark:ring-1 dark:ring-rose-400/20"
              )}
              whileHover={{ scale: 1.08, rotate: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <LogOut className="h-4.5 w-4.5 dark:drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
            </motion.div>
            <span className={cn(
              "text-sm font-semibold",
              "dark:group-hover:text-rose-300",
              "transition-colors duration-200"
            )}>
              Sign out
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
