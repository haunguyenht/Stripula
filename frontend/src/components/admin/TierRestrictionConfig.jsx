import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Lock, Unlock, Loader2, Crown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useConfirmation } from '@/hooks/useConfirmation';
import { useToast } from '@/hooks/useToast';

/**
 * Tier hierarchy with display info
 */
const TIERS = [
  { value: null, label: 'All Tiers', description: 'No restriction - everyone can access', icon: Unlock },
  { value: 'bronze', label: 'Bronze+', description: 'Bronze, Silver, Gold, Diamond', icon: Shield },
  { value: 'silver', label: 'Silver+', description: 'Silver, Gold, Diamond', icon: Shield },
  { value: 'gold', label: 'Gold+', description: 'Gold, Diamond only', icon: Crown },
  { value: 'diamond', label: 'Diamond', description: 'Diamond only', icon: Crown },
];

/**
 * Get tier badge color
 */
function getTierColor(tier) {
  switch (tier) {
    case 'diamond': return 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
    case 'gold': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
    case 'silver': return 'bg-slate-400/20 text-slate-600 dark:text-slate-300 border-slate-400/30';
    case 'bronze': return 'bg-amber-600/20 text-amber-700 dark:text-amber-400 border-amber-600/30';
    default: return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  }
}

/**
 * TierRestrictionConfig Component
 * Admin config for setting minimum tier restriction on a gateway
 */
export function TierRestrictionConfig({
  gateway,
  onGetTierRestriction,
  onSetTierRestriction,
  onClearTierRestriction,
  isLoading: externalLoading = false
}) {
  const [currentTier, setCurrentTier] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { success, error: showError } = useToast();
  const confirmation = useConfirmation();

  // Load tier restriction on mount
  useEffect(() => {
    const loadTierRestriction = async () => {
      setIsLoadingConfig(true);
      try {
        const result = await onGetTierRestriction(gateway.id);
        if (result.success) {
          setCurrentTier(result.minTier);
          setSelectedTier(result.minTier);
        }
      } catch (err) {

      } finally {
        setIsLoadingConfig(false);
      }
    };
    loadTierRestriction();
  }, [gateway.id, onGetTierRestriction]);

  const hasChanges = selectedTier !== currentTier;
  const isOperationInProgress = externalLoading || isSaving;

  const handleSave = useCallback(async () => {
    // Show confirmation dialog
    const tierInfo = TIERS.find(t => t.value === selectedTier);
    const confirmed = await confirmation.confirm({
      title: selectedTier ? 'Set Tier Restriction' : 'Remove Tier Restriction',
      description: selectedTier 
        ? `Restrict ${gateway.label || gateway.id} to ${tierInfo?.label || selectedTier}+ users?`
        : `Allow all tiers to access ${gateway.label || gateway.id}?`,
      content: (
        <div className="space-y-3 py-2">
          {selectedTier && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-2">Only these tiers will have access:</p>
              <div className="flex flex-wrap gap-1.5">
                {TIERS
                  .filter(t => t.value && TIERS.findIndex(x => x.value === t.value) >= TIERS.findIndex(x => x.value === selectedTier))
                  .map(t => (
                    <Badge key={t.value} variant="outline" className={cn('text-xs', getTierColor(t.value))}>
                      {t.value.charAt(0).toUpperCase() + t.value.slice(1)}
                    </Badge>
                  ))
                }
              </div>
            </div>
          )}
          {!selectedTier && (
            <p className="text-sm text-muted-foreground">
              All users (including free tier) will be able to access this gateway.
            </p>
          )}
        </div>
      ),
      confirmText: selectedTier ? 'Set Restriction' : 'Remove Restriction',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    setIsSaving(true);
    try {
      const result = selectedTier 
        ? await onSetTierRestriction(gateway.id, selectedTier)
        : await onClearTierRestriction(gateway.id);
      
      if (result.success) {
        setCurrentTier(selectedTier);
        success(result.message || (selectedTier ? 'Tier restriction set' : 'Tier restriction cleared'));
      } else {
        showError(result.error || 'Failed to update tier restriction');
      }
    } finally {
      setIsSaving(false);
    }
  }, [gateway.id, gateway.label, selectedTier, onSetTierRestriction, onClearTierRestriction, confirmation, success, showError]);

  const handleReset = useCallback(() => {
    setSelectedTier(currentTier);
  }, [currentTier]);

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {currentTier ? (
          <Lock className="h-4 w-4 text-amber-500" />
        ) : (
          <Unlock className="h-4 w-4 text-emerald-500" />
        )}
        <h4 className="text-sm font-medium">Tier Restriction</h4>
        {currentTier && (
          <Badge variant="outline" className={cn('text-xs', getTierColor(currentTier))}>
            {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}+ only
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        <Select
          value={selectedTier || 'all'}
          onValueChange={(value) => setSelectedTier(value === 'all' ? null : value)}
          disabled={isOperationInProgress}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select minimum tier..." />
          </SelectTrigger>
          <SelectContent>
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              return (
                <SelectItem key={tier.value || 'all'} value={tier.value || 'all'}>
                  <div className="flex items-center gap-2">
                    <Icon className={cn(
                      'h-4 w-4',
                      tier.value ? 'text-amber-500' : 'text-emerald-500'
                    )} />
                    <span>{tier.label}</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      — {tier.description}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Preview of allowed tiers */}
        {selectedTier && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
          >
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
              Allowed tiers:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TIERS
                .filter(t => t.value && TIERS.findIndex(x => x.value === t.value) >= TIERS.findIndex(x => x.value === selectedTier))
                .map(t => (
                  <Badge key={t.value} variant="outline" className={cn('text-xs', getTierColor(t.value))}>
                    {t.value.charAt(0).toUpperCase() + t.value.slice(1)}
                  </Badge>
                ))
              }
            </div>
          </motion.div>
        )}

        {!selectedTier && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              All users can access this gateway (no tier restriction)
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2"
        >
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isOperationInProgress}
            className="flex-1"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Lock className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isOperationInProgress}
          >
            Reset
          </Button>
        </motion.div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmation.isOpen}
        onOpenChange={confirmation.setOpen}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        isLoading={confirmation.isLoading}
        {...confirmation.config}
      />
    </div>
  );
}

export default TierRestrictionConfig;
