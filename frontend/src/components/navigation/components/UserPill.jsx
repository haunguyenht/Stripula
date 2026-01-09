import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { getTierConfig } from '../config/tier-config';
import { LogOut, ShieldCheck, Sparkles, User, ChevronDown } from 'lucide-react';
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
 * UserPill - Cyberpunk Design System
 * 
 * Light Mode: Vintage Banking (Cream Paper + Copper Foil)
 * - Copper foil gradients and metallic effects
 * - Embossed text shadows
 * - Wax seal icon styling
 * 
 * Dark Mode: Cyberpunk Neon
 * - Electric cyan (#00f0ff) and hot pink (#ff0080)
 * - Visible neon glow effects
 * - Tech-inspired HUD styling
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
    localStorage.setItem('appActiveRoute', 'dashboard');
    await logout();
  };

  return (
    <div className="flex items-center gap-0.5 xs:gap-1 md:gap-2">
      {/* ═══════════════════════════════════════════════════════════════════
          THEME TOGGLE
          ═══════════════════════════════════════════════════════════════════ */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              "p-1.5 rounded-full transition-all duration-300",
              // Light mode: Wax seal container
              "bg-gradient-to-b from-[hsl(40,45%,96%)] to-[hsl(38,40%,94%)]",
              "border border-[hsl(30,30%,82%)]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(101,67,33,0.08),0_1px_3px_rgba(101,67,33,0.1)]",
              // Dark mode: Cyberpunk neon pill
              "dark:bg-none dark:bg-[rgba(8,12,20,0.8)]",
              "dark:backdrop-blur-xl dark:backdrop-saturate-150",
              "dark:border-[rgba(0,240,255,0.2)]",
              "dark:shadow-[0_0_1px_rgba(0,240,255,0.4),inset_0_1px_0_rgba(0,240,255,0.05)]",
              "dark:hover:border-[rgba(0,240,255,0.5)] dark:hover:shadow-[0_0_15px_-4px_rgba(0,240,255,0.5)]",
              "hover:scale-105 active:scale-95"
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
            "text-xs font-medium",
            "bg-[hsl(40,45%,97%)] border-[hsl(30,30%,80%)] text-[hsl(25,40%,30%)]",
            "shadow-[0_4px_12px_rgba(101,67,33,0.15)]",
            "dark:bg-[rgba(8,12,20,0.97)] dark:border-[rgba(0,240,255,0.3)] dark:text-[rgba(180,255,255,0.95)]",
            "dark:shadow-[0_0_15px_-4px_rgba(0,240,255,0.4)]"
          )}
        >
          <p>Toggle theme</p>
        </TooltipContent>
      </Tooltip>

      {/* ═══════════════════════════════════════════════════════════════════
          AVATAR
          ═══════════════════════════════════════════════════════════════════ */}
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
            {/* Animated neon ring on hover */}
            <AnimatePresence>
              {isAvatarHovered && (
                <motion.div
                  className={cn(
                    "absolute -inset-1.5 rounded-full",
                    // Light mode: Copper foil glow
                    "bg-gradient-to-r from-[hsl(25,70%,55%)] via-[hsl(35,75%,52%)] to-[hsl(25,70%,55%)]",
                    // Dark mode: Neon cyan/pink glow
                    "dark:bg-none dark:bg-gradient-to-r dark:from-[rgba(0,240,255,1)] dark:via-[rgba(255,0,128,0.8)] dark:to-[rgba(0,240,255,1)]"
                  )}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 0.8, 
                    scale: 1,
                    rotate: [0, 360]
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 },
                    rotate: { duration: 2, repeat: Infinity, ease: 'linear' }
                  }}
                  style={{ filter: 'blur(6px)' }}
                />
              )}
            </AnimatePresence>

            {/* User icon overlay on hover */}
            <AnimatePresence>
              {isAvatarHovered && (
                <motion.div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center rounded-full z-10",
                    // Light mode: Copper overlay
                    "bg-gradient-to-b from-[hsl(25,65%,50%)] via-[hsl(30,70%,48%)] to-[hsl(25,60%,42%)]",
                    // Dark mode: Neon overlay
                    "dark:bg-none dark:bg-gradient-to-br dark:from-[rgba(0,240,255,0.95)] dark:via-[rgba(0,200,240,0.9)] dark:to-[rgba(255,0,128,0.8)]"
                  )}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <User className="h-4 w-4 text-white dark:text-[rgba(10,15,20,1)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Avatar container */}
            <div className="relative">
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt={displayName}
                  className={cn(
                    "rounded-full object-cover transition-all duration-300",
                    "h-7 w-7 xs:h-8 xs:w-8 md:h-9 md:w-9",
                    // Light mode: Copper coin ring
                    "ring-2 ring-[hsl(30,40%,75%)]",
                    "shadow-[0_2px_6px_rgba(101,67,33,0.2)]",
                    // Dark mode: Neon ring
                    "dark:ring-[rgba(0,240,255,0.4)]",
                    "dark:shadow-[0_0_15px_-4px_rgba(0,240,255,0.5)]"
                  )}
                />
              ) : (
                <div className={cn(
                  "flex items-center justify-center rounded-full font-bold transition-all duration-300",
                  "h-7 w-7 xs:h-8 xs:w-8 md:h-9 md:w-9",
                  "text-xs text-white",
                  // Light mode: Copper foil gradient
                  "bg-gradient-to-b from-[hsl(25,65%,52%)] via-[hsl(30,70%,48%)] to-[hsl(25,60%,42%)]",
                  "ring-2 ring-[hsl(30,40%,75%)]",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.1),0_2px_6px_rgba(101,67,33,0.2)]",
                  // Dark mode: Neon gradient
                  "dark:bg-none dark:bg-gradient-to-br dark:from-[rgba(0,240,255,1)] dark:to-[rgba(255,0,128,0.9)]",
                  "dark:ring-[rgba(0,240,255,0.4)]",
                  "dark:shadow-[0_0_15px_-4px_rgba(0,240,255,0.6)]",
                  "dark:text-[rgba(10,15,20,1)]"
                )}
                style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* Tier badge - top right */}
              {TierIcon && user?.tier && user.tier !== 'free' && !isAvatarHovered && (
                <motion.div 
                  className={cn(
                    "absolute -top-0.5 -right-0.5 flex items-center justify-center",
                    "h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-[18px] md:w-[18px] rounded-full",
                    // Light mode: Wax seal badge
                    "bg-gradient-to-b from-[hsl(40,50%,97%)] to-[hsl(38,45%,94%)]",
                    "border border-[hsl(30,30%,78%)]",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_3px_rgba(101,67,33,0.15)]",
                    // Dark mode: Tech badge
                    "dark:bg-none dark:bg-[rgba(8,12,20,0.95)]",
                    "dark:border-[rgba(0,240,255,0.3)]",
                    "dark:shadow-[0_0_8px_-2px_rgba(0,240,255,0.4)]"
                  )}
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <TierIcon className={cn(
                    "h-2 w-2 xs:h-2.5 xs:w-2.5 md:h-2.5 md:w-2.5",
                    user?.tier === 'diamond' && "text-sky-500 dark:text-[rgba(0,240,255,1)] dark:drop-shadow-[0_0_4px_rgba(0,240,255,0.8)]",
                    user?.tier === 'gold' && "text-amber-600 dark:text-amber-400 dark:drop-shadow-[0_0_4px_rgba(255,200,0,0.6)]",
                    user?.tier === 'silver' && "text-slate-500 dark:text-slate-300",
                    user?.tier === 'bronze' && "text-orange-600 dark:text-orange-400",
                  )} />
                </motion.div>
              )}
              
              {/* Status indicator - bottom right */}
              {!isAvatarHovered && (
                showExpirationWarning ? (
                  <motion.div 
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full",
                      "bg-amber-500 dark:bg-amber-400",
                      "ring-2 ring-background",
                      "dark:shadow-[0_0_10px_rgba(255,200,0,0.6)]"
                    )}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                ) : (
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full",
                    "bg-emerald-500 dark:bg-[rgba(0,255,150,1)]",
                    "ring-2 ring-background",
                    "dark:shadow-[0_0_10px_rgba(0,255,150,0.6)]"
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
            "shadow-[0_4px_12px_rgba(101,67,33,0.15)]",
            "dark:bg-[rgba(8,12,20,0.97)] dark:border-[rgba(0,240,255,0.3)] dark:text-[rgba(180,255,255,0.95)]",
            "dark:shadow-[0_0_15px_-4px_rgba(0,240,255,0.4)]"
          )}
        >
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3" />
            <span>My Profile</span>
          </div>
        </TooltipContent>
      </Tooltip>

      {/* ═══════════════════════════════════════════════════════════════════
          USER DROPDOWN
          ═══════════════════════════════════════════════════════════════════ */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            className={cn(
              "flex items-center cursor-pointer transition-all duration-300 outline-none",
              "p-1.5 rounded-lg",
              // Light mode
              "bg-gradient-to-b from-[hsl(40,45%,96%)] to-[hsl(38,40%,94%)]",
              "border border-[hsl(30,30%,82%)]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(101,67,33,0.08)]",
              "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_4px_rgba(101,67,33,0.12)]",
              // Dark mode: Cyberpunk pill
              "dark:bg-none dark:bg-[rgba(8,12,20,0.8)]",
              "dark:backdrop-blur-xl",
              "dark:border-[rgba(0,240,255,0.2)]",
              "dark:shadow-[0_0_1px_rgba(0,240,255,0.4),inset_0_1px_0_rgba(0,240,255,0.05)]",
              "dark:hover:bg-[rgba(0,240,255,0.1)]",
              "dark:hover:border-[rgba(0,240,255,0.5)]",
              "dark:hover:shadow-[0_0_15px_-4px_rgba(0,240,255,0.5)]",
              "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronDown className={cn(
              "h-3.5 w-3.5 transition-colors",
              "text-[hsl(25,35%,45%)]",
              "dark:text-[rgba(0,240,255,0.7)] dark:hover:text-[rgba(0,240,255,1)]"
            )} />
          </motion.button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className={cn(
            "w-60 p-3 overflow-hidden relative",
            // ═══════════════════════════════════════════════════════════
            // LIGHT MODE: Vintage Banking Certificate Style
            // ═══════════════════════════════════════════════════════════
            "bg-gradient-to-b from-[hsl(40,50%,98%)] to-[hsl(38,45%,95%)]",
            "border-2 border-[hsl(30,35%,78%)]",
            "shadow-[inset_0_0_0_1px_hsl(38,45%,96%),inset_0_0_0_2px_hsl(30,30%,85%),0_8px_32px_rgba(101,67,33,0.15),0_2px_8px_rgba(101,67,33,0.1)]",
            "rounded-xl",
            // ═══════════════════════════════════════════════════════════
            // DARK MODE: Cyberpunk Neon Panel
            // ═══════════════════════════════════════════════════════════
            "dark:bg-none dark:bg-[rgba(4,8,16,0.97)]",
            "dark:backdrop-blur-2xl dark:backdrop-saturate-150",
            "dark:border dark:border-[rgba(0,240,255,0.25)]",
            // Neon glow
            "dark:shadow-[0_0_2px_rgba(0,240,255,0.5),0_0_50px_-15px_rgba(0,240,255,0.3),0_0_35px_-10px_rgba(255,0,128,0.15),0_20px_50px_-10px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(0,240,255,0.1)]",
            "dark:rounded-xl"
          )}
        >
          {/* Light mode: Paper grain texture overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none dark:hidden"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
            }}
          />

          {/* Dark mode: Tech corner accents */}
          <div className="absolute top-0 left-0 w-5 h-5 hidden dark:block pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-[rgba(0,240,255,0.7)] to-transparent" />
            <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-[rgba(0,240,255,0.7)] to-transparent" />
          </div>
          <div className="absolute bottom-0 right-0 w-5 h-5 hidden dark:block pointer-events-none">
            <div className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-[rgba(255,0,128,0.6)] to-transparent" />
            <div className="absolute bottom-0 right-0 w-px h-full bg-gradient-to-t from-[rgba(255,0,128,0.6)] to-transparent" />
          </div>

          {/* Dark mode: Scan line effect */}
          <div className="absolute inset-0 hidden dark:block overflow-hidden rounded-xl pointer-events-none opacity-20">
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,240,255,0.1)] to-transparent h-[200%]"
              animate={{ y: ['-100%', '0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* ═══════════════════════════════════════════════════════════
              USER INFO HEADER
              ═══════════════════════════════════════════════════════════ */}
          <div className={cn(
            "relative mb-3 pb-3",
            "border-b-2 border-[hsl(30,30%,85%)]",
            "dark:border-b dark:border-[rgba(0,240,255,0.15)]"
          )}>
            <div className="flex items-center gap-3">
              {/* Mini avatar */}
              <div className="relative">
                {photoUrl ? (
                  <img 
                    src={photoUrl} 
                    alt={displayName}
                    className={cn(
                      "h-11 w-11 rounded-xl object-cover",
                      "ring-2 ring-[hsl(30,35%,80%)]",
                      "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3),0_2px_6px_rgba(101,67,33,0.15)]",
                      "dark:ring-[rgba(0,240,255,0.3)]",
                      "dark:shadow-[0_0_15px_-4px_rgba(0,240,255,0.4)]"
                    )}
                  />
                ) : (
                  <div className={cn(
                    "h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm text-white",
                    "bg-gradient-to-b from-[hsl(25,65%,52%)] via-[hsl(30,70%,48%)] to-[hsl(25,60%,42%)]",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.15),0_2px_6px_rgba(101,67,33,0.2)]",
                    "dark:bg-none dark:bg-gradient-to-br dark:from-[rgba(0,240,255,1)] dark:to-[rgba(255,0,128,0.9)]",
                    "dark:text-[rgba(10,15,20,1)]",
                    "dark:shadow-[0_0_20px_-4px_rgba(0,240,255,0.6)]"
                  )}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Online indicator */}
                <motion.div 
                  className={cn(
                    "absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full",
                    "bg-emerald-500 dark:bg-[rgba(0,255,150,1)]",
                    "ring-2 ring-[hsl(40,50%,97%)]",
                    "dark:ring-[rgba(4,8,16,0.97)]",
                    "dark:shadow-[0_0_12px_rgba(0,255,150,0.7)]"
                  )}
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              
              {/* User details */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-semibold text-sm truncate",
                  "text-[hsl(25,40%,25%)]",
                  "[text-shadow:0_1px_0_rgba(255,255,255,0.5)] dark:[text-shadow:0_0_8px_rgba(0,240,255,0.4)]",
                  "dark:text-[rgba(180,255,255,1)]"
                )}>
                  {displayName}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {TierIcon && (
                    <motion.div
                      animate={tier.iconAnimation}
                      transition={tier.iconTransition}
                      className={cn(tier.color, "dark:drop-shadow-[0_0_6px_currentColor]")}
                    >
                      <TierIcon className="h-3.5 w-3.5" />
                    </motion.div>
                  )}
                  <span className={cn(
                    "text-xs font-medium capitalize",
                    tier.color,
                    "[text-shadow:0_1px_0_rgba(255,255,255,0.3)] dark:[text-shadow:none]"
                  )}>
                    {user?.tier || 'Free'} Tier
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              ADMIN PANEL BUTTON
              ═══════════════════════════════════════════════════════════ */}
          {isAdmin && (
            <DropdownMenuItem 
              onClick={handleAdminClick}
              className={cn(
                "gap-3 py-3 px-3 rounded-xl cursor-pointer transition-all duration-300 relative group",
                // Light mode
                "hover:bg-gradient-to-r hover:from-[hsl(38,45%,93%)] hover:to-[hsl(40,40%,95%)]",
                "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_3px_rgba(101,67,33,0.08)]",
                // Dark mode: Neon cyan hover
                "dark:hover:bg-gradient-to-r dark:hover:from-[rgba(0,240,255,0.15)] dark:hover:to-[rgba(0,200,240,0.08)]",
                "dark:hover:shadow-[0_0_20px_-5px_rgba(0,240,255,0.5),inset_0_0_0_1px_rgba(0,240,255,0.25)]"
              )}
            >
              <motion.div 
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl relative",
                  // Light mode
                  "bg-gradient-to-b from-[hsl(40,45%,95%)] to-[hsl(38,40%,92%)]",
                  "border border-[hsl(30,30%,82%)]",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(101,67,33,0.08),0_1px_3px_rgba(101,67,33,0.1)]",
                  // Dark mode: Neon container
                  "dark:bg-none dark:bg-[rgba(0,240,255,0.15)]",
                  "dark:border-0 dark:ring-1 dark:ring-[rgba(0,240,255,0.3)]",
                  "dark:shadow-[0_0_15px_-4px_rgba(0,240,255,0.5),inset_0_1px_0_rgba(0,240,255,0.2)]"
                )}
                whileHover={{ scale: 1.08, rotate: 3 }}
              >
                <ShieldCheck className={cn(
                  "h-5 w-5",
                  "text-[hsl(25,50%,42%)]",
                  "dark:text-[rgba(0,240,255,1)] dark:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                )} />
              </motion.div>
              <div className="flex-1">
                <span className={cn(
                  "text-sm font-semibold transition-colors duration-200",
                  "text-[hsl(25,40%,28%)]",
                  "[text-shadow:0_1px_0_rgba(255,255,255,0.4)] dark:[text-shadow:none]",
                  "dark:text-[rgba(180,255,255,1)] dark:group-hover:text-[rgba(200,255,255,1)]"
                )}>
                  Admin Panel
                </span>
                <p className={cn(
                  "text-[10px] transition-colors",
                  "text-[hsl(25,25%,55%)]",
                  "dark:text-[rgba(0,240,255,0.5)] dark:group-hover:text-[rgba(0,240,255,0.7)]"
                )}>
                  Manage users & settings
                </p>
              </div>
              <motion.div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Sparkles className={cn(
                  "h-4 w-4",
                  "text-[hsl(25,50%,50%)]",
                  "dark:text-[rgba(0,240,255,1)] dark:drop-shadow-[0_0_6px_rgba(0,240,255,0.8)]"
                )} />
              </motion.div>
            </DropdownMenuItem>
          )}
          
          {/* ═══════════════════════════════════════════════════════════
              SIGN OUT BUTTON
              ═══════════════════════════════════════════════════════════ */}
          <DropdownMenuItem 
            onClick={handleLogout}
            className={cn(
              "gap-3 py-3 px-3 rounded-xl cursor-pointer transition-all duration-300 relative mt-2 group",
              // Light mode
              "text-[hsl(0,50%,42%)]",
              "hover:bg-gradient-to-r hover:from-[hsl(0,45%,95%)] hover:to-[hsl(0,40%,97%)]",
              "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_3px_rgba(120,40,40,0.1)]",
              // Dark mode: Neon pink hover
              "dark:text-[rgba(255,100,150,1)]",
              "dark:hover:bg-gradient-to-r dark:hover:from-[rgba(255,0,128,0.15)] dark:hover:to-[rgba(255,50,100,0.08)]",
              "dark:hover:shadow-[0_0_20px_-5px_rgba(255,0,128,0.5),inset_0_0_0_1px_rgba(255,0,128,0.25)]"
            )}
          >
            <motion.div 
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl relative",
                // Light mode
                "bg-gradient-to-b from-[hsl(0,40%,96%)] to-[hsl(0,35%,93%)]",
                "border border-[hsl(0,30%,82%)]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(120,40,40,0.06),0_1px_3px_rgba(120,40,40,0.1)]",
                // Dark mode: Neon pink container
                "dark:bg-none dark:bg-[rgba(255,0,128,0.15)]",
                "dark:border-0 dark:ring-1 dark:ring-[rgba(255,0,128,0.3)]",
                "dark:shadow-[0_0_15px_-4px_rgba(255,0,128,0.5),inset_0_1px_0_rgba(255,0,128,0.2)]"
              )}
              whileHover={{ scale: 1.08, rotate: -3 }}
            >
              <LogOut className={cn(
                "h-5 w-5",
                "text-[hsl(0,45%,45%)]",
                "dark:text-[rgba(255,100,150,1)] dark:drop-shadow-[0_0_8px_rgba(255,0,128,0.8)]"
              )} />
            </motion.div>
            <div className="flex-1">
              <span className={cn(
                "text-sm font-semibold transition-colors duration-200",
                "[text-shadow:0_1px_0_rgba(255,255,255,0.4)] dark:[text-shadow:none]",
                "dark:text-[rgba(255,150,180,1)] dark:group-hover:text-[rgba(255,180,200,1)]"
              )}>
                Sign out
              </span>
              <p className={cn(
                "text-[10px] transition-colors",
                "text-[hsl(0,30%,55%)]",
                "dark:text-[rgba(255,0,128,0.5)] dark:group-hover:text-[rgba(255,0,128,0.7)]"
              )}>
                End your session
              </p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
