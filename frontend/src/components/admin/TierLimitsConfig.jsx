import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  Loader2, 
  RefreshCw,
  Check,
  X,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useCardInputLimits } from '@/hooks/useCardInputLimits';
import { useConfirmation } from '@/hooks/useConfirmation';
import { useToast } from '@/hooks/useToast';

/**
 * TierLimitsConfig Component
 * Admin panel for configuring card input limits per tier
 * 
 * Requirements: 7.1, 7.2, 7.5
 */

const API_BASE = '/api';

const TIER_LABELS = {
  free: 'Free',
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  diamond: 'Diamond'
};

const TIER_ORDER = ['free', 'bronze', 'silver', 'gold', 'diamond'];

// Validation bounds (Requirements: 7.6)
const LIMIT_BOUNDS = {
  MIN: 100,
  MAX: 10000
};

/**
 * Validate a limit value
 * Requirements: 7.6
 */
function validateLimit(value) {
  if (value === '' || value === null || value === undefined) {
    return { valid: false, error: 'Limit is required' };
  }

  const limit = parseInt(value, 10);
  
  if (isNaN(limit)) {
    return { valid: false, error: 'Limit must be a number' };
  }

  if (!Number.isInteger(limit)) {
    return { valid: false, error: 'Limit must be an integer' };
  }

  if (limit < LIMIT_BOUNDS.MIN || limit > LIMIT_BOUNDS.MAX) {
    return { 
      valid: false, 
      error: `Limit must be between ${LIMIT_BOUNDS.MIN} and ${LIMIT_BOUNDS.MAX}` 
    };
  }

  return { valid: true, error: null };
}

/**
 * TierLimitRow - Inline editable row for a tier's card limit
 */
