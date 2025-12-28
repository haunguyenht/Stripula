/**
 * Tests for useDebouncedFilter hook
 * Verifies debounced filtering behavior
 * 
 * **Feature: performance-optimization**
 * **Validates: Requirements 3.5**
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebouncedFilter, useDebouncedValue, useCardFilterDebounced } from './useDebouncedFilter';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Verify initial value is returned immediately
   */
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 150));
    expect(result.current).toBe('initial');
  });

  /**
   * Verify value is debounced by default 150ms
   * Requirements: 3.5
   */
  it('should debounce value changes by 150ms', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 150),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'changed' });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Advance time by 100ms (not enough)
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('initial');

    // Advance remaining 50ms
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe('changed');
  });

  /**
   * Verify rapid changes only result in final value
   * Requirements: 3.5
   */
  it('should only apply final value after rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 150),
      { initialProps: { value: 'v1' } }
    );

    // Rapid changes
    rerender({ value: 'v2' });
    act(() => { vi.advanceTimersByTime(50); });
    
    rerender({ value: 'v3' });
    act(() => { vi.advanceTimersByTime(50); });
    
    rerender({ value: 'v4' });
    act(() => { vi.advanceTimersByTime(50); });
    
    rerender({ value: 'final' });

    // Still showing initial value
    expect(result.current).toBe('v1');

    // Wait for debounce
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Should show final value, not intermediate ones
    expect(result.current).toBe('final');
  });
});

describe('useDebouncedFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const testItems = [
    { id: 1, status: 'LIVE' },
    { id: 2, status: 'DEAD' },
    { id: 3, status: 'LIVE' },
    { id: 4, status: 'ERROR' },
  ];

  /**
   * Verify filter is applied after debounce delay
   * Requirements: 3.5
   */
  it('should apply filter after debounce delay', () => {
    const filterFn = (item) => item.status === 'LIVE';
    
    const { result } = renderHook(() => 
      useDebouncedFilter(testItems, filterFn, 150)
    );

    // Wait for debounce
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.length).toBe(2);
    expect(result.current.every(item => item.status === 'LIVE')).toBe(true);
  });

  /**
   * Verify filter changes are debounced
   * Requirements: 3.5
   */
  it('should debounce filter function changes', () => {
    const liveFilter = (item) => item.status === 'LIVE';
    const deadFilter = (item) => item.status === 'DEAD';

    const { result, rerender } = renderHook(
      ({ filterFn }) => useDebouncedFilter(testItems, filterFn, 150),
      { initialProps: { filterFn: liveFilter } }
    );

    // Initial filter applied after debounce
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current.length).toBe(2); // 2 LIVE items

    // Change filter
    rerender({ filterFn: deadFilter });

    // Filter should not change immediately
    expect(result.current.length).toBe(2); // Still showing LIVE results

    // Wait for debounce
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Now should show DEAD results
    expect(result.current.length).toBe(1);
    expect(result.current[0].status).toBe('DEAD');
  });

  /**
   * Verify empty array handling
   */
  it('should handle empty arrays', () => {
    const filterFn = (item) => item.status === 'LIVE';
    
    const { result } = renderHook(() => 
      useDebouncedFilter([], filterFn, 150)
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current).toEqual([]);
  });

  /**
   * Verify null filter handling
   */
  it('should return all items when filter is null', () => {
    const { result } = renderHook(() => 
      useDebouncedFilter(testItems, null, 150)
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.length).toBe(4);
  });
});

describe('useCardFilterDebounced', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const cardResults = [
    { status: 'APPROVED', card: '4111111111111111' },
    { status: 'LIVE', card: '4222222222222222' },
    { status: 'DIE', card: '4333333333333333' },
    { status: 'ERROR', card: '4444444444444444' },
    { status: 'RETRY', card: '4555555555555555' },
    { status: 'DECLINED', card: '4666666666666666' },
  ];

  /**
   * Verify 'all' filter returns all results
   */
  it('should return all results for "all" filter', () => {
    const { result } = renderHook(() => 
      useCardFilterDebounced(cardResults, 'all', 150)
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.length).toBe(6);
  });

  /**
   * Verify 'approved' filter returns only APPROVED
   */
  it('should filter APPROVED cards correctly', () => {
    const { result } = renderHook(() => 
      useCardFilterDebounced(cardResults, 'approved', 150)
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.length).toBe(1);
    expect(result.current[0].status).toBe('APPROVED');
  });

  /**
   * Verify 'live' filter returns only LIVE
   */
  it('should filter LIVE cards correctly', () => {
    const { result } = renderHook(() => 
      useCardFilterDebounced(cardResults, 'live', 150)
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.length).toBe(1);
    expect(result.current[0].status).toBe('LIVE');
  });

  /**
   * Verify 'die' filter returns DIE and DECLINED
   */
  it('should filter DIE/DECLINED cards correctly', () => {
    const { result } = renderHook(() => 
      useCardFilterDebounced(cardResults, 'die', 150)
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.length).toBe(2);
    expect(result.current.every(r => r.status === 'DIE' || r.status === 'DECLINED')).toBe(true);
  });

  /**
   * Verify 'error' filter returns ERROR and RETRY
   */
  it('should filter ERROR/RETRY cards correctly', () => {
    const { result } = renderHook(() => 
      useCardFilterDebounced(cardResults, 'error', 150)
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.length).toBe(2);
    expect(result.current.every(r => r.status === 'ERROR' || r.status === 'RETRY')).toBe(true);
  });

  /**
   * Verify filter changes are debounced
   * Requirements: 3.5
   */
  it('should debounce filter changes', () => {
    const { result, rerender } = renderHook(
      ({ filter }) => useCardFilterDebounced(cardResults, filter, 150),
      { initialProps: { filter: 'all' } }
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current.length).toBe(6);

    // Change filter rapidly
    rerender({ filter: 'approved' });
    expect(result.current.length).toBe(6); // Still showing all

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current.length).toBe(1); // Now showing approved
  });
});

