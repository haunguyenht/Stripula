import { memo } from 'react';
import { motion } from 'motion/react';
import { Trophy, Crown, Medal, Flame, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getTierConfig } from '@/components/navigation/config/tier-config';

/**
 * Animated rank badge with special effects for top 3
 */
function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <motion.div 
        className={cn(
          "relative flex items-center justify-center w-10 h-10 rounded-xl",
          "bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500",
          "shadow-lg shadow-amber-500/40"
        )}
        animate={{ 
          scale: [1, 1.05, 1],
          rotate: [0, 3, -3, 0]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
          />
        </div>
        <Crown className="w-5 h-5 text-white relative z-10" strokeWidth={2} />
      </motion.div>
    );
  }
  
  if (rank === 2) {
    return (
      <motion.div 
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl",
          "bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500",
          "shadow-md shadow-slate-400/30"
        )}
        whileHover={{ scale: 1.05 }}
      >
        <Medal className="w-5 h-5 text-white" strokeWidth={2} />
      </motion.div>
    );
  }
  
  if (rank === 3) {
    return (
      <motion.div 
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl",
          "bg-gradient-to-br from-orange-400 via-amber-600 to-orange-700",
          "shadow-md shadow-orange-500/25"
        )}
        whileHover={{ scale: 1.05 }}
      >
        <Medal className="w-5 h-5 text-white" strokeWidth={2} />
      </motion.div>
    );
  }
  
  return (
    <div className={cn(
      "flex items-center justify-center w-10 h-10 rounded-xl",
      "bg-muted/60 dark:bg-white/[0.06]",
      "border border-border/50 dark:border-white/[0.08]"
    )}>
      <span className="text-sm font-bold text-muted-foreground tabular-nums">{rank}</span>
    </div>
  );
}

/**
 * Premium user avatar with tier glow effects
 */
