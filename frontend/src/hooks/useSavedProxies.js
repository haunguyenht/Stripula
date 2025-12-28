import { useState, useCallback, useEffect } from 'react';

const API_BASE = '/api/admin';

/**
 * Hook for managing saved proxy configurations from database
 * Stores proxies with their full config including password
 */
export function useSavedProxies() {
  const [savedProxies, setSavedProxies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch saved proxies from API
  const fetchProxies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/proxies`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch proxies');
      }

      const data = await response.json();
      if (data.status === 'OK') {
        setSavedProxies(data.proxies || []);
      }
    } catch (err) {
      console.error('Failed to fetch saved proxies:', err);
      setError(err.message);
      setSavedProxies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load proxies on mount
  useEffect(() => {
    fetchProxies();
  }, [fetchProxies]);

  /**
   * Generate a unique key for a proxy config
   */
  const getProxyKey = useCallback((config) => {
    if (!config) return null;
    // Use ID if available (from database), otherwise generate from fields
    if (config.id) return config.id;
    return `${config.type || 'http'}://${config.username || ''}@${config.host}:${config.port}`;
  }, []);

  /**
   * Format proxy for display (without password)
   */
  const formatProxyLabel = useCallback((config) => {
    if (!config) return '';
    let label = '';
    if (config.label) {
      label = `${config.label} - `;
    }
    label += `${config.type?.toUpperCase() || 'HTTP'}://`;
    if (config.username) {
      label += `${config.username}@`;
    }
    label += `${config.host}:${config.port}`;
    return label;
  }, []);

  /**
   * Save a proxy to the database
   */
  const saveProxy = useCallback(async (config) => {
    if (!config?.host || !config?.port) return null;

    try {
      const response = await fetch(`${API_BASE}/proxies`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save proxy');
      }

      const data = await response.json();
      if (data.status === 'OK' && data.proxy) {
        // Refresh list
        await fetchProxies();
        return data.proxy;
      }
      return null;
    } catch (err) {
      console.error('Failed to save proxy:', err);
      throw err;
    }
  }, [fetchProxies]);

  /**
   * Delete a proxy from the database
   */
  const deleteProxy = useCallback(async (proxyId) => {
    if (!proxyId) return false;

    try {
      const response = await fetch(`${API_BASE}/proxies/${proxyId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete proxy');
      }

      // Refresh list
      await fetchProxies();
      return true;
    } catch (err) {
      console.error('Failed to delete proxy:', err);
      throw err;
    }
  }, [fetchProxies]);

  /**
   * Check if a proxy config already exists in saved list
   */
  const isProxySaved = useCallback((config) => {
    if (!config) return false;
    return savedProxies.some(p => 
      p.host === config.host && 
      p.port === config.port && 
      (p.username || '') === (config.username || '')
    );
  }, [savedProxies]);

  return {
    savedProxies,
    isLoading,
    error,
    saveProxy,
    deleteProxy,
    refreshProxies: fetchProxies,
    isProxySaved,
    formatProxyLabel,
    getProxyKey
  };
}

export default useSavedProxies;
