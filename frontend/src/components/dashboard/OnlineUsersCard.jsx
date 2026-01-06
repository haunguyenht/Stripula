import { memo, forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, ChevronLeft, ChevronRight, Wifi, Radio, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTierConfig } from '@/components/navigation/config/tier-config';

function formatLastActive(timestamp) {
  if (!timestamp) return 'Now';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins}m ago`;
  return `${Math.floor(diffMins / 60)}h ago`;
}

/**
 * Premium user avatar with online pulse and tier styling
 */
function UserAvatar({ src, name, tier }) {
  const [imgError, setImgError] = useState(false);
  const initials = (name || 'A').slice(0, 2).toUpperCase();
  const isDiamond = tier === 'diamond';
  const isGold = tier === 'gold';
  
  const showImage = src && !imgError;

  const glowColor = isDiamond ? 'from-cyan-400 to-blue-500' :
    isGold ? 'from-yellow-400 to-amber-500' : null;

  return (
    <div className="relative">
      {/* Tier glow ring */}
      {glowColor && (
        <motion.div 
          className={cn(
            "absolute -inset-1 rounded-full opacity-50",
            "bg-gradient-to-r",
            glowColor
          )}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      
      <div className={cn(
        "relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0",
        "border-2 bg-muted dark:bg-white/[0.08]",
        "shadow-sm",
        isDiamond && "border-cyan-400",
        isGold && "border-yellow-400",
        !isDiamond && !isGold && "border-border/60 dark:border-white/[0.12]"
      )}>
        {showImage && (
          <img 
            src={src} 
            alt={name} 
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
        
        {!showImage && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center text-xs font-bold",
            "bg-gradient-to-br",
            isDiamond && "from-cyan-100 to-sky-200 dark:from-cyan-900/80 dark:to-sky-900/80 text-cyan-700 dark:text-cyan-300",
            isGold && "from-yellow-100 to-amber-200 dark:from-yellow-900/80 dark:to-amber-900/80 text-yellow-700 dark:text-yellow-300",
            !isDiamond && !isGold && "from-muted to-muted text-muted-foreground"
          )}>
            {initials}
          </div>
        )}
      </div>
      
      {/* Online indicator with pulse */}
      <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
        <span className={cn(
          "relative inline-flex rounded-full h-3.5 w-3.5",
          "border-2 border-card bg-emerald-500",
          "shadow-[0_0_6px_rgba(16,185,129,0.5)]"
        )} />
      </span>
    </div>
  );
}

/**
 * User row with premium hover effects
 */
const UserRow = forwardRef(function UserRow({ user, delay = 0 }, ref) {
  const { username, firstName, tier, lastActiveAt, avatarUrl } = user;
  const tierConfig = getTierConfig(tier || 'free');
  const TierIcon = tierConfig.icon;
  const displayName = firstName || username || 'Anonymous';
  
  const isDiamond = tier === 'diamond';
  const isGold = tier === 'gold';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ x: 4 }}
      className={cn(
        "group flex items-center gap-3.5 p-3 rounded-xl",
        "transition-all duration-300",
        "hover:bg-accent/50 dark:hover:bg-white/[0.04]",
        // Premium tier styling
        (isDiamond || isGold) && [
          "bg-gradient-to-r from-transparent",
          isDiamond && "to-cyan-500/[0.02] dark:to-cyan-500/[0.03]",
          isGold && "to-amber-500/[0.02] dark:to-amber-500/[0.03]"
        ]
      )}
    >
      <UserAvatar src={avatarUrl} name={displayName} tier={tier} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-semibold truncate",
            isDiamond && "bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent",
            isGold && "bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent",
            !isDiamond && !isGold && "text-foreground"
          )}>
            {displayName}
          </span>
          <TierIcon className={cn("w-3.5 h-3.5 flex-shrink-0", tierConfig.color)} />
        </div>
        <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
          @{username || 'anonymous'}
        </p>
      </div>
      
      {/* Time badge */}
      <div className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg",
        "bg-muted/50 dark:bg-white/[0.04]",
        "text-[10px] font-medium text-muted-foreground tabular-nums"
      )}>
        <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" />
        {formatLastActive(lastActiveAt)}
      </div>
    </motion.div>
  );
});

/**
 * Premium pagination controls
 */
function Pagination({ page, totalPages, onPrev, onNext, hasPrev, hasNext }) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn(
      "flex items-center justify-center gap-4 pt-4 mt-3",
      "border-t border-border/30 dark:border-white/[0.06]"
    )}>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onPrev} 
        disabled={!hasPrev} 
        className={cn(
          "h-8 w-8 rounded-lg",
          "disabled:opacity-30"
        )}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      
      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <motion.div
            key={i}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-200",
              i + 1 === page 
                ? "bg-primary w-4" 
                : "bg-muted-foreground/30"
            )}
            animate={i + 1 === page ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onNext} 
        disabled={!hasNext} 
        className={cn(
          "h-8 w-8 rounded-lg",
          "disabled:opacity-30"
        )}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

/**
 * OnlineUsersCard - Active users with premium glass styling
 */
function OnlineUsersCardComponent({ 
  users = [], 
  page = 1,
  totalPages = 1,
  total = 0,
  hasNextPage = false,
  hasPrevPage = false,
  onNextPage,
  onPrevPage,
  isLoading = false, 
  className 
}) {
  return (
    <div className={cn(
      "relative rounded-3xl overflow-hidden h-full",
      // Light mode
      "bg-card/80 backdrop-blur-sm",
      "border border-border/60",
      "shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
      // Dark mode - OPUX glass
      "dark:bg-white/[0.03] dark:backdrop-blur-xl",
      "dark:border-white/[0.08]",
      "dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]",
      className
    )}>
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-0 dark:opacity-[0.15] pointer-events-none bg-[image:var(--noise-pattern-subtle)] bg-repeat" />
      
      {/* Decorative gradient */}
      <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/15 to-green-500/10 blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="relative px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-2xl",
                "bg-gradient-to-br from-emerald-500 to-green-600",
                "shadow-lg shadow-emerald-500/30"
              )}
              animate={{ 
                scale: [1, 1.04, 1]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Wifi className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">
                Online Now
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Active users
              </p>
            </div>
          </div>
          
          {/* Live count badge */}
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Badge 
              variant="outline"
              className={cn(
                "text-xs font-bold px-3 py-1.5 gap-2",
                "bg-emerald-500/10 border-emerald-500/30 text-emerald-600",
                "dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400",
                "shadow-[0_0_12px_-3px_rgba(16,185,129,0.3)]"
              )}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {total}
            </Badge>
          </motion.div>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative px-4 pb-5">
        {isLoading ? (
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div 
                key={i} 
                className="flex items-center gap-3.5 p-3 rounded-xl"
              >
                {/* Avatar skeleton */}
                <div className={cn(
                  "relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0",
                  "bg-gradient-to-br from-muted/60 to-muted/30",
                  "dark:from-white/[0.08] dark:to-white/[0.04]"
                )}>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.3, repeat: Infinity, ease: "linear", delay: i * 0.1 }}
                  />
                </div>
                
                {/* Text skeleton */}
                <div className="flex-1 space-y-2">
                  <div className={cn(
                    "h-4 w-28 rounded-md overflow-hidden",
                    "bg-gradient-to-r from-muted/50 to-muted/30",
                    "dark:from-white/[0.06] dark:to-white/[0.03]"
                  )} />
                  <div className={cn(
                    "h-3 w-20 rounded-md",
                    "bg-muted/30 dark:bg-white/[0.04]"
                  )} />
                </div>
                
                {/* Time skeleton */}
                <div className={cn(
                  "h-6 w-14 rounded-lg",
                  "bg-muted/30 dark:bg-white/[0.04]"
                )} />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <motion.div 
              className={cn(
                "w-20 h-20 rounded-3xl flex items-center justify-center mb-5",
                "bg-gradient-to-br from-muted/60 to-muted/30",
                "dark:from-white/[0.06] dark:to-white/[0.02]",
                "border border-border/30 dark:border-white/[0.06]"
              )}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Users className="w-10 h-10 text-muted-foreground/40" />
            </motion.div>
            <p className="text-sm font-semibold text-muted-foreground">No users online</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Users will appear here when active</p>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {users.map((user, index) => (
                <UserRow key={user.userId || index} user={user} delay={index * 0.04} />
              ))}
            </AnimatePresence>
            
            <Pagination
              page={page}
              totalPages={totalPages}
              onPrev={onPrevPage}
              onNext={onNextPage}
              hasPrev={hasPrevPage}
              hasNext={hasNextPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const OnlineUsersCard = memo(OnlineUsersCardComponent);
export default OnlineUsersCard;
