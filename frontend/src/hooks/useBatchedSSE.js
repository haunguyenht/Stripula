/**
 * useBatchedSSE - Batched SSE event processing hook
 * 
 * Accumulates SSE events and delivers them in batches to reduce UI updates.
 * Events are flushed when:
 * - Batch reaches max size (10 events)
 * - Timeout expires (50ms since first event in batch)
 * - Component unmounts
 * 
 * Requirements: 6.2 - SSE event batching for performance
 */
import { useRef, useCallback, useEffect } from 'react';

const BATCH_SIZE = 10;
const BATCH_TIMEOUT = 50; // ms

/**
 * Hook for batching SSE events to reduce UI update frequency
 * @param {Function} onBatch - Callback that receives batched events array
 * @returns {Object} { addEvent, flushBatch }
 */
export function useBatchedSSE(onBatch) {
  const batchRef = useRef([]);
  const timeoutRef = useRef(null);
  const onBatchRef = useRef(onBatch);
  
  // Keep callback ref updated to avoid stale closures
  useEffect(() => {
    onBatchRef.current = onBatch;
  }, [onBatch]);
  
  const flushBatch = useCallback(() => {
    if (batchRef.current.length > 0) {
      const batch = [...batchRef.current];
      batchRef.current = [];
      onBatchRef.current(batch);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  const addEvent = useCallback((event) => {
    batchRef.current.push(event);
    
    // Flush immediately if batch is full
    if (batchRef.current.length >= BATCH_SIZE) {
      flushBatch();
      return;
    }
    
    // Schedule flush after timeout if not already scheduled
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(flushBatch, BATCH_TIMEOUT);
    }
  }, [flushBatch]);
  
  // Cleanup on unmount - flush any remaining events
  useEffect(() => {
    return () => {
      // Flush remaining events before unmount
      if (batchRef.current.length > 0 && onBatchRef.current) {
        onBatchRef.current([...batchRef.current]);
        batchRef.current = [];
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);
  
  return { addEvent, flushBatch };
}

export default useBatchedSSE;
