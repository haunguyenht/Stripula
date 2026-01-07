import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Users, Copy, Check, Link2, Gift, Sparkles, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Animated progress bar with copper shimmer
 */
function ProgressBar({ value, max }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  
  return (
    <div className={cn(
      "relative h-2.5 rounded-full overflow-hidden",
      // Light: aged paper inset
      "bg-[hsl(30,20%,88%)]",
      "shadow-[inset_0_1px_2px_hsl(25,30%,30%,0.1)]",
      // Dark mode
      "dark:bg-white/[0.06] dark:shadow-none"
    )}>
      <motion.div
        className={cn(
          "absolute inset-y-0 left-0 rounded-full",
          // Light: copper foil gradient
          "bg-gradient-to-r from-[hsl(280,45%,50%)] via-[hsl(290,50%,55%)] to-[hsl(300,45%,50%)]",
          // Dark mode: violet aurora
          "dark:from-violet-500 dark:via-purple-500 dark:to-fuchsia-500"
        )}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      />
      {/* Shimmer effect - copper for light */}
      <motion.div
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-r from-transparent via-white/30 to-transparent",
          "dark:via-white/40"
        )}
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "linear" }}
      />
    </div>
  );
}

/**
 * Stat mini card - vintage banking style
 */
function StatMini({ icon: Icon, value, label, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden p-4 rounded-xl text-center",
        "border",
        gradient
      )}
    >
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <Icon className="w-4 h-4" />
        <span className={cn(
          "text-2xl font-bold tabular-nums",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.4)] dark:[text-shadow:none]"
        )}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
        {label}
      </span>
    </motion.div>
  );
}

/**
 * ReferralCard Component
 * 
 * VINTAGE BANKING REDESIGN: Share-focused design with 
 * copper foil code display, aged paper aesthetics, and treasury styling.
 */
