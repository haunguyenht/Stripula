import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  Loader2, 
  RefreshCw,
  Check,
  X,
  AlertCircle,
  RotateCcw,
  Shield,
  Award,
  Crown,
  Gem,
  User,
  Edit2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useCardInputLimits } from '@/hooks/useCardInputLimits';
import { useConfirmation } from '@/hooks/useConfirmation';
import { useToast } from '@/hooks/useToast';
import { spring } from '@/lib/motion';

/**
 * TierLimitsConfig Component
 * Admin panel for configuring card input limits per tier
 * Redesigned with tier cards and slider inputs
 * 
 * Requirements: 7.1, 7.2, 7.5
 */

const API_BASE = '/api';

const TIER_CONFIG = {
  free: { icon: User, color: 'slate', label: 'Free', gradient: 'from-slate-500 to-slate-600' },
  bronze: { icon: Shield, color: 'amber', label: 'Bronze', gradient: 'from-amber-500 to-amber-600' },
  silver: { icon: Award, color: 'slate', label: 'Silver', gradient: 'from-slate-400 to-slate-500' },
  gold: { icon: Crown, color: 'yellow', label: 'Gold', gradient: 'from-yellow-500 to-amber-500' },
  diamond: { icon: Gem, color: 'cyan', label: 'Diamond', gradient: 'from-cyan-400 to-blue-500' }
};

const TIER_ORDER = ['free', 'bronze', 'silver', 'gold', 'diamond'];

// Validation bounds
const LIMIT_BOUNDS = {
  MIN: 100,
  MAX: 10000
};

/**
 * Validate a limit value
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
 * TierLimitCard - Card-based display for a tier's limit
 */
