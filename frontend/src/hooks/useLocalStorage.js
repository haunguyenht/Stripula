import { useState, useEffect, useCallback } from 'react';

/**
 * useLocalStorage Hook
 * Persist state to localStorage with automatic sync
 * 
 * @param {string} key - localStorage key
 * @param {any} initialValue - Default value if not in storage
 * @returns {[any, function]} - [value, setValue]
 */
export function useLocalStorage(key, initialValue) {
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

    // Update localStorage when value changes
    useEffect(() => {
        try {
            if (storedValue === undefined) {
                localStorage.removeItem(key);
            } else {
                const valueToStore = typeof storedValue === 'string' 
                    ? storedValue 
                    : JSON.stringify(storedValue);
                localStorage.setItem(key, valueToStore);
            }
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

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

