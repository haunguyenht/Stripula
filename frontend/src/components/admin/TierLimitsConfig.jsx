import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  Loader2, 
  RefreshCw,
  Check,
  AlertCircle,
  RotateCcw,
  Shield,
  Award,
  Crown,
  Gem,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useCardInputLimits } from '@/hooks/useCardInputLimits';
import { useConfirmation } from '@/hooks/useConfirmation';
import { useToast } from '@/hooks/useToast';

const API_BASE = '/api';

const TIER_CONFIG = {
  free: { icon: User, color: 'text-slate-500', bg: 'bg-slate-500/10', label: 'Free' },
  bronze: { icon: Shield, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Bronze' },
  silver: { icon: Award, color: 'text-slate-400', bg: 'bg-slate-400/10', label: 'Silver' },
  gold: { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Gold' },
  diamond: { icon: Gem, color: 'text-cyan-500', bg: 'bg-cyan-500/10', label: 'Diamond' }
};

const TIER_ORDER = ['free', 'bronze', 'silver', 'gold', 'diamond'];

const LIMIT_BOUNDS = { MIN: 100, MAX: 10000 };

function validateLimit(value) {
  const limit = parseInt(value, 10);
  if (isNaN(limit) || limit < LIMIT_BOUNDS.MIN || limit > LIMIT_BOUNDS.MAX) {
    return { valid: false, error: `Must be ${LIMIT_BOUNDS.MIN}-${LIMIT_BOUNDS.MAX}` };
  }
  return { valid: true, error: null };
}

function TierLimitRow({ tier, limit, isCustom, onUpdate, isUpdating, index }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(limit);
  const { success, error: showError } = useToast();

  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.free;
  const TierIcon = tierConfig.icon;

  useEffect(() => {
    if (!isEditing) setEditValue(limit);
  }, [limit, isEditing]);

  const handleSave = useCallback(async () => {
    const validation = validateLimit(editValue);
    if (!validation.valid) {
      showError(validation.error);
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
      success(`Updated ${tierConfig.label}`);
    } else if (!result.cancelled) {
      showError(result.error);
    }
  }, [tier, editValue, limit, onUpdate, success, showError, tierConfig.label]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "group flex items-center gap-3 px-3 py-2 rounded-xl transition-all",
        "hover:bg-[rgb(250,247,245)] dark:hover:bg-white/[0.03]",
        isEditing && "bg-[rgb(250,247,245)] dark:bg-white/[0.03]"
      )}
    >
      <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", tierConfig.bg)}>
        <TierIcon className={cn("h-3.5 w-3.5", tierConfig.color)} />
      </div>
      
      <span className={cn("w-16 text-xs font-medium shrink-0", tierConfig.color)}>
        {tierConfig.label}
      </span>

      {isEditing ? (
        <>
          <div className="flex items-center gap-1.5 flex-1">
            <CreditCard className="h-3 w-3 text-primary shrink-0" />
            <Input
              type="number"
              min={LIMIT_BOUNDS.MIN}
              max={LIMIT_BOUNDS.MAX}
              step="100"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-7 w-24 text-xs rounded-md px-2"
            />
            <span className="text-[10px] text-muted-foreground">cards</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-emerald-500" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditing(false)}>
              <span className="text-xs text-muted-foreground">✕</span>
            </Button>
          </div>
        </>
      ) : (
        <>
          <button
            onClick={() => { setEditValue(limit); setIsEditing(true); }}
            className="flex items-center gap-2 flex-1 text-left hover:opacity-70 transition-opacity"
          >
            <CreditCard className="h-3 w-3 text-primary" />
            <span className="text-sm font-semibold text-foreground">{limit.toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground">cards</span>
          </button>
          {isCustom && (
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 shrink-0">Custom</Badge>
          )}
        </>
      )}
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

  if (isLoading) {
    return (
      <div className={cn(
        "rounded-2xl p-8 flex items-center justify-center",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10"
      )}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "rounded-2xl p-6 text-center",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10"
      )}>
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={refresh} className="rounded-lg">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "rounded-2xl overflow-hidden",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10",
        "dark:backdrop-blur-sm"
      )}>
        <div className="px-4 py-3 border-b border-[rgb(237,234,233)] dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Card Limits</h3>
              <p className="text-[10px] text-muted-foreground">Max cards per tier</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refresh} disabled={isResetting}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            {hasCustomLimits && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={handleResetToDefaults}
                disabled={isResetting}
              >
                {isResetting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
              </Button>
            )}
          </div>
        </div>

        <div className="p-3 space-y-1">
          {TIER_ORDER.map((tier, index) => (
            <TierLimitRow
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
