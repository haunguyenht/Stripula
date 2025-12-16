import { createContext, useContext } from 'react';

/**
 * StripeContext - Centralized state management for Stripe validation
 * Provides state and callbacks for key/card validation panels
 */
export const StripeContext = createContext(null);

/**
 * Hook to access Stripe context
 */
export function useStripeContext() {
    const context = useContext(StripeContext);
    if (!context) {
        throw new Error('useStripeContext must be used within StripeProvider');
    }
    return context;
}

