import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGatewayCreditRates } from '@/hooks/useGatewayCreditRates';

/**
 * useCredits Hook
 * Provides credit balance, gateway rates, and credit operations for validation panels.
 * Now integrates with useGatewayCreditRates for real-time rate updates.
 * 
 * Requirements: 4.3, 4.4, 4.6, 11.1, 11.2, 11.3, 14.2
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.gatewayId - Gateway ID (e.g., 'auth-1', 'charge-1', 'shopify-1')
 * @returns {Object} - Credit state and operations
 */

const API_BASE = '/api';

// Default gateway rates (fallback if API unavailable)
// Based on billing type: auth/shopify use pricing_live, charge uses pricing_approved
const DEFAULT_GATEWAY_RATES = {
  auth: 3.0,      // Uses pricing_live
  charge: 5.0,    // Uses pricing_approved
  skbased: 5.0,   // Uses pricing_approved (SK charge)
  'skbased-auth': 3.0, // Uses pricing_live
  shopify: 3.0    // Uses pricing_live
};



export function useCredits(options = {}) {
  const { gatewayId = 'auth' } = options;
  const { user, isAuthenticated, refreshUser, updateCreditBalance } = useAuth();
  
  // Get real-time gateway credit rates - Requirements: 11.1, 14.2
  const { 
    getEffectiveRate: getGatewayEffectiveRate, 
    getBaseRate: getGatewayBaseRate,
    getRate: getGatewayRate,
    userTier: ratesTier
  } = useGatewayCreditRates();

  // State - Initialize with user data from AuthContext to prevent flash of 0
  const [creditData, setCreditData] = useState(() => ({
    balance: user?.creditBalance ?? user?.credit_balance ?? 0,
    tier: user?.tier || 'free',
    gatewayRate: DEFAULT_GATEWAY_RATES[gatewayId] || 1.0,
    isLoading: !user, // Not loading if we already have user data
    error: null
  }));
  
  const [creditsConsumed, setCreditsConsumed] = useState(0);
  const [liveCardsCount, setLiveCardsCount] = useState(0);

  // Get gateway rate from real-time rates or fallback to default
  const gatewayRate = useMemo(() => {
    const rateFromService = getGatewayBaseRate(gatewayId);
    if (rateFromService) return rateFromService;
    
    // Fallback to default based on gateway type
    const gatewayType = gatewayId.split('-')[0];
    return DEFAULT_GATEWAY_RATES[gatewayType] || DEFAULT_GATEWAY_RATES[gatewayId] || 1.0;
  }, [gatewayId, getGatewayBaseRate]);

  // Get rate info for display (includes isCustom flag)
  const rateInfo = useMemo(() => {
    return getGatewayRate(gatewayId);
  }, [gatewayId, getGatewayRate]);

  /**
   * Fetch credit data from backend
   */
  const fetchCreditData = useCallback(async () => {
    if (!isAuthenticated) {
      setCreditData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/user/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          const tier = data.tier?.name || data.user?.tier || 'free';
          
          setCreditData({
            balance: data.credits?.balance ?? data.user?.creditBalance ?? data.user?.credit_balance ?? 0,
            tier,
            gatewayRate: DEFAULT_GATEWAY_RATES[gatewayId] || 1.0,
            isLoading: false,
            error: null
          });
        }
      } else {
        setCreditData(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load credit data'
        }));
      }
    } catch (err) {

      setCreditData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Network error'
      }));
    }
  }, [isAuthenticated, gatewayId]);

  // Fetch on mount and when auth changes
  useEffect(() => {
    fetchCreditData();
  }, [fetchCreditData]);

  // Sync credit data when user object changes (e.g., after AuthContext refresh)
  useEffect(() => {
    if (user) {
      const userBalance = user.creditBalance ?? user.credit_balance ?? 0;
      const userTier = user.tier || 'free';
      
      setCreditData(prev => {
        // Only update if values actually changed to prevent unnecessary re-renders
        if (prev.balance !== userBalance || prev.tier !== userTier) {
          return {
            ...prev,
            balance: userBalance,
            tier: userTier,
            isLoading: false
          };
        }
        return prev;
      });
    }
  }, [user?.creditBalance, user?.credit_balance, user?.tier]);

  /**
   * Get effective rate (same for all tiers - no multiplier)
   * Uses real-time rates from useGatewayCreditRates when available
   * Requirements: 11.1, 11.3
   */
  const effectiveRate = useMemo(() => {
    // Try to get effective rate from real-time service first
    const rateFromService = getGatewayEffectiveRate(gatewayId);
    if (rateFromService) return rateFromService;
    
    // Fallback to local gateway rate
    return gatewayRate;
  }, [gatewayId, gatewayRate, getGatewayEffectiveRate]);

  /**
   * Calculate estimated cost for a batch
   * @param {number} cardCount - Number of cards in batch
   * @returns {number} - Estimated maximum credit cost
   */
  const calculateEstimatedCost = useCallback((cardCount) => {
    // Worst case: all cards are LIVE
    return Math.ceil(cardCount * effectiveRate);
  }, [effectiveRate]);

  /**
   * Calculate actual cost based on LIVE cards
   * @param {number} liveCount - Number of LIVE cards
   * @returns {number} - Actual credit cost
   */
  const calculateActualCost = useCallback((liveCount) => {
    return Math.ceil(liveCount * effectiveRate);
  }, [effectiveRate]);

  /**
   * Check if user has sufficient credits for a batch
   * @param {number} cardCount - Number of cards in batch
   * @returns {Object} - { sufficient, currentBalance, requiredCredits, shortfall }
   */
  const checkSufficientCredits = useCallback((cardCount) => {
    const requiredCredits = calculateEstimatedCost(cardCount);
    const sufficient = creditData.balance >= requiredCredits;
    
    return {
      sufficient,
      currentBalance: creditData.balance,
      requiredCredits,
      shortfall: sufficient ? 0 : requiredCredits - creditData.balance
    };
  }, [creditData.balance, calculateEstimatedCost]);

  /**
   * Track credits consumed during a batch operation
   * Call this when a LIVE card is detected
   * Also optimistically updates balance for live UI feedback
   * @param {number} [creditCost] - Optional specific credit cost (otherwise uses effectiveRate)
   */
  const trackLiveCard = useCallback((creditCost) => {
    const cost = creditCost ?? effectiveRate;
    setLiveCardsCount(prev => prev + 1);
    setCreditsConsumed(prev => prev + cost);
    // Optimistically update balance for live feedback
    setCreditData(prev => ({
      ...prev,
      balance: Math.max(0, prev.balance - cost)
    }));
  }, [effectiveRate]);

  // Sync balance to AuthContext navbar separately to avoid setState during render
  useEffect(() => {
    if (updateCreditBalance && creditData.balance !== undefined) {
      updateCreditBalance(creditData.balance);
    }
  }, [creditData.balance, updateCreditBalance]);

  /**
   * Reset tracking for a new batch
   */
  const resetTracking = useCallback(() => {
    setCreditsConsumed(0);
    setLiveCardsCount(0);
  }, []);

  /**
   * Update balance after batch completes
   * @param {number} actualLiveCount - Actual number of LIVE cards
   */
  const updateBalanceAfterBatch = useCallback((actualLiveCount) => {
    const cost = calculateActualCost(actualLiveCount);
    setCreditData(prev => ({
      ...prev,
      balance: Math.max(0, prev.balance - cost)
    }));
    // Also refresh from server to get accurate balance
    fetchCreditData();
  }, [calculateActualCost, fetchCreditData]);

  /**
   * Directly set the balance (for live SSE updates)
   * AuthContext navbar sync is handled by the useEffect above
   * @param {number} newBalance - The new credit balance from server
   */
  const setBalance = useCallback((newBalance) => {
    const balance = typeof newBalance === 'number' ? newBalance : parseFloat(newBalance) || 0;
    setCreditData(prev => ({
      ...prev,
      balance
    }));
  }, []);

  /**
   * Refresh credit data from server
   */
  const refresh = useCallback(async () => {
    await fetchCreditData();
    if (refreshUser) {
      await refreshUser();
    }
  }, [fetchCreditData, refreshUser]);

  return useMemo(() => ({
    // Credit data
    balance: creditData.balance,
    tier: creditData.tier,
    gatewayRate,
    effectiveRate,
    isLoading: creditData.isLoading,
    error: creditData.error,
    
    // Rate info from real-time service (includes isCustom flag)
    // Requirements: 11.1, 11.4
    rateInfo,
    baseRate: gatewayRate,
    isCustomRate: rateInfo?.isCustom || false,
    
    // Tracking state
    creditsConsumed,
    liveCardsCount,
    
    // Methods
    calculateEstimatedCost,
    calculateActualCost,
    checkSufficientCredits,
    trackLiveCard,
    resetTracking,
    updateBalanceAfterBatch,
    setBalance,
    refresh,
    
    // Auth state
    isAuthenticated
  }), [
    creditData,
    gatewayRate,
    effectiveRate,
    rateInfo,
    creditsConsumed,
    liveCardsCount,
    calculateEstimatedCost,
    calculateActualCost,
    checkSufficientCredits,
    trackLiveCard,
    resetTracking,
    updateBalanceAfterBatch,
    setBalance,
    refresh,
    isAuthenticated
  ]);
}

export default useCredits;
