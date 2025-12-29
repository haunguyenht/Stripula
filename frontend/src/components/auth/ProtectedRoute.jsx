import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';

/**
 * ProtectedRoute Component
 * Wraps content that requires authentication
 * Shows loading state, login prompt, or protected content
 * 
 * Requirements: 2.2, 2.3
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Protected content
 * @param {React.ReactNode} props.fallback - Content to show when not authenticated
 * @param {React.ReactNode} props.loadingFallback - Content to show while checking auth
 */
export function ProtectedRoute({ 
  children, 
  fallback = null,
  loadingFallback = null 
}) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return loadingFallback || (
      <div className="flex items-center justify-center min-h-[200px]">
        <Spinner variant="pulse" size="lg" label="Checking authentication..." />
      </div>
    );
  }

  // Show fallback when not authenticated
  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-4 text-center p-6">
          <div className="rounded-full bg-muted p-4">
            <svg 
              className="h-8 w-8 text-muted-foreground" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Authentication Required
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Please log in with Telegram to access this feature.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, render protected content
  return children;
}

/**
 * withAuth HOC
 * Higher-order component for protecting components
 * 
 * @param {React.ComponentType} Component - Component to protect
 * @param {Object} options - Protection options
 * @returns {React.ComponentType} Protected component
 */
export function withAuth(Component, options = {}) {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

export default ProtectedRoute;
