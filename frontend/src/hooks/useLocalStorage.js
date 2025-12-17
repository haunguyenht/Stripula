import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useLocalStorage Hook
 * Persist state to localStorage with automatic sync
 * 
 * @param {string} key - localStorage key
 * @param {any} initialValue - Default value if not in storage
 * @returns {[any, function]} - [value, setValue]
 */
export function useLocalStorage(key, initialValue, options = {}) {
    const { debounceMs = 500, maxArrayLength = 100 } = options;
    const debounceRef = useRef(null);
    
    // Get initial value from localStorage or use default
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return initialValue;
            
            // Try to parse as JSON, fallback to raw string
            try {
                return JSON.parse(item);
            } catch {
                return item;
            }
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Debounced localStorage write
    useEffect(() => {
        // Clear any pending write
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        
        debounceRef.current = setTimeout(() => {
            try {
                if (storedValue === undefined) {
                    localStorage.removeItem(key);
                } else {
                    // Limit array size to prevent localStorage bloat
                    let valueToSave = storedValue;
                    if (Array.isArray(storedValue) && storedValue.length > maxArrayLength) {
                        valueToSave = storedValue.slice(0, maxArrayLength);
                    }
                    
                    const valueToStore = typeof valueToSave === 'string' 
                        ? valueToSave 
                        : JSON.stringify(valueToSave);
                    localStorage.setItem(key, valueToStore);
                }
            } catch (error) {
                console.warn(`Error setting localStorage key "${key}":`, error);
            }
        }, debounceMs);
        
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [key, storedValue, debounceMs, maxArrayLength]);

    // Memoized setter that handles function updates
    const setValue = useCallback((value) => {
        setStoredValue(prev => {
            const newValue = typeof value === 'function' ? value(prev) : value;
            return newValue;
        });
    }, []);

    return [storedValue, setValue];
}

/**
 * useSessionStorage Hook
 * Same as useLocalStorage but uses sessionStorage
 */
export function useSessionStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = sessionStorage.getItem(key);
            if (item === null) return initialValue;
            
            try {
                return JSON.parse(item);
            } catch {
                return item;
            }
        } catch (error) {
            console.warn(`Error reading sessionStorage key "${key}":`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            if (storedValue === undefined) {
                sessionStorage.removeItem(key);
            } else {
                const valueToStore = typeof storedValue === 'string' 
                    ? storedValue 
                    : JSON.stringify(storedValue);
                sessionStorage.setItem(key, valueToStore);
            }
        } catch (error) {
            console.warn(`Error setting sessionStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    const setValue = useCallback((value) => {
        setStoredValue(prev => {
            const newValue = typeof value === 'function' ? value(prev) : value;
            return newValue;
        });
    }, []);

    return [storedValue, setValue];
}

