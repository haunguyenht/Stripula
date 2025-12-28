import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * useSpeedConfigMatrix Hook
 * Fetches all speed configs in matrix format for admin view
 * 
 * Requirements: 1.6
 * 
 * @returns {Object} - Speed config matrix data and state
 */

const API_BASE = '/api';

const GATEWAYS = ['auth', 'charge'];
const TIERS = ['free', 'bronze', 'silver', 'gold', 'diamond'];

/**
 * Generate default matrix structure
 */
function getDefaultMatrix() {
  const configs = {};
  GATEWAYS.forEach(gateway => {
    configs[gateway] = {};
    TIERS.forEach(tier => {
      configs[gateway][tier] = {
        gatewayId: gateway,
        tier,
        concurrency: getDefaultConcurrency(tier),
        delay: getDefaultDelay(tier),
        isCustom: false,
        updatedAt: null
      };
    });
  });
  
  return {
    gateways: GATEWAYS,
    tiers: TIERS,
    configs
  };
}

function getDefaultConcurrency(tier) {
  const defaults = { free: 1, bronze: 2, silver: 3, gold: 5, diamond: 10 };
  return defaults[tier] || 1;
}

function getDefaultDelay(tier) {
  const defaults = { free: 2000, bronze: 1500, silver: 1000, gold: 500, diamond: 200 };
  return defaults[tier] || 2000;
}

export function useSpeedConfigMatrix() {
  const [data, setData] = useState({
    matrix: getDefaultMatrix(),
    isLoading: true,
    error: null
  });

  /**
   * Fetch speed config matrix from backend
   */
  const fetchMatrix = useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE}/speed-config`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'OK') {
          setData({
            matrix: {
              gateways: result.gateways || GATEWAYS,
              tiers: result.tiers || TIERS,
              configs: result.configs || getDefaultMatrix().configs
            },
            isLoading: false,
            error: null
          });
          return;
        }
      }

      // Fallback to defaults on error
      setData({
        matrix: getDefaultMatrix(),
        isLoading: false,
        error: 'Failed to load speed config matrix'
      });
    } catch (err) {
      setData({
        matrix: getDefaultMatrix(),
        isLoading: false,
        error: 'Network error'
      });
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  /**
   * Update a specific speed config
   * @param {string} gatewayId - Gateway ID
   * @param {string} tier - Tier name
   * @param {Object} config - Config update { concurrency?, delay? }
   * @returns {Promise<Object>} Updated config or error
   */
  const updateConfig = useCallback(async (gatewayId, tier, config) => {
    try {
      const response = await fetch(`${API_BASE}/admin/speed-config/${gatewayId}/${tier}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      const result = await response.json();

      if (response.ok && result.status === 'OK') {
        // Update local state with new config
        setData(prev => ({
          ...prev,
          matrix: {
            ...prev.matrix,
            configs: {
              ...prev.matrix.configs,
              [gatewayId]: {
                ...prev.matrix.configs[gatewayId],
                [tier]: result.config
              }
            }
          }
        }));
        return { success: true, config: result.config };
      }

      return { success: false, error: result.message || 'Update failed' };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }, []);

  /**
   * Reset configs to defaults
   * @param {string} [gatewayId] - Optional gateway ID to reset (all if not provided)
   * @returns {Promise<Object>} Success or error
   */
  const resetToDefaults = useCallback(async (gatewayId = null) => {
    try {
      const response = await fetch(`${API_BASE}/admin/speed-config/reset`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gatewayId })
      });

      const result = await response.json();

      if (response.ok && result.status === 'OK') {
        // Refresh the matrix
        await fetchMatrix();
        return { success: true };
      }

      return { success: false, error: result.message || 'Reset failed' };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }, [fetchMatrix]);

  /**
   * Get config for a specific gateway and tier
   * @param {string} gatewayId - Gateway ID
   * @param {string} tier - Tier name
   * @returns {Object} Speed config
   */
  const getConfig = useCallback((gatewayId, tier) => {
    return data.matrix.configs[gatewayId]?.[tier] || {
      gatewayId,
      tier,
      concurrency: getDefaultConcurrency(tier),
      delay: getDefaultDelay(tier),
      isCustom: false
    };
  }, [data.matrix.configs]);

  /**
   * Validate config values
   * @param {Object} config - Config to validate
   * @returns {Object} Validation result { valid, errors }
   */
  const validateConfig = useCallback((config) => {
    const errors = [];

    if (config.concurrency !== undefined) {
      const concurrency = parseInt(config.concurrency, 10);
      if (isNaN(concurrency) || concurrency < 1 || concurrency > 50) {
        errors.push('Concurrency must be between 1 and 50');
      }
    }

    if (config.delay !== undefined) {
      const delay = parseInt(config.delay, 10);
      if (isNaN(delay) || delay < 100 || delay > 10000) {
        errors.push('Delay must be between 100ms and 10000ms');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }, []);

  return useMemo(() => ({
    // Data
    matrix: data.matrix,
    gateways: data.matrix.gateways,
    tiers: data.matrix.tiers,
    configs: data.matrix.configs,
    isLoading: data.isLoading,
    error: data.error,
    
    // Methods
    fetchMatrix,
    updateConfig,
    resetToDefaults,
    getConfig,
    validateConfig
  }), [
    data,
    fetchMatrix,
    updateConfig,
    resetToDefaults,
    getConfig,
    validateConfig
  ]);
}

export default useSpeedConfigMatrix;
