import { useMemo } from 'react';

/**
 * Hook for filtering card results
 */
export function useCardFilters(results, filter) {
    return useMemo(() => {
        return results.filter(r => {
            if (filter === 'all') return true;
            if (filter === 'approved') return r.status === 'APPROVED';
            if (filter === 'live') return r.status === 'LIVE';
            if (filter === 'die') return r.status === 'DIE';
            if (filter === 'error') return r.status === 'ERROR' || r.status === 'RETRY';
            return true;
        });
    }, [results, filter]);
}

