import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, getPreservedInput, clearPreservedInput } from './ErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Content rendered successfully</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
    localStorage.clear();
  });
  afterEach(() => {
    console.error = originalError;
  });

  describe('Error Catching', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Content rendered successfully')).toBeInTheDocument();
    });

    it('should catch errors and display fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should display custom fallback message when provided', () => {
      render(
        <ErrorBoundary fallbackMessage="Custom error message">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
  });

  describe('Recovery Flow', () => {
    it('should allow retry after error', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      // Error UI should be shown
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      
      // Click retry button
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      
      // After retry, component will try to render children again
      // Since ThrowError still throws, error UI will show again
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show refresh suggestion after 2 failed retries', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      // First retry
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      
      // Second retry - should now show refresh suggestion
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      
      // Should now show refresh page button
      expect(screen.getByText(/multiple recovery attempts failed/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
    });

    it('should show retry count after first retry', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      // First retry
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      
      // Should show retry count
      expect(screen.getByRole('button', { name: /try again \(1\/2\)/i })).toBeInTheDocument();
    });
  });

  describe('Input Preservation', () => {
    it('should preserve input values to localStorage on error', () => {
      // Create a mock input element
      const input = document.createElement('input');
      input.type = 'text';
      input.name = 'testInput';
      input.value = 'test value';
      document.body.appendChild(input);
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      // Check localStorage was updated
      const preserved = localStorage.getItem('_error_preserved_input');
      expect(preserved).toBeTruthy();
      
      const parsed = JSON.parse(preserved);
      expect(parsed.inputs.testInput).toBe('test value');
      
      // Cleanup
      document.body.removeChild(input);
    });
  });

  describe('Utility Functions', () => {
    it('getPreservedInput should return preserved data within 5 minutes', () => {
      const testData = {
        timestamp: Date.now(),
        inputs: { field1: 'value1' }
      };
      localStorage.setItem('_error_preserved_input', JSON.stringify(testData));
      
      const result = getPreservedInput();
      expect(result).toEqual({ field1: 'value1' });
    });

    it('getPreservedInput should return null for stale data', () => {
      const testData = {
        timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago
        inputs: { field1: 'value1' }
      };
      localStorage.setItem('_error_preserved_input', JSON.stringify(testData));
      
      const result = getPreservedInput();
      expect(result).toBeNull();
    });

    it('clearPreservedInput should remove data from localStorage', () => {
      localStorage.setItem('_error_preserved_input', JSON.stringify({ test: 'data' }));
      
      clearPreservedInput();
      
      expect(localStorage.getItem('_error_preserved_input')).toBeNull();
    });
  });

  describe('Error Callback', () => {
    it('should call onError callback when error occurs', () => {
      const onError = vi.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });
  });
});
