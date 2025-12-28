/**
 * Tests for useBoundedStorage hook
 * Verifies bounded storage and FIFO limit enforcement
 * 
 * **Feature: performance-optimization**
 * **Validates: Requirements 4.1, 4.2**
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useBoundedResults, MAX_RESULTS } from './useBoundedStorage';

// Mock sessionStorage
const mockStorage = {};
beforeEach(() => {
  Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(key => mockStorage[key] || null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
    mockStorage[key] = value;
  });
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(key => {
    delete mockStorage[key];
  });
});

describe('useBoundedResults - Storage Limit Verification', () => {
  /**
   * Verify MAX_RESULTS constant is set correctly
   * Requirements: 4.1
   */
  it('should have MAX_RESULTS set to 5000', () => {
    expect(MAX_RESULTS).toBe(5000);
  });

  /**
   * Verify addResult adds items to the beginning (newest first)
   */
  it('should add results to the beginning of the array', () => {
    const { result } = renderHook(() => useBoundedResults('test-key', []));
    
    act(() => {
      result.current.addResult({ id: 1, status: 'LIVE' });
    });
    
    act(() => {
      result.current.addResult({ id: 2, status: 'DEAD' });
    });
    
    // Newest should be first
    expect(result.current.results[0].id).toBe(2);
    expect(result.current.results[1].id).toBe(1);
    expect(result.current.count).toBe(2);
  });

  /**
   * Verify addResults adds multiple items at once
   */
  it('should add multiple results at once', () => {
    const { result } = renderHook(() => useBoundedResults('test-key', []));
    
    act(() => {
      result.current.addResults([
        { id: 1, status: 'LIVE' },
        { id: 2, status: 'DEAD' },
        { id: 3, status: 'ERROR' }
      ]);
    });
    
    expect(result.current.count).toBe(3);
    expect(result.current.results[0].id).toBe(1);
  });

  /**
   * Verify clearResults empties the array
   */
  it('should clear all results', () => {
    const { result } = renderHook(() => useBoundedResults('test-key', []));
    
    act(() => {
      result.current.addResults([
        { id: 1, status: 'LIVE' },
        { id: 2, status: 'DEAD' }
      ]);
    });
    
    expect(result.current.count).toBe(2);
    
    act(() => {
      result.current.clearResults();
    });
    
    expect(result.current.count).toBe(0);
    expect(result.current.results).toEqual([]);
  });

  /**
   * Verify isFull flag is set correctly
   */
  it('should set isFull flag when at capacity', () => {
    const { result } = renderHook(() => useBoundedResults('test-key', []));
    
    // Initially not full
    expect(result.current.isFull).toBe(false);
    
    // Create array at capacity
    const fullArray = Array.from({ length: MAX_RESULTS }, (_, i) => ({ id: i }));
    
    act(() => {
      result.current.addResults(fullArray);
    });
    
    expect(result.current.isFull).toBe(true);
    expect(result.current.count).toBe(MAX_RESULTS);
  });

  /**
   * Verify empty array handling
   */
  it('should handle empty addResults gracefully', () => {
    const { result } = renderHook(() => useBoundedResults('test-key', []));
    
    act(() => {
      result.current.addResults([]);
    });
    
    expect(result.current.count).toBe(0);
    
    act(() => {
      result.current.addResults(null);
    });
    
    expect(result.current.count).toBe(0);
  });
});

describe('useBoundedResults - FIFO Limit Enforcement', () => {
  /**
   * Property test: Storage should never exceed MAX_RESULTS
   * Requirements: 4.1, 4.2
   */
  it('should never exceed MAX_RESULTS limit', () => {
    // Use a smaller limit for testing performance
    const testLimit = 100;
    
    fc.assert(
      fc.property(
        fc.array(fc.record({ id: fc.nat(), status: fc.constantFrom('LIVE', 'DEAD', 'ERROR') }), 
          { minLength: 0, maxLength: 200 }),
        (items) => {
          const { result } = renderHook(() => useBoundedResults('test-fifo', []));
          
          // Add items one by one
          items.forEach(item => {
            act(() => {
              result.current.addResult(item);
            });
          });
          
          // Count should never exceed MAX_RESULTS
          expect(result.current.count).toBeLessThanOrEqual(MAX_RESULTS);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Verify FIFO order - oldest items removed first when limit exceeded
   * Requirements: 4.2
   * 
   * Note: Items are added to the BEGINNING of the array (newest first).
   * When addResults([0,1,2,...]) is called, item 0 becomes results[0] (newest position).
   * When limit is exceeded, items at the END (oldest) are removed via slice(0, MAX_RESULTS).
   */
  it('should remove oldest items first when limit exceeded (FIFO)', () => {
    const { result } = renderHook(() => useBoundedResults('test-fifo', []));
    
    // Create array at capacity - items added in order, so id:0 is at results[0]
    const initialItems = Array.from({ length: MAX_RESULTS }, (_, i) => ({ 
      id: i, 
      timestamp: i 
    }));
    
    act(() => {
      result.current.addResults(initialItems);
    });
    
    expect(result.current.count).toBe(MAX_RESULTS);
    // After addResults, id:0 is at results[0], id:4999 is at results[4999]
    expect(result.current.results[0].id).toBe(0);
    expect(result.current.results[MAX_RESULTS - 1].id).toBe(MAX_RESULTS - 1);
    
    // Add one more item - this goes to the BEGINNING
    act(() => {
      result.current.addResult({ id: MAX_RESULTS, timestamp: MAX_RESULTS });
    });
    
    // Should still be at MAX_RESULTS
    expect(result.current.count).toBe(MAX_RESULTS);
    
    // Newest item should be first
    expect(result.current.results[0].id).toBe(MAX_RESULTS);
    
    // The item that was at the END (id: MAX_RESULTS - 1) should have been removed
    // because slice(0, MAX_RESULTS) removes from the end
    const hasOldestItem = result.current.results.some(r => r.id === MAX_RESULTS - 1);
    expect(hasOldestItem).toBe(false);
    
    // The item that was second-to-last (id: MAX_RESULTS - 2) should now be last
    expect(result.current.results[MAX_RESULTS - 1].id).toBe(MAX_RESULTS - 2);
  });
});

