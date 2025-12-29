import React, { useMemo } from 'react';
import { FileText, AlertTriangle, Copy, Trash2, Clock, Coins, CreditCard, ShieldAlert, Upload, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * ImportPreviewDialog - Redesigned for OrangeAI/OPUX Design System
 * 
 * Modern import preview dialog with:
 * - Glass morphism stat cards
 * - Visual tier limit indicators
 * - Clean toggle options
 * 
 * Requirements: 6.3, 6.4, 7.1, 7.2, 7.3, 7.4
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
      <DialogContent className="sm:max-w-md">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn(
              "shrink-0 p-2.5 rounded-xl ring-1",
              "bg-primary/10 dark:bg-primary/15",
              "ring-primary/20 dark:ring-primary/25"
            )}>
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
              <DialogTitle>Import Preview</DialogTitle>
              <DialogDescription>
                Review imported cards before adding to input
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {/* Tier Limit Warning */}
          {exceedsTierLimit && (
            <div className={cn(
              "rounded-xl p-3",
              "bg-rose-50 dark:bg-rose-500/[0.08]",
              "border border-rose-200/80 dark:border-rose-500/20"
            )}>
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[13px] font-semibold text-rose-700 dark:text-rose-300">
                    Exceeds tier limit
                  </p>
                  <p className="text-[12px] leading-relaxed text-rose-600/90 dark:text-rose-400/80">
                    You have {finalCardCount} cards but your {userTier} tier limit is {tierLimit}. 
                    Please reduce by {tierLimitExcess} card{tierLimitExcess > 1 ? 's' : ''} to continue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tier Limit Progress */}
          <div className={cn(
            "rounded-xl p-3",
            "bg-neutral-50 dark:bg-white/[0.03]",
            "border border-neutral-200/60 dark:border-white/[0.06]"
          )}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-neutral-500 dark:text-white/50" />
                <span className="text-[12px] text-neutral-500 dark:text-white/50">
                  Tier limit ({userTier})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[13px] font-bold font-mono",
                  exceedsTierLimit ? "text-rose-600 dark:text-rose-400" : "text-neutral-900 dark:text-white"
                )}>
                  {finalCardCount} / {tierLimit}
                </span>
                {!exceedsTierLimit && (
                  <Badge className="text-[9px] h-4 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0">
                    OK
                  </Badge>
                )}
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  exceedsTierLimit 
                    ? "bg-rose-500" 
                    : finalCardCount / tierLimit > 0.8 
                      ? "bg-amber-500" 
                      : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(100, (finalCardCount / tierLimit) * 100)}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="Total Parsed"
              value={stats.totalParsed || 0}
              icon={FileText}
            />
            <StatCard
              label="Final Count"
              value={finalCardCount}
              icon={FileText}
              highlight
            />
            {(stats.duplicatesRemoved || 0) > 0 && (
              <StatCard
                label="Duplicates"
                value={stats.duplicatesRemoved}
                icon={Copy}
                variant="warning"
              />
            )}
            {(stats.expiredRemoved || 0) > 0 && (
              <StatCard
                label="Expired"
                value={stats.expiredRemoved}
                icon={Clock}
                variant="warning"
              />
            )}
            {(stats.luhnFailedRemoved || 0) > 0 && (
              <StatCard
                label="Invalid Numbers"
                value={stats.luhnFailedRemoved}
                icon={ShieldAlert}
                variant="warning"
              />
            )}
            {(stats.invalidFormatRemoved || 0) > 0 && (
              <StatCard
                label="Invalid Format"
                value={stats.invalidFormatRemoved}
                icon={Trash2}
                variant="warning"
              />
            )}
            {(stats.invalidRows || 0) > 0 && (
              <StatCard
                label="Invalid Rows"
                value={stats.invalidRows}
                icon={Trash2}
                variant="error"
              />
            )}
          </div>

          {/* Truncation Warning */}
          {stats.truncated && (
            <div className={cn(
              "rounded-xl p-3",
              "bg-amber-50 dark:bg-amber-500/[0.08]",
              "border border-amber-200/80 dark:border-amber-500/20"
            )}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-[12px] font-medium text-amber-700 dark:text-amber-300">
                  File truncated to 10,000 cards ({stats.truncatedCount || 0} skipped)
                </span>
              </div>
            </div>
          )}

          {/* Sample Preview */}
          {sampleCards.length > 0 && (
            <div className="space-y-2">
              <Label className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-white/40">
                Sample Preview (first 5)
              </Label>
              <div className={cn(
                "rounded-xl p-3 space-y-1 max-h-28 overflow-y-auto",
                "bg-neutral-50 dark:bg-white/[0.03]",
                "border border-neutral-200/60 dark:border-white/[0.06]"
              )}>
                {sampleCards.map((card, idx) => (
                  <div
                    key={idx}
                    className="font-mono text-[11px] text-neutral-500 dark:text-white/50 truncate"
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
              "rounded-xl p-4 space-y-3",
              "bg-neutral-50 dark:bg-white/[0.03]",
              "border border-neutral-200/60 dark:border-white/[0.06]"
            )}>
              <Label className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-white/40">
                Import Options
              </Label>
              
              {(stats.duplicatesRemoved || 0) > 0 && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="keep-duplicates" className="text-[13px] text-neutral-600 dark:text-white/70 cursor-pointer">
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
                  <Label htmlFor="keep-expired" className="text-[13px] text-neutral-600 dark:text-white/70 cursor-pointer">
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
            "rounded-xl p-3",
            hasSufficientCredits
              ? "bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.06]"
              : "bg-amber-50 dark:bg-amber-500/[0.08] border border-amber-200/80 dark:border-amber-500/20"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className={cn(
                  "h-4 w-4",
                  hasSufficientCredits ? "text-neutral-500 dark:text-white/50" : "text-amber-600 dark:text-amber-400"
                )} />
                <span className={cn(
                  "text-[12px]",
                  hasSufficientCredits ? "text-neutral-500 dark:text-white/50" : "text-amber-700 dark:text-amber-300"
                )}>
                  Est. max cost:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[14px] font-bold font-mono",
                  hasSufficientCredits ? "text-neutral-900 dark:text-white" : "text-amber-700 dark:text-amber-300"
                )}>
                  {estimatedCost} credits
                </span>
                <Badge className="text-[9px] h-4 bg-neutral-100 dark:bg-white/10 text-neutral-500 dark:text-white/50 border-0">
                  {effectiveRate}/card
                </Badge>
              </div>
            </div>
          </div>

          {!hasSufficientCredits && (
            <div className="flex items-center justify-center gap-2 text-[11px] text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
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
              "h-10 font-medium text-[14px]",
              "border-neutral-200 text-neutral-700",
              "hover:bg-neutral-100 hover:border-neutral-300",
              "dark:border-white/10 dark:text-white/70",
              "dark:hover:bg-white/[0.06] dark:hover:border-white/20"
            )}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={exceedsTierLimit}
            className="h-10 font-medium text-[14px] min-w-[140px] gap-1.5"
            title={exceedsTierLimit ? `Reduce cards to ${tierLimit} or fewer` : undefined}
          >
            {exceedsTierLimit ? (
              `Exceeds Limit (${tierLimit})`
            ) : (
              <>
                Import {finalCardCount} Cards
                <ChevronRight className="h-4 w-4" />
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
function StatCard({ label, value, icon: Icon, variant = 'default', highlight = false }) {
  return (
    <div className={cn(
      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl",
      "border",
      variant === 'warning' && "bg-amber-50 dark:bg-amber-500/[0.08] border-amber-200/60 dark:border-amber-500/15",
      variant === 'error' && "bg-rose-50 dark:bg-rose-500/[0.08] border-rose-200/60 dark:border-rose-500/15",
      variant === 'default' && "bg-neutral-50 dark:bg-white/[0.03] border-neutral-200/60 dark:border-white/[0.06]",
      highlight && "ring-1 ring-primary/20 dark:ring-primary/25"
    )}>
      <div className={cn(
        "flex items-center justify-center w-7 h-7 rounded-lg shrink-0",
        variant === 'warning' && "bg-amber-100 dark:bg-amber-500/15",
        variant === 'error' && "bg-rose-100 dark:bg-rose-500/15",
        variant === 'default' && "bg-neutral-100 dark:bg-white/[0.06]"
      )}>
        <Icon className={cn(
          "h-3.5 w-3.5",
          variant === 'warning' && "text-amber-600 dark:text-amber-400",
          variant === 'error' && "text-rose-600 dark:text-rose-400",
          variant === 'default' && "text-neutral-500 dark:text-white/50"
        )} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-white/40 truncate">{label}</p>
        <p className={cn(
          "text-[14px] font-bold font-mono",
          highlight ? "text-primary" : "text-neutral-900 dark:text-white"
        )}>
          {value.toLocaleString()}
        </p>
      </div>
    </div>
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
