import { useMemo, useState, useEffect, useRef, useCallback } from 'react';

/**
 * Default debounce delay in milliseconds
 * Requirements 3.5: Debounce filter operations by 150ms
 */
const DEFAULT_DEBOUNCE_DELAY = 150;

/**
 * Hook for filtering card results with debouncing
 * 
 * @param {Array} results - Array of card results to filter
 * @param {string} filter - Filter type: 'all', 'approved', 'live', 'die', 'error'
 * @param {Object} options - Options object
 * @param {number} options.debounceDelay - Debounce delay in ms (default: 150ms, 0 to disable)
 * @returns {Array} Filtered results array
 * 
 * Requirements: 3.5 - WHEN filtering results, THE Results_Panel SHALL debounce filter operations by 150ms
 */
export function useCardFilters(results, filter, options = {}) {
    const { debounceDelay = DEFAULT_DEBOUNCE_DELAY } = options;
    
    // Debounce the filter value
    const [debouncedFilter, setDebouncedFilter] = useState(filter);
    const timeoutRef = useRef(null);
    
    useEffect(() => {
        // If debouncing is disabled, update immediately
        if (debounceDelay === 0) {
            setDebouncedFilter(filter);
            return;
        }
        
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        // Set new timeout to update the debounced filter
        timeoutRef.current = setTimeout(() => {
            setDebouncedFilter(filter);
        }, debounceDelay);
        
        // Cleanup on unmount or when dependencies change
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [filter, debounceDelay]);
    
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





