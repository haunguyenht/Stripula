import { useState, useCallback, useMemo } from 'react';
import { classifyError, getErrorMessage, isRetryableError, isSessionExpired } from '@/utils/errorHandler';

/**
 * useGatewayAdmin Hook
 * Admin operations for gateway management
 * 
 * Requirements: 6.1, 6.2, 7.1, 7.2, 7.3, 7.4, 16.1, 16.2, 16.3, 16.4, 16.5, 17.1, 17.3, 17.4
 * 
 * @returns {Object} - Admin gateway operations and state
 */

const API_BASE = '/api';

/**
 * Helper to handle API errors with proper classification
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
 */
async function handleApiError(response) {
  let errorData = {};
  try {
    errorData = await response.json();
  } catch {
    errorData = { message: response.statusText };
  }
  
  const errorCode = classifyError({ status: response.status, ...errorData });
  const message = getErrorMessage({ status: response.status, ...errorData }, errorData.message);
  
  return {
    code: errorCode,
    message,
    status: response.status,
    isRetryable: isRetryableError({ code: errorCode }),
    isSessionExpired: isSessionExpired({ code: errorCode }),
  };
}

export function useGatewayAdmin() {
  // State
  const [gateways, setGateways] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [operationLoading, setOperationLoading] = useState({});

  /**
   * Fetch all gateways with admin details
   * Requirement: 6.1
   * Requirements: 16.1, 16.2, 16.4
   */
  const fetchGateways = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/admin/gateways`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorInfo = await handleApiError(response);
        throw { ...errorInfo, isApiError: true };
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.gateways) {
        setGateways(data.gateways);
        return { success: true, gateways: data.gateways };
      }

      throw new Error(data.message || 'Failed to fetch gateways');
    } catch (err) {

      const errorMessage = err.isApiError ? err.message : getErrorMessage(err, 'Failed to fetch gateways');
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage,
        code: err.code || classifyError(err),
        isRetryable: err.isRetryable ?? isRetryableError(err),
        isSessionExpired: err.isSessionExpired ?? isSessionExpired(err),
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update gateway state (enabled/maintenance/disabled)
   * Requirement: 6.2
   */
  const updateGatewayState = useCallback(async (gatewayId, state, reason = null) => {
    setOperationLoading(prev => ({ ...prev, [gatewayId]: true }));
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/admin/gateways/${gatewayId}/state`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state, reason })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update gateway state');
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.gateway) {
        // Update local state
        setGateways(prev => prev.map(g => 
          g.id === gatewayId ? { ...g, ...data.gateway } : g
        ));
        return { success: true, gateway: data.gateway };
      }

      throw new Error(data.message || 'Failed to update gateway state');
    } catch (err) {

      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setOperationLoading(prev => ({ ...prev, [gatewayId]: false }));
    }
  }, []);

  /**
   * Enable maintenance mode for a gateway
   * Requirement: 6.2
   */
  const enableMaintenance = useCallback(async (gatewayId, reason = null, scheduledEnd = null) => {
    setOperationLoading(prev => ({ ...prev, [gatewayId]: true }));
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/admin/gateways/${gatewayId}/maintenance`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason, scheduledEnd })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to enable maintenance mode');
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.gateway) {
        // Update local state
        setGateways(prev => prev.map(g => 
          g.id === gatewayId ? { ...g, ...data.gateway } : g
        ));
        return { success: true, gateway: data.gateway };
      }

      throw new Error(data.message || 'Failed to enable maintenance mode');
    } catch (err) {

      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setOperationLoading(prev => ({ ...prev, [gatewayId]: false }));
    }
  }, []);

  /**
   * Disable maintenance mode for a gateway
   * Requirement: 6.2
   */
  const disableMaintenance = useCallback(async (gatewayId) => {
    setOperationLoading(prev => ({ ...prev, [gatewayId]: true }));
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/admin/gateways/${gatewayId}/maintenance`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to disable maintenance mode');
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.gateway) {
        // Update local state
        setGateways(prev => prev.map(g => 
          g.id === gatewayId ? { ...g, ...data.gateway } : g
        ));
        return { success: true, gateway: data.gateway };
      }

      throw new Error(data.message || 'Failed to disable maintenance mode');
    } catch (err) {

      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setOperationLoading(prev => ({ ...prev, [gatewayId]: false }));
    }
  }, []);

  /**
   * Get health metrics for a specific gateway
   * Requirement: 6.3
   */
  const getHealthMetrics = useCallback(async (gatewayId) => {
    try {
      const response = await fetch(`${API_BASE}/admin/gateways/${gatewayId}/health`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch health metrics');
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        return { success: true, metrics: data.metrics, healthStatus: data.healthStatus };
      }

      throw new Error(data.message || 'Failed to fetch health metrics');
    } catch (err) {

      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Reset health metrics for a gateway, bringing it back online
   */
  const resetHealth = useCallback(async (gatewayId) => {
    setOperationLoading(prev => ({ ...prev, [`health-${gatewayId}`]: true }));
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/admin/gateways/${gatewayId}/health/reset`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reset health metrics');
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        return { success: true, ...data };
      }

      throw new Error(data.message || 'Failed to reset health metrics');
    } catch (err) {

      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setOperationLoading(prev => ({ ...prev, [`health-${gatewayId}`]: false }));
    }
  }, []);

  /**
   * Get current health thresholds configuration
   */
  const getHealthThresholds = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/gateways/health/thresholds`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch health thresholds');
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        return { success: true, thresholds: data.thresholds };
      }

      throw new Error(data.message || 'Failed to fetch health thresholds');
    } catch (err) {

      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Update health thresholds configuration
   */
  const updateHealthThresholds = useCallback(async (thresholds) => {
    setOperationLoading(prev => ({ ...prev, 'health-thresholds': true }));
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/admin/gateways/health/thresholds`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(thresholds)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update health thresholds');
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        return { success: true, thresholds: data.thresholds };
      }

      throw new Error(data.message || 'Failed to update health thresholds');
    } catch (err) {

      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setOperationLoading(prev => ({ ...prev, 'health-thresholds': false }));
    }
  }, []);

  /**
   * Get proxy configuration for a gateway
   * Requirement: 7.1
   */
  const getProxyConfig = useCallback(async (gatewayId) => {
    try {
      const response = await fetch(`${API_BASE}/admin/gateways/${gatewayId}/proxy`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch proxy configuration');
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        return { 
          success: true, 
          proxyConfig: data.proxyConfig, 
          hasProxy: data.hasProxy 
        };
      }

      throw new Error(data.message || 'Failed to fetch proxy configuration');
    } catch (err) {

      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Set proxy configuration for a gateway
   * Requirement: 7.2
   */
  const setProxyConfig = useCallback(async (gatewayId, config) => {
    setOperationLoading(prev => ({ ...prev, [`proxy-${gatewayId}`]: true }));
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/admin/gateways/${gatewayId}/proxy`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config || {})
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update proxy configuration');
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        return { success: true, hasProxy: data.hasProxy };
      }

      throw new Error(data.message || 'Failed to update proxy configuration');
    } catch (err) {

      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setOperationLoading(prev => ({ ...prev, [`proxy-${gatewayId}`]: false }));
    }
  }, []);

  /**
   * Clear proxy configuration for a gateway
   * Requirement: 7.3
   */
  const clearProxyConfig = useCallback(async (gatewayId) => {
    setOperationLoading(prev => ({ ...prev, [`proxy-${gatewayId}`]: true }));
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/admin/gateways/${gatewayId}/proxy`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to clear proxy configuration');
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        return { success: true, hasProxy: data.hasProxy };
      }

      throw new Error(data.message || 'Failed to clear proxy configuration');
    } catch (err) {

      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setOperationLoading(prev => ({ ...prev, [`proxy-${gatewayId}`]: false }));
    }
  }, []);

  /**
   * Test proxy connection for a gateway
   * Requirement: 7.4
   */
  const testProxyConnection = useCallback(async (gatewayId, config) => {
    setOperationLoading(prev => ({ ...prev, [`proxy-test-${gatewayId}`]: true }));

    try {
      const response = await fetch(`${API_BASE}/admin/gateways/${gatewayId}/proxy/test`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config || {})
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to test proxy connection');
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.testResult) {
        return data.testResult;
      }

      throw new Error(data.message || 'Failed to test proxy connection');
    } catch (err) {

      return { success: false, error: err.message };
    } finally {
      setOperationLoading(prev => ({ ...prev, [`proxy-test-${gatewayId}`]: false }));
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // Credit Rate Operations (Requirements: 9.1, 9.2, 9.3)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get credit rate for a gateway
   * Returns both legacy rate and new pricing object
   * Requirement: 9.1
   */
  const getCreditRate = useCallback(async (gatewayId) => {
    try {
      const response = await fetch(`${API_BASE}/admin/gateways/${gatewayId}/credit-rate`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch credit rate');
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        return { 
          success: true, 
          // Legacy single rate (backward compat)
          rate: data.rate,
          defaultRate: data.defaultRate,
          // New pricing object
          pricing: data.pricing || { approved: data.rate, live: data.rate },
          defaultPricing: data.defaultPricing || { approved: 5, live: 3 },
          billingType: data.billingType || 'live',
          gatewayType: data.gatewayType,
          isCustom: data.isCustom,
          updatedAt: data.updatedAt
        };
      }

      throw new Error(data.message || 'Failed to fetch credit rate');
    } catch (err) {

      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Set credit rate for a gateway
   * Accepts either legacy { rate } or new { pricing: { approved, live } }
   * Requirement: 9.2
   * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 17.1, 17.3, 17.4
   */
  const setCreditRate = useCallback(async (gatewayId, rateOrPricing) => {
    setOperationLoading(prev => ({ ...prev, [`credit-rate-${gatewayId}`]: true }));
    setError(null);

    // Support both legacy (number) and new (object) formats
    const body = typeof rateOrPricing === 'object' && rateOrPricing !== null
      ? { pricing: rateOrPricing }
      : { rate: rateOrPricing };

    try {
      const response = await fetch(`${API_BASE}/admin/gateways/${gatewayId}/credit-rate`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorInfo = await handleApiError(response);
        throw { ...errorInfo, isApiError: true };
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        return { 
          success: true,
          pricing: data.pricing,
          defaultPricing: data.defaultPricing,
          billingType: data.billingType,
          isCustom: data.isCustom,
          updatedAt: data.updatedAt
        };
      }

      throw new Error(data.message || 'Failed to update credit rate');
    } catch (err) {

      const errorMessage = err.isApiError ? err.message : getErrorMessage(err, 'Failed to update credit rate');
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage,
        code: err.code || classifyError(err),
        isRetryable: err.isRetryable ?? isRetryableError(err),
        isSessionExpired: err.isSessionExpired ?? isSessionExpired(err),
      };
    } finally {
      setOperationLoading(prev => ({ ...prev, [`credit-rate-${gatewayId}`]: false }));
    }
  }, []);

  /**
   * Reset credit rate to default for a gateway
   * Requirement: 9.3
   * Requirements: 16.1, 16.2, 16.4, 16.5, 17.1, 17.3, 17.4
   */
  const resetCreditRate = useCallback(async (gatewayId) => {
    setOperationLoading(prev => ({ ...prev, [`credit-rate-${gatewayId}`]: true }));
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/admin/gateways/${gatewayId}/credit-rate`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorInfo = await handleApiError(response);
        throw { ...errorInfo, isApiError: true };
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        return { 
          success: true, 
          oldRate: data.oldRate,
          newRate: data.newRate,
          defaultRate: data.defaultRate,
          isCustom: false,
          updatedAt: data.updatedAt
        };
      }

      throw new Error(data.message || 'Failed to reset credit rate');
    } catch (err) {

      const errorMessage = err.isApiError ? err.message : getErrorMessage(err, 'Failed to reset credit rate');
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage,
        code: err.code || classifyError(err),
        isRetryable: err.isRetryable ?? isRetryableError(err),
        isSessionExpired: err.isSessionExpired ?? isSessionExpired(err),
      };
    } finally {
      setOperationLoading(prev => ({ ...prev, [`credit-rate-${gatewayId}`]: false }));
    }
  }, []);

  /**
   * Check if credit rate operation is loading for a gateway
   */
  const isCreditRateLoading = useCallback((gatewayId) => {
    return operationLoading[`credit-rate-${gatewayId}`] || false;
  }, [operationLoading]);

  /**
   * Set pricing for a gateway (approved and live rates)
   * @param {string} gatewayId - Gateway ID
   * @param {Object} pricing - { approved: number, live: number }
   */
  const setPricing = useCallback(async (gatewayId, pricing) => {
    setOperationLoading(prev => ({ ...prev, [`pricing-${gatewayId}`]: true }));
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/admin/gateways/${gatewayId}/pricing`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pricing)
      });

      if (!response.ok) {
        const errorInfo = await handleApiError(response);
        throw { ...errorInfo, isApiError: true };
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        return { 
          success: true, 
          oldPricing: data.oldPricing,
          newPricing: data.newPricing,
          updatedAt: data.updatedAt
        };
      }

      throw new Error(data.message || 'Failed to update pricing');
    } catch (err) {

      const errorMessage = err.isApiError ? err.message : getErrorMessage(err, 'Failed to update pricing');
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage,
        code: err.code || classifyError(err),
        isRetryable: err.isRetryable ?? isRetryableError(err),
        isSessionExpired: err.isSessionExpired ?? isSessionExpired(err),
      };
    } finally {
      setOperationLoading(prev => ({ ...prev, [`pricing-${gatewayId}`]: false }));
    }
  }, []);

  /**
   * Check if pricing operation is loading for a gateway
   */
  const isPricingLoading = useCallback((gatewayId) => {
    return operationLoading[`pricing-${gatewayId}`] || false;
  }, [operationLoading]);

  // ============================================================
  // TIER RESTRICTION OPERATIONS
  // ============================================================

  /**
   * Get tier restriction for a gateway
   */
  const getTierRestriction = useCallback(async (gatewayId) => {
    setOperationLoading(prev => ({ ...prev, [`tier-${gatewayId}`]: true }));
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/admin/gateways/${gatewayId}/tier-restriction`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorInfo = await handleApiError(response);
        throw { ...errorInfo, isApiError: true };
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        return { 
          success: true, 
          minTier: data.minTier,
          gatewayName: data.gatewayName
        };
      }

      throw new Error(data.message || 'Failed to fetch tier restriction');
    } catch (err) {

      const errorMessage = err.isApiError ? err.message : getErrorMessage(err, 'Failed to fetch tier restriction');
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage,
        code: err.code || classifyError(err),
        isRetryable: err.isRetryable ?? isRetryableError(err),
      };
    } finally {
      setOperationLoading(prev => ({ ...prev, [`tier-${gatewayId}`]: false }));
    }
  }, []);

  /**
   * Set tier restriction for a gateway
   * @param {string} gatewayId - Gateway ID
   * @param {string|null} minTier - Minimum tier (null to clear)
   */
  const setTierRestriction = useCallback(async (gatewayId, minTier) => {
    setOperationLoading(prev => ({ ...prev, [`tier-${gatewayId}`]: true }));
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/admin/gateways/${gatewayId}/tier-restriction`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ minTier })
      });

      if (!response.ok) {
        const errorInfo = await handleApiError(response);
        throw { ...errorInfo, isApiError: true };
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        return { 
          success: true, 
          oldTier: data.oldTier,
          newTier: data.newTier,
          message: data.message
        };
      }

      throw new Error(data.message || 'Failed to set tier restriction');
    } catch (err) {

      const errorMessage = err.isApiError ? err.message : getErrorMessage(err, 'Failed to set tier restriction');
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage,
        code: err.code || classifyError(err),
        isRetryable: err.isRetryable ?? isRetryableError(err),
      };
    } finally {
      setOperationLoading(prev => ({ ...prev, [`tier-${gatewayId}`]: false }));
    }
  }, []);

  /**
   * Clear tier restriction for a gateway (allow all tiers)
   */
  const clearTierRestriction = useCallback(async (gatewayId) => {
    setOperationLoading(prev => ({ ...prev, [`tier-${gatewayId}`]: true }));
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/admin/gateways/${gatewayId}/tier-restriction`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorInfo = await handleApiError(response);
        throw { ...errorInfo, isApiError: true };
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        return { 
          success: true, 
          oldTier: data.oldTier,
          message: data.message
        };
      }

      throw new Error(data.message || 'Failed to clear tier restriction');
    } catch (err) {

      const errorMessage = err.isApiError ? err.message : getErrorMessage(err, 'Failed to clear tier restriction');
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage,
        code: err.code || classifyError(err),
        isRetryable: err.isRetryable ?? isRetryableError(err),
      };
    } finally {
      setOperationLoading(prev => ({ ...prev, [`tier-${gatewayId}`]: false }));
    }
  }, []);

  /**
   * Check if tier restriction operation is loading for a gateway
   */
  const isTierRestrictionLoading = useCallback((gatewayId) => {
    return operationLoading[`tier-${gatewayId}`] || false;
  }, [operationLoading]);

  /**
   * Check if a specific gateway operation is loading
   */
  const isGatewayLoading = useCallback((gatewayId) => {
    return operationLoading[gatewayId] || false;
  }, [operationLoading]);

  /**
   * Get gateways grouped by legacy type (for backwards compatibility)
   */
  const gatewaysByType = useMemo(() => {
    return gateways.reduce((acc, gateway) => {
      const type = gateway.type || 'unknown';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(gateway);
      return acc;
    }, {});
  }, [gateways]);

  /**
   * Get gateways grouped by parent type and sub type (new hierarchy)
   * Structure: { stripe: { auth: [...], charge: [...], skbased: [...] }, shopify: { _gateways: [...] } }
   */
  const gatewaysByHierarchy = useMemo(() => {
    return gateways.reduce((acc, gateway) => {
      const parentType = gateway.parentType || 'unknown';
      const subType = gateway.subType || '_gateways'; // Use _gateways for types without sub-type
      
      if (!acc[parentType]) {
        acc[parentType] = {};
      }
      if (!acc[parentType][subType]) {
        acc[parentType][subType] = [];
      }
      acc[parentType][subType].push(gateway);
      return acc;
    }, {});
  }, [gateways]);

  return useMemo(() => ({
    // State
    gateways,
    gatewaysByType,
    gatewaysByHierarchy,
    isLoading,
    error,
    
    // Operations
    fetchGateways,
    updateGatewayState,
    enableMaintenance,
    disableMaintenance,
    getHealthMetrics,
    resetHealth,
    getHealthThresholds,
    updateHealthThresholds,
    isGatewayLoading,
    // Proxy operations (Requirements: 7.1, 7.2, 7.3, 7.4)
    getProxyConfig,
    setProxyConfig,
    clearProxyConfig,
    testProxyConnection,
    // Credit rate operations (Requirements: 9.1, 9.2, 9.3)
    getCreditRate,
    setCreditRate,
    resetCreditRate,
    isCreditRateLoading,
    // Pricing operations
    setPricing,
    isPricingLoading,
    // Tier restriction operations
    getTierRestriction,
    setTierRestriction,
    clearTierRestriction,
    isTierRestrictionLoading
  }), [
    gateways,
    gatewaysByType,
    gatewaysByHierarchy,
    isLoading,
    error,
    fetchGateways,
    updateGatewayState,
    enableMaintenance,
    disableMaintenance,
    getHealthMetrics,
    resetHealth,
    getHealthThresholds,
    updateHealthThresholds,
    isGatewayLoading,
    getProxyConfig,
    setProxyConfig,
    clearProxyConfig,
    testProxyConnection,
    getCreditRate,
    setCreditRate,
    resetCreditRate,
    isCreditRateLoading,
    setPricing,
    isPricingLoading,
    getTierRestriction,
    setTierRestriction,
    clearTierRestriction,
    isTierRestrictionLoading
  ]);
}

export default useGatewayAdmin;
