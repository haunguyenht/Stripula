import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ValidationContext = createContext(null);

/**
 * ValidationProvider - Provides shared validation state across panels
 * Tracks if any validation is in progress to prevent accidental navigation
 */
export function ValidationProvider({ children }) {
  const [isValidating, setIsValidating] = useState(false);
  const [currentPanel, setCurrentPanel] = useState(null);
  const abortCallbackRef = useRef(null);

  // Register a panel as actively validating
  const startValidation = useCallback((panelId, abortCallback) => {
    setIsValidating(true);
    setCurrentPanel(panelId);
    abortCallbackRef.current = abortCallback;
  }, []);

  // Mark validation as complete
  const endValidation = useCallback(() => {
    setIsValidating(false);
    setCurrentPanel(null);
    abortCallbackRef.current = null;
  }, []);

  // Stop current validation (called from confirmation dialog)
  const stopValidation = useCallback(() => {
    if (abortCallbackRef.current) {
      abortCallbackRef.current();
    }
    endValidation();
  }, [endValidation]);

  return (
    <ValidationContext.Provider value={{
      isValidating,
      currentPanel,
      startValidation,
      endValidation,
      stopValidation,
    }}>
      {children}
    </ValidationContext.Provider>
  );
}

export function useValidation() {
  const context = useContext(ValidationContext);
  // Return null if not in provider - allows panels to work standalone
  return context;
}