export function ReferralCard({ referral, className }) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const code = referral?.code || 'LOADING';
  const referralCount = referral?.referralCount ?? 0;
  const creditsEarned = referral?.creditsEarned ?? 0;
  const maxReferrals = referral?.maxReferrals ?? 10;
  const canEarnMore = referral?.canEarnMore ?? true;
  const remainingSlots = maxReferrals - referralCount;
  
  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}?ref=${code}` 
    : '';

  const handleCopy = useCallback(async (text, isLink = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isLink) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      // Clipboard API failed silently
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        // Light mode - Vintage Banking certificate style
        "bg-gradient-to-b from-[hsl(42,50%,98%)] via-[hsl(40,45%,97%)] to-[hsl(38,40%,95%)]",
        "border border-[hsl(30,25%,78%)]",
        "shadow-[0_8px_30px_-8px_hsl(25,35%,30%,0.12),inset_0_0_0_1px_hsl(30,20%,88%),inset_0_0_0_3px_hsl(38,45%,97%),inset_0_0_0_4px_hsl(30,25%,82%)]",
        // Dark mode - Glass morphism (bg-none resets light gradient)
        "dark:bg-none dark:bg-white/[0.02] dark:backdrop-blur-2xl dark:backdrop-saturate-[1.8]",
        "dark:border-white/[0.06]",
        "dark:shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_0.5px_0_rgba(255,255,255,0.06)]",
        className
      )}
    >
      {/* Top edge highlight (dark only) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent opacity-0 dark:opacity-100" />
      
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
      
      {/* Decorative gradient blobs - copper for light */}
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-[60px] opacity-15 dark:opacity-30 bg-gradient-to-br from-[hsl(280,45%,55%)] via-[hsl(290,50%,50%)] to-[hsl(300,45%,45%)] dark:from-violet-500 dark:via-purple-500 dark:to-fuchsia-500" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-[50px] opacity-10 dark:opacity-20 bg-gradient-to-tr from-[hsl(300,45%,50%)] to-[hsl(280,50%,55%)] dark:from-fuchsia-500 dark:to-violet-500" />
      
      {/* Header */}
      <div className="relative p-5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl",
                // Light: violet wax seal style
                "bg-gradient-to-br from-[hsl(280,40%,92%)] via-[hsl(285,45%,88%)] to-[hsl(290,35%,85%)]",
                "border border-[hsl(280,35%,75%)]",
                "shadow-[0_4px_12px_hsl(280,40%,40%,0.15),inset_0_1px_0_rgba(255,255,255,0.5)]",
                // Dark mode (bg-none resets light gradient)
                "dark:bg-none dark:bg-gradient-to-br dark:from-violet-500/15 dark:via-purple-500/10 dark:to-fuchsia-500/15",
                "dark:border-violet-400/20 dark:shadow-violet-500/5"
              )}
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <Share2 className="w-5 h-5 text-[hsl(280,45%,45%)] dark:text-violet-400" />
            </motion.div>
            
            <div>
              <h3 className={cn(
                "text-lg font-bold font-serif",
                "text-[hsl(25,40%,22%)] dark:text-white",
                "[text-shadow:0_1px_0_rgba(255,255,255,0.6)] dark:[text-shadow:none]"
              )}>
                Invite & Earn
              </h3>
              <p className="text-xs text-[hsl(25,25%,45%)] dark:text-white/50">
                Get <span className="font-semibold text-[hsl(280,45%,45%)] dark:text-violet-400">15 credits</span> per friend
              </p>
            </div>
          </div>
          
          {!canEarnMore && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                // Light: violet aged badge
                "bg-gradient-to-b from-[hsl(280,40%,95%)] to-[hsl(285,35%,92%)]",
                "text-[hsl(280,45%,40%)]",
                "border border-[hsl(280,35%,80%)]",
                // Dark mode (bg-none resets light gradient)
                "dark:bg-none dark:bg-gradient-to-b dark:from-violet-500/15 dark:to-purple-500/10",
                "dark:text-violet-400 dark:border-violet-500/25"
              )}
            >
              <Sparkles className="w-3 h-3" />
              Max
            </motion.span>
          )}
        </div>
      </div>
      
      {/* Referral Code Section */}
      <div className="relative px-5 pb-4">
        <p className={cn(
          "text-[10px] font-bold uppercase tracking-widest mb-2.5",
          "text-[hsl(25,20%,50%)] dark:text-white/35",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.5)] dark:[text-shadow:none]"
        )}>
          Your Invite Code
        </p>
        
        <div className="flex gap-2">
          {/* Code display - treasury vault style */}
          <motion.button
            onClick={() => handleCopy(code)}
            className={cn(
              "flex-1 flex items-center justify-between px-4 py-3.5 rounded-xl",
              // Light: bank note style
              "bg-gradient-to-b from-[hsl(40,45%,98%)] via-[hsl(38,40%,96%)] to-[hsl(35,35%,94%)]",
              "border border-[hsl(30,30%,78%)]",
              "shadow-[inset_0_0_0_1px_hsl(38,45%,97%),inset_0_0_0_2px_hsl(30,25%,85%)]",
              // Dark mode (bg-none resets light gradient)
              "dark:bg-none dark:bg-gradient-to-b dark:from-white/[0.04] dark:via-white/[0.02] dark:to-white/[0.01]",
              "dark:border-white/[0.1]",
              // Hover
              "transition-all duration-300 ease-out",
              "hover:border-[hsl(280,35%,70%)] dark:hover:border-violet-400/30",
              "hover:shadow-[0_4px_12px_hsl(280,40%,45%,0.12),inset_0_0_0_1px_hsl(38,45%,97%),inset_0_0_0_2px_hsl(280,30%,85%)]",
              "dark:hover:shadow-lg dark:hover:shadow-violet-500/15",
              "active:scale-[0.99]",
              // Success state
              copied && cn(
                "border-[hsl(150,40%,70%)] dark:border-emerald-400/40",
                "bg-gradient-to-b from-[hsl(150,35%,97%)] to-[hsl(145,30%,95%)] dark:bg-none dark:bg-emerald-500/5"
              )
            )}
            whileTap={{ scale: 0.98 }}
          >
            <code className={cn(
              "text-xl font-black tracking-[0.25em] font-mono transition-colors",
              copied 
                ? "text-[hsl(150,45%,35%)] dark:text-emerald-400" 
                : "text-[hsl(25,40%,25%)] dark:text-white",
              "[text-shadow:0_1px_0_rgba(255,255,255,0.5)] dark:[text-shadow:none]"
            )}>
              {code}
            </code>
            <motion.div
              key={copied ? 'check' : 'copy'}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {copied ? (
                <Check className="w-5 h-5 text-[hsl(150,45%,38%)] dark:text-emerald-500" />
              ) : (
                <Copy className="w-5 h-5 text-[hsl(25,25%,55%)] dark:text-white/40" />
              )}
            </motion.div>
          </motion.button>
          
          {/* Copy link button - copper coin style */}
          <Button 
            variant="outline" 
            size="icon"
            className={cn(
              "h-auto w-14 flex-shrink-0 rounded-xl",
              // Light: copper coin
              "bg-gradient-to-b from-[hsl(40,45%,97%)] to-[hsl(38,40%,94%)]",
              "border-[hsl(30,30%,78%)]",
              "shadow-[0_2px_4px_hsl(25,30%,30%,0.06),inset_0_1px_0_rgba(255,255,255,0.5)]",
              // Dark mode (bg-none resets light gradient)
              "dark:bg-none dark:bg-white/[0.02] dark:border-white/[0.1] dark:shadow-none",
              // Hover
              "hover:border-[hsl(280,35%,70%)] dark:hover:border-violet-400/30",
              "hover:bg-[hsl(280,40%,96%)] dark:hover:bg-violet-500/10",
              // Success state
              copiedLink && "border-[hsl(150,40%,70%)] dark:border-emerald-400/40 bg-[hsl(150,35%,97%)] dark:bg-emerald-500/10"
            )}
            onClick={() => handleCopy(referralLink, true)}
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-[hsl(150,45%,38%)] dark:text-emerald-500" />
            ) : (
              <Link2 className="w-4 h-4 text-[hsl(25,30%,50%)] dark:text-white/50" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <StatMini
            icon={Users}
            value={referralCount}
            label="Referrals"
            gradient={cn(
              // Light: aged paper
              "bg-gradient-to-b from-[hsl(40,40%,97%)] to-[hsl(38,35%,95%)]",
              "border-[hsl(30,25%,82%)]",
              "text-[hsl(210,45%,40%)] dark:text-blue-400",
              // Dark mode (bg-none resets light gradient)
              "dark:bg-none dark:bg-white/[0.02] dark:border-white/[0.06]"
            )}
            delay={0.15}
          />
          
          <StatMini
            icon={Gift}
            value={`+${creditsEarned}`}
            label="Credits Earned"
            gradient={cn(
              // Light: patina green
              "bg-gradient-to-b from-[hsl(150,35%,96%)] to-[hsl(145,30%,93%)]",
              "border-[hsl(150,25%,78%)]",
              "text-[hsl(150,45%,35%)] dark:text-emerald-400",
              // Dark mode
              "dark:from-emerald-500/10 dark:to-green-500/5",
              "dark:border-emerald-500/15"
            )}
            delay={0.2}
          />
        </div>
      </div>
      
      {/* Progress Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="px-5 pb-5"
      >
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span className="text-[hsl(25,25%,45%)] dark:text-white/50 font-medium">Progress</span>
          <span className={cn(
            "font-bold tabular-nums",
            "text-[hsl(25,40%,30%)] dark:text-white",
            "[text-shadow:0_1px_0_rgba(255,255,255,0.4)] dark:[text-shadow:none]"
          )}>
            {referralCount} / {maxReferrals}
          </span>
        </div>
        
        <ProgressBar value={referralCount} max={maxReferrals} />
        
        <p className="text-center text-xs text-[hsl(25,25%,45%)] dark:text-white/50 mt-3">
          {canEarnMore 
            ? (
              <>
                <span className="font-semibold text-[hsl(280,45%,45%)] dark:text-violet-400">{remainingSlots}</span>
                {' '}invite {remainingSlots === 1 ? 'slot' : 'slots'} remaining
              </>
            )
            : (
              <span className="flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-[hsl(280,45%,50%)] dark:text-violet-500" />
                All slots used — thank you!
              </span>
            )
          }
        </p>
      </motion.div>
    </motion.div>
  );
}

export default ReferralCard;
