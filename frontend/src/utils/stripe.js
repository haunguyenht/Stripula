/**
 * Stripe utility functions for data transformation and normalization
 */

/**
 * Transform legacy card results that stored card as object
 * Converts { card: { number, last4, expMonth, expYear } } to { card: "****1234", fullCard: "..." }
 */
export function transformLegacyCardResults(results) {
    if (!Array.isArray(results)) return [];
    return results.map(r => {
        if (r.card && typeof r.card === 'object') {
            const cardInfo = r.card;
            return {
                ...r,
                card: `****${cardInfo.last4 || '****'}`,
                fullCard: cardInfo.number 
                    ? `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}`
                    : r.fullCard
            };
        }
        return r;
    });
}

/**
 * Normalize card result from API response
 */
export function normalizeCardResult(result) {
    const cardInfo = result.card || {};
    const cardDisplay = typeof cardInfo === 'object'
        ? `****${cardInfo.last4 || '****'}`
        : cardInfo;
    const fullCard = typeof cardInfo === 'object'
        ? `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}`
        : cardInfo;
    
    return {
        ...result,
        card: cardDisplay,
        fullCard: fullCard
    };
}

/**
 * Calculate card stats from results array
 */
export function calculateCardStats(results) {
    const stats = {
        approved: 0,
        live: 0,
        die: 0,
        error: 0,
        total: results.length
    };
    
    results.forEach(r => {
        if (r.status === 'APPROVED' || r.status === 'LIVE') {
            stats.live++;
            stats.approved++;
        } else if (r.status === 'DIE') {
            stats.die++;
        } else if (r.status === 'ERROR' || r.status === 'RETRY') {
            stats.error++;
        }
    });
    
    return stats;
}

/**
 * Calculate key stats from results array
 */
export function calculateKeyStats(results) {
    const stats = {
        live: 0,
        livePlus: 0,
        liveZero: 0,
        liveNeg: 0,
        dead: 0,
        error: 0,
        total: results.length
    };
    
    results.forEach(r => {
        if (r.status === 'LIVE+') {
            stats.live++;
            stats.livePlus++;
        } else if (r.status === 'LIVE0') {
            stats.live++;
            stats.liveZero++;
        } else if (r.status === 'LIVE-') {
            stats.live++;
            stats.liveNeg++;
        } else if (r.status?.startsWith('LIVE')) {
            stats.live++;
        } else if (r.status === 'DEAD') {
            stats.dead++;
        } else if (r.status === 'ERROR') {
            stats.error++;
        }
    });
    
    return stats;
}

