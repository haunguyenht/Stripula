import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Wrench,
  Loader2, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  Power,
  PowerOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useMaintenanceStatus } from '@/hooks/useMaintenanceStatus';
import { useConfirmation } from '@/hooks/useConfirmation';
import { useToast } from '@/hooks/useToast';

/**
 * MaintenanceControls Component
 * Admin panel component for managing system-wide maintenance mode
 * 
 * Requirements:
 * - 1.1: Enable maintenance mode via admin panel with broadcast to all clients
 * - 1.5: Disable maintenance mode and notify via Telegram
 */

const API_BASE = '/api';

/**
 * Format date for datetime-local input
 */
function formatDateTimeLocal(date) {
  if (!date) return '';
  const d = new Date(date);
  // Format: YYYY-MM-DDTHH:mm
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format relative time for display
 */
function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Format estimated end time for display
 */
function formatEstimatedEnd(timestamp) {
  if (!timestamp) return null;
  
  const date = new Date(timestamp);
  const now = new Date();
  
  if (date <= now) {
    return 'Overdue';
  }
  
  const diffMs = date - now;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) return `in ${diffMins}m`;
  if (diffHours < 24) return `in ${diffHours}h ${diffMins % 60}m`;
  return `in ${diffDays}d ${diffHours % 24}h`;
}

