import { Component } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const PRESERVED_INPUT_KEY = '_error_preserved_input';
const MAX_RETRY_COUNT = 2;

/**
 * ErrorBoundary - Error boundary with retry and input preservation
 * 
 * Features:
 * - Catches component errors and displays recovery UI
 * - Logs errors with component stack trace
 * - Preserves user input to localStorage before showing error
 * - Provides retry button with counter
 * - Suggests page refresh after 2 failed retries
 * 
 * @param {React.ReactNode} children - Child components to wrap
 * @param {string} fallbackMessage - Optional custom error message
 * @param {Function} onError - Optional callback when error occurs
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0 
    };
  }
  
  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Store error info for display
    this.setState({ errorInfo });
    
    // Preserve user input before showing error
    this.preserveUserInput();
    
    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  preserveUserInput() {
    try {
      // Save current input values to localStorage
      const inputs = document.querySelectorAll('textarea, input[type="text"]');
      const preserved = {};
      
      inputs.forEach((input, index) => {
        if (input.value && input.value.trim()) {
          const key = input.name || input.id || `input_${index}`;
          preserved[key] = input.value;
        }
      });
      
      if (Object.keys(preserved).length > 0) {
        localStorage.setItem(PRESERVED_INPUT_KEY, JSON.stringify({
          timestamp: Date.now(),
          inputs: preserved
        }));
      }
    } catch (e) {
      // Silently fail if localStorage is not available
    }
  }
  
  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    if (newRetryCount >= MAX_RETRY_COUNT) {
      // After max retries, just update counter to show refresh suggestion
      this.setState({ retryCount: newRetryCount });
      return;
    }
    
    // Reset error state and increment retry counter
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: newRetryCount 
    });
  };

  handleRefresh = () => {
    window.location.reload();
  };
  
  render() {
    if (this.state.hasError) {
      const showRefreshSuggestion = this.state.retryCount >= MAX_RETRY_COUNT;
      const { fallbackMessage } = this.props;
      
      return (
        <div className="flex items-center justify-center h-full p-4">
          <Card variant="elevated" className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              
              <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
              
              <p className="text-sm text-muted-foreground mb-4">
                {showRefreshSuggestion 
                  ? "Multiple recovery attempts failed. Please refresh the page to continue."
                  : fallbackMessage || "An error occurred. Your input has been preserved."}
              </p>
              
              {showRefreshSuggestion ? (
                <Button 
                  onClick={this.handleRefresh}
                  variant="default"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </Button>
              ) : (
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again {this.state.retryCount > 0 && `(${this.state.retryCount}/${MAX_RETRY_COUNT})`}
                </Button>
              )}
              
              {/* Show error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    Error details
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return this.props.children;
  }
}

/**
 * Utility to retrieve preserved input from localStorage
 * Call this when recovering from an error to restore user input
 * 
 * @returns {Object|null} Preserved input data or null
 */
export function getPreservedInput() {
  try {
    const data = localStorage.getItem(PRESERVED_INPUT_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Only return if preserved within last 5 minutes
      if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
        return parsed.inputs;
      }
      // Clear stale data
      localStorage.removeItem(PRESERVED_INPUT_KEY);
    }
  } catch (e) {
    // Silently fail
  }
  return null;
}

/**
 * Utility to clear preserved input from localStorage
 * Call this after successfully restoring input
 */
export function clearPreservedInput() {
  try {
    localStorage.removeItem(PRESERVED_INPUT_KEY);
  } catch (e) {
    // Silently fail
  }
}

export default ErrorBoundary;
