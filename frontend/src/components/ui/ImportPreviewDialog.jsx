import React, { useMemo } from 'react';
import { FileText, AlertTriangle, Copy, Trash2, Clock, Coins, CreditCard, ShieldAlert } from 'lucide-react';
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
 * ImportPreviewDialog Component
 * 
 * Displays import preview with stats, sample cards, and options
 * to keep/remove duplicates and expired cards.
 * Shows tier limit warnings when imported cards exceed user's limit.
 * 
 * Requirements: 6.3, 6.4, 7.1, 7.2, 7.3, 7.4
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether dialog is open
 * @param {function} props.onOpenChange - Callback when open state changes
 * @param {Object} props.stats - Import statistics
 * @param {number} props.stats.totalParsed - Total cards parsed
 * @param {number} props.stats.duplicatesRemoved - Duplicates found
 * @param {number} props.stats.expiredRemoved - Expired cards found
 * @param {number} props.stats.invalidRows - Invalid rows skipped
 * @param {number} props.stats.luhnFailedRemoved - Cards failing Luhn validation
 * @param {number} props.stats.invalidFormatRemoved - Cards with invalid format
 * @param {boolean} props.stats.truncated - Whether file was truncated
 * @param {number} props.stats.finalCount - Final card count after filtering
 * @param {string[]} props.sampleCards - First 5 cards as sample
 * @param {function} props.onConfirm - Callback when user confirms: (options) => void
 * @param {function} props.onCancel - Callback when user cancels
 * @param {number} props.effectiveRate - Credit rate per card (for cost estimate)
 * @param {number} props.balance - Current credit balance
 * @param {number} props.tierLimit - Maximum cards allowed for user's tier (Requirement 6.4)
 * @param {string} props.userTier - User's tier name (e.g., 'free', 'bronze')
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

  // Requirement 6.3, 6.4: Check if imported cards exceed tier limit
  const exceedsTierLimit = useMemo(() => {
    return finalCardCount > tierLimit;
  }, [finalCardCount, tierLimit]);

  const tierLimitExcess = useMemo(() => {
    return exceedsTierLimit ? finalCardCount - tierLimit : 0;
  }, [finalCardCount, tierLimit, exceedsTierLimit]);

  // Calculate estimated credit cost
  // Requirement 7.4: Display estimated credit cost based on card count
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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Import Preview
          </DialogTitle>
          <DialogDescription>
            Review imported cards before adding to input
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tier Limit Warning - Requirement 6.3, 6.4 */}
          {exceedsTierLimit && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-rose-700 dark:text-rose-300">
                  Exceeds tier limit
                </p>
                <p className="text-rose-600 dark:text-rose-400 mt-0.5">
                  You have {finalCardCount} cards but your {userTier} tier limit is {tierLimit}. 
                  Please reduce by {tierLimitExcess} card{tierLimitExcess > 1 ? 's' : ''} to continue.
                </p>
              </div>
            </div>
          )}

          {/* Tier Limit Display - Requirement 6.4 */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 dark:bg-white/5 border border-border/50">
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Tier limit ({userTier}):</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs font-semibold",
                exceedsTierLimit ? "text-rose-600 dark:text-rose-400" : "text-foreground"
              )}>
                {finalCardCount} / {tierLimit}
              </span>
              {!exceedsTierLimit && (
                <Badge variant="secondary" className="text-[9px] h-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  OK
                </Badge>
              )}
            </div>
          </div>

          {/* Stats Grid - Requirement 7.1 */}
          <div className="grid grid-cols-2 gap-3">
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
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-xs text-amber-700 dark:text-amber-300">
                File truncated to 10,000 cards ({stats.truncatedCount || 0} cards skipped)
              </span>
            </div>
          )}

          {/* Sample Preview - Requirement 7.2 */}
          {sampleCards.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Sample Preview (first 5 cards)
              </Label>
              <div className="rounded-lg border bg-muted/30 dark:bg-white/5 p-2 space-y-1 max-h-32 overflow-y-auto">
                {sampleCards.map((card, idx) => (
                  <div
                    key={idx}
                    className="font-mono text-[10px] text-muted-foreground truncate"
                  >
                    {maskCard(card)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Options - Requirement 7.3 */}
          {((stats.duplicatesRemoved || 0) > 0 || (stats.expiredRemoved || 0) > 0) && (
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-xs font-medium">Import Options</Label>
              
              {(stats.duplicatesRemoved || 0) > 0 && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="keep-duplicates" className="text-xs text-muted-foreground">
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
                  <Label htmlFor="keep-expired" className="text-xs text-muted-foreground">
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

          {/* Credit Cost Estimate - Requirement 7.4 */}
          <div className={cn(
            "flex items-center justify-between px-3 py-2 rounded-lg text-xs",
            hasSufficientCredits
              ? "bg-muted/50 dark:bg-white/5 border border-border/50"
              : "bg-amber-500/10 border border-amber-500/30"
          )}>
            <div className="flex items-center gap-1.5">
              <Coins className={cn(
                "h-3.5 w-3.5",
                hasSufficientCredits ? "text-muted-foreground" : "text-amber-500"
              )} />
              <span className="text-muted-foreground">Est. max cost:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-semibold",
                hasSufficientCredits ? "text-foreground" : "text-amber-700 dark:text-amber-300"
              )}>
                {estimatedCost} credits
              </span>
              <Badge variant="secondary" className="text-[9px] h-4">
                {effectiveRate}/card
              </Badge>
            </div>
          </div>

          {!hasSufficientCredits && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>
                You have {balance} credits. May stop early if all cards are LIVE.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={exceedsTierLimit}
            title={exceedsTierLimit ? `Reduce cards to ${tierLimit} or fewer` : undefined}
          >
            {exceedsTierLimit ? `Exceeds Limit (${tierLimit})` : `Import ${finalCardCount} Cards`}
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
      "flex items-center gap-2 px-3 py-2 rounded-lg",
      variant === 'warning' && "bg-amber-500/10 dark:bg-amber-500/20",
      variant === 'error' && "bg-rose-500/10 dark:bg-rose-500/20",
      variant === 'default' && "bg-muted/50 dark:bg-white/5",
      highlight && "ring-1 ring-primary/20"
    )}>
      <Icon className={cn(
        "h-4 w-4 shrink-0",
        variant === 'warning' && "text-amber-500",
        variant === 'error' && "text-rose-500",
        variant === 'default' && "text-muted-foreground"
      )} />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <p className={cn(
          "text-sm font-semibold",
          highlight && "text-primary"
        )}>
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

/**
 * Mask card number for preview display
 * Shows first 6 and last 4 digits
 */
function maskCard(card) {
  if (!card) return '';
  
  // Extract card number (first part before delimiter)
  const parts = card.split(/[|:,\s]/);
  const number = parts[0] || '';
  
  if (number.length < 10) return card;
  
  const masked = number.slice(0, 6) + '****' + number.slice(-4);
  
  // Reconstruct with other parts
  if (parts.length > 1) {
    return [masked, ...parts.slice(1)].join('|');
  }
  
  return masked;
}

export default ImportPreviewDialog;
