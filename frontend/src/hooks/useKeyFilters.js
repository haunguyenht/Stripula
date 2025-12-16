import { useMemo } from 'react';

/**
 * Hook for filtering key results
 */
export function useKeyFilters(results, filter) {
    return useMemo(() => {
        return results.filter(r => {
            if (filter === 'all') return true;
            if (filter === 'live') return r.status?.startsWith('LIVE');
            if (filter === 'dead') return r.status === 'DEAD';
            return true;
        });
    }, [results, filter]);
}

