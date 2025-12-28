/**
 * VirtualResultsList - Virtualized list for rendering large result sets
 * 
 * Uses @tanstack/react-virtual for efficient DOM rendering
 * Only renders visible items plus overscan buffer
 * 
 * Requirements:
 * - 3.1: Use virtualized rendering for >50 results
 * - 3.2: Render only visible items plus 5-item overscan buffer
 * - 3.4: Support dynamic item heights with measurement
 */

import { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

// Default virtualization threshold (Requirements 3.1)
const DEFAULT_VIRTUALIZATION_THRESHOLD = 50;

// Default overscan count (Requirements 3.2)
const DEFAULT_OVERSCAN = 5;

/**
 * VirtualResultsList Component
 * 
 * @param {Array} items - Array of items to render
 * @param {Function} renderItem - Function to render each item: (item, index) => ReactNode
 * @param {number} estimateSize - Estimated height of each item in pixels (default: 100)
 * @param {number} overscan - Number of items to render outside visible area (default: 5)
 * @param {string} className - Additional classes for container
 * @param {Function} getItemKey - Function to get unique key for item: (item, index) => string
 */
export function VirtualResultsList({
  items,
  renderItem,
  estimateSize = 100,
  overscan = DEFAULT_OVERSCAN,
  className,
  getItemKey,
}) {
  const parentRef = useRef(null);

  // Stable estimate size function (memoized to prevent re-renders)
  const getEstimateSize = useCallback(() => estimateSize, [estimateSize]);

  // Stable getItemKey function - use index if no custom key function
  // This prevents unnecessary re-renders when items array reference changes
  const stableGetItemKey = useCallback(
    (index) => {
      if (getItemKey && items[index]) {
        return getItemKey(items[index], index);
      }
      return index;
    },
    [getItemKey, items]
  );

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: getEstimateSize,
    overscan,
    getItemKey: stableGetItemKey,
  });

  // Get virtual items for rendering
  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={cn("h-full overflow-auto", className)}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              // measureElement ref enables dynamic height measurement (Requirements 3.4)
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="pb-3">
                {renderItem(item, virtualItem.index)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Hook to determine if virtualization should be used
 * Based on item count threshold (Requirements 3.1)
 * 
 * @param {number} itemCount - Number of items in the list
 * @param {number} threshold - Threshold above which virtualization is enabled (default: 50)
 * @returns {boolean} - Whether virtualization should be used
 */
export function useVirtualization(itemCount, threshold = DEFAULT_VIRTUALIZATION_THRESHOLD) {
  return itemCount > threshold;
}

