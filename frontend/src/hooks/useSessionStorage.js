import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useSessionStorage Hook
 * Like useLocalStorage but uses sessionStorage - survives page refresh/crash
 * but clears when browser/tab is closed (better for large temporary data)
 * 
 * @param {string} key - sessionStorage key
 * @param {any} initialValue - Default value if not in storage
 * @param {object} options - Options { debounceMs, maxArrayLength }
 * @returns {[any, function]} - [value, setValue]
 */
export function useSessionStorage(key, initialValue, options = {}) {
  const { debounceMs = 300, maxArrayLength = 100 } = options;
  const debounceRef = useRef(null);
  
  // Get initial value from sessionStorage or use default
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
      return initialValue;
    }
  });

  // Debounced sessionStorage write
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      try {
        if (storedValue === undefined) {
          sessionStorage.removeItem(key);
        } else {
          // Limit array size to prevent storage bloat
          let valueToSave = storedValue;
          if (Array.isArray(storedValue) && storedValue.length > maxArrayLength) {
            valueToSave = storedValue.slice(0, maxArrayLength);
          }
          
          const valueToStore = typeof valueToSave === 'string' 
            ? valueToSave 
            : JSON.stringify(valueToSave);
          sessionStorage.setItem(key, valueToStore);
        }
      } catch (error) {
        // sessionStorage might be full or disabled
      }
    }, debounceMs);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [key, storedValue, debounceMs, maxArrayLength]);

  const setValue = useCallback((value) => {
    setStoredValue(prev => {
      const newValue = typeof value === 'function' ? value(prev) : value;
      return newValue;
    });
  }, []);

  return [storedValue, setValue];
}