export function MaintenanceControls() {
  const { 
    isMaintenanceMode, 
    reason: currentReason, 
    estimatedEndTime: currentEndTime,
    enabledAt,
    isConnected,
    isLoading: statusLoading,
    refresh: refreshStatus
  } = useMaintenanceStatus();

  const { success, error: showError } = useToast();
  const confirmation = useConfirmation();

  // Form state
  const [reason, setReason] = useState('');
  const [estimatedEndTime, setEstimatedEndTime] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync form state with current maintenance state
  useEffect(() => {
    if (isMaintenanceMode) {
      setReason(currentReason || '');
      setEstimatedEndTime(currentEndTime ? formatDateTimeLocal(currentEndTime) : '');
    } else {
      setReason('');
      setEstimatedEndTime('');
    }
  }, [isMaintenanceMode, currentReason, currentEndTime]);

  /**
   * Enable maintenance mode
   * Requirement: 1.1 - Enable maintenance mode via admin panel
   */
  const handleEnableMaintenance = useCallback(async () => {
    const confirmed = await confirmation.confirm({
      title: 'Enable Maintenance Mode',
      description: 'This will prevent all non-admin users from accessing the application. Are you sure you want to enable maintenance mode?',
      confirmText: 'Enable Maintenance',
      cancelText: 'Cancel',
      destructive: true
    });

    if (!confirmed) return;

    setIsUpdating(true);

    try {
      const body = {};
      if (reason.trim()) {
        body.reason = reason.trim();
      }
      if (estimatedEndTime) {
        body.estimatedEndTime = new Date(estimatedEndTime).toISOString();
      }

      const response = await fetch(`${API_BASE}/admin/maintenance/enable`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to enable maintenance mode');
      }

      if (data.status === 'OK') {
        success('Maintenance mode enabled');
        await refreshStatus();
      } else {
        throw new Error(data.message || 'Failed to enable maintenance mode');
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setIsUpdating(false);
    }
  }, [reason, estimatedEndTime, confirmation, success, showError, refreshStatus]);

  /**
   * Disable maintenance mode
   * Requirement: 1.5 - Disable maintenance mode and notify via Telegram
   */
  const handleDisableMaintenance = useCallback(async () => {
    const confirmed = await confirmation.confirm({
      title: 'Disable Maintenance Mode',
      description: 'This will restore normal access for all users. Are you sure you want to disable maintenance mode?',
      confirmText: 'Disable Maintenance',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    setIsUpdating(true);

    try {
      const response = await fetch(`${API_BASE}/admin/maintenance/disable`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to disable maintenance mode');
      }

      if (data.status === 'OK') {
        success('Maintenance mode disabled');
        setReason('');
        setEstimatedEndTime('');
        await refreshStatus();
      } else {
        throw new Error(data.message || 'Failed to disable maintenance mode');
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setIsUpdating(false);
    }
  }, [confirmation, success, showError, refreshStatus]);

  /**
   * Handle toggle switch change
   */
  const handleToggle = useCallback((checked) => {
    if (checked) {
      handleEnableMaintenance();
    } else {
      handleDisableMaintenance();
    }
  }, [handleEnableMaintenance, handleDisableMaintenance]);

  // Get minimum datetime for the picker (now + 5 minutes)
  const minDateTime = formatDateTimeLocal(new Date(Date.now() + 5 * 60 * 1000));

  return (
    <>
      <div className={cn(
        "rounded-2xl overflow-hidden",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10",
        "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
      )}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-[rgb(237,234,233)] dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center",
              isMaintenanceMode 
                ? "bg-amber-500/10 dark:bg-amber-500/20" 
                : "bg-primary/10 dark:bg-primary/20"
            )}>
              <Wrench className={cn(
                "h-4 w-4",
                isMaintenanceMode 
                  ? "text-amber-500" 
                  : "text-primary"
              )} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Maintenance Mode</h3>
              <p className="text-[10px] text-muted-foreground">System-wide access control</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Connection status indicator */}
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px]",
              isConnected 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            )}>
              <span className={cn(
                "h-1.5 w-1.5 rounded-full",
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              )} />
              {isConnected ? 'Live' : 'Disconnected'}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={refreshStatus}
              disabled={statusLoading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", statusLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Current Status Display */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-4 rounded-xl border",
              isMaintenanceMode 
                ? "bg-amber-500/5 border-amber-500/20 dark:bg-amber-500/10 dark:border-amber-500/30" 
                : "bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-500/10 dark:border-emerald-500/30"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  isMaintenanceMode 
                    ? "bg-amber-500/10 dark:bg-amber-500/20" 
                    : "bg-emerald-500/10 dark:bg-emerald-500/20"
                )}>
                  {isMaintenanceMode ? (
                    <PowerOff className="h-5 w-5 text-amber-500" />
                  ) : (
                    <Power className="h-5 w-5 text-emerald-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-semibold",
                      isMaintenanceMode ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {isMaintenanceMode ? 'Maintenance Active' : 'System Online'}
                    </span>
                    <Badge 
                      variant={isMaintenanceMode ? "warning" : "success"}
                      className="text-[10px] h-5"
                    >
                      {isMaintenanceMode ? 'OFFLINE' : 'ONLINE'}
                    </Badge>
                  </div>
                  {isMaintenanceMode && enabledAt && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Started {formatRelativeTime(enabledAt)}
                    </p>
                  )}
                  {!isMaintenanceMode && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      All users can access the application
                    </p>
                  )}
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center gap-2">
                <Label htmlFor="maintenance-toggle" className="text-xs text-muted-foreground">
                  {isMaintenanceMode ? 'Enabled' : 'Disabled'}
                </Label>
                <Switch
                  id="maintenance-toggle"
                  checked={isMaintenanceMode}
                  onCheckedChange={handleToggle}
                  disabled={isUpdating}
                  className={cn(
                    isMaintenanceMode && "data-[state=checked]:bg-amber-500"
                  )}
                />
              </div>
            </div>

            {/* Current maintenance details */}
            {isMaintenanceMode && (currentReason || currentEndTime) && (
              <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-2">
                {currentReason && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">{currentReason}</p>
                  </div>
                )}
                {currentEndTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Expected to end {formatEstimatedEnd(currentEndTime)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Configuration Form (only show when not in maintenance mode) */}
          {!isMaintenanceMode && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Maintenance Configuration
              </div>

              {/* Reason Input */}
              <div className="space-y-2">
                <Label htmlFor="maintenance-reason" className="text-xs font-medium">
                  Reason (optional)
                </Label>
                <Textarea
                  id="maintenance-reason"
                  placeholder="e.g., Scheduled maintenance, System upgrade, Database migration..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[80px] text-sm resize-none"
                  maxLength={500}
                />
                <p className="text-[10px] text-muted-foreground">
                  This message will be displayed to users on the maintenance page
                </p>
              </div>

              {/* Estimated End Time */}
              <div className="space-y-2">
                <Label htmlFor="maintenance-end-time" className="text-xs font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Estimated End Time (optional)
                </Label>
                <Input
                  id="maintenance-end-time"
                  type="datetime-local"
                  value={estimatedEndTime}
                  onChange={(e) => setEstimatedEndTime(e.target.value)}
                  min={minDateTime}
                  className="text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  Users will see a countdown to this time on the maintenance page
                </p>
              </div>

              {/* Enable Button */}
              <Button
                onClick={handleEnableMaintenance}
                disabled={isUpdating}
                className={cn(
                  "w-full h-10 rounded-xl",
                  "bg-amber-500 hover:bg-amber-600 text-white"
                )}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Wrench className="h-4 w-4 mr-2" />
                )}
                Enable Maintenance Mode
              </Button>
            </motion.div>
          )}

          {/* Disable Button (only show when in maintenance mode) */}
          {isMaintenanceMode && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Button
                onClick={handleDisableMaintenance}
                disabled={isUpdating}
                variant="outline"
                className={cn(
                  "w-full h-10 rounded-xl",
                  "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10",
                  "dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                )}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Disable Maintenance Mode
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
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

export default MaintenanceControls;
