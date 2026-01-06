import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

/**
 * AuthContext
 * Manages authentication state, user data, and auth operations
 * 
 * Requirements: 2.1, 2.4
 */

const AuthContext = createContext(null);

/**
 * Calculate tier expiration status
 */
function getTierExpirationStatus(tierExpiresAt) {
  if (!tierExpiresAt) return { isExpired: false, isExpiringSoon: false, daysRemaining: null };
  
  const expDate = new Date(tierExpiresAt);
  const now = new Date();
  const diffMs = expDate - now;
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  return {
    isExpired: daysRemaining <= 0,
    isExpiringSoon: daysRemaining > 0 && daysRemaining <= 7,
    daysRemaining: Math.max(0, daysRemaining),
    expiresAt: expDate
  };
}

// API base URL - uses Vite proxy in development
const API_BASE = '/api';

/**
 * AuthProvider Component
 * Provides authentication state and methods to the app
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch current user from backend
   * Called on mount to restore session from cookie
   */
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK' && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          return { success: true, user: data.user };
        }
      }
      
      // Not authenticated or error
      setUser(null);
      setIsAuthenticated(false);
      return { success: false };
    } catch (err) {

      setUser(null);
      setIsAuthenticated(false);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Login with Telegram auth data
   * Sends auth data to backend, receives JWT cookie
   */
  const login = useCallback(async (telegramAuthData, referralCode = null) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = { ...telegramAuthData };
      if (referralCode) {
        payload.referral_code = referralCode;
      }

      const response = await fetch(`${API_BASE}/auth/telegram/callback`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        setUser(data.user);
        setIsAuthenticated(true);
        return { 
          success: true, 
          user: data.user, 
          isNewUser: data.isNewUser 
        };
      }

      const errorMsg = data.message || 'Authentication failed';
      setError(errorMsg);
      return { success: false, error: errorMsg, code: data.code };
    } catch (err) {

      const errorMsg = err.message || 'Network error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout user
   * Clears session on backend and local state
   */
  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Clear local state regardless of response
      setUser(null);
      setIsAuthenticated(false);
      setError(null);

      if (response.ok) {
        return { success: true };
      }

      const data = await response.json();
      return { success: false, error: data.message };
    } catch (err) {

      // Still clear local state on error
      setUser(null);
      setIsAuthenticated(false);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh user data from backend
   * Useful after credit operations
   */
  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return { success: false };
    return fetchCurrentUser();
  }, [isAuthenticated, fetchCurrentUser]);

  /**
   * Update credit balance directly (for live SSE updates)
   * @param {number} newBalance - The new credit balance
   */
  const updateCreditBalance = useCallback((newBalance) => {
    setUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        creditBalance: newBalance,
        credit_balance: newBalance
      };
    });
  }, []);

  /**
   * Refresh session token
   */
  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, expiresAt: data.expiresAt };
      }

      return { success: false };
    } catch (err) {

      return { success: false, error: err.message };
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await fetchCurrentUser();
      setIsLoading(false);
    };

    initAuth();
  }, [fetchCurrentUser]);

  // Calculate tier expiration status
  const tierExpiration = useMemo(() => {
    if (!user) return { isExpired: false, isExpiringSoon: false, daysRemaining: null };
    return getTierExpirationStatus(user.tierExpiresAt);
  }, [user?.tierExpiresAt]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    logout,
    refreshUser,
    refreshToken,
    updateCreditBalance,
    tierExpiration
  }), [user, isLoading, isAuthenticated, error, login, logout, refreshUser, refreshToken, updateCreditBalance, tierExpiration]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 * Access authentication state and methods
 * 
 * @returns {Object} Auth context value
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;