function TierLimitCard({ tier, limit, defaultLimit, isCustom, onUpdate, isUpdating, index }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(limit);
  const [sliderValue, setSliderValue] = useState(limit);
  const [error, setError] = useState(null);

  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.free;
  const TierIcon = tierConfig.icon;

  // Sync edit value when limit changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(limit);
      setSliderValue(limit);
    }
  }, [limit, isEditing]);

  const handleEdit = useCallback(() => {
    setEditValue(limit);
    setSliderValue(limit);
    setError(null);
    setIsEditing(true);
  }, [limit]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(limit);
    setSliderValue(limit);
    setError(null);
  }, [limit]);

  const handleSave = useCallback(async () => {
    const validation = validateLimit(editValue);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    const newLimit = parseInt(editValue, 10);
    
    if (newLimit === limit) {
      setIsEditing(false);
      return;
    }

    const result = await onUpdate(tier, newLimit);

    if (result.success) {
      setIsEditing(false);
      setError(null);
    } else if (!result.cancelled) {
      setError(result.error);
    }
  }, [tier, editValue, limit, onUpdate]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setEditValue(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= LIMIT_BOUNDS.MIN && numValue <= LIMIT_BOUNDS.MAX) {
      setSliderValue(numValue);
    }
    if (error) {
      const validation = validateLimit(value);
      setError(validation.error);
    }
  }, [error]);

  const handleSliderChange = useCallback((values) => {
    const value = values[0];
    setSliderValue(value);
    setEditValue(value.toString());
    setError(null);
  }, []);

  // Calculate progress percentage for visual indicator
  const progressPercent = ((limit - LIMIT_BOUNDS.MIN) / (LIMIT_BOUNDS.MAX - LIMIT_BOUNDS.MIN)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, ...spring.soft }}
      className={cn(
        "group relative rounded-xl overflow-hidden transition-all duration-200",
        "bg-white dark:bg-white/[0.02]",
        "border border-[rgb(237,234,233)] dark:border-white/5",
        "hover:border-[rgb(255,64,23)]/20 dark:hover:border-white/10",
        "hover:shadow-sm dark:hover:bg-white/[0.04]"
      )}
    >
      {/* Tier Header */}
      <div className={cn(
        "px-4 py-3 flex items-center justify-between",
        "border-b border-[rgb(237,234,233)] dark:border-white/5",
        "bg-gradient-to-r",
        `${tierConfig.gradient}/5`
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center",
            `bg-${tierConfig.color}-500/10`
          )}>
            <TierIcon className={cn("h-4.5 w-4.5", `text-${tierConfig.color}-500`)} />
          </div>
          <div>
            <h4 className="font-semibold text-[rgb(37,27,24)] dark:text-white text-sm">
              {tierConfig.label}
            </h4>
            {/* Progress Bar */}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-20 h-1.5 bg-[rgb(250,247,245)] dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r",
                    tierConfig.gradient
                  )}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {Math.round(progressPercent)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCustom && (
            <Badge variant="secondary" className="text-[10px] h-5">Custom</Badge>
          )}
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleEdit}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Card Limit</span>
                  <span className="text-xs text-muted-foreground">
                    Default: {defaultLimit.toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={[sliderValue]}
                  onValueChange={handleSliderChange}
                  min={LIMIT_BOUNDS.MIN}
                  max={LIMIT_BOUNDS.MAX}
                  step={100}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{LIMIT_BOUNDS.MIN.toLocaleString()}</span>
                  <span>{LIMIT_BOUNDS.MAX.toLocaleString()}</span>
                </div>
              </div>

              {/* Input */}
              <div className="space-y-2">
                <Input
                  type="number"
                  min={LIMIT_BOUNDS.MIN}
                  max={LIMIT_BOUNDS.MAX}
                  value={editValue}
                  onChange={handleInputChange}
                  className={cn(
                    "h-9 rounded-lg text-center",
                    error && "border-red-500 focus-visible:border-red-500"
                  )}
                />
                {error && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isUpdating}
                  className="flex-1 h-8 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="flex-1 h-8 rounded-lg"
                >
                  {isUpdating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={cn(
                "p-4 rounded-lg text-center",
                "bg-[rgb(250,247,245)] dark:bg-white/5",
                "border border-[rgb(237,234,233)] dark:border-white/10"
              )}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Max Cards</span>
                </div>
                <p className="text-2xl font-bold text-[rgb(37,27,24)] dark:text-white">
                  {limit.toLocaleString()}
                </p>
                {isCustom && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Default: {defaultLimit.toLocaleString()}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

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
        success(`Updated ${TIER_CONFIG[tier]?.label || tier} limit to ${newLimit.toLocaleString()} cards`);
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
   */
  const handleUpdateWithConfirmation = useCallback(async (tier, newLimit) => {
    const currentLimit = limits[tier];
    
    const confirmed = await confirmation.confirm({
      title: 'Update Card Limit',
      description: `Change ${TIER_CONFIG[tier]?.label || tier} tier limit from ${currentLimit.toLocaleString()} to ${newLimit.toLocaleString()} cards?`,
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
   */
  const handleResetToDefaults = useCallback(async () => {
    const confirmed = await confirmation.confirm({
      title: 'Reset All Tier Limits',
      description: 'Are you sure you want to reset all tier limits to their default values?',
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
  }, [confirmation, success, showError, refresh]);

  // Check if any limits are custom
  const hasCustomLimits = TIER_ORDER.some(tier => metadata[tier]?.isCustom);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn(
        "rounded-2xl overflow-hidden",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10",
        "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
      )}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading tier limits...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn(
        "rounded-2xl overflow-hidden",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10",
        "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
      )}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={refresh} className="rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "rounded-2xl overflow-hidden",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10",
        "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
      )}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-[rgb(237,234,233)] dark:border-white/10 bg-gradient-to-br from-[rgb(250,247,245)] to-transparent dark:from-white/[0.02] dark:to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(37,27,24)] dark:text-white">
                  Tier Card Limits
                </h2>
                <p className="text-xs text-muted-foreground">Configure maximum card input limits per tier</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refresh}
                disabled={isResetting}
                className="rounded-xl"
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
                  className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-500/20"
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
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tier Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {TIER_ORDER.map((tier, index) => (
              <TierLimitCard
                key={tier}
                tier={tier}
                limit={limits[tier] || defaults[tier]}
                defaultLimit={defaults[tier]}
                isCustom={metadata[tier]?.isCustom || false}
                onUpdate={handleUpdateWithConfirmation}
                isUpdating={isUpdating[tier] || false}
                index={index}
              />
            ))}
          </div>

          {/* Help Info */}
          <div className={cn(
            "mt-6 p-4 rounded-xl",
            "bg-[rgb(250,247,245)] dark:bg-white/5",
            "border border-[rgb(237,234,233)] dark:border-white/10"
          )}>
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-[rgb(37,27,24)] dark:text-white mb-2">
                  Configuration Guide
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• <strong>Card Limit</strong>: Maximum number of cards a user can input per validation batch</li>
                  <li>• Limits must be between {LIMIT_BOUNDS.MIN.toLocaleString()} and {LIMIT_BOUNDS.MAX.toLocaleString()} cards</li>
                  <li>• Higher tiers should have higher limits to provide better value</li>
                  <li>• Changes apply immediately to all users of that tier</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        open={confirmation.isOpen}
        onOpenChange={confirmation.setOpen}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        isLoading={confirmation.isLoading}
        {...confirmation.config}
      />
    </>
  );
}

export default TierLimitsConfig;
