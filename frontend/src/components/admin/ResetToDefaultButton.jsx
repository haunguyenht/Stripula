import { useState, useCallback } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

/**
 * ResetToDefaultButton Component
 * 
 * Button to reset credit rate to default value.
 * Only shows when rate is custom (different from default).
 * Triggers confirmation dialog before reset.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 * 
 * @param {Object} props
 * @param {string} props.gatewayName - Gateway display name for dialog
 * @param {number} props.currentRate - Current custom rate
 * @param {number} props.defaultRate - Default rate to reset to
 * @param {boolean} props.isCustom - Whether rate is custom (controls visibility)
 * @param {Function} props.onReset - Callback when reset is confirmed: () => Promise<void>
 * @param {boolean} props.isLoading - Loading state for reset operation
 * @param {boolean} props.disabled - Disable the button
 */
export function ResetToDefaultButton({
  gatewayName,
  currentRate,
  defaultRate,
  isCustom,
  onReset,
  isLoading = false,
  disabled = false
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Handle reset confirmation - Requirement 4.4
  const handleConfirmReset = useCallback(async () => {
    setIsResetting(true);
    try {
      await onReset();
      setShowDialog(false);
    } finally {
      setIsResetting(false);
    }
  }, [onReset]);

  // Handle cancel - Requirement 4.5
  const handleCancel = useCallback(() => {
    if (!isResetting) {
      setShowDialog(false);
    }
  }, [isResetting]);

  // Only show when rate is custom - Requirement 4.1
  if (!isCustom) {
    return null;
  }

  return (
    <>
      {/* Reset button - Requirement 4.1 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        disabled={isLoading || disabled || isResetting}
        className="text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
      >
        {(isLoading || isResetting) ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <RotateCcw className="h-4 w-4 mr-1" />
        )}
        Reset to Default
      </Button>

      {/* Confirmation dialog - Requirements 4.2, 4.3 */}
      <ConfirmationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Reset Credit Rate"
        description={`Reset the credit rate for ${gatewayName || 'this gateway'} to its default value?`}
        confirmText="Reset"
        cancelText="Cancel"
        onConfirm={handleConfirmReset}
        onCancel={handleCancel}
        isLoading={isResetting}
      >
        {/* Show current and default rates in dialog - Requirement 4.3 */}
        <div className="space-y-3 py-2">
          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Current Rate</span>
            <span className="text-sm font-semibold text-foreground">
              {currentRate?.toFixed(2) ?? '—'}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-sm text-emerald-600 dark:text-emerald-400">Default Rate</span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {defaultRate?.toFixed(2) ?? '—'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            This will reset the credit rate to the default value for this gateway type.
          </p>
        </div>
      </ConfirmationDialog>
    </>
  );
}

export default ResetToDefaultButton;
