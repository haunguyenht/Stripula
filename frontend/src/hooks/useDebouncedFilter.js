import { useState, useMemo, useEffect, useRef, useCallback } from 'react';

/**
 * Default debounce delay in milliseconds
 * Requirements 3.5: Debounce filter operations by 150ms
 */
const DEFAULT_DEBOUNCE_DELAY = 150;

/**
 * useDebouncedFilter - Debounced filtering hook for performance optimization
 * 
 * Debounces filter function changes to prevent excessive re-filtering during
 * rapid filter changes (e.g., typing in search, quick filter toggles).
 * 
 * @param {Array} items - Array of items to filter
 * @param {Function} filterFn - Filter function (item) => boolean
 * @param {number} delay - Debounce delay in milliseconds (default: 150ms)
 * @returns {Array} Filtered items array
 * 
 * Requirements: 3.5 - WHEN filtering results, THE Results_Panel SHALL debounce filter operations by 150ms
 */
export function useDebouncedFilter(items, filterFn, delay = DEFAULT_DEBOUNCE_DELAY) {
  // Store the debounced filter function
  const [debouncedFilter, setDebouncedFilter] = useState(() => filterFn);
  
  // Use ref for timeout management to avoid stale closures
  const timeoutRef = useRef(null);
  
  // Effect to debounce filter function changes
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout to update the debounced filter
    timeoutRef.current = setTimeout(() => {
      setDebouncedFilter(() => filterFn);
    }, delay);
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [filterFn, delay]);
  
  // Memoize filtered results to avoid unnecessary recalculations
  const filteredItems = useMemo(() => {
    if (!debouncedFilter) return items;
    if (!Array.isArray(items)) return [];
    return items.filter(debouncedFilter);
  }, [items, debouncedFilter]);
  
  return filteredItems;
}

/**
 * useDebouncedValue - Generic debounced value hook
 * 
 * Useful for debouncing any value, not just filter functions.
 * 
 * @param {any} value - Value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 150ms)
 * @returns {any} Debounced value
 */
export function useDebouncedValue(value, delay = DEFAULT_DEBOUNCE_DELAY) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * useCardFilterDebounced - Debounced card filtering hook
 * 
 * Combines card filtering logic with debouncing for optimal performance.
 * 
 * @param {Array} results - Array of card results to filter
 * @param {string} filter - Filter type: 'all', 'approved', 'live', 'die', 'error'
 * @param {number} delay - Debounce delay in milliseconds (default: 150ms)
 * @returns {Array} Filtered results array
 */
export function useCardFilterDebounced(results, filter, delay = DEFAULT_DEBOUNCE_DELAY) {
  // Debounce the filter value
  const debouncedFilter = useDebouncedValue(filter, delay);
  
  // Create stable filter function based on debounced filter
  const filterFn = useCallback((r) => {
    if (debouncedFilter === 'all') return true;
    if (debouncedFilter === 'approved') return r.status === 'APPROVED';
    if (debouncedFilter === 'live') return r.status === 'LIVE';
    if (debouncedFilter === 'die') return r.status === 'DECLINED' || r.status === 'DIE';
    if (debouncedFilter === 'error') return r.status === 'ERROR' || r.status === 'RETRY';
    return true;
  }, [debouncedFilter]);
  
  // Memoize filtered results
  return useMemo(() => {
    if (!Array.isArray(results)) return [];
    return results.filter(filterFn);
  }, [results, filterFn]);
}

/**
 * useKeyFilterDebounced - Debounced key filtering hook
 * 
 * Combines key filtering logic with debouncing for optimal performance.
 * 
 * @param {Array} results - Array of key results to filter
 * @param {string} filter - Filter type: 'all', 'live', 'dead'
 * @param {number} delay - Debounce delay in milliseconds (default: 150ms)
 * @returns {Array} Filtered results array
 */
export function useKeyFilterDebounced(results, filter, delay = DEFAULT_DEBOUNCE_DELAY) {
  // Debounce the filter value
  const debouncedFilter = useDebouncedValue(filter, delay);
  
  // Create stable filter function based on debounced filter
  const filterFn = useCallback((r) => {
    if (debouncedFilter === 'all') return true;
    if (debouncedFilter === 'live') return r.status?.startsWith('LIVE');
    if (debouncedFilter === 'dead') return r.status === 'DEAD';
    return true;
  }, [debouncedFilter]);
  
  // Memoize filtered results
  return useMemo(() => {
    if (!Array.isArray(results)) return [];
    return results.filter(filterFn);
  }, [results, filterFn]);
}
