import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * useRedeemKey Hook
 * Handles API call to POST /api/redeem for key redemption
 * 
 * Requirements: 5.1
 * 
 * @returns {Object} - Mutation function and state
 */

const API_BASE = '/api';

export function useRedeemKey() {
  const { isAuthenticated, refreshUser } = useAuth();
  
  const [state, setState] = useState({
    isLoading: false,
    isSuccess: false,
    isError: false,
    data: null,
    error: null
  });

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      data: null,
      error: null
    });
  }, []);

  /**
   * Redeem a key code
   * @param {string} code - The key code to redeem (format: XXXX-XXXX-XXXX-XXXX)
   * @returns {Promise<Object>} - Result object with success status and data/error
   */
  const redeemKey = useCallback(async (code) => {
    if (!isAuthenticated) {
      const errorResult = {
        success: false,
        error: 'NOT_AUTHENTICATED',
        message: 'Please log in to redeem keys'
      };
      setState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        data: null,
        error: errorResult
      });
      return errorResult;
    }

    if (!code || code.trim() === '') {
      const errorResult = {
        success: false,
        error: 'MISSING_CODE',
        message: 'Please enter a key code'
      };
      setState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        data: null,
        error: errorResult
      });
      return errorResult;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null
    }));

    try {
      const response = await fetch(`${API_BASE}/redeem`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: code.trim() })
      });

      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        // Refresh user data to get updated credits/tier
        if (refreshUser) {
          await refreshUser();
        }

        const successResult = {
          success: true,
          type: data.type,
          message: data.message,
          creditsAdded: data.creditsAdded,
          newBalance: data.newBalance,
          newTier: data.newTier,
          previousTier: data.previousTier
        };

        setState({
          isLoading: false,
          isSuccess: true,
          isError: false,
          data: successResult,
          error: null
        });

        return successResult;
      }

      // Error response from server
      const errorResult = {
        success: false,
        error: data.code || 'UNKNOWN_ERROR',
        message: data.message || 'Failed to redeem key'
      };

      setState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        data: null,
        error: errorResult
      });

      return errorResult;
    } catch (err) {
      const errorResult = {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network error. Please try again.'
      };

      setState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        data: null,
        error: errorResult
      });

      return errorResult;
    }
  }, [isAuthenticated, refreshUser]);

  return useMemo(() => ({
    // Mutation function
    redeemKey,
    reset,
    
    // State
    isLoading: state.isLoading,
    isSuccess: state.isSuccess,
    isError: state.isError,
    data: state.data,
    error: state.error
  }), [redeemKey, reset, state]);
}

export default useRedeemKey;
