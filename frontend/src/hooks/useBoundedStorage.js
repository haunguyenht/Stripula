import { useCallback, useMemo } from 'react';
import { useSessionStorage } from '@/hooks/useSessionStorage';

/**
 * Maximum number of results to store per panel
 * Prevents memory bloat during long validation sessions
 * Requirements: 4.1, 4.2
 */
export const MAX_RESULTS = 5000;

/**
 * useBoundedResults Hook
 * Provides bounded storage for validation results with FIFO limit enforcement.
 * When results exceed MAX_RESULTS, oldest results are removed first.
 * 
 * @param {string} key - sessionStorage key
 * @param {any[]} initialValue - Default value (empty array)
 * @returns {Object} - { results, addResult, addResults, clearResults, count, isFull }
 * 
 * Requirements: 4.1, 4.2
 */
export function useBoundedResults(key, initialValue = []) {
  // Use sessionStorage with a high maxArrayLength since we handle limiting ourselves
  const [results, setResults, setResultsImmediate] = useSessionStorage(key, initialValue, { 
    maxArrayLength: MAX_RESULTS,
    debounceMs: 300 
  });

  /**
   * Add a single result to the beginning of the array (newest first)
   * Enforces FIFO limit - removes oldest results when limit exceeded
   */
  const addResult = useCallback((newResult) => {
    setResults(prev => {
      const updated = [newResult, ...prev];
      // FIFO: remove oldest if over limit
      if (updated.length > MAX_RESULTS) {
        return updated.slice(0, MAX_RESULTS);
      }
      return updated;
    });
  }, [setResults]);

  /**
   * Add multiple results to the beginning of the array (newest first)
   * Enforces FIFO limit - removes oldest results when limit exceeded
   */
  const addResults = useCallback((newResults) => {
    if (!Array.isArray(newResults) || newResults.length === 0) return;
    
    setResults(prev => {
      const updated = [...newResults, ...prev];
      // FIFO: remove oldest if over limit
      if (updated.length > MAX_RESULTS) {
        return updated.slice(0, MAX_RESULTS);
      }
      return updated;
    });
  }, [setResults]);

  /**
   * Clear all results - uses immediate write to bypass debounce
   * This ensures storage is cleared before any new validation starts
   */
  const clearResults = useCallback(() => {
    setResultsImmediate([]);
  }, [setResultsImmediate]);

  /**
   * Current count of stored results
   */
  const count = useMemo(() => results?.length || 0, [results]);

  /**
   * Whether storage is at capacity
   */
  const isFull = useMemo(() => count >= MAX_RESULTS, [count]);

  return {
    results,
    addResult,
    addResults,
    clearResults,
    setResults, // Expose raw setter for compatibility with existing code
    count,
    isFull
  };
}
