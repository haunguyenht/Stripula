import { cn } from '@/lib/utils';
import { Zap, Timer } from 'lucide-react';

/**
 * GatewayInfoSummary - Shows gateway speed info below the selector
 * Pricing info is shown in CreditInfo component to avoid duplication
 * 
 * @param {Object} speedConfig - Speed configuration { concurrency, delay }
 */
export function GatewayInfoSummary({
  speedConfig,
  className
}) {
  const concurrency = speedConfig?.concurrency || 1;
  const delay = speedConfig?.delay || 2000;

  return (
    <div className={cn(
      "flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground",
      className
    )}>
      {/* Speed info */}
      <div className="flex items-center gap-1.5">
        <Zap className="w-3 h-3 text-amber-500" />
        <span>{concurrency} parallel</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Timer className="w-3 h-3 text-sky-500" />
        <span>{delay >= 1000 ? `${(delay / 1000).toFixed(1)}s` : `${delay}ms`} delay</span>
      </div>
    </div>
  );
}

export default GatewayInfoSummary;