function TierLimitRow({ tier, limit, defaultLimit, isCustom, onUpdate, isUpdating }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(limit);
  const [error, setError] = useState(null);

  // Sync edit value when limit changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(limit);
    }
  }, [limit, isEditing]);

  const handleEdit = useCallback(() => {
    setEditValue(limit);
    setError(null);
    setIsEditing(true);
  }, [limit]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(limit);
    setError(null);
  }, [limit]);

  const handleSave = useCallback(async () => {
    // Validate before saving
    const validation = validateLimit(editValue);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    const newLimit = parseInt(editValue, 10);
    
    // Don't save if unchanged
    if (newLimit === limit) {
      setIsEditing(false);
      return;
    }

    const result = await onUpdate(tier, newLimit);

    if (result.success) {
      setIsEditing(false);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [tier, editValue, limit, onUpdate]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setEditValue(value);
    // Clear error on input change
    if (error) {
      const validation = validateLimit(value);
      setError(validation.error);
    }
  }, [error]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "border-b border-border/50 last:border-0",
        "hover:bg-muted/30 transition-colors"
      )}
    >
      {/* Tier Name */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">{TIER_LABELS[tier]}</span>
          {isCustom && (
            <Badge variant="secondary" className="text-xs">Custom</Badge>
          )}
        </div>
      </td>

      {/* Card Limit */}
      <td className="py-3 px-4">
        {isEditing ? (
          <div className="flex flex-col gap-1">
            <Input
              type="number"
              min={LIMIT_BOUNDS.MIN}
              max={LIMIT_BOUNDS.MAX}
              value={editValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={cn(
                "w-28 h-8 text-sm",
                error && "border-red-500 focus-visible:border-red-500"
              )}
              autoFocus
            />
            {error && (
              <span className="text-xs text-red-500">{error}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-sm">
            <CreditCard className="h-3.5 w-3.5 text-primary" />
            <span>{limit.toLocaleString()} cards</span>
          </div>
        )}
      </td>

      {/* Default Value */}
      <td className="py-3 px-4 text-sm text-muted-foreground">
        {defaultLimit.toLocaleString()}
      </td>

      {/* Actions */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleSave}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCancel}
                disabled={isUpdating}
              >
                <X className="h-3.5 w-3.5 text-red-500" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleEdit}
            >
              Edit
            </Button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}


/**
 * TierLimitsConfig - Main component
 * Requirements: 7.1, 7.2, 7.5
 */
export function TierLimitsConfig() {
  const { 
    limits, 
    defaults, 
    metadata,
    isLoading, 
    error,
    refresh
  } = useCardInputLimits();

  const [isUpdating, setIsUpdating] = useState({});
  const [isResetting, setIsResetting] = useState(false);
  const { success, error: showError } = useToast();
  const confirmation = useConfirmation();

  /**
   * Update a single tier limit
   * Requirements: 7.2, 7.3
   */
  const handleUpdateLimit = useCallback(async (tier, newLimit) => {
    setIsUpdating(prev => ({ ...prev, [tier]: true }));

    try {
      const response = await fetch(`${API_BASE}/admin/tier-limits/${tier}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ limit: newLimit })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update tier limit');
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        success(`Updated ${TIER_LABELS[tier]} limit to ${newLimit.toLocaleString()} cards`);
        // Refresh to get updated data (SSE will also update, but this ensures immediate sync)
        await refresh();
        return { success: true };
      }

      throw new Error(data.message || 'Failed to update tier limit');
    } catch (err) {
      showError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsUpdating(prev => ({ ...prev, [tier]: false }));
    }
  }, [success, showError, refresh]);

  /**
   * Handle update with confirmation
   * Requirements: 7.2
   */
  const handleUpdateWithConfirmation = useCallback(async (tier, newLimit) => {
    const currentLimit = limits[tier];
    
    // Show confirmation dialog
    const confirmed = await confirmation.confirm({
      title: 'Update Card Limit',
      description: `Change ${TIER_LABELS[tier]} tier limit from ${currentLimit.toLocaleString()} to ${newLimit.toLocaleString()} cards?`,
      content: (
        <div className="space-y-3 py-2">
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current limit:</span>
              <span className="font-medium">{currentLimit.toLocaleString()} cards</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">New limit:</span>
              <span className="font-medium text-primary">{newLimit.toLocaleString()} cards</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            This change will affect all {TIER_LABELS[tier]} tier users immediately.
          </p>
        </div>
      ),
      confirmText: 'Update Limit',
      cancelText: 'Cancel'
    });

    if (!confirmed) {
      return { success: false, cancelled: true };
    }

    return handleUpdateLimit(tier, newLimit);
  }, [limits, confirmation, handleUpdateLimit]);

  /**
   * Reset all limits to defaults
   * Requirements: 7.5
   */
  const handleResetToDefaults = useCallback(async () => {
    // Show confirmation dialog
    const confirmed = await confirmation.confirm({
      title: 'Reset All Tier Limits',
      description: 'Are you sure you want to reset all tier limits to their default values?',
      content: (
        <div className="space-y-3 py-2">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">
              This will reset:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {TIER_ORDER.map(tier => (
                <li key={tier}>
                  • {TIER_LABELS[tier]}: {limits[tier]?.toLocaleString()} → {defaults[tier]?.toLocaleString()} cards
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            All custom configurations will be replaced with default values.
          </p>
        </div>
      ),
      confirmText: 'Reset All',
      cancelText: 'Cancel',
      destructive: true
    });

    if (!confirmed) return;

    setIsResetting(true);

    try {
      const response = await fetch(`${API_BASE}/admin/tier-limits/reset`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reset tier limits');
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        success('All tier limits reset to defaults');
        await refresh();
      } else {
        throw new Error(data.message || 'Failed to reset tier limits');
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setIsResetting(false);
    }
  }, [limits, defaults, confirmation, success, showError, refresh]);

  // Check if any limits are custom
  const hasCustomLimits = TIER_ORDER.some(tier => metadata[tier]?.isCustom);

  // Loading state
  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading tier limits...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card variant="elevated">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Tier Card Limits
            </CardTitle>
            <CardDescription className="mt-1">
              Configure maximum card input limits per user tier
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refresh}
              disabled={isResetting}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {hasCustomLimits && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetToDefaults}
                disabled={isResetting}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                {isResetting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Reset All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Limits Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tier
                </th>
                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Card Limit
                </th>
                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Default
                </th>
                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {TIER_ORDER.map(tier => (
                <TierLimitRow
                  key={tier}
                  tier={tier}
                  limit={limits[tier] || defaults[tier]}
                  defaultLimit={defaults[tier]}
                  isCustom={metadata[tier]?.isCustom || false}
                  onUpdate={handleUpdateWithConfirmation}
                  isUpdating={isUpdating[tier] || false}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Help text */}
        <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
          <h4 className="text-sm font-medium mb-2">Configuration Guide</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <strong>Card Limit</strong>: Maximum number of cards a user can input per validation batch</li>
            <li>• Limits must be between {LIMIT_BOUNDS.MIN.toLocaleString()} and {LIMIT_BOUNDS.MAX.toLocaleString()} cards</li>
            <li>• Higher tiers should have higher limits to provide better value</li>
            <li>• Changes apply immediately to all users of that tier</li>
          </ul>
        </div>
      </CardContent>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmation.isOpen}
        onOpenChange={confirmation.setOpen}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        isLoading={confirmation.isLoading}
        {...confirmation.config}
      />
    </Card>
  );
}

export default TierLimitsConfig;
