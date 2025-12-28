import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * useSpeedConfig Hook
 * Fetches speed config for a specific gateway and tier
 * 
 * Requirements: 4.1, 4.2
 * 
 * @param {string} gatewayId - Gateway ID (e.g., 'auth', 'charge', 'shopify')
 * @param {string} tier - User tier (e.g., 'free', 'bronze', 'silver', 'gold', 'diamond')
 * @returns {Object} - Speed config data and state
 */

const API_BASE = '/api';

// Default speed limits (fallback if API unavailable)
const DEFAULT_SPEED_LIMITS = {
  free: { concurrency: 1, delay: 2000 },
  bronze: { concurrency: 2, delay: 1500 },
  silver: { concurrency: 3, delay: 1000 },
  gold: { concurrency: 5, delay: 500 },
  diamond: { concurrency: 10, delay: 200 }
};

// Cache for speed configs (shared across hook instances)
const configCache = new Map();
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Get cache key for gateway/tier combination
 */
function getCacheKey(gatewayId, tier) {
  return `${gatewayId}:${tier}`;
}

/**
 * Get cached config if valid
 */
function getCachedConfig(gatewayId, tier) {
  const key = getCacheKey(gatewayId, tier);
  const cached = configCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.config;
  }
  
  return null;
}

/**
 * Set cached config
 */
function setCachedConfig(gatewayId, tier, config) {
  const key = getCacheKey(gatewayId, tier);
  configCache.set(key, {
    config,
    timestamp: Date.now()
  });
}

/**
 * Get default config for a tier
 */
function getDefaultConfig(gatewayId, tier) {
  const tierDefaults = DEFAULT_SPEED_LIMITS[tier] || DEFAULT_SPEED_LIMITS.free;
  return {
    gatewayId,
    tier,
    concurrency: tierDefaults.concurrency,
    delay: tierDefaults.delay,
    isCustom: false
  };
}

export function useSpeedConfig(gatewayId = 'auth', tier = null) {
  const { user, isAuthenticated } = useAuth();
  
  // Use user's tier if not explicitly provided
  const effectiveTier = tier || user?.tier || 'free';
  
  const [data, setData] = useState({
    config: getDefaultConfig(gatewayId, effectiveTier),
    isLoading: true,
    error: null
  });

  // Track if component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  /**
   * Fetch speed config from backend
   */
  const fetchConfig = useCallback(async () => {
    // Skip fetch if gatewayId is null/undefined (config provided externally)
    if (!gatewayId || !effectiveTier) {
      setData(prev => ({ ...prev, isLoading: false, config: null }));
      return;
    }

    // Check cache first
    const cached = getCachedConfig(gatewayId, effectiveTier);
    if (cached) {
      setData({
        config: cached,
        isLoading: false,
        error: null
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/speed-config/${gatewayId}/${effectiveTier}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!isMounted.current) return;

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'OK' && result.config) {
          // Cache the result
          setCachedConfig(gatewayId, effectiveTier, result.config);
          
          setData({
            config: result.config,
            isLoading: false,
            error: null
          });
          return;
        }
      }

      // Fallback to defaults on error
      const defaultConfig = getDefaultConfig(gatewayId, effectiveTier);
      setData({
        config: defaultConfig,
        isLoading: false,
        error: 'Failed to load speed config'
      });
    } catch (err) {
      if (!isMounted.current) return;
      const defaultConfig = getDefaultConfig(gatewayId, effectiveTier);
      setData({
        config: defaultConfig,
        isLoading: false,
        error: 'Network error'
      });
    }
  }, [gatewayId, effectiveTier]);

  // Fetch on mount and when gatewayId/tier changes
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  /**
   * Refresh config from server (bypasses cache)
   */
  const refresh = useCallback(async () => {
    // Clear cache for this key
    const key = getCacheKey(gatewayId, effectiveTier);
    configCache.delete(key);
    
    setData(prev => ({ ...prev, isLoading: true }));
    await fetchConfig();
  }, [gatewayId, effectiveTier, fetchConfig]);

  /**
   * Clear all cached configs
   */
  const clearCache = useCallback(() => {
    configCache.clear();
  }, []);

  return useMemo(() => ({
    // Config data
    config: data.config,
    concurrency: data.config?.concurrency || 1,
    delay: data.config?.delay || 2000,
    isCustom: data.config?.isCustom || false,
    
    // State
    isLoading: data.isLoading,
    error: data.error,
    
    // Computed
    gatewayId,
    tier: effectiveTier,
    
    // Methods
    refresh,
    clearCache,
    
    // Auth state
    isAuthenticated
  }), [
    data,
    gatewayId,
    effectiveTier,
    refresh,
    clearCache,
    isAuthenticated
  ]);
}

export default useSpeedConfig;
