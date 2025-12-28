import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  XCircle,
  Clock
} from 'lucide-react';

/**
 * ProxyTestButton Component
 * Button to test proxy connection with loading state and result display
 * 
 * Requirements: 5.1, 5.2, 5.3
 * - Test button with loading state
 * - Display success message with latency
 * - Display error message on failure
 */

export function ProxyTestButton({ 
  onTest,
  disabled = false,
  className 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  /**
   * Handle test button click
   * Requirement 5.1: Test proxy connection
   */
  const handleTest = useCallback(async () => {
    if (!onTest || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const testResult = await onTest();
      setResult(testResult);
    } catch (error) {
      setResult({
        success: false,
        error: error.message || 'Test failed'
      });
    } finally {
      setIsLoading(false);
    }
  }, [onTest, isLoading]);

  /**
   * Clear result
   */
  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Test Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleTest}
        disabled={disabled || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Testing Connection...
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4 mr-2" />
            Test Proxy Connection
          </>
        )}
      </Button>

      {/* Result Display */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {result.success ? (
              /* Requirement 5.2: Success message with latency */
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-lg",
                "bg-emerald-500/10 border border-emerald-500/20",
                "text-emerald-600 dark:text-emerald-400"
              )}>
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Connection successful</p>
                  {result.latencyMs !== undefined && (
                    <p className="text-xs opacity-80 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      Latency: {result.latencyMs}ms
                    </p>
                  )}
                </div>
                <button
                  onClick={clearResult}
                  className="text-emerald-600/60 hover:text-emerald-600 dark:text-emerald-400/60 dark:hover:text-emerald-400"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            ) : (
              /* Requirement 5.3: Error message on failure */
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-lg",
                "bg-red-500/10 border border-red-500/20",
                "text-red-600 dark:text-red-400"
              )}>
                <WifiOff className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Connection failed</p>
                  {result.error && (
                    <p className="text-xs opacity-80 mt-0.5 truncate">
                      {result.error}
                    </p>
                  )}
                </div>
                <button
                  onClick={clearResult}
                  className="text-red-600/60 hover:text-red-600 dark:text-red-400/60 dark:hover:text-red-400"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProxyTestButton;
