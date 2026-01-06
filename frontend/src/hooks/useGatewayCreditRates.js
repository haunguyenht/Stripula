import { useState, useEffect, useCallback, useMemo, useId } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { gatewaySSE } from '@/lib/services/gatewaySSE';

/**
 * useGatewayCreditRates Hook
 * 
 * Fetches gateway credit rates on mount and subscribes to shared SSE for real-time updates.
 * 
 * Requirements: 11.1, 14.2
 * 
 * @returns {Object} - Gateway credit rates data and methods
 */

const API_BASE = '/api';

export function useGatewayCreditRates() {
  const subscriberId = useId();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [rates, setRates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Get user's tier
  const userTier = useMemo(() => {
    return user?.tier || 'free';
  }, [user]);

  /**
   * Fetch credit rates from API
   */
  const fetchRates = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/gateways/credit-rates`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK' && data.rates) {
          setRates(data.rates);
          setLastUpdate(new Date(data.timestamp));
          setError(null);
        }
      } else {
        setError('Failed to fetch credit rates');
      }
    } catch (err) {

      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Handle SSE events from shared service
   */
  const handleSSEEvent = useCallback((data) => {
    // Handle credit rate change event
    if (data.type === 'creditRateChange') {
      setRates(prev => {
        const updated = [...prev];
        const index = updated.findIndex(r => r.gatewayId === data.gatewayId);
        
        if (index >= 0) {
          updated[index] = {
            ...updated[index],
            rate: data.newRate,
            isCustom: data.isCustom,
            effectiveRate: data.newRate
          };
        }
        
        return updated;
      });
      setLastUpdate(new Date(data.timestamp));
    }
    
    // Handle pricing change event
    if (data.type === 'pricingChange') {
      setRates(prev => {
        const updated = [...prev];
        const index = updated.findIndex(r => r.gatewayId === data.gatewayId);
        
        if (index >= 0) {
          updated[index] = {
            ...updated[index],
            pricing: data.newPricing
          };
        }
        
        return updated;
      });
      setLastUpdate(new Date(data.timestamp));
    }
  }, []);

  // Fetch rates on mount and when auth changes
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Subscribe to shared SSE service
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const unsubscribe = gatewaySSE.subscribe(`rates-${subscriberId}`, handleSSEEvent);
    return unsubscribe;
  }, [subscriberId, isAuthenticated, handleSSEEvent]);

  /**
   * Get rate for a specific gateway
   */
  const getRate = useCallback((gatewayId) => {
    return rates.find(r => r.gatewayId === gatewayId) || null;
  }, [rates]);

  /**
   * Get gateways by parent type
   */
  const getGatewaysByParentType = useCallback((parentType) => {
    return rates.filter(r => r.parentType === parentType);
  }, [rates]);

  /**
   * Get gateways by sub-type
   */
  const getGatewaysBySubType = useCallback((subType) => {
    return rates.filter(r => r.subType === subType);
  }, [rates]);

  /**
   * Get gateway billing type based on ID
   * - Auth gateways use pricing_live
   * - Charge gateways use pricing_approved
   */
  const getGatewayBillingType = useCallback((gatewayId) => {
    if (!gatewayId) return 'live';
    // Auth gateways and Shopify use pricing_live
    if (gatewayId.startsWith('auth-')) return 'live';
    if (gatewayId.startsWith('skbased-auth-')) return 'live';
    if (gatewayId.startsWith('shopify-')) return 'live';
    if (gatewayId.startsWith('auto-shopify-')) return 'live';
    // Charge gateways use pricing_approved
    if (gatewayId.startsWith('charge-')) return 'approved';
    if (gatewayId.startsWith('skbased-') && !gatewayId.startsWith('skbased-auth-')) return 'approved';
    return 'live';
  }, []);

  /**
   * Get effective rate for a gateway (based on billing type)
   * - Auth/Shopify gateways: use pricing_live
   * - Charge gateways: use pricing_approved
   * Returns null if rate not found (no fallback defaults)
   */
  const getEffectiveRate = useCallback((gatewayId) => {
    const rate = rates.find(r => r.gatewayId === gatewayId);
    const billingType = getGatewayBillingType(gatewayId);
    
    if (!rate) {
      // No fallback - return null to indicate rate not available
      return null;
    }
    
    // Return correct rate based on billing type
    if (rate.pricing) {
      const pricingRate = billingType === 'approved' 
        ? rate.pricing.approved 
        : rate.pricing.live;
      
      if (pricingRate === undefined || pricingRate === null) {
        return null;
      }
      return pricingRate;
    }
    
    return rate.effectiveRate ?? rate.rate ?? null;
  }, [rates, getGatewayBillingType]);

  /**
   * Get base rate for a gateway (same as effective rate - based on billing type)
   */
  const getBaseRate = useCallback((gatewayId) => {
    return getEffectiveRate(gatewayId);
  }, [getEffectiveRate]);

  /**
   * Calculate estimated cost for a batch
   */
  const calculateEstimatedCost = useCallback((gatewayId, cardCount) => {
    const effectiveRate = getEffectiveRate(gatewayId);
    return Math.ceil(cardCount * effectiveRate);
  }, [getEffectiveRate]);

  /**
   * Get pricing config for a gateway
   * Returns null if pricing not found (no fallback defaults)
   */
  const getPricing = useCallback((gatewayId) => {
    const rate = rates.find(r => r.gatewayId === gatewayId);
    if (rate?.pricing) {
      return rate.pricing;
    }
    return null;
  }, [rates]);

  /**
   * Refresh rates from server
   */
  const refresh = useCallback(async () => {
    await fetchRates();
  }, [fetchRates]);

  /**
   * Check if rates data is available
   */
  const isAvailable = useMemo(() => {
    return rates.length > 0 && !error;
  }, [rates, error]);

  return useMemo(() => ({
    rates,
    isLoading,
    error,
    lastUpdate,
    userTier,
    isAvailable,
    getRate,
    getEffectiveRate,
    getBaseRate,
    getPricing,
    getGatewayBillingType,
    calculateEstimatedCost,
    refresh,
    getGatewaysByParentType,
    getGatewaysBySubType
  }), [
    rates,
    isLoading,
    error,
    lastUpdate,
    userTier,
    isAvailable,
    getRate,
    getEffectiveRate,
    getBaseRate,
    getPricing,
    getGatewayBillingType,
    calculateEstimatedCost,
    refresh,
    getGatewaysByParentType,
    getGatewaysBySubType
  ]);
}

export default useGatewayCreditRates;
