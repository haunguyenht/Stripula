import React, { useMemo } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  Copy, 
  Trash2, 
  Clock, 
  Coins, 
  CreditCard, 
  ShieldAlert, 
  Upload, 
  ChevronRight,
  CheckCircle2,
  XCircle,
  FileWarning
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogSection,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * ImportPreviewDialog - Premium Dual Theme Design System
 * 
 * ═══════════════════════════════════════════════════════════════════
 * Modern import preview dialog with:
 * - Art Deco treasury styling (light) / Obsidian nebula glass (dark)
 * - Animated stat cards with tier limit visualization
 * - Clean toggle options with premium switches
 * - Responsive layout for all screen sizes
 * ═══════════════════════════════════════════════════════════════════
 */
export function ImportPreviewDialog({
  open,
  onOpenChange,
  stats = {},
  sampleCards = [],
  onConfirm,
  onCancel,
  effectiveRate = 1,
  balance = 0,
  tierLimit = 500,
  userTier = 'free',
}) {
  const [keepDuplicates, setKeepDuplicates] = React.useState(false);
  const [keepExpired, setKeepExpired] = React.useState(false);

  // Calculate final card count based on options
  const finalCardCount = useMemo(() => {
    let count = stats.finalCount || 0;
    if (keepDuplicates && stats.duplicatesRemoved) {
      count += stats.duplicatesRemoved;
    }
    if (keepExpired && stats.expiredRemoved) {
      count += stats.expiredRemoved;
    }
    return count;
  }, [stats, keepDuplicates, keepExpired]);

  // Check if imported cards exceed tier limit
  const exceedsTierLimit = useMemo(() => {
    return finalCardCount > tierLimit;
  }, [finalCardCount, tierLimit]);

  const tierLimitExcess = useMemo(() => {
    return exceedsTierLimit ? finalCardCount - tierLimit : 0;
  }, [finalCardCount, tierLimit, exceedsTierLimit]);

  // Calculate estimated credit cost
  const estimatedCost = useMemo(() => {
    return Math.ceil(finalCardCount * effectiveRate);
  }, [finalCardCount, effectiveRate]);

  const hasSufficientCredits = balance >= estimatedCost;
  const tierUsagePercent = Math.min(100, (finalCardCount / tierLimit) * 100);

  const handleConfirm = () => {
    onConfirm?.({
      removeDuplicates: !keepDuplicates,
      removeExpired: !keepExpired,
    });
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="default" className="sm:max-w-[480px]">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-start gap-3 xs:gap-4">
            <motion.div 
              className={cn(
                "shrink-0 flex items-center justify-center",
                "h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12",
                "rounded-xl sm:rounded-2xl",
                "ring-1",
                // Light: Emerald treasury
                "bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-50",
                "ring-emerald-200/60",
                "shadow-[inset_0_-2px_4px_rgba(0,0,0,0.03)]",
                // Dark: Cyan aurora
                "dark:from-cyan-500/20 dark:via-cyan-500/15 dark:to-emerald-500/10",
                "dark:ring-cyan-500/30",
                "dark:shadow-[0_0_24px_-4px_rgba(34,211,238,0.5)]"
              )}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <Upload className="h-5 w-5 xs:h-5.5 xs:w-5.5 sm:h-6 sm:w-6 text-emerald-600 dark:text-cyan-400" />
            </motion.div>
            <div className="flex-1 min-w-0 pt-0.5 space-y-1 xs:space-y-1.5">
              <DialogTitle className="pr-6">Import Preview</DialogTitle>
              <DialogDescription>
                Review imported cards before adding to input
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 xs:space-y-4">
          {/* Tier Limit Warning */}
          {exceedsTierLimit && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <DialogSection variant="danger">
                <div className="flex items-start gap-2 xs:gap-2.5">
                  <ShieldAlert className="h-4 w-4 xs:h-4.5 xs:w-4.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-xs xs:text-[13px] font-semibold text-rose-700 dark:text-rose-300">
                      Exceeds tier limit
                    </p>
                    <p className="text-[11px] xs:text-[12px] leading-relaxed text-rose-600/90 dark:text-rose-400/80">
                      You have {finalCardCount} cards but your {userTier} tier limit is {tierLimit}. 
                      Please reduce by {tierLimitExcess} card{tierLimitExcess > 1 ? 's' : ''} to continue.
                    </p>
                  </div>
                </div>
              </DialogSection>
            </motion.div>
          )}

          {/* Tier Limit Progress */}
          <motion.div 
            className={cn(
              "rounded-xl sm:rounded-2xl p-3 xs:p-4",
              // Light
              "bg-gradient-to-br from-[hsl(40,30%,96%)] to-[hsl(38,25%,94%)]",
              "ring-1 ring-inset ring-[hsl(38,25%,85%)]",
              // Dark
              "dark:from-white/[0.03] dark:to-white/[0.02]",
              "dark:ring-white/[0.08]"
            )}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-[hsl(35,25%,50%)] dark:text-white/50" />
                <span className="text-[11px] xs:text-[12px] text-[hsl(35,25%,50%)] dark:text-white/50">
                  Tier limit ({userTier})
                </span>
              </div>
              <div className="flex items-center gap-1.5 xs:gap-2">
                <span className={cn(
                  "text-xs xs:text-[13px] font-bold font-mono",
                  exceedsTierLimit ? "text-rose-600 dark:text-rose-400" : "text-[hsl(35,35%,30%)] dark:text-white"
                )}>
                  {finalCardCount} / {tierLimit}
                </span>
                {!exceedsTierLimit && (
                  <Badge className={cn(
                    "text-[8px] xs:text-[9px] h-4 px-1.5 border-0",
                    "bg-emerald-100 dark:bg-emerald-500/15",
                    "text-emerald-700 dark:text-emerald-400"
                  )}>
                    OK
                  </Badge>
                )}
              </div>
            </div>
            {/* Progress bar */}
            <div className={cn(
              "h-1.5 xs:h-2 rounded-full overflow-hidden",
              "bg-[hsl(40,25%,90%)] dark:bg-white/10"
            )}>
              <motion.div 
                className={cn(
                  "h-full rounded-full",
                  exceedsTierLimit 
                    ? "bg-gradient-to-r from-rose-500 to-rose-600" 
                    : tierUsagePercent > 80 
                      ? "bg-gradient-to-r from-amber-500 to-amber-600" 
                      : "bg-gradient-to-r from-emerald-500 to-emerald-600"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${tierUsagePercent}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 xs:gap-2.5">
            <StatCard
              label="Total Parsed"
              value={stats.totalParsed || 0}
              icon={FileText}
              delay={0.1}
            />
            <StatCard
              label="Final Count"
              value={finalCardCount}
              icon={CheckCircle2}
              highlight
              delay={0.15}
            />
            {(stats.duplicatesRemoved || 0) > 0 && (
              <StatCard
                label="Duplicates"
                value={stats.duplicatesRemoved}
                icon={Copy}
                variant="warning"
                delay={0.2}
              />
            )}
            {(stats.expiredRemoved || 0) > 0 && (
              <StatCard
                label="Expired"
                value={stats.expiredRemoved}
                icon={Clock}
                variant="warning"
                delay={0.25}
              />
            )}
            {(stats.luhnFailedRemoved || 0) > 0 && (
              <StatCard
                label="Invalid Numbers"
                value={stats.luhnFailedRemoved}
                icon={ShieldAlert}
                variant="warning"
                delay={0.3}
              />
            )}
            {(stats.invalidFormatRemoved || 0) > 0 && (
              <StatCard
                label="Invalid Format"
                value={stats.invalidFormatRemoved}
                icon={FileWarning}
                variant="warning"
                delay={0.35}
              />
            )}
            {(stats.invalidRows || 0) > 0 && (
              <StatCard
                label="Invalid Rows"
                value={stats.invalidRows}
                icon={XCircle}
                variant="error"
                delay={0.4}
              />
            )}
          </div>

          {/* Truncation Warning */}
          {stats.truncated && (
            <DialogSection variant="warning">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px] xs:text-[12px] font-medium text-amber-700 dark:text-amber-300">
                  File truncated to 10,000 cards ({stats.truncatedCount || 0} skipped)
                </span>
              </div>
            </DialogSection>
          )}

          {/* Sample Preview */}
          {sampleCards.length > 0 && (
            <div className="space-y-1.5 xs:space-y-2">
              <Label className="text-[10px] xs:text-[11px] font-medium uppercase tracking-wider text-[hsl(35,20%,55%)] dark:text-white/40">
                Sample Preview (first 5)
              </Label>
              <div className={cn(
                "rounded-lg xs:rounded-xl p-2.5 xs:p-3 space-y-1 max-h-24 xs:max-h-28 overflow-y-auto",
                "bg-[hsl(42,35%,97%)] dark:bg-white/[0.03]",
                "ring-1 ring-inset ring-[hsl(40,30%,88%)] dark:ring-white/[0.06]",
                "scrollbar-thin scrollbar-thumb-[hsl(38,30%,80%)] dark:scrollbar-thumb-white/20"
              )}>
                {sampleCards.map((card, idx) => (
                  <div
                    key={idx}
                    className="font-mono text-[10px] xs:text-[11px] text-[hsl(35,25%,45%)] dark:text-white/50 truncate"
                  >
                    {maskCard(card)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Options */}
          {((stats.duplicatesRemoved || 0) > 0 || (stats.expiredRemoved || 0) > 0) && (
            <div className={cn(
              "rounded-xl sm:rounded-2xl p-3 xs:p-4 space-y-3",
              "bg-[hsl(42,35%,97%)] dark:bg-white/[0.03]",
              "ring-1 ring-inset ring-[hsl(40,30%,88%)] dark:ring-white/[0.06]"
            )}>
              <Label className="text-[10px] xs:text-[11px] font-medium uppercase tracking-wider text-[hsl(35,20%,55%)] dark:text-white/40">
                Import Options
              </Label>
              
              {(stats.duplicatesRemoved || 0) > 0 && (
                <div className="flex items-center justify-between">
                  <Label 
                    htmlFor="keep-duplicates" 
                    className="text-xs xs:text-[13px] text-[hsl(35,25%,40%)] dark:text-white/70 cursor-pointer"
                  >
                    Keep duplicate cards ({stats.duplicatesRemoved})
                  </Label>
                  <Switch
                    id="keep-duplicates"
                    checked={keepDuplicates}
                    onCheckedChange={setKeepDuplicates}
                  />
                </div>
              )}
              
              {(stats.expiredRemoved || 0) > 0 && (
                <div className="flex items-center justify-between">
                  <Label 
                    htmlFor="keep-expired" 
                    className="text-xs xs:text-[13px] text-[hsl(35,25%,40%)] dark:text-white/70 cursor-pointer"
                  >
                    Keep expired cards ({stats.expiredRemoved})
                  </Label>
                  <Switch
                    id="keep-expired"
                    checked={keepExpired}
                    onCheckedChange={setKeepExpired}
                  />
                </div>
              )}
            </div>
          )}

          {/* Credit Cost Estimate */}
          <div className={cn(
            "rounded-xl sm:rounded-2xl p-3 xs:p-4",
            hasSufficientCredits
              ? [
                  "bg-[hsl(42,35%,97%)] dark:bg-white/[0.03]",
                  "ring-1 ring-inset ring-[hsl(40,30%,88%)] dark:ring-white/[0.06]"
                ]
              : [
                  "bg-amber-50 dark:bg-amber-500/[0.08]",
                  "ring-1 ring-inset ring-amber-200/80 dark:ring-amber-500/20"
                ]
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className={cn(
                  "h-3.5 w-3.5 xs:h-4 xs:w-4",
                  hasSufficientCredits ? "text-[hsl(35,25%,50%)] dark:text-white/50" : "text-amber-600 dark:text-amber-400"
                )} />
                <span className={cn(
                  "text-[11px] xs:text-[12px]",
                  hasSufficientCredits ? "text-[hsl(35,25%,50%)] dark:text-white/50" : "text-amber-700 dark:text-amber-300"
                )}>
                  Est. max cost:
                </span>
              </div>
              <div className="flex items-center gap-1.5 xs:gap-2">
                <span className={cn(
                  "text-sm xs:text-[14px] font-bold font-mono",
                  hasSufficientCredits ? "text-[hsl(35,35%,30%)] dark:text-white" : "text-amber-700 dark:text-amber-300"
                )}>
                  {estimatedCost} credits
                </span>
                <Badge className={cn(
                  "text-[8px] xs:text-[9px] h-4 px-1.5 border-0",
                  "bg-[hsl(40,25%,90%)] dark:bg-white/10",
                  "text-[hsl(35,25%,50%)] dark:text-white/50"
                )}>
                  {effectiveRate}/card
                </Badge>
              </div>
            </div>
          </div>

          {!hasSufficientCredits && (
            <div className="flex items-center justify-center gap-1.5 xs:gap-2 text-[10px] xs:text-[11px] text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
              <span>
                You have {balance} credits. May stop early if all cards are LIVE.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className={cn(
              "flex-1 sm:flex-none",
              "h-9 xs:h-10 sm:h-11",
              "text-[13px] xs:text-[14px] font-medium",
              // Light mode
              "bg-gradient-to-b from-[hsl(42,45%,97%)] to-[hsl(40,40%,93%)]",
              "border-[hsl(42,40%,75%)] text-[hsl(35,35%,30%)]",
              "hover:from-[hsl(42,50%,95%)] hover:to-[hsl(40,45%,90%)]",
              // Dark mode
              "dark:bg-transparent dark:from-transparent dark:to-transparent",
              "dark:border-white/[0.1] dark:text-white/70",
              "dark:hover:bg-white/[0.06] dark:hover:text-white"
            )}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={exceedsTierLimit}
            className={cn(
              "flex-1 sm:flex-none min-w-[130px] xs:min-w-[150px]",
              "h-9 xs:h-10 sm:h-11",
              "text-[13px] xs:text-[14px] font-medium gap-1 xs:gap-1.5",
              exceedsTierLimit
                ? "opacity-50 cursor-not-allowed"
                : [
                    // Light: Emerald seal
                    "bg-gradient-to-b from-[hsl(155,55%,42%)] via-[hsl(155,50%,38%)] to-[hsl(155,45%,32%)]",
                    "border border-[hsl(155,40%,28%)]/30 text-white",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_16px_-2px_rgba(50,150,100,0.3)]",
                    // Dark: Cyan aurora
                    "dark:from-cyan-600 dark:via-cyan-600 dark:to-cyan-700",
                    "dark:border-cyan-500/30",
                    "dark:shadow-[0_0_30px_-6px_rgba(34,211,238,0.6)]"
                  ]
            )}
            title={exceedsTierLimit ? `Reduce cards to ${tierLimit} or fewer` : undefined}
          >
            {exceedsTierLimit ? (
              <span className="text-[12px] xs:text-[13px]">Exceeds Limit ({tierLimit})</span>
            ) : (
              <>
                Import {finalCardCount} Cards
                <ChevronRight className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Stat card for displaying import statistics
 */
function StatCard({ label, value, icon: Icon, variant = 'default', highlight = false, delay = 0 }) {
  return (
    <motion.div 
      className={cn(
        "flex items-center gap-2 xs:gap-2.5 px-2.5 xs:px-3 py-2 xs:py-2.5 rounded-lg xs:rounded-xl",
        "ring-1 ring-inset",
        variant === 'warning' && [
          "bg-amber-50 dark:bg-amber-500/[0.08]",
          "ring-amber-200/60 dark:ring-amber-500/15"
        ],
        variant === 'error' && [
          "bg-rose-50 dark:bg-rose-500/[0.08]",
          "ring-rose-200/60 dark:ring-rose-500/15"
        ],
        variant === 'default' && [
          "bg-[hsl(42,35%,97%)] dark:bg-white/[0.03]",
          "ring-[hsl(40,30%,88%)] dark:ring-white/[0.06]"
        ],
        highlight && "ring-2 ring-emerald-300/60 dark:ring-cyan-500/30"
      )}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
    >
      <div className={cn(
        "flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 rounded-md xs:rounded-lg shrink-0",
        variant === 'warning' && "bg-amber-100 dark:bg-amber-500/15",
        variant === 'error' && "bg-rose-100 dark:bg-rose-500/15",
        variant === 'default' && "bg-[hsl(40,30%,92%)] dark:bg-white/[0.06]"
      )}>
        <Icon className={cn(
          "h-3 w-3 xs:h-3.5 xs:w-3.5",
          variant === 'warning' && "text-amber-600 dark:text-amber-400",
          variant === 'error' && "text-rose-600 dark:text-rose-400",
          variant === 'default' && "text-[hsl(35,25%,50%)] dark:text-white/50"
        )} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] xs:text-[10px] uppercase tracking-wider text-[hsl(35,20%,55%)] dark:text-white/40 truncate">
          {label}
        </p>
        <p className={cn(
          "text-sm xs:text-[14px] font-bold font-mono",
          highlight ? "text-emerald-600 dark:text-cyan-400" : "text-[hsl(35,35%,30%)] dark:text-white"
        )}>
          {value.toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Mask card number for preview display
 */
function maskCard(card) {
  if (!card) return '';
  
  const parts = card.split(/[|:,\s]/);
  const number = parts[0] || '';
  
  if (number.length < 10) return card;
  
  const masked = number.slice(0, 6) + '****' + number.slice(-4);
  
  if (parts.length > 1) {
    return [masked, ...parts.slice(1)].join('|');
  }
  
  return masked;
}

export default ImportPreviewDialog;
