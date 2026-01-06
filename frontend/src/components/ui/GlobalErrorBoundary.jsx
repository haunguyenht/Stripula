import { Component } from 'react';
import { ErrorPage } from '@/pages/ErrorPage';

const API_BASE = '/api';

/**
 * GlobalErrorBoundary - Top-level error boundary with error reporting
 * 
 * Features:
 * - Catches unhandled errors at the application level
 * - Reports errors to backend for Telegram notification
 * - Displays ErrorPage with unique error reference ID
 * - Does NOT expose error details to users
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.7
 */
export class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      errorId: null,
      error: null
    };
  }
  
  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Report error to backend
    // Requirements: 6.3, 6.4 - Report errors with unique ID
    this.reportError(error, errorInfo);
  }
  
  /**
   * Report error to backend for Telegram notification
   * Requirements: 6.3, 6.4, 6.5 - Error reporting with reference ID
   */
  async reportError(error, errorInfo) {
    try {
      const response = await fetch(`${API_BASE}/errors/report`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: error?.message || 'Unknown error',
          stack: error?.stack || null,
          componentStack: errorInfo?.componentStack || null,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Store the error ID for display
        // Requirement 6.3: Provide unique error reference ID
        if (data.errorId) {
          this.setState({ errorId: data.errorId });
        }
      }
    } catch (reportError) {
      // Silently fail if error reporting fails
      // Generate a client-side error ID as fallback
      const fallbackId = `ERR-${Date.now().toString(36).toUpperCase()}`;
      this.setState({ errorId: fallbackId });
    }
  }
  
  /**
   * Handle retry - reset error state
   * Requirement 6.7: Provide options to retry
   */
  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      errorId: null,
      error: null
    });
  };

  /**
   * Handle navigate home - reset and go to dashboard
   * Requirement 6.7: Provide options to return to dashboard
   */
  handleNavigateHome = () => {
    // Reset error state
    this.setState({ 
      hasError: false, 
      errorId: null,
      error: null
    });
    
    // Navigate to dashboard
    localStorage.setItem('appActiveRoute', 'dashboard');
    window.location.reload();
  };
  
  render() {
    if (this.state.hasError) {
      // Requirement 6.1, 6.2: Display 500 error page with generic message
      // Requirement 6.3: Show error reference ID
      return (
        <ErrorPage 
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          onNavigateHome={this.handleNavigateHome}
        />
      );
    }
    
    return this.props.children;
  }
}

export default GlobalErrorBoundary;
