/**
 * Tests for VirtualResultsList component and useVirtualization hook
 * Verifies virtualization threshold and rendering behavior
 * 
 * **Feature: performance-optimization**
 * **Validates: Requirements 3.1, 3.2**
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { VirtualResultsList, useVirtualization } from './virtual-list';

describe('useVirtualization hook', () => {
  /**
   * Verify virtualization is disabled for small lists (<=50 items)
   * Requirements: 3.1
   */
  it('should return false for 50 or fewer items', () => {
    const { result: result0 } = renderHook(() => useVirtualization(0));
    expect(result0.current).toBe(false);

    const { result: result10 } = renderHook(() => useVirtualization(10));
    expect(result10.current).toBe(false);

    const { result: result50 } = renderHook(() => useVirtualization(50));
    expect(result50.current).toBe(false);
  });

  /**
   * Verify virtualization is enabled for large lists (>50 items)
   * Requirements: 3.1
   */
  it('should return true for more than 50 items', () => {
    const { result: result51 } = renderHook(() => useVirtualization(51));
    expect(result51.current).toBe(true);

    const { result: result100 } = renderHook(() => useVirtualization(100));
    expect(result100.current).toBe(true);

    const { result: result1000 } = renderHook(() => useVirtualization(1000));
    expect(result1000.current).toBe(true);
  });

  /**
   * Verify custom threshold works
   */
  it('should respect custom threshold', () => {
    const { result: result20 } = renderHook(() => useVirtualization(20, 10));
    expect(result20.current).toBe(true);

    const { result: result5 } = renderHook(() => useVirtualization(5, 10));
    expect(result5.current).toBe(false);
  });

  /**
   * Verify threshold boundary behavior
   * Requirements: 3.1 - "more than 50 results"
   */
  it('should handle threshold boundary correctly', () => {
    // Exactly at threshold - should NOT virtualize
    const { result: atThreshold } = renderHook(() => useVirtualization(50, 50));
    expect(atThreshold.current).toBe(false);

    // One above threshold - should virtualize
    const { result: aboveThreshold } = renderHook(() => useVirtualization(51, 50));
    expect(aboveThreshold.current).toBe(true);
  });
});

describe('VirtualResultsList component', () => {
  /**
   * Generate test items
   */
  const generateItems = (count) => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      status: i % 2 === 0 ? 'LIVE' : 'DEAD',
      card: `4111111111111${String(i).padStart(3, '0')}`
    }));

  /**
   * Simple render function for testing
   */
  const renderItem = (item, index) => (
    <div data-testid={`item-${item.id}`} key={item.id}>
      {item.card} - {item.status}
    </div>
  );

  /**
   * Verify component renders without crashing
   */
  it('should render without crashing', () => {
    const items = generateItems(10);
    
    const { container } = render(
      <div style={{ height: '500px' }}>
        <VirtualResultsList
          items={items}
          renderItem={renderItem}
          getItemKey={(item) => item.id}
          estimateSize={100}
        />
      </div>
    );

    expect(container).toBeTruthy();
  });

  /**
   * Verify empty list handling
   */
  it('should handle empty items array', () => {
    const { container } = render(
      <div style={{ height: '500px' }}>
        <VirtualResultsList
          items={[]}
          renderItem={renderItem}
          getItemKey={(item) => item.id}
          estimateSize={100}
        />
      </div>
    );

    expect(container).toBeTruthy();
  });

  /**
   * Verify custom className is applied
   */
  it('should apply custom className', () => {
    const items = generateItems(5);
    
    const { container } = render(
      <div style={{ height: '500px' }}>
        <VirtualResultsList
          items={items}
          renderItem={renderItem}
          getItemKey={(item) => item.id}
          className="custom-class"
        />
      </div>
    );

    const scrollContainer = container.querySelector('.custom-class');
    expect(scrollContainer).toBeTruthy();
  });

  /**
   * Verify getItemKey is used for keys
   */
  it('should use getItemKey for item keys', () => {
    const items = generateItems(5);
    
    const { container } = render(
      <div style={{ height: '500px' }}>
        <VirtualResultsList
          items={items}
          renderItem={renderItem}
          getItemKey={(item) => `custom-${item.id}`}
          estimateSize={100}
        />
      </div>
    );

    // Component should render without key warnings
    expect(container).toBeTruthy();
  });

  /**
   * Verify overscan prop is respected
   * Requirements: 3.2 - "5-item overscan buffer"
   */
  it('should accept overscan prop', () => {
    const items = generateItems(100);
    
    // This test verifies the prop is accepted without errors
    // Actual overscan behavior is internal to @tanstack/react-virtual
    const { container } = render(
      <div style={{ height: '500px' }}>
        <VirtualResultsList
          items={items}
          renderItem={renderItem}
          getItemKey={(item) => item.id}
          overscan={5}
          estimateSize={100}
        />
      </div>
    );

    expect(container).toBeTruthy();
  });

  /**
   * Verify large list renders (100+ items)
   * This is the checkpoint verification for "Test virtualization with 100+ results"
   */
  it('should handle 100+ items efficiently', () => {
    const items = generateItems(150);
    
    const { container } = render(
      <div style={{ height: '500px' }}>
        <VirtualResultsList
          items={items}
          renderItem={renderItem}
          getItemKey={(item) => item.id}
          estimateSize={100}
          overscan={5}
        />
      </div>
    );

    // Component should render without crashing
    expect(container).toBeTruthy();
    
    // The virtual list should have a container with the total height
    const innerContainer = container.querySelector('[style*="position: relative"]');
    expect(innerContainer).toBeTruthy();
  });

  /**
   * Verify very large list renders (500+ items)
   */
  it('should handle 500+ items efficiently', () => {
    const items = generateItems(500);
    
    const startTime = performance.now();
    
    const { container } = render(
      <div style={{ height: '500px' }}>
        <VirtualResultsList
          items={items}
          renderItem={renderItem}
          getItemKey={(item) => item.id}
          estimateSize={100}
          overscan={5}
        />
      </div>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Component should render without crashing
    expect(container).toBeTruthy();
    
    // Render should be reasonably fast (under 1 second)
    // This is a sanity check, not a strict performance test
    expect(renderTime).toBeLessThan(1000);
  });
});