function UserAvatar({ src, name, tier, rank }) {
  const initials = (name || 'A').slice(0, 2).toUpperCase();
  const isDiamond = tier === 'diamond';
  const isGold = tier === 'gold';
  const isTop3 = rank <= 3;

  const glowColor = rank === 1 ? 'from-amber-400 via-yellow-500 to-orange-500' :
    isDiamond ? 'from-cyan-400 via-sky-500 to-blue-500' :
    isGold ? 'from-yellow-400 via-amber-500 to-orange-500' : null;

  return (
    <div className="relative">
      {/* Animated glow ring */}
      {(glowColor) && (
        <motion.div 
          className={cn(
            "absolute -inset-1.5 rounded-full opacity-60",
            "bg-gradient-to-r",
            glowColor
          )}
          animate={{ 
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      
      <div className={cn(
        "relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0",
        "border-2 bg-muted dark:bg-white/[0.08]",
        "shadow-md",
        isDiamond && "border-cyan-400",
        isGold && "border-yellow-400",
        rank === 1 && "border-amber-400",
        !isDiamond && !isGold && rank > 1 && "border-border dark:border-white/[0.12]"
      )}>
        {src ? (
          <img 
            src={src} 
            alt={name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={cn(
          "absolute inset-0 items-center justify-center text-sm font-bold",
          src ? "hidden" : "flex",
          "bg-gradient-to-br",
          isDiamond && "from-cyan-100 to-sky-200 dark:from-cyan-900/80 dark:to-sky-900/80 text-cyan-700 dark:text-cyan-300",
          isGold && "from-yellow-100 to-amber-200 dark:from-yellow-900/80 dark:to-amber-900/80 text-yellow-700 dark:text-yellow-300",
          rank === 1 && !isDiamond && !isGold && "from-amber-100 to-orange-200 dark:from-amber-900/80 dark:to-orange-900/80 text-amber-700 dark:text-amber-300",
          !isDiamond && !isGold && rank > 1 && "from-muted to-muted text-muted-foreground"
        )}>
          {initials}
        </div>
      </div>
    </div>
  );
}

/**
 * Leaderboard row with premium animations
 */
function LeaderboardRow({ entry, isCurrentUser, delay = 0 }) {
  const { rank, username, firstName, tier, totalHits, avatarUrl } = entry;
  const tierConfig = getTierConfig(tier || 'free');
  const TierIcon = tierConfig.icon;
  const displayName = firstName || username || 'Anonymous';
  
  const isDiamond = tier === 'diamond';
  const isGold = tier === 'gold';
  const isTop3 = rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ x: 4 }}
      className={cn(
        "group relative flex items-center gap-4 p-3.5 rounded-2xl",
        "transition-all duration-300",
        // Base styling
        "hover:bg-accent/50 dark:hover:bg-white/[0.04]",
        // Current user highlight
        isCurrentUser && [
          "bg-primary/[0.06] dark:bg-primary/10",
          "ring-1 ring-primary/20 dark:ring-primary/30",
          "shadow-sm shadow-primary/5"
        ],
        // Top 3 special styling
        isTop3 && !isCurrentUser && [
          "bg-gradient-to-r from-transparent to-amber-500/[0.02]",
          "dark:from-transparent dark:to-amber-500/[0.03]"
        ]
      )}
    >
      <RankBadge rank={rank} />
      
      <UserAvatar src={avatarUrl} name={displayName} tier={tier} rank={rank} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-bold truncate",
            isDiamond && "bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent",
            isGold && "bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent",
            rank === 1 && !isDiamond && !isGold && "bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent",
            !isDiamond && !isGold && rank > 1 && "text-foreground"
          )}>
            {displayName}
          </span>
          
          <TierIcon className={cn("w-4 h-4 flex-shrink-0", tierConfig.color)} />
          
          {isCurrentUser && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-[9px] px-2 py-0.5 h-4 font-bold",
                "border-primary/40 text-primary",
                "bg-primary/10"
              )}
            >
              You
            </Badge>
          )}
        </div>
        
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
          @{username || 'anonymous'}
        </p>
      </div>
      
      {/* Hits badge */}
      <motion.div 
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl",
          "bg-gradient-to-r from-orange-500/10 to-amber-500/10",
          "dark:from-orange-500/15 dark:to-amber-500/15",
          "border border-orange-500/20"
        )}
        whileHover={{ scale: 1.02 }}
      >
        <Flame className="w-4 h-4 text-orange-500" />
        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 tabular-nums">
          {totalHits.toLocaleString()}
        </span>
      </motion.div>
    </motion.div>
  );
}

/**
 * LeaderboardCard - Premium leaderboard with glass morphism
 */
function LeaderboardCardComponent({ leaderboard = [], currentUserId, isLoading = false, className }) {
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
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-amber-500/15 to-orange-500/10 blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="relative px-6 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <motion.div 
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-2xl",
              "bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500",
              "shadow-lg shadow-amber-500/30"
            )}
            animate={{ 
              rotate: [0, -5, 5, 0],
              scale: [1, 1.02, 1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Trophy className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              Top Karders
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hall of fame
            </p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative px-4 pb-5">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 p-3.5 rounded-2xl">
                <div className={cn(
                  "w-10 h-10 rounded-xl overflow-hidden",
                  "bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50",
                  "dark:from-white/[0.06] dark:via-white/[0.03] dark:to-white/[0.06]"
                )}>
                  <motion.div
                    className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: i * 0.1 }}
                  />
                </div>
                <div className="w-12 h-12 rounded-full bg-muted/50 dark:bg-white/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 bg-muted/50 dark:bg-white/[0.06] rounded-lg" />
                  <div className="h-3 w-20 bg-muted/30 dark:bg-white/[0.04] rounded-md" />
                </div>
                <div className="h-8 w-16 bg-muted/30 dark:bg-white/[0.04] rounded-xl" />
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
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
              <Trophy className="w-10 h-10 text-muted-foreground/40" />
            </motion.div>
            <p className="text-sm font-semibold text-muted-foreground">No data yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Start checking to climb the ranks</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {leaderboard.map((entry, index) => (
              <LeaderboardRow
                key={entry.userId || index}
                entry={entry}
                isCurrentUser={entry.userId === currentUserId}
                delay={index * 0.06}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const LeaderboardCard = memo(LeaderboardCardComponent);
export default LeaderboardCard;
