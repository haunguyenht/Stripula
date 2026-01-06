import { motion } from 'motion/react';
import { Calendar, Activity, Zap, TrendingUp, Flame, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Format date to elegant readable string
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Circular progress indicator for hit rate - vintage gauge style
 */
function CircularProgress({ value, max = 100, size = 80, strokeWidth = 6 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((value / max) * 100, 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-[hsl(30,20%,88%)] dark:text-white/[0.08]"
        />
        {/* Progress circle - copper patina green for light */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradientVintage)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          {/* Light mode: patina green gradient */}
          <linearGradient id="progressGradientVintage" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(155, 45%, 40%)" />
            <stop offset="50%" stopColor="hsl(150, 50%, 35%)" />
            <stop offset="100%" stopColor="hsl(145, 45%, 32%)" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className={cn(
            "text-lg font-bold tabular-nums",
            "text-[hsl(25,40%,22%)] dark:text-white",
            "[text-shadow:0_1px_0_rgba(255,255,255,0.5)] dark:[text-shadow:none]"
          )}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {value.toFixed(1)}%
        </motion.span>
      </div>
    </div>
  );
}

/**
 * Stat tile with icon and value - vintage banking style
 */
function StatTile({ icon: Icon, label, value, accent, gradient, delay = 0, featured = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative group overflow-hidden",
        featured ? "p-5 rounded-2xl" : "p-4 rounded-xl",
        // Light mode - aged paper with certificate border
        "bg-gradient-to-b from-[hsl(42,50%,98%)] via-[hsl(40,45%,97%)] to-[hsl(38,40%,95%)]",
        "border border-[hsl(30,25%,80%)]",
        "shadow-[0_4px_16px_hsl(25,30%,30%,0.08),inset_0_0_0_1px_hsl(38,45%,97%),inset_0_0_0_2px_hsl(30,25%,85%)]",
        // Dark mode (reset gradient first)
        "dark:bg-none dark:bg-zinc-900/80 dark:backdrop-blur-xl",
        "dark:border-white/[0.08]",
        "dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_0.5px_0_rgba(255,255,255,0.06)]",
        // Hover effects
        "transition-all duration-300 ease-out",
        "hover:border-[hsl(30,30%,75%)] dark:hover:border-white/[0.12]",
        "hover:shadow-[0_8px_24px_hsl(25,30%,30%,0.12),inset_0_0_0_1px_hsl(38,45%,97%),inset_0_0_0_2px_hsl(30,25%,82%)]",
        "dark:hover:bg-zinc-800/80 dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_0.5px_0_rgba(255,255,255,0.1)]"
      )}
    >
      {/* Glass edge highlight (dark only) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 dark:opacity-100" />
      
      {/* Paper grain (light only) */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-0 pointer-events-none"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '150px 150px'
        }}
      />
      
      {/* Gradient accent on hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        "bg-gradient-to-br",
        gradient || "from-[hsl(30,40%,50%,0.03)] to-transparent dark:from-white/[0.02]"
      )} />
      
      <div className="relative">
        {/* Icon - copper coin style */}
        <div className={cn(
          "inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3",
          // Light: copper coin accent
          "bg-gradient-to-b from-[hsl(40,45%,96%)] to-[hsl(38,40%,93%)]",
          "border border-[hsl(30,25%,80%)]",
          "shadow-[0_2px_6px_hsl(25,30%,30%,0.08),inset_0_1px_0_rgba(255,255,255,0.6)]",
          // Dark mode (reset gradient)
          "dark:bg-none dark:bg-white/[0.08] dark:border-white/[0.1] dark:shadow-none"
        )}>
          <Icon className={cn("w-5 h-5", accent || "text-[hsl(25,40%,45%)] dark:text-white/70")} />
        </div>
        
        {/* Value - embossed letterpress */}
        <p className={cn(
          "font-bold mb-0.5 truncate",
          featured ? "text-xl" : "text-lg",
          "text-[hsl(25,40%,22%)] dark:text-white",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.5)] dark:[text-shadow:none]"
        )}>
          {value}
        </p>
        
        {/* Label */}
        <span className={cn(
          "text-[10px] font-semibold uppercase tracking-widest",
          "text-[hsl(25,20%,50%)] dark:text-white/40"
        )}>
          {label}
        </span>
      </div>
    </motion.div>
  );
}

