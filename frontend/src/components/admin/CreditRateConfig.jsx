import { useState, useEffect, useCallback } from 'react';
import { Loader2, Save, DollarSign, Check, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

/**
 * Credit rate validation constants
 * Requirements: 2.2, 2.3
 */
const CREDIT_RATE_LIMITS = {
  MIN: 0.1,
  MAX: 100.0
};

/**
 * Validate credit rate value
 * @param {string|number} value - Rate value to validate
 * @returns {{ isValid: boolean, error: string | null }}
 */
function validateCreditRate(value) {
  if (value === '' || value === null || value === undefined) {
    return { isValid: false, error: 'Credit rate is required' };
  }

  const rate = parseFloat(value);
  
  if (isNaN(rate)) {
    return { isValid: false, error: 'Credit rate must be a valid number' };
  }

  if (rate < CREDIT_RATE_LIMITS.MIN || rate > CREDIT_RATE_LIMITS.MAX) {
    return { 
      isValid: false, 
      error: `Credit rate must be between ${CREDIT_RATE_LIMITS.MIN} and ${CREDIT_RATE_LIMITS.MAX}` 
    };
  }

  return { isValid: true, error: null };
}

/**
 * Get gateway subType from gateway ID
 * @param {string} gatewayId - Gateway ID (e.g., 'auth-1', 'charge-2', 'shopify-05')
 * @returns {'auth'|'charge'|'skbased'|'shopify'} Gateway subType
 */
function getGatewaySubType(gatewayId) {
  if (!gatewayId) return 'auth';
  if (gatewayId.startsWith('auth-')) return 'auth';
  if (gatewayId.startsWith('charge-')) return 'charge';
  if (gatewayId.startsWith('sk-') || gatewayId.startsWith('skbased-')) return 'skbased';
  if (gatewayId.startsWith('shopify-')) return 'shopify';
  return 'auth'; // Default to auth
}

/**
 * Get pricing field configuration based on gateway subType
 * - Auth: only APPROVED (auth validates cards = approved or declined)
 * - Shopify: only APPROVED (shopify validates cards = approved or declined)
 * - Charge: both APPROVED (charge success) and LIVE (card live but charge failed)
 * - SKbased: both CHARGED and LIVE (SK-based can result in charged or live status)
 * 
 * @param {'auth'|'charge'|'skbased'|'shopify'} subType - Gateway subType
 * @returns {{ showApproved: boolean, showLive: boolean, approvedLabel: string }}
 */
function getPricingConfig(subType) {
  switch (subType) {
    case 'charge':
      return { showApproved: true, showLive: true, approvedLabel: 'APPROVED' };
    case 'skbased':
      return { showApproved: true, showLive: true, approvedLabel: 'CHARGED' };
    case 'auth':
      return { showApproved: true, showLive: false, approvedLabel: 'APPROVED' };
    case 'shopify':
      return { showApproved: true, showLive: false, approvedLabel: 'APPROVED' };
    default:
      return { showApproved: true, showLive: false, approvedLabel: 'APPROVED' };
  }
}

/**
 * CreditRateConfig Component
 * 
 * Credit rate configuration section for gateway row.
 * Shows pricing fields based on gateway type:
 * - Auth/Shopify gateways: Only LIVE rate (validates without charging)
 * - Charge gateways: Both APPROVED and LIVE rates
 * - SKbased gateways: Both CHARGED and LIVE rates
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 * 
 * @param {Object} props
 * @param {Object} props.gateway - Gateway object with id, label, type
 * @param {Object} props.pricing - Current pricing { approved: number, live: number }
 * @param {Object} props.defaultPricing - Default pricing { approved: 5, live: 3 }
 * @param {string} props.billingType - 'approved' for charge gateways, 'live' for auth gateways
 * @param {boolean} props.isCustom - Whether rate is custom (different from default)
 * @param {Function} props.onSave - Callback when save is clicked: (pricing: { approved, live }) => Promise<void>
 * @param {boolean} props.isLoading - Loading state for save operation
 * @param {boolean} props.disabled - Disable all inputs
 */
export function CreditRateConfig({ 
  gateway,
  pricing,
  defaultPricing = { approved: 5, live: 3 },
  billingType = 'live',
  isCustom,
  onSave, 
  isLoading = false,
  disabled = false
}) {
  // Determine gateway subType and pricing config
  const subType = getGatewaySubType(gateway?.id);
  const pricingConfig = getPricingConfig(subType);
  // Local state for input values
  const [approvedValue, setApprovedValue] = useState('');
  const [liveValue, setLiveValue] = useState('');
  const [approvedError, setApprovedError] = useState(null);
  const [liveError, setLiveError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize input values when pricing changes
  useEffect(() => {
    if (pricing) {
      setApprovedValue(pricing.approved?.toFixed(2) || '5.00');
      setLiveValue(pricing.live?.toFixed(2) || '3.00');
      setIsDirty(false);
      setApprovedError(null);
      setLiveError(null);
    }
  }, [pricing]);

  // Handle approved input change with validation
  const handleApprovedChange = useCallback((e) => {
    const value = e.target.value;
    setApprovedValue(value);
    setIsDirty(true);
    const validation = validateCreditRate(value);
    setApprovedError(validation.error);
  }, []);

  // Handle live input change with validation
  const handleLiveChange = useCallback((e) => {
    const value = e.target.value;
    setLiveValue(value);
    setIsDirty(true);
    const validation = validateCreditRate(value);
    setLiveError(validation.error);
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    // Validate based on which fields are shown
    if (pricingConfig.showApproved) {
      const approvedValid = validateCreditRate(approvedValue);
      if (!approvedValid.isValid) {
        setApprovedError(approvedValid.error);
        return;
      }
    }
    
    if (pricingConfig.showLive) {
      const liveValid = validateCreditRate(liveValue);
      if (!liveValid.isValid) {
        setLiveError(liveValid.error);
        return;
      }
    }

    const newPricing = {
      approved: pricingConfig.showApproved ? parseFloat(approvedValue) : pricing?.approved,
      live: pricingConfig.showLive ? parseFloat(liveValue) : pricing?.live
    };
    
    await onSave(newPricing);
    setIsDirty(false);
  }, [approvedValue, liveValue, onSave, pricingConfig, pricing]);

  // Check if value has changed from current (only for shown fields)
  const hasChanged = isDirty && (
    (pricingConfig.showApproved && parseFloat(approvedValue) !== pricing?.approved) ||
    (pricingConfig.showLive && parseFloat(liveValue) !== pricing?.live)
  );
  const hasError = (pricingConfig.showApproved && approvedError) || (pricingConfig.showLive && liveError);
  const canSave = hasChanged && !hasError && !isLoading && !disabled;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">Credit Pricing Configuration</h4>
        {isCustom && (
          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
            Custom
          </Badge>
        )}
      </div>

      {/* Gateway type indicator */}
      <div className="text-xs text-muted-foreground">
        {subType === 'auth' && 'Auth gateway: bills for LIVE cards only (validates without charging)'}
        {subType === 'shopify' && 'Shopify gateway: bills for LIVE cards only (validates without charging)'}
        {subType === 'charge' && 'Charge gateway: bills for both APPROVED and LIVE cards'}
        {subType === 'skbased' && 'SK-based gateway: bills for both CHARGED and LIVE cards'}
      </div>

      {/* Pricing inputs - grid adapts based on which fields are shown */}
      <div className={cn(
        "grid gap-4",
        pricingConfig.showApproved && pricingConfig.showLive ? "grid-cols-2" : "grid-cols-1"
      )}>
        {/* APPROVED/CHARGED Rate - only shown for charge/skbased gateways */}
        {pricingConfig.showApproved && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="approved-rate" className="text-sm font-medium text-green-600 dark:text-green-400">
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  {pricingConfig.approvedLabel} Rate
                </div>
              </Label>
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                Active
              </Badge>
            </div>
            <Input
              id="approved-rate"
              type="number"
              step="0.1"
              min={CREDIT_RATE_LIMITS.MIN}
              max={CREDIT_RATE_LIMITS.MAX}
              value={approvedValue}
              onChange={handleApprovedChange}
              placeholder="5.00"
              disabled={isLoading || disabled}
              className={cn(
                "w-full",
                approvedError && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/10"
              )}
            />
            {approvedError && (
              <p className="text-xs text-red-500">{approvedError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Default: {defaultPricing.approved} credits
            </p>
          </div>
        )}

        {/* LIVE Rate - shown for all gateway types */}
        {pricingConfig.showLive && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="live-rate" className="text-sm font-medium text-blue-600 dark:text-blue-400">
                <div className="flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5" />
                  LIVE Rate
                </div>
              </Label>
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                Active
              </Badge>
            </div>
            <Input
              id="live-rate"
              type="number"
              step="0.1"
              min={CREDIT_RATE_LIMITS.MIN}
              max={CREDIT_RATE_LIMITS.MAX}
              value={liveValue}
              onChange={handleLiveChange}
              placeholder="3.00"
              disabled={isLoading || disabled}
              className={cn(
                "w-full",
                liveError && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/10"
              )}
            />
            {liveError && (
              <p className="text-xs text-red-500">{liveError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Default: {defaultPricing.live} credits
            </p>
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={!canSave}
          className="h-9"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          {isLoading ? 'Saving...' : 'Save Pricing'}
        </Button>
      </div>

      {/* Help text - contextual based on gateway type */}
      <p className="text-xs text-muted-foreground border-t pt-3">
        {pricingConfig.showApproved && pricingConfig.showLive && (
          <>
            <strong>{pricingConfig.approvedLabel}:</strong> Credits charged for successfully {subType === 'skbased' ? 'charged' : 'approved'} cards.
            <br />
            <strong>LIVE:</strong> Credits charged for live cards (3DS, partial declines).
          </>
        )}
        {!pricingConfig.showApproved && pricingConfig.showLive && (
          <>
            <strong>LIVE:</strong> Credits charged for live/approved cards. Auth and Shopify gateways validate cards without making real charges.
          </>
        )}
      </p>
    </div>
  );
}

export default CreditRateConfig;
