import { motion } from 'motion/react';
import { 
  Percent, Gift, Zap, Star, Clock, AlertTriangle, 
  Timer, Infinity, ChevronRight, Sparkles, ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getTierConfig, TIER_ORDER } from '@/components/navigation/config/tier-config';

/**
 * Format expiration date for display
 */
export function formatExpirationDate(expiresAt) {
  if (!expiresAt) return null;
  
  const expDate = new Date(expiresAt);
  if (isNaN(expDate.getTime())) return null;
  
  const now = new Date();
  const diffMs = expDate - now;
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  const isSameDay = expDate.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = expDate.toDateString() === tomorrow.toDateString();
  
  if (diffMs <= 0) {
    return { text: 'Expired', isExpired: true, isUrgent: true, isCritical: true, isWarning: false, urgency: 'expired' };
  }
  
  if (totalHours < 24 || isSameDay) {
    const hours = Math.floor(totalHours);
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    let text = hours === 0 
      ? (minutes === 1 ? '1 minute left' : `${minutes} minutes left`)
      : (minutes > 0 ? `${hours}h ${minutes}m left` : `${hours} hours left`);
    return { text, isExpired: false, isUrgent: true, isCritical: true, isWarning: false, urgency: 'critical' };
  }
  
  if (isTomorrow) {
    return { text: 'Expires tomorrow', isExpired: false, isUrgent: true, isCritical: false, isWarning: true, urgency: 'warning' };
  }
  
  if (diffDays >= 2 && diffDays <= 7) {
    return { text: `${diffDays} days remaining`, isExpired: false, isUrgent: true, isCritical: false, isWarning: true, urgency: 'warning' };
  }
  
  if (diffDays >= 8 && diffDays <= 30) {
    return { text: `${diffDays} days remaining`, isExpired: false, isUrgent: false, isCritical: false, isWarning: false, urgency: 'normal' };
  }
  
  return { 
    text: `Until ${expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, 
    isExpired: false, isUrgent: false, isCritical: false, isWarning: false, urgency: 'normal' 
  };
}

/**
 * Benefit item with vintage banking styling
 */
function BenefitItem({ icon: Icon, label, value, accent, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-xl",
        // Light: aged paper with subtle inset
        "bg-gradient-to-b from-[hsl(40,40%,97%)] to-[hsl(38,35%,95%)]",
        "border border-[hsl(30,25%,85%)]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_hsl(25,30%,30%,0.03)]",
        // Dark mode (reset gradient first)
        "dark:bg-none dark:bg-white/[0.04] dark:border-white/[0.06] dark:shadow-none",
        // Hover effects
        "transition-all duration-300",
        "hover:bg-[hsl(38,45%,96%)] dark:hover:bg-white/[0.08]",
        "hover:border-[hsl(30,30%,78%)] dark:hover:border-white/[0.1]"
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-9 h-9 rounded-lg",
        // Light: copper coin style
        "bg-gradient-to-b from-[hsl(40,45%,98%)] to-[hsl(38,40%,95%)]",
        "border border-[hsl(30,25%,82%)]",
        "shadow-[0_2px_4px_hsl(25,30%,30%,0.06),inset_0_1px_0_rgba(255,255,255,0.6)]",
        // Dark mode (reset gradient)
        "dark:bg-none dark:bg-white/[0.08] dark:border-white/[0.1] dark:shadow-none"
      )}>
        <Icon className={cn("w-4 h-4", accent)} />
      </div>
      
      <div className="flex-1 min-w-0">
        <span className="text-xs text-[hsl(25,25%,45%)] dark:text-white/50">{label}</span>
      </div>
      
      <span className={cn(
        "text-sm font-semibold",
        "text-[hsl(25,40%,25%)] dark:text-white",
        "[text-shadow:0_1px_0_rgba(255,255,255,0.5)] dark:[text-shadow:none]"
      )}>
        {value}
      </span>
    </motion.div>
  );
}

/**
 * TierInfoCard Component
 * 
 * VINTAGE BANKING REDESIGN: Premium membership certificate with 
 * copper foil accents, embossed typography, and treasury aesthetics.
 */
export function TierInfoCard({ tier, className }) {
  const tierName = tier?.name || 'free';
  const config = getTierConfig(tierName);
  const TierIcon = config.icon;
  
  const multiplier = tier?.multiplier ?? 1.0;
  const discountPercent = Math.round((1 - multiplier) * 100);
  const dailyClaim = tier?.dailyClaim ?? 10;
  
  const expiresAt = tier?.expiresAt;
  const expirationInfo = formatExpirationDate(expiresAt);
  const isPermanent = tierName !== 'free' && !expiresAt;
  
  const canUpgrade = tierName !== 'diamond';
  const tierIndex = TIER_ORDER.indexOf(tierName);
  const nextTier = canUpgrade ? TIER_ORDER[tierIndex + 1] : null;
  const nextTierConfig = nextTier ? getTierConfig(nextTier) : null;

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
        // Dark mode - Glass morphism (reset light mode first)
        "dark:bg-none dark:bg-zinc-900/80 dark:backdrop-blur-2xl",
        "dark:border-white/[0.08]",
        "dark:shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_0.5px_0_rgba(255,255,255,0.06)]",
        className
      )}
    >
      {/* Top edge highlight (dark only) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent opacity-0 dark:opacity-100" />
      
      {/* Paper grain texture (light only) */}
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
      
      {/* Tier gradient accent bar - copper for light */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1.5",
        // Light: Copper foil gradient
        "bg-gradient-to-r from-[hsl(25,70%,50%)] via-[hsl(35,80%,58%)] to-[hsl(28,65%,48%)]",
        // Dark: Tier gradient
        "dark:bg-gradient-to-r",
        config.bgGradient.replace('from-', 'dark:from-').replace('via-', 'dark:via-').replace('to-', 'dark:to-')
      )} />
      
      {/* Ambient tier glow */}
      <motion.div 
        className={cn(
          "absolute -top-20 -right-10 w-48 h-48 rounded-full blur-[70px]",
          "bg-gradient-to-br opacity-10 dark:opacity-25",
          // Light: warm copper
          "from-[hsl(30,70%,55%)] to-[hsl(25,60%,45%)]",
          // Dark: tier gradient
          config.bgGradient.replace('from-', 'dark:from-').replace('via-', 'dark:via-').replace('to-', 'dark:to-')
        )}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Header Section */}
      <div className="relative p-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Tier Icon - Large decorative wax seal style */}
            <motion.div 
              className={cn(
                "relative flex items-center justify-center w-16 h-16 rounded-2xl",
                "bg-gradient-to-br",
                config.bgGradient,
                "border border-white/30 dark:border-white/10",
                "shadow-[0_6px_20px_hsl(25,35%,30%,0.2),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1)]",
                "dark:shadow-lg",
                config.glowColor
              )}
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            >
              {/* Glow layer */}
              <div className={cn(
                "absolute inset-0 rounded-2xl blur-xl opacity-40 dark:opacity-60",
                "bg-gradient-to-br",
                config.bgGradient
              )} />
              <motion.div
                animate={config.iconAnimation}
                transition={config.iconTransition}
                className="relative"
              >
                <TierIcon className={cn("w-8 h-8", config.color)} />
              </motion.div>
            </motion.div>
            
            <div>
              <motion.h3 
                className={cn(
                  "text-2xl font-bold font-serif tracking-tight",
                  "text-[hsl(25,40%,20%)] dark:text-white",
                  "[text-shadow:0_1px_0_rgba(255,255,255,0.6),0_-1px_0_rgba(101,67,33,0.08)] dark:[text-shadow:none]"
                )}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {config.label}
              </motion.h3>
              <motion.p 
                className="text-sm text-[hsl(25,25%,45%)] dark:text-white/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                Membership Tier
              </motion.p>
            </div>
          </div>
          
          {/* Status Badge - vintage seal style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {tierName === 'free' ? (
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
                // Light: aged paper badge
                "bg-gradient-to-b from-[hsl(40,40%,96%)] to-[hsl(38,35%,93%)]",
                "text-[hsl(25,30%,40%)]",
                "border border-[hsl(30,25%,80%)]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
                // Dark mode
                "dark:bg-white/[0.06] dark:text-white/60 dark:border-white/[0.08] dark:shadow-none"
              )}>
                <Sparkles className="w-3 h-3" />
                Free
              </span>
            ) : isPermanent ? (
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
                // Light: patina green vintage
                "bg-gradient-to-b from-[hsl(145,35%,94%)] to-[hsl(150,30%,90%)]",
                "text-[hsl(145,50%,30%)]",
                "border border-[hsl(145,30%,75%)]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
                // Dark mode
                "dark:from-emerald-500/15 dark:to-green-500/10",
                "dark:text-emerald-400 dark:border-emerald-500/25 dark:shadow-none"
              )}>
                <Infinity className="w-3.5 h-3.5" />
                Lifetime
              </span>
            ) : expirationInfo?.isCritical ? (
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
                // Light: burgundy wax seal red
                "bg-gradient-to-b from-[hsl(0,40%,95%)] to-[hsl(355,35%,92%)]",
                "text-[hsl(0,50%,40%)]",
                "border border-[hsl(0,35%,80%)]",
                // Dark mode
                "dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
                expirationInfo?.isExpired && "animate-pulse"
              )}>
                {expirationInfo?.isExpired ? <AlertTriangle className="w-3 h-3" /> : <Timer className="w-3 h-3" />}
                {expirationInfo.text}
              </span>
            ) : expirationInfo?.isWarning ? (
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
                // Light: aged amber/copper
                "bg-gradient-to-b from-[hsl(35,50%,94%)] to-[hsl(30,45%,91%)]",
                "text-[hsl(30,60%,35%)]",
                "border border-[hsl(30,40%,78%)]",
                // Dark mode
                "dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25"
              )}>
                <Clock className="w-3 h-3" />
                {expirationInfo.text}
              </span>
            ) : expirationInfo ? (
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
                // Light: aged paper
                "bg-gradient-to-b from-[hsl(40,40%,96%)] to-[hsl(38,35%,93%)]",
                "text-[hsl(25,30%,40%)]",
                "border border-[hsl(30,25%,80%)]",
                // Dark mode
                "dark:bg-white/[0.06] dark:text-white/60 dark:border-white/[0.08]"
              )}>
                <Timer className="w-3 h-3" />
                {expirationInfo.text}
              </span>
            ) : null}
          </motion.div>
        </div>
      </div>
      
      {/* Expiration Warning Banner */}
      {(expirationInfo?.isWarning || expirationInfo?.isCritical || expirationInfo?.isExpired) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className={cn(
            "mx-5 mb-4 p-3.5 rounded-xl flex items-center gap-3",
            expirationInfo?.isExpired || expirationInfo?.isCritical 
              ? cn(
                  // Light: burgundy warning
                  "bg-gradient-to-b from-[hsl(0,40%,97%)] to-[hsl(355,35%,95%)]",
                  "border border-[hsl(0,35%,82%)]",
                  // Dark mode
                  "dark:bg-red-500/10 dark:border-red-500/20"
                )
              : cn(
                  // Light: amber/copper warning
                  "bg-gradient-to-b from-[hsl(35,50%,96%)] to-[hsl(30,45%,94%)]",
                  "border border-[hsl(30,40%,80%)]",
                  // Dark mode
                  "dark:bg-amber-500/10 dark:border-amber-500/20"
                )
          )}
        >
          <AlertTriangle className={cn(
            "w-4 h-4 flex-shrink-0",
            expirationInfo?.isExpired || expirationInfo?.isCritical 
              ? "text-[hsl(0,50%,42%)] dark:text-red-400" 
              : "text-[hsl(30,60%,38%)] dark:text-amber-400"
          )} />
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-medium",
              expirationInfo?.isExpired || expirationInfo?.isCritical 
                ? "text-[hsl(0,45%,35%)] dark:text-red-400" 
                : "text-[hsl(30,50%,32%)] dark:text-amber-400"
            )}>
              {expirationInfo?.isExpired 
                ? 'Your subscription has expired'
                : `Your ${config.label} tier is expiring soon`}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "h-8 text-xs font-semibold gap-1",
              expirationInfo?.isExpired || expirationInfo?.isCritical 
                ? "text-[hsl(0,50%,42%)] hover:text-[hsl(0,55%,35%)] hover:bg-[hsl(0,40%,92%)] dark:text-red-400 dark:hover:bg-red-500/20" 
                : "text-[hsl(30,60%,38%)] hover:text-[hsl(30,65%,32%)] hover:bg-[hsl(30,45%,92%)] dark:text-amber-400 dark:hover:bg-amber-500/20"
            )}
          >
            Renew <ArrowUpRight className="w-3 h-3" />
          </Button>
        </motion.div>
      )}
      
      {/* Benefits Section */}
      <div className="px-5 pb-2">
        <p className={cn(
          "text-[10px] font-bold uppercase tracking-widest mb-3",
          "text-[hsl(25,20%,50%)] dark:text-white/35",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.5)] dark:[text-shadow:none]"
        )}>
          Your Benefits
        </p>
        
        <div className="space-y-2">
          <BenefitItem
            icon={Percent}
            label="Credit Discount"
            value={discountPercent > 0 ? `${discountPercent}% off` : 'Standard rate'}
            accent="text-[hsl(145,50%,35%)] dark:text-emerald-400"
            delay={0.15}
          />
          <BenefitItem
            icon={Gift}
            label="Daily Claim"
            value={`${dailyClaim} credits`}
            accent="text-[hsl(280,45%,45%)] dark:text-violet-400"
            delay={0.2}
          />
          <BenefitItem
            icon={Zap}
            label="Processing Speed"
            value={tierName === 'diamond' ? 'Maximum' : tierName === 'free' ? 'Standard' : 'Enhanced'}
            accent="text-[hsl(30,65%,40%)] dark:text-amber-400"
            delay={0.25}
          />
          <BenefitItem
            icon={Star}
            label="Rate Multiplier"
            value={`${multiplier}x`}
            accent="text-[hsl(210,50%,40%)] dark:text-blue-400"
            delay={0.3}
          />
        </div>
      </div>
      
      {/* Upgrade CTA */}
      {canUpgrade && nextTierConfig && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="p-5 pt-4"
        >
          <Button 
            variant="outline" 
            size="default" 
            className={cn(
              "w-full h-11 text-sm font-semibold gap-2 group",
              // Light: copper foil button
              "bg-gradient-to-b from-[hsl(40,45%,97%)] to-[hsl(38,40%,94%)]",
              "border-[hsl(30,30%,75%)]",
              "text-[hsl(25,40%,30%)]",
              "[text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
              "shadow-[0_2px_4px_hsl(25,30%,30%,0.08),inset_0_1px_0_rgba(255,255,255,0.6)]",
              "hover:bg-gradient-to-b hover:from-[hsl(30,55%,55%)] hover:via-[hsl(32,60%,50%)] hover:to-[hsl(28,55%,48%)]",
              "hover:border-[hsl(25,50%,45%)]",
              "hover:text-white hover:[text-shadow:0_1px_1px_rgba(80,50,20,0.3)]",
              "hover:shadow-[0_4px_12px_hsl(25,50%,40%,0.25),inset_0_1px_0_rgba(255,200,150,0.4)]",
              // Dark mode
              "dark:from-white/[0.03] dark:to-white/[0.01] dark:hover:from-white/[0.06] dark:hover:to-white/[0.03]",
              "dark:border-white/[0.1] dark:hover:border-white/[0.15]",
              "dark:text-white dark:[text-shadow:none]",
              "dark:shadow-none"
            )}
          >
            <span>Upgrade to {nextTierConfig.label}</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

export default TierInfoCard;
