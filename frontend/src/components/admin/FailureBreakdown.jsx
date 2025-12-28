import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  WifiOff, 
  Server, 
  Clock, 
  Globe,
  AlertTriangle
} from 'lucide-react';

/**
 * FailureBreakdown Component
 * Display failure counts by category for a gateway
 * 
 * Requirement 6.6: Display failure breakdown by category
 * - Show proxy_error, gateway_error, timeout, network_error
 */

const FAILURE_CATEGORIES = [
  {
    key: 'proxy_error',
    label: 'Proxy Errors',
    icon: WifiOff,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    description: 'Proxy connection or authentication failures'
  },
  {
    key: 'gateway_error',
    label: 'Gateway Errors',
    icon: Server,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    description: 'HTTP 5xx errors from the gateway'
  },
  {
    key: 'timeout',
    label: 'Timeouts',
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    description: 'Request timeout errors'
  },
  {
    key: 'network_error',
    label: 'Network Errors',
    icon: Globe,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    description: 'DNS, connection refused, or other network issues'
  }
];

export function FailureBreakdown({ 
  failuresByCategory = {},
  totalFailures = 0,
  showEmpty = false,
  compact = false,
  className 
}) {
  // Calculate total from categories if not provided
  const calculatedTotal = useMemo(() => {
    if (totalFailures > 0) return totalFailures;
    return Object.values(failuresByCategory).reduce((sum, count) => sum + (count || 0), 0);
  }, [failuresByCategory, totalFailures]);

  // Check if there are any failures
  const hasFailures = calculatedTotal > 0;

  // Don't render if no failures and showEmpty is false
  if (!hasFailures && !showEmpty) {
    return null;
  }

  // Compact view - single row with counts
  if (compact) {
    return (
      <div className={cn("flex items-center gap-3 flex-wrap", className)}>
        {FAILURE_CATEGORIES.map((category) => {
          const count = failuresByCategory[category.key] || 0;
          if (count === 0 && !showEmpty) return null;
          
          const Icon = category.icon;
          return (
            <div 
              key={category.key}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                count > 0 ? category.color : "text-muted-foreground"
              )}
              title={category.description}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{count}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Full view - grid with labels
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          Failure Breakdown
        </h4>
        {hasFailures && (
          <span className="text-xs text-muted-foreground">
            Total: {calculatedTotal}
          </span>
        )}
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 gap-2">
        {FAILURE_CATEGORIES.map((category) => {
          const count = failuresByCategory[category.key] || 0;
          const Icon = category.icon;
          const percentage = calculatedTotal > 0 
            ? Math.round((count / calculatedTotal) * 100) 
            : 0;

          return (
            <div
              key={category.key}
              className={cn(
                "p-2.5 rounded-lg border transition-colors",
                count > 0 
                  ? cn(category.bgColor, category.borderColor)
                  : "bg-muted/30 border-border/50"
              )}
              title={category.description}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn(
                  "h-4 w-4",
                  count > 0 ? category.color : "text-muted-foreground"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-medium truncate",
                      count > 0 ? category.color : "text-muted-foreground"
                    )}>
                      {category.label}
                    </span>
                    <span className={cn(
                      "text-sm font-semibold ml-2",
                      count > 0 ? category.color : "text-muted-foreground"
                    )}>
                      {count}
                    </span>
                  </div>
                  {count > 0 && calculatedTotal > 0 && (
                    <div className="mt-1">
                      <div className="h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            category.key === 'proxy_error' && "bg-purple-500",
                            category.key === 'gateway_error' && "bg-red-500",
                            category.key === 'timeout' && "bg-amber-500",
                            category.key === 'network_error' && "bg-blue-500"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {percentage}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No failures message */}
      {!hasFailures && showEmpty && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No failures recorded
        </p>
      )}
    </div>
  );
}

export default FailureBreakdown;