/**
 * ProfileStats Component
 * 
 * VINTAGE BANKING REDESIGN: Treasury report aesthetic with 
 * copper patina accents, embossed typography, and ledger styling.
 */
export function ProfileStats({ profile, className }) {
  const memberSince = profile?.createdAt ? formatDate(profile.createdAt) : 'N/A';
  const totalCards = profile?.totalCardsChecked ?? 0;
  const totalHits = profile?.totalHits ?? 0;
  const hitRate = totalCards > 0 ? ((totalHits / totalCards) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn("space-y-4", className)}
    >
      {/* Featured Hit Rate Card - Treasury ledger style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative overflow-hidden rounded-2xl",
          // Light mode - patina green tinted paper
          "bg-gradient-to-br from-[hsl(150,30%,97%)] via-[hsl(145,25%,96%)] to-[hsl(155,20%,95%)]",
          "border border-[hsl(150,25%,78%)]",
          "shadow-[0_8px_30px_hsl(150,35%,35%,0.1),inset_0_0_0_1px_hsl(150,20%,90%),inset_0_0_0_3px_hsl(150,30%,97%),inset_0_0_0_4px_hsl(150,25%,82%)]",
          // Dark mode (reset gradient first)
          "dark:bg-none dark:bg-zinc-900/80 dark:backdrop-blur-xl",
          "dark:border-emerald-500/20",
          "dark:shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_0.5px_0_rgba(255,255,255,0.08)]"
        )}
      >
        {/* Paper grain (light only) */}
        <div 
          className="absolute inset-0 opacity-[0.025] dark:opacity-0 pointer-events-none"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: '150px 150px'
          }}
        />
        
        {/* Tile pattern (dark only) */}
        <div 
          className="absolute inset-0 opacity-0 dark:opacity-[0.03] pointer-events-none"
          style={{ 
            backgroundImage: 'url(/bg-tile.webp)',
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat'
          }}
        />
        
        {/* Ambient glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[60px] opacity-15 dark:opacity-30 bg-gradient-to-br from-[hsl(150,45%,45%)] to-[hsl(145,50%,35%)] dark:from-emerald-400 dark:to-green-500" />
        
        <div className="relative p-5">
          <div className="flex items-center gap-6">
            {/* Circular progress */}
            <CircularProgress value={hitRate} />
            
            {/* Stats breakdown */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-[hsl(150,45%,35%)] dark:text-emerald-400" />
                <h3 className={cn(
                  "text-base font-semibold font-serif",
                  "text-[hsl(25,40%,22%)] dark:text-white",
                  "[text-shadow:0_1px_0_rgba(255,255,255,0.5)] dark:[text-shadow:none]"
                )}>
                  Hit Rate
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={cn(
                    "text-2xl font-bold tabular-nums",
                    "text-[hsl(25,40%,22%)] dark:text-white",
                    "[text-shadow:0_1px_0_rgba(255,255,255,0.4)] dark:[text-shadow:none]"
                  )}>
                    {totalHits.toLocaleString()}
                  </p>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[hsl(150,40%,38%)] dark:text-emerald-400/60">
                    Total Hits
                  </span>
                </div>
                <div>
                  <p className={cn(
                    "text-2xl font-bold tabular-nums",
                    "text-[hsl(25,40%,22%)] dark:text-white",
                    "[text-shadow:0_1px_0_rgba(255,255,255,0.4)] dark:[text-shadow:none]"
                  )}>
                    {totalCards.toLocaleString()}
                  </p>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[hsl(25,20%,50%)] dark:text-white/40">
                    Cards Checked
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Stats Grid - Asymmetric 2-column */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          icon={Calendar}
          label="Member Since"
          value={memberSince}
          accent="text-[hsl(210,45%,40%)] dark:text-blue-400"
          gradient="from-[hsl(210,40%,50%,0.03)] to-transparent dark:from-blue-500/5"
          delay={0.1}
        />
        
        <StatTile
          icon={Activity}
          label="Status"
          value="Active"
          accent="text-[hsl(150,45%,35%)] dark:text-emerald-400"
          gradient="from-[hsl(150,40%,45%,0.03)] to-transparent dark:from-emerald-500/5"
          delay={0.15}
        />
      </div>
    </motion.div>
  );
}

export default ProfileStats;
