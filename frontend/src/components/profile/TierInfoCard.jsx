import { motion } from 'motion/react';
import { Star, Percent, Gift, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getTierConfig, TIER_ORDER } from '@/components/navigation/config/tier-config';

/**
 * Benefit item component
 */
function BenefitItem({ icon: Icon, label, value, iconBg, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-center gap-3"
    >
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg border",
        iconBg
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </motion.div>
  );
}

/**
 * TierInfoCard Component
 * 
 * Displays current tier benefits including multiplier discount and daily claim amount.
 * Shows upgrade CTA for non-diamond users.
 * 
 * @param {Object} props
 * @param {Object} props.tier - Tier info from API { name, multiplier, dailyClaim }
 * @param {string} props.className - Additional CSS classes
 */
export function TierInfoCard({ tier, className }) {
  const tierName = tier?.name || 'free';
  const config = getTierConfig(tierName);
  const TierIcon = config.icon;
  
  // Calculate discount percentage from multiplier
  const multiplier = tier?.multiplier ?? 1.0;
  const discountPercent = Math.round((1 - multiplier) * 100);
  const dailyClaim = tier?.dailyClaim ?? 10;
  
  // Check if user can upgrade
  const canUpgrade = tierName !== 'diamond';
  const tierIndex = TIER_ORDER.indexOf(tierName);
  const nextTier = canUpgrade ? TIER_ORDER[tierIndex + 1] : null;
  const nextTierConfig = nextTier ? getTierConfig(nextTier) : null;

  return (
    <Card 
      variant="elevated" 
      className={cn(
        // Light mode
        "bg-white border-gray-100",
        // Dark mode
        "dark:bg-white/[0.02] dark:border-white/[0.06]",
        className
      )}
    >
      <CardContent className="p-4">
        {/* Tier Header */}
        <div className="flex items-center gap-3 mb-4">
          <motion.div 
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-xl border",
              "bg-gradient-to-br",
              config.bgGradient,
              config.borderColor.replace('ring-', 'border-')
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.div
              animate={config.iconAnimation}
              transition={config.iconTransition}
            >
              <TierIcon className={cn("w-5 h-5", config.color)} />
            </motion.div>
          </motion.div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-foreground">
                {config.label} Tier
              </span>
              <Badge 
                variant="outline" 
                className="text-[10px] px-1.5 py-0 h-4 border-muted-foreground/30"
              >
                Active
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your current membership tier
            </p>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <BenefitItem
            icon={Percent}
            label="Credit Discount"
            value={discountPercent > 0 ? `${discountPercent}% off` : 'Standard rate'}
            iconBg={cn(
              "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5",
              "dark:from-emerald-400/15 dark:to-emerald-500/10",
              "border-emerald-500/20 dark:border-emerald-400/20",
              "text-emerald-600 dark:text-emerald-400"
            )}
            delay={0}
          />
          <BenefitItem
            icon={Gift}
            label="Daily Claim"
            value={`${dailyClaim} credits/day`}
            iconBg={cn(
              "bg-gradient-to-br from-violet-500/10 to-violet-600/5",
              "dark:from-violet-400/15 dark:to-violet-500/10",
              "border-violet-500/20 dark:border-violet-400/20",
              "text-violet-600 dark:text-violet-400"
            )}
            delay={0.05}
          />
          <BenefitItem
            icon={Zap}
            label="Processing Speed"
            value={tierName === 'diamond' ? 'Maximum' : tierName === 'free' ? 'Standard' : 'Enhanced'}
            iconBg={cn(
              "bg-gradient-to-br from-amber-500/10 to-amber-600/5",
              "dark:from-amber-400/15 dark:to-amber-500/10",
              "border-amber-500/20 dark:border-amber-400/20",
              "text-amber-600 dark:text-amber-400"
            )}
            delay={0.1}
          />
          <BenefitItem
            icon={Star}
            label="Rate Multiplier"
            value={`${multiplier}x`}
            iconBg={cn(
              "bg-gradient-to-br from-blue-500/10 to-blue-600/5",
              "dark:from-blue-400/15 dark:to-blue-500/10",
              "border-blue-500/20 dark:border-blue-400/20",
              "text-blue-600 dark:text-blue-400"
            )}
            delay={0.15}
          />
        </div>

        {/* Upgrade CTA */}
        {canUpgrade && nextTierConfig && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "w-full h-9 text-xs gap-2",
                "hover:border-primary/50 hover:bg-primary/5"
              )}
            >
              <Star className="w-3.5 h-3.5" />
              Upgrade to {nextTierConfig.label}
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

export default TierInfoCard;
