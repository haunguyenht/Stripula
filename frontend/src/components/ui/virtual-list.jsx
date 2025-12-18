/**
 * VirtualResultsList - Virtualized list for rendering large result sets
 * 
 * Uses @tanstack/react-virtual for efficient DOM rendering
 * Only renders visible items plus overscan buffer
 */

import { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

/**
 * VirtualResultsList Component
 * 
 * @param {Array} items - Array of items to render
 * @param {Function} renderItem - Function to render each item: (item, index) => ReactNode
 * @param {number} estimateSize - Estimated height of each item in pixels (default: 120)
 * @param {number} overscan - Number of items to render outside visible area (default: 5)
 * @param {string} className - Additional classes for container
 * @param {Function} getItemKey - Function to get unique key for item: (item, index) => string
 */
export function VirtualResultsList({
  items,
  renderItem,
  estimateSize = 120,
  overscan = 5,
  className,
  getItemKey,
}) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: getItemKey ? (index) => getItemKey(items[index], index) : undefined,
  });

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
 * Based on item count threshold
 */
export function useVirtualization(itemCount, threshold = 50) {
  return itemCount > threshold;
}

