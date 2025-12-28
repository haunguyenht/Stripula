import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Gift, Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRedeemKey } from '@/hooks/useRedeemKey';
import { useToast } from '@/hooks/useToast';
import { spring } from '@/lib/motion';

/**
 * RedeemKeyInput Component
 * Input field for redeeming keys with auto-formatting
 * 
 * Requirements: 5.1, 5.8
 * 
 * @param {Function} onSuccess - Callback when redemption succeeds (to refresh user data)
 */
export function RedeemKeyInput({ onSuccess }) {
  const [code, setCode] = useState('');
  const { redeemKey, isLoading, reset } = useRedeemKey();
  const { success, error } = useToast();

  /**
   * Format key code with dashes as user types
   * Format: XXXX-XXXX-XXXX-XXXX
   */
  const formatKeyCode = useCallback((value) => {
    // Remove all non-alphanumeric characters
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Split into groups of 4 and join with dashes
    const groups = [];
    for (let i = 0; i < cleaned.length && i < 16; i += 4) {
      groups.push(cleaned.slice(i, i + 4));
    }
    
    return groups.join('-');
  }, []);

  /**
   * Handle input change with auto-formatting
   */
  const handleChange = useCallback((e) => {
    const formatted = formatKeyCode(e.target.value);
    setCode(formatted);
    // Reset any previous error state when user starts typing
    reset();
  }, [formatKeyCode, reset]);

  /**
   * Handle key redemption
   */
  const handleRedeem = useCallback(async () => {
    if (!code || code.length < 19) {
      error('Please enter a complete key code');
      return;
    }

    const result = await redeemKey(code);

    if (result.success) {
      // Show success toast with details
      if (result.type === 'credits') {
        success(`+${result.creditsAdded} credits added! New balance: ${result.newBalance}`);
      } else {
        success(`Upgraded to ${result.newTier} tier!`);
      }
      
      // Clear input
      setCode('');
      
      // Trigger parent refresh
      if (onSuccess) {
        onSuccess(result);
      }
    } else {
      // Show error toast
      error(result.message || 'Failed to redeem key');
    }
  }, [code, redeemKey, success, error, onSuccess]);

  /**
   * Handle Enter key press
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !isLoading && code.length === 19) {
      handleRedeem();
    }
  }, [handleRedeem, isLoading, code.length]);

  // Check if code is complete (19 chars = 16 alphanumeric + 3 dashes)
  const isCodeComplete = code.length === 19;

  return (
    <Card variant="elevated" className="h-full">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            "flex items-center justify-center w-9 h-9 rounded-xl border",
            "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5",
            "dark:from-emerald-400/15 dark:to-emerald-500/10",
            "border-emerald-500/20 dark:border-emerald-400/20"
          )}>
            <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Redeem Key</h3>
            <p className="text-xs text-muted-foreground">Enter your key code</p>
          </div>
        </div>

        {/* Input and Button */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={code}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              maxLength={19}
              className={cn(
                "font-mono text-sm tracking-wider uppercase",
                "placeholder:tracking-normal placeholder:normal-case"
              )}
            />
            {/* Completion indicator */}
            {isCodeComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={spring.soft}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Check className="w-4 h-4 text-emerald-500" />
              </motion.div>
            )}
          </div>
          
          <Button
            onClick={handleRedeem}
            disabled={isLoading || !isCodeComplete}
            size="sm"
            className="shrink-0 px-4"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Redeem'
            )}
          </Button>
        </div>

        {/* Help text */}
        <p className="text-[10px] text-muted-foreground mt-2">
          Keys are 16 characters in XXXX-XXXX-XXXX-XXXX format
        </p>
      </CardContent>
    </Card>
  );
}

export default RedeemKeyInput;
