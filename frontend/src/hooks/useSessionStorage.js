import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Helper to write value to sessionStorage
 */
function writeToStorage(key, value, maxArrayLength) {
  try {
    if (value === undefined) {
      sessionStorage.removeItem(key);
    } else {
      // Limit array size to prevent storage bloat
      let valueToSave = value;
      if (Array.isArray(value) && value.length > maxArrayLength) {
        valueToSave = value.slice(0, maxArrayLength);
      }
      
      const valueToStore = typeof valueToSave === 'string' 
        ? valueToSave 
        : JSON.stringify(valueToSave);
      sessionStorage.setItem(key, valueToStore);
    }
  } catch {
    // sessionStorage might be full or disabled
  }
}

/**
 * useSessionStorage Hook
 * Like useLocalStorage but uses sessionStorage - survives page refresh/crash
 * but clears when browser/tab is closed (better for large temporary data)
 * 
 * @param {string} key - sessionStorage key
 * @param {any} initialValue - Default value if not in storage
 * @param {object} options - Options { debounceMs, maxArrayLength }
 * @returns {[any, function, function]} - [value, setValue, setValueImmediate]
 */
export function useSessionStorage(key, initialValue, options = {}) {
  const { debounceMs = 300, maxArrayLength = 100 } = options;
  const debounceRef = useRef(null);
  const maxArrayLengthRef = useRef(maxArrayLength);
  
  // Keep maxArrayLength ref updated
  useEffect(() => {
    maxArrayLengthRef.current = maxArrayLength;
  }, [maxArrayLength]);
  
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
    } catch {
      return initialValue;
    }
  });

  // Debounced sessionStorage write
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      writeToStorage(key, storedValue, maxArrayLength);
    }, debounceMs);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [key, storedValue, debounceMs, maxArrayLength]);

  // Standard setValue with debounced storage write
  const setValue = useCallback((value) => {
    setStoredValue(prev => {
      const newValue = typeof value === 'function' ? value(prev) : value;
      return newValue;
    });
  }, []);

  // Immediate setValue that bypasses debounce - use for clearing/critical updates
  const setValueImmediate = useCallback((value) => {
    // Cancel any pending debounced write
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    
    setStoredValue(prev => {
      const newValue = typeof value === 'function' ? value(prev) : value;
      // Write immediately to storage
      writeToStorage(key, newValue, maxArrayLengthRef.current);
      return newValue;
    });
  }, [key]);

  return [storedValue, setValue, setValueImmediate];
}
