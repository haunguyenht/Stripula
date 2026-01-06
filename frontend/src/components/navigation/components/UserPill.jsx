import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { NavPill } from './NavPill';
import { getTierConfig } from '../config/tier-config';
import { LogOut, ShieldCheck, Clock, Sparkles, User, ChevronDown } from 'lucide-react';
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
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
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
    // Reset route to dashboard for next login
    localStorage.setItem('appActiveRoute', 'dashboard');
    await logout();
  };


  return (
    <div className="flex items-center gap-0.5 xs:gap-1 md:gap-2">
      {/* Theme Toggle - Clean, no background */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className="p-1"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
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

      {/* Avatar - Clickable to Profile */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={handleProfileClick}
            onHoverStart={() => setIsAvatarHovered(true)}
            onHoverEnd={() => setIsAvatarHovered(false)}
            className={cn(
              "relative cursor-pointer transition-all duration-300 outline-none",
              "p-0.5 rounded-full",
              "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            )}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Animated ring on hover - Light mode: copper, Dark mode: aurora */}
            <AnimatePresence>
              {isAvatarHovered && (
                <motion.div
                  className={cn(
                    "absolute -inset-1 rounded-full",
                    // Light mode: Copper foil glow
                    "bg-gradient-to-r from-[hsl(25,70%,55%)] via-[hsl(30,65%,50%)] to-[hsl(25,70%,55%)]",
                    // Dark mode: Aurora glow
                    "dark:from-cyan-400 dark:via-violet-500 dark:to-pink-500"
                  )}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 0.6, 
                    scale: 1,
                    rotate: [0, 360]
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 },
                    rotate: { duration: 3, repeat: Infinity, ease: 'linear' }
                  }}
                  style={{ filter: 'blur(4px)' }}
                />
              )}
            </AnimatePresence>

            {/* User icon overlay on hover */}
            <AnimatePresence>
              {isAvatarHovered && (
                <motion.div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center rounded-full z-10",
                    // Light mode: translucent copper overlay
                    "bg-[hsl(25,60%,45%)]/85",
                    // Dark mode: translucent aurora overlay
                    "dark:bg-gradient-to-br dark:from-cyan-500/90 dark:via-violet-500/90 dark:to-pink-500/90"
                  )}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <User className="h-4 w-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Avatar - Clean, with tier badge */}
            <div className="relative">
              {/* Avatar image or initial */}
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt={displayName}
                  className={cn(
                    "rounded-full object-cover transition-all duration-300",
                    "h-7 w-7 xs:h-8 xs:w-8 md:h-9 md:w-9",
                    // Subtle ring only
                    "ring-2 ring-white/20 dark:ring-white/10"
                  )}
                />
              ) : (
                <div className={cn(
                  "flex items-center justify-center rounded-full font-bold transition-all duration-300",
                  "h-7 w-7 xs:h-8 xs:w-8 md:h-9 md:w-9",
                  "text-xs",
                  // Light mode
                  "bg-gradient-to-br from-[hsl(25,70%,48%)] to-[hsl(22,65%,38%)] text-white",
                  // Dark mode
                  "dark:from-violet-500 dark:to-cyan-500",
                  // Subtle ring
                  "ring-2 ring-white/20 dark:ring-white/10"
                )}
                style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* Tier badge - top right corner - small circular badge */}
              {TierIcon && user?.tier && user.tier !== 'free' && !isAvatarHovered && (
                <motion.div 
                  className={cn(
                    "absolute -top-0.5 -right-0.5 flex items-center justify-center",
                    "h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-[18px] md:w-[18px] rounded-full",
                    // Light mode - subtle cream background
                    "bg-[hsl(40,45%,96%)] border border-[hsl(30,30%,80%)]",
                    "shadow-[0_1px_3px_rgba(0,0,0,0.1)]",
                    // Dark mode - dark glass with subtle border
                    "dark:bg-[rgba(20,22,30,0.95)] dark:border-white/20",
                    "dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                  )}
                  animate={{ 
                    scale: [1, 1.08, 1],
                  }}
                  transition={{ 
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <TierIcon className={cn(
                    "h-2 w-2 xs:h-2.5 xs:w-2.5 md:h-2.5 md:w-2.5",
                    // Custom colors per tier for better visibility
                    user?.tier === 'diamond' && "text-sky-400 dark:text-sky-300",
                    user?.tier === 'gold' && "text-amber-500 dark:text-amber-400",
                    user?.tier === 'silver' && "text-slate-400 dark:text-slate-300",
                    user?.tier === 'bronze' && "text-orange-500 dark:text-orange-400",
                  )} />
                </motion.div>
              )}
              
              {/* Status indicator - bottom right - hidden when hovered */}
              {!isAvatarHovered && (
                showExpirationWarning ? (
                  <motion.div 
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full",
                      "bg-amber-500 dark:bg-amber-400",
                      "ring-2 ring-background"
                    )}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                ) : (
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full",
                    "bg-emerald-500 dark:bg-emerald-400",
                    "ring-2 ring-background"
                  )} />
                )
              )}
            </div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className={cn(
            "text-xs font-medium",
            "bg-[hsl(40,45%,97%)] border-[hsl(30,30%,80%)] text-[hsl(25,40%,30%)]",
            "dark:bg-[rgba(8,10,18,0.95)] dark:border-violet-500/20 dark:text-white",
            "dark:shadow-[0_0_20px_-4px_rgba(139,92,246,0.3)]"
          )}
        >
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3" />
            <span>My Profile</span>
          </div>
        </TooltipContent>
      </Tooltip>

      {/* User Dropdown - Chevron trigger */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            className={cn(
              "flex items-center cursor-pointer transition-all duration-300 outline-none",
              "p-1 rounded-md",
              // Light mode
              "hover:bg-[hsl(38,35%,92%)]",
              // Dark mode
              "dark:hover:bg-white/10",
              "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronDown className={cn(
              "h-3.5 w-3.5 transition-colors",
              "text-[hsl(25,30%,50%)]",
              "dark:text-white/60 dark:hover:text-white"
            )} />
          </motion.button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className={cn(
            "w-56 p-3 overflow-hidden relative",
            // Light mode: Vintage Banking
            "bg-gradient-to-b from-[hsl(40,50%,97%)] to-[hsl(38,45%,95%)]",
            "border-[hsl(30,35%,75%)]/50",
            "shadow-[0_8px_32px_rgba(101,67,33,0.12)]",
            // ═══════════════════════════════════════════════════════════
            // DARK MODE: Obsidian Aurora Crystalline Dropdown
            // ═══════════════════════════════════════════════════════════
            "dark:bg-[rgba(6,8,16,0.97)]",
            "dark:backdrop-blur-[100px] dark:backdrop-saturate-[220%]",
            // Premium prismatic animated border
            "dark:border-2 dark:border-transparent dark:rounded-2xl",
            "dark:[background-image:linear-gradient(to_bottom,rgba(6,8,16,0.97),rgba(10,12,22,0.97)),linear-gradient(135deg,rgba(34,211,238,0.6),rgba(139,92,246,0.5),rgba(236,72,153,0.5),rgba(34,211,238,0.6))]",
            "dark:[background-origin:border-box] dark:[background-clip:padding-box,border-box]",
            // Multi-layered deep aurora glow - ENHANCED
            "dark:shadow-[0_30px_70px_-12px_rgba(0,0,0,0.95),0_0_100px_-20px_rgba(139,92,246,0.4),0_0_60px_-15px_rgba(34,211,238,0.3),0_0_40px_-8px_rgba(236,72,153,0.25),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(139,92,246,0.15)]"
          )}
        >
          {/* Inner aurora shimmer effect - ENHANCED */}
          <div className="absolute inset-0 hidden dark:block overflow-hidden rounded-xl pointer-events-none">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full"
              animate={{ translateX: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
            />
            {/* Animated aurora glow spots */}
            <motion.div 
              className="absolute -top-4 left-1/4 w-20 h-20 bg-cyan-500/15 blur-3xl rounded-full"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.15, 0.25, 0.15]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div 
              className="absolute -bottom-4 right-1/4 w-20 h-20 bg-violet-500/15 blur-3xl rounded-full"
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.12, 0.2]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />
            <motion.div 
              className="absolute top-1/2 -left-4 w-16 h-16 bg-pink-500/10 blur-2xl rounded-full"
              animate={{ 
                y: [-10, 10, -10],
                opacity: [0.1, 0.18, 0.1]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
          </div>

          {/* User Info Header Section */}
          <div className={cn(
            "relative mb-2 pb-3",
            // Light mode
            "border-b border-[hsl(30,30%,85%)]",
            // Dark mode
            "dark:border-b dark:border-white/[0.08]"
          )}>
            <div className="flex items-center gap-3">
              {/* Mini avatar */}
              <div className="relative">
                {photoUrl ? (
                  <img 
                    src={photoUrl} 
                    alt={displayName}
                    className={cn(
                      "h-10 w-10 rounded-xl object-cover",
                      "ring-2 ring-[hsl(30,35%,85%)]",
                      "dark:ring-white/10"
                    )}
                  />
                ) : (
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm",
                    "bg-gradient-to-br from-[hsl(25,70%,48%)] to-[hsl(22,65%,38%)] text-white",
                    "dark:from-cyan-500 dark:via-violet-500 dark:to-pink-500"
                  )}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Online indicator */}
                <motion.div 
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full",
                    "bg-emerald-500 dark:bg-emerald-400",
                    "ring-2 ring-white dark:ring-[rgba(6,8,16,0.97)]",
                    "dark:shadow-[0_0_10px_rgba(52,211,153,0.6)]"
                  )}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              
              {/* User details */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-semibold text-sm truncate",
                  "text-[hsl(25,35%,25%)]",
                  "dark:text-white"
                )}>
                  {displayName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {TierIcon && (
                    <motion.div
                      animate={tier.iconAnimation}
                      transition={tier.iconTransition}
                      className={cn(tier.color, "dark:drop-shadow-[0_0_4px_currentColor]")}
                    >
                      <TierIcon className="h-3 w-3" />
                    </motion.div>
                  )}
                  <span className={cn(
                    "text-xs font-medium capitalize",
                    tier.color,
                    "dark:opacity-90"
                  )}>
                    {user?.tier || 'Free'} Tier
                  </span>
                </div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <DropdownMenuItem 
              onClick={handleAdminClick}
              className={cn(
                "gap-3 py-3 px-3 rounded-xl cursor-pointer transition-all duration-300 relative",
                "hover:bg-[hsl(38,40%,92%)]",
                // Dark mode: Enhanced aurora hover with glow
                "dark:hover:bg-gradient-to-r dark:hover:from-cyan-500/[0.18] dark:hover:via-violet-500/[0.12] dark:hover:to-transparent",
                "dark:hover:shadow-[0_0_30px_-6px_rgba(34,211,238,0.6),inset_0_0_0_1px_rgba(34,211,238,0.25)]",
                "group"
              )}
            >
              <motion.div 
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl relative",
                  "bg-[hsl(38,35%,90%)]",
                  // Dark mode: Crystalline icon container with aurora gradient + PULSING GLOW
                  "dark:bg-gradient-to-br dark:from-cyan-500/30 dark:via-violet-500/25 dark:to-cyan-500/30",
                  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_24px_-4px_rgba(34,211,238,0.5)]",
                  "dark:ring-1 dark:ring-cyan-400/25"
                )}
                whileHover={{ scale: 1.1, rotate: 5 }}
                animate={{
                  boxShadow: [
                    'inset 0 1px 0 rgba(255,255,255,0.2), 0 0 24px -4px rgba(34,211,238,0.4)',
                    'inset 0 1px 0 rgba(255,255,255,0.2), 0 0 32px -4px rgba(34,211,238,0.6)',
                    'inset 0 1px 0 rgba(255,255,255,0.2), 0 0 24px -4px rgba(34,211,238,0.4)',
                  ]
                }}
                transition={{ 
                  boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                  scale: { type: "spring", stiffness: 400, damping: 17 },
                  rotate: { type: "spring", stiffness: 400, damping: 17 }
                }}
              >
                <ShieldCheck className="h-5 w-5 text-[hsl(25,40%,40%)] dark:text-cyan-400 dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
              </motion.div>
              <div className="flex-1">
                <span className={cn(
                  "text-sm font-semibold text-[hsl(25,35%,25%)]",
                  "dark:text-white dark:group-hover:text-cyan-100",
                  "transition-colors duration-200"
                )}>
                  Admin Panel
                </span>
                <p className="text-[10px] text-[hsl(25,25%,50%)] dark:text-white/40 dark:group-hover:text-cyan-200/50 transition-colors">
                  Manage users & settings
                </p>
              </div>
              {/* Hover arrow indicator */}
              <motion.div 
                className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                initial={{ x: -4, opacity: 0 }}
                whileHover={{ x: 0, opacity: 1 }}
              >
                <Sparkles className="h-4 w-4 text-cyan-400/80 dark:drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]" />
              </motion.div>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            onClick={handleLogout}
            className={cn(
              "gap-3 py-3 px-3 rounded-xl cursor-pointer transition-all duration-300 relative mt-1.5",
              "text-[hsl(0,55%,45%)] hover:bg-[hsl(0,50%,95%)]",
              // Dark mode: Rose aurora hover with pulsing glow
              "dark:text-rose-400",
              "dark:hover:bg-gradient-to-r dark:hover:from-rose-500/[0.2] dark:hover:via-pink-500/[0.14] dark:hover:to-transparent",
              "dark:hover:shadow-[0_0_30px_-6px_rgba(244,63,94,0.7),inset_0_0_0_1px_rgba(244,63,94,0.3)]",
              "group"
            )}
          >
            <motion.div 
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl relative",
                "bg-[hsl(0,45%,92%)]",
                // Dark mode: Rose crystalline container with PULSING GLOW
                "dark:bg-gradient-to-br dark:from-rose-500/30 dark:via-pink-500/25 dark:to-rose-500/30",
                "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_24px_-4px_rgba(244,63,94,0.5)]",
                "dark:ring-1 dark:ring-rose-400/25"
              )}
              whileHover={{ scale: 1.1, rotate: -5 }}
              animate={{
                boxShadow: [
                  'inset 0 1px 0 rgba(255,255,255,0.15), 0 0 24px -4px rgba(244,63,94,0.4)',
                  'inset 0 1px 0 rgba(255,255,255,0.15), 0 0 32px -4px rgba(244,63,94,0.6)',
                  'inset 0 1px 0 rgba(255,255,255,0.15), 0 0 24px -4px rgba(244,63,94,0.4)',
                ]
              }}
              transition={{ 
                boxShadow: { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
                scale: { type: "spring", stiffness: 400, damping: 17 },
                rotate: { type: "spring", stiffness: 400, damping: 17 }
              }}
            >
              <LogOut className="h-5 w-5 dark:text-rose-400 dark:drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]" />
            </motion.div>
            <div className="flex-1">
              <span className={cn(
                "text-sm font-semibold",
                "dark:text-rose-400 dark:group-hover:text-rose-300",
                "transition-colors duration-200"
              )}>
                Sign out
              </span>
              <p className="text-[10px] text-[hsl(0,30%,55%)] dark:text-rose-400/50 dark:group-hover:text-rose-300/60 transition-colors">
                End your session
              </p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
