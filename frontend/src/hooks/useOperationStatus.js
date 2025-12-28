import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * useOperationStatus Hook
 * Polls /api/user/status every 5 seconds to check for active operations.
 * Disables UI when an operation is running for the user.
 * 
 * Requirements: 14.12
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether polling is enabled (default: true)
 * @param {number} options.pollInterval - Polling interval in ms (default: 5000)
 * @param {boolean} options.isAuthenticated - Whether user is authenticated
 * @returns {Object} - Operation status and control methods
 */

const API_BASE = '/api';
const DEFAULT_POLL_INTERVAL = 5000; // 5 seconds

export function useOperationStatus(options = {}) {
  const {
    enabled = true,
    pollInterval = DEFAULT_POLL_INTERVAL,
    isAuthenticated = false
  } = options;

  // State
  const [status, setStatus] = useState({
    hasRunningOperation: false,
    runningOperation: null,
    recentOperations: [],
    lastChecked: null,
    error: null
  });
  const [isPolling, setIsPolling] = useState(false);
  
  // Refs for cleanup
  const pollIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Fetch operation status from backend
   */
  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated) {
      return null;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/user/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, stop polling
          return { error: 'NOT_AUTHENTICATED' };
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK') {
        return {
          hasRunningOperation: data.hasRunningOperation,
          runningOperation: data.runningOperation,
          recentOperations: data.recentOperations || [],
          lastChecked: new Date().toISOString(),
          error: null
        };
      }

      return { error: data.code || 'UNKNOWN_ERROR' };
    } catch (error) {
      if (error.name === 'AbortError') {
        return null; // Request was cancelled
      }
      return { error: error.message };
    }
  }, [isAuthenticated]);

  /**
   * Manually refresh status
   */
  const refresh = useCallback(async () => {
    const result = await fetchStatus();
    if (result) {
      setStatus(prev => ({
        ...prev,
        ...result
      }));
    }
    return result;
  }, [fetchStatus]);

  /**
   * Start polling
   */
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      return; // Already polling
    }

    setIsPolling(true);
    
    // Initial fetch
    refresh();

    // Set up interval
    pollIntervalRef.current = setInterval(() => {
      refresh();
    }, pollInterval);
  }, [refresh, pollInterval]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsPolling(false);
  }, []);

  // Start/stop polling based on enabled state and authentication
  useEffect(() => {
    if (enabled && isAuthenticated) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, isAuthenticated, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  /**
   * Check if UI should be disabled
   * Returns true if an operation is running for the user
   */
  const shouldDisableUI = useMemo(() => {
    return status.hasRunningOperation;
  }, [status.hasRunningOperation]);

  /**
   * Get a user-friendly message about the current status
   */
  const statusMessage = useMemo(() => {
    if (!status.hasRunningOperation) {
      return null;
    }

    const op = status.runningOperation;
    const opType = op?.operationType || 'operation';
    const cardCount = op?.cardCount;
    
    if (cardCount) {
      return `${opType} in progress (${cardCount} cards)`;
    }
    return `${opType} in progress`;
  }, [status]);

  return useMemo(() => ({
    // Status data
    hasRunningOperation: status.hasRunningOperation,
    runningOperation: status.runningOperation,
    recentOperations: status.recentOperations,
    lastChecked: status.lastChecked,
    error: status.error,
    
    // Computed values
    shouldDisableUI,
    statusMessage,
    
    // Control methods
    refresh,
    startPolling,
    stopPolling,
    isPolling
  }), [
    status,
    shouldDisableUI,
    statusMessage,
    refresh,
    startPolling,
    stopPolling,
    isPolling
  ]);
}

export default useOperationStatus;
