import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGatewayCreditRates } from '@/hooks/useGatewayCreditRates';

/**
 * useCredits Hook
 * Provides credit balance, gateway rates, and credit operations for validation panels.
 * Now integrates with useGatewayCreditRates for real-time rate updates.
 * No fallback defaults - database values are required.
 * 
 * Requirements: 4.3, 4.4, 4.6, 11.1, 11.2, 11.3, 14.2
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.gatewayId - Gateway ID (e.g., 'auth-1', 'charge-1', 'shopify-1')
 * @returns {Object} - Credit state and operations
 */

const API_BASE = '/api';

export function useCredits(options = {}) {
  const { gatewayId = 'auth' } = options;
  const { user, isAuthenticated, refreshUser, updateCreditBalance } = useAuth();
  
  // Get real-time gateway credit rates - Requirements: 11.1, 14.2
  const { 
    getEffectiveRate: getGatewayEffectiveRate, 
    getBaseRate: getGatewayBaseRate,
    getRate: getGatewayRate,
    isAvailable: ratesAvailable,
    error: ratesError,
    userTier: ratesTier
  } = useGatewayCreditRates();

  // State - Initialize with user data from AuthContext to prevent flash of 0
  const [creditData, setCreditData] = useState(() => ({
    balance: user?.creditBalance ?? user?.credit_balance ?? 0,
    tier: user?.tier || 'free',
    gatewayRate: null, // No default - must come from database
    isLoading: !user, // Not loading if we already have user data
    error: null
  }));
  
  const [creditsConsumed, setCreditsConsumed] = useState(0);
  const [liveCardsCount, setLiveCardsCount] = useState(0);
  const [approvedCardsCount, setApprovedCardsCount] = useState(0);

  // Get gateway rate from real-time rates - no fallback
  const gatewayRate = useMemo(() => {
    const rateFromService = getGatewayBaseRate(gatewayId);
    return rateFromService; // Can be null if not available
  }, [gatewayId, getGatewayBaseRate]);

  // Get rate info for display (includes isCustom flag)
  const rateInfo = useMemo(() => {
    return getGatewayRate(gatewayId);
  }, [gatewayId, getGatewayRate]);

  /**
   * Fetch credit data from backend
   * No fallback defaults - database values are required
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
            gatewayRate: null, // Rate comes from useGatewayCreditRates
            isLoading: false,
            error: null
          });
        } else {
          setCreditData(prev => ({
            ...prev,
            isLoading: false,
            error: data.error?.message || 'Failed to load credit data'
          }));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setCreditData(prev => ({
          ...prev,
          isLoading: false,
          error: errorData.error?.message || 'Failed to load credit data'
        }));
      }
    } catch (err) {
      setCreditData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Network error - credit data unavailable'
      }));
    }
  }, [isAuthenticated]);

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
   * Uses real-time rates from useGatewayCreditRates - no fallback
   * Requirements: 11.1, 11.3
   */
  const effectiveRate = useMemo(() => {
    // Get effective rate from real-time service - can be null
    const rateFromService = getGatewayEffectiveRate(gatewayId);
    return rateFromService; // No fallback - returns null if unavailable
  }, [gatewayId, getGatewayEffectiveRate]);

  /**
   * Check if rate data is available for calculations
   */
  const rateDataAvailable = useMemo(() => {
    return effectiveRate !== null && ratesAvailable;
  }, [effectiveRate, ratesAvailable]);

  /**
   * Calculate estimated cost for a batch
   * @param {number} cardCount - Number of cards in batch
   * @returns {number|null} - Estimated maximum credit cost, or null if rate unavailable
   */
  const calculateEstimatedCost = useCallback((cardCount) => {
    if (effectiveRate === null) return null;
    // Worst case: all cards are LIVE
    return Math.ceil(cardCount * effectiveRate);
  }, [effectiveRate]);

  /**
   * Calculate actual cost based on LIVE cards
   * @param {number} liveCount - Number of LIVE cards
   * @returns {number|null} - Actual credit cost, or null if rate unavailable
   */
  const calculateActualCost = useCallback((liveCount) => {
    if (effectiveRate === null) return null;
    return Math.ceil(liveCount * effectiveRate);
  }, [effectiveRate]);

  /**
   * Check if user has sufficient credits for a batch
   * @param {number} cardCount - Number of cards in batch
   * @returns {Object} - { sufficient, currentBalance, requiredCredits, shortfall, rateUnavailable }
   */
  const checkSufficientCredits = useCallback((cardCount) => {
    if (effectiveRate === null) {
      return {
        sufficient: false,
        currentBalance: creditData.balance,
        requiredCredits: null,
        shortfall: null,
        rateUnavailable: true,
        error: 'Credit rate unavailable - cannot calculate cost'
      };
    }
    
    const requiredCredits = calculateEstimatedCost(cardCount);
    const sufficient = creditData.balance >= requiredCredits;
    
    return {
      sufficient,
      currentBalance: creditData.balance,
      requiredCredits,
      shortfall: sufficient ? 0 : requiredCredits - creditData.balance,
      rateUnavailable: false
    };
  }, [creditData.balance, effectiveRate, calculateEstimatedCost]);

  /**
   * Track credits consumed during a batch operation
   * Call this when a LIVE card is detected
   * Also optimistically updates balance for live UI feedback
   * @param {number} [creditCost] - Optional specific credit cost (otherwise uses effectiveRate)
   */
  const trackLiveCard = useCallback((creditCost) => {
    const cost = creditCost ?? effectiveRate ?? 0;
    
    setLiveCardsCount(prev => prev + 1);
    if (cost > 0) {
      setCreditsConsumed(prev => prev + cost);
      // Optimistically update balance for live feedback
      setCreditData(prev => ({
        ...prev,
        balance: Math.max(0, prev.balance - cost)
      }));
    }
  }, [effectiveRate]);

  /**
   * Track credits consumed for an APPROVED/CHARGED card
   * Call this when an APPROVED card is detected (separate from LIVE)
   * Also optimistically updates balance for live UI feedback
   * @param {number} [creditCost] - Optional specific credit cost (otherwise uses effectiveRate)
   */
  const trackApprovedCard = useCallback((creditCost) => {
    const cost = creditCost ?? effectiveRate ?? 0;
    
    setApprovedCardsCount(prev => prev + 1);
    if (cost > 0) {
      setCreditsConsumed(prev => prev + cost);
      // Optimistically update balance for live feedback
      setCreditData(prev => ({
        ...prev,
        balance: Math.max(0, prev.balance - cost)
      }));
    }
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
    setApprovedCardsCount(0);
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
    error: creditData.error || ratesError,
    
    // Rate availability
    rateDataAvailable,
    ratesError,
    
    // Rate info from real-time service
    // Requirements: 11.1, 11.4
    rateInfo,
    baseRate: gatewayRate,
    
    // Tracking state
    creditsConsumed,
    liveCardsCount,
    approvedCardsCount,
    
    // Methods
    calculateEstimatedCost,
    calculateActualCost,
    checkSufficientCredits,
    trackLiveCard,
    trackApprovedCard,
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
    rateDataAvailable,
    ratesError,
    rateInfo,
    creditsConsumed,
    liveCardsCount,
    calculateEstimatedCost,
    calculateActualCost,
    checkSufficientCredits,
    trackLiveCard,
    trackApprovedCard,
    resetTracking,
    updateBalanceAfterBatch,
    setBalance,
    refresh,
    isAuthenticated,
    approvedCardsCount
  ]);
}

export default useCredits;
