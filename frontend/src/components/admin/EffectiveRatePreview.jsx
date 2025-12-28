import { useMemo } from 'react';
import { cn } from '@/lib/utils';

/**
 * PricingPreview Component
 * 
 * Displays credit pricing for gateway: Approved, Live, Dead/Error costs.
 * Pricing is the same for all tiers (no tier discounts).
 * 
 * @param {Object} props
 * @param {Object} props.pricing - Pricing config { approved: {min,max}, live: {min,max} }
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.compact - Use compact layout
 */
export function EffectiveRatePreview({ 
  pricing,
  className,
  compact = false 
}) {
  // Default pricing if not provided
  const pricingConfig = useMemo(() => {
    return pricing || {
      approved: { min: 3, max: 5 },
      live: { min: 1, max: 3 }
    };
  }, [pricing]);

  const pricingItems = useMemo(() => [
    {
      key: 'approved',
      label: 'Approved',
      description: 'Charged cards with successful transaction',
      min: pricingConfig.approved?.min || 3,
      max: pricingConfig.approved?.max || 5,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    {
      key: 'live',
      label: 'Live cards',
      description: 'Valid cards (auth only, no charge)',
      min: pricingConfig.live?.min || 1,
      max: pricingConfig.live?.max || 3,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      key: 'dead',
      label: 'Dead/Errors',
      description: 'Declined, expired, or error cards',
      min: 0,
      max: 0,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/30'
    }
  ], [pricingConfig]);

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-3", className)}>
        {pricingItems.map(({ key, label, min, max, color }) => (
          <div 
            key={key}
            className="flex items-center gap-1.5 text-xs"
          >
            <span className={cn("font-medium", color)}>{label}:</span>
            <span className="text-foreground font-mono">
              {min === 0 && max === 0 ? 'Free' : `-${min}/${max}`}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h5 className="text-xs font-medium text-muted-foreground">
        Credit Pricing
      </h5>
      <div className="grid grid-cols-3 gap-2">
        {pricingItems.map(({ key, label, description, min, max, color, bgColor }) => (
          <div 
            key={key}
            className={cn(
              "p-3 rounded-lg text-center border border-border/50",
              bgColor
            )}
          >
            {/* Label */}
            <div className={cn("text-xs font-medium mb-1", color)}>
              {label}
            </div>
            {/* Cost */}
            <div className="text-lg font-semibold text-foreground font-mono">
              {min === 0 && max === 0 ? (
                <span className="text-muted-foreground">Free</span>
              ) : (
                <span>-{min}/{max}</span>
              )}
            </div>
            {/* Description */}
            <div className="text-[10px] text-muted-foreground mt-1">
              {description}
            </div>
          </div>
        ))}
      </div>
      {/* Note */}
      <p className="text-[10px] text-muted-foreground">
        Same pricing for all user tiers. Credits randomly selected within range.
      </p>
    </div>
  );
}

export default EffectiveRatePreview;
