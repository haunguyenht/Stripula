import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Users, Copy, Check, ExternalLink, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

/**
 * ReferralCard Component
 * 
 * Displays referral code, stats, and share functionality.
 * Shows progress toward maximum referrals.
 * 
 * @param {Object} props
 * @param {Object} props.referral - Referral data from API
 * @param {string} props.referral.code - Referral code
 * @param {number} props.referral.referralCount - Number of successful referrals
 * @param {number} props.referral.creditsEarned - Total credits earned from referrals
 * @param {number} props.referral.maxReferrals - Maximum allowed referrals
 * @param {number} props.referral.remainingReferrals - Remaining referral slots
 * @param {boolean} props.referral.canEarnMore - Whether user can earn more referral credits
 * @param {string} props.className - Additional CSS classes
 */
export function ReferralCard({ referral, className }) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const code = referral?.code || '...';
  const referralCount = referral?.referralCount ?? 0;
  const creditsEarned = referral?.creditsEarned ?? 0;
  const maxReferrals = referral?.maxReferrals ?? 10;
  const canEarnMore = referral?.canEarnMore ?? true;
  
  const progress = maxReferrals > 0 ? (referralCount / maxReferrals) * 100 : 0;
  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}?ref=${code}` 
    : '';

  /**
   * Copy text to clipboard
   */
  const handleCopy = useCallback(async (text, isLink = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isLink) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      // Clipboard API failed silently
    }
  }, []);

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
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <motion.div 
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl border",
              "bg-gradient-to-br from-violet-500/10 to-purple-500/5",
              "dark:from-violet-400/15 dark:to-purple-400/10",
              "border-violet-500/20 dark:border-violet-400/20"
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </motion.div>
          
          <div className="flex-1">
            <span className="font-semibold text-sm text-foreground">
              Referral Program
            </span>
            <p className="text-xs text-muted-foreground">
              Earn 15 credits per referral
            </p>
          </div>
          
          {!canEarnMore && (
            <Badge variant="secondary" className="text-[10px]">
              Max Reached
            </Badge>
          )}
        </div>

        {/* Referral Code */}
        <div className="space-y-2 mb-4">
          <label className="text-xs text-muted-foreground font-medium">
            Your Referral Code
          </label>
          <div className="flex items-center gap-2">
            <motion.div 
              onClick={() => handleCopy(code)}
              className={cn(
                "flex-1 flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                "bg-muted/50 hover:bg-muted border border-transparent hover:border-border"
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <code className="text-sm font-mono font-semibold tracking-wider">
                {code}
              </code>
              <motion.div
                initial={false}
                animate={{ scale: copied ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.2 }}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </motion.div>
            </motion.div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 w-10 p-0 flex-shrink-0"
              onClick={() => handleCopy(referralLink, true)}
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl",
              "bg-gradient-to-br from-blue-500/5 to-blue-600/5",
              "dark:from-blue-400/10 dark:to-blue-500/5",
              "border border-blue-500/10 dark:border-blue-400/15"
            )}
          >
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {referralCount}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Referrals
            </span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl",
              "bg-gradient-to-br from-emerald-500/5 to-emerald-600/5",
              "dark:from-emerald-400/10 dark:to-emerald-500/5",
              "border border-emerald-500/10 dark:border-emerald-400/15"
            )}
          >
            <div className="flex items-center gap-1">
              <Gift className="w-4 h-4 text-emerald-500" />
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{creditsEarned}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Credits Earned
            </span>
          </motion.div>
        </div>

        {/* Progress toward max */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground tabular-nums">
              {referralCount} / {maxReferrals}
            </span>
          </div>
          <Progress 
            value={progress} 
            className="h-2"
          />
          <p className="text-[10px] text-muted-foreground text-center">
            {canEarnMore 
              ? `${maxReferrals - referralCount} referral slots remaining`
              : 'Maximum referrals reached - thank you!'
            }
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}

export default ReferralCard;
