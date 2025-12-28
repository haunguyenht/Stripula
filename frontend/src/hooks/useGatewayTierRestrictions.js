import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './useAuth';

/**
 * useGatewayTierRestrictions Hook
 * Fetches tier restrictions for all gateways and checks user access
 * 
 * @returns {Object} - Tier restriction data and access check methods
 */

const API_BASE = '/api';

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Tier hierarchy for access check
 */
const TIER_HIERARCHY = ['free', 'bronze', 'silver', 'gold', 'diamond'];

/**
 * Check if a user tier can access a gateway with a minimum tier restriction
 */
function canTierAccess(userTier, minTier) {
  if (!minTier) return true; // No restriction
  const userLevel = TIER_HIERARCHY.indexOf((userTier || 'free').toLowerCase());
  const minLevel = TIER_HIERARCHY.indexOf(minTier.toLowerCase());
  if (userLevel === -1 || minLevel === -1) return false;
  return userLevel >= minLevel;
}

export function useGatewayTierRestrictions() {
  // State
  const [restrictions, setRestrictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  // Auth context for user tier
  const { user, isAuthenticated } = useAuth();
  const userTier = user?.tier || 'free';
  
  // Ref for cache validation
  const cacheRef = useRef({ data: null, timestamp: 0 });

  /**
   * Fetch tier restrictions from API
   */
  const fetchRestrictions = useCallback(async (force = false) => {
    // Skip if not authenticated
    if (!isAuthenticated) {
      setRestrictions([]);
      return { success: true, restrictions: [] };
    }

    // Check cache
    const now = Date.now();
    if (!force && cacheRef.current.data && (now - cacheRef.current.timestamp) < CACHE_TTL) {
      return { success: true, restrictions: cacheRef.current.data, cached: true };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/gateways/tier-restrictions`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tier restrictions');
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.restrictions) {
        setRestrictions(data.restrictions);
        cacheRef.current = { data: data.restrictions, timestamp: now };
        setLastFetch(new Date());
        return { success: true, restrictions: data.restrictions };
      }

      throw new Error(data.message || 'Failed to fetch tier restrictions');
    } catch (err) {

      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Check if user can access a specific gateway
   */
  const canAccessGateway = useCallback((gatewayId) => {
    const restriction = restrictions.find(r => r.gatewayId === gatewayId);
    if (!restriction) return true; // No restriction data = allow
    return canTierAccess(userTier, restriction.minTier);
  }, [restrictions, userTier]);

  /**
   * Get tier restriction for a specific gateway
   */
  const getRestriction = useCallback((gatewayId) => {
    return restrictions.find(r => r.gatewayId === gatewayId) || null;
  }, [restrictions]);

  /**
   * Get minimum tier required for a gateway
   */
  const getMinTier = useCallback((gatewayId) => {
    const restriction = restrictions.find(r => r.gatewayId === gatewayId);
    return restriction?.minTier || null;
  }, [restrictions]);

  /**
   * Get all restricted gateways (with non-null minTier)
   */
  const restrictedGateways = useMemo(() => {
    return restrictions.filter(r => r.minTier !== null);
  }, [restrictions]);

  /**
   * Get gateways the user cannot access
   */
  const lockedGateways = useMemo(() => {
    return restrictions.filter(r => r.minTier && !canTierAccess(userTier, r.minTier));
  }, [restrictions, userTier]);

  /**
   * Get gateways by type with access info
   */
  const getGatewaysByTypeWithAccess = useCallback((type) => {
    return restrictions
      .filter(r => r.type === type)
      .map(r => ({
        ...r,
        canAccess: canTierAccess(userTier, r.minTier),
        isLocked: r.minTier && !canTierAccess(userTier, r.minTier)
      }));
  }, [restrictions, userTier]);

  // Fetch on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchRestrictions();
    }
  }, [isAuthenticated, fetchRestrictions]);

  return useMemo(() => ({
    // State
    restrictions,
    restrictedGateways,
    lockedGateways,
    isLoading,
    error,
    lastFetch,
    userTier,
    
    // Methods
    fetchRestrictions,
    canAccessGateway,
    getRestriction,
    getMinTier,
    getGatewaysByTypeWithAccess,
    
    // Utility
    canTierAccess
  }), [
    restrictions,
    restrictedGateways,
    lockedGateways,
    isLoading,
    error,
    lastFetch,
    userTier,
    fetchRestrictions,
    canAccessGateway,
    getRestriction,
    getMinTier,
    getGatewaysByTypeWithAccess
  ]);
}

export default useGatewayTierRestrictions;
