/**
 * Statistics utility functions for validation results
 * Used by KeysValidationPanel and CardsValidationPanel
 */

/**
 * Calculate statistics from an array of key validation results
 * @param {Array} results - Array of key result objects with status property
 * @returns {Object} Statistics object with counts by status
 */
export function calculateKeyStats(results) {
    const stats = {
        live: 0,
        livePlus: 0,
        liveZero: 0,
        liveNeg: 0,
        dead: 0,
        error: 0,
        total: 0,
    };

    if (!Array.isArray(results)) {
        return stats;
    }

    for (const result of results) {
        if (!result?.status) continue;
        
        const status = result.status;
        
        if (status === 'LIVE+') {
            stats.live++;
            stats.livePlus++;
        } else if (status === 'LIVE0') {
            stats.live++;
            stats.liveZero++;
        } else if (status === 'LIVE-') {
            stats.live++;
            stats.liveNeg++;
        } else if (status === 'LIVE') {
            stats.live++;
        } else if (status === 'DEAD') {
            stats.dead++;
        } else if (status === 'ERROR') {
            stats.error++;
        }
    }

    stats.total = stats.live + stats.dead + stats.error;
    return stats;
}

/**
 * Calculate statistics from an array of card validation results
 * @param {Array} results - Array of card result objects with status property
 * @returns {Object} Statistics object with counts by status
 */
export function calculateCardStats(results) {
    const stats = {
        approved: 0,
        live: 0,
        die: 0,
        error: 0,
        total: 0,
    };

    if (!Array.isArray(results)) {
        return stats;
    }

    for (const result of results) {
        if (!result?.status) continue;
        
        const status = result.status;
        
        if (status === 'APPROVED') {
            stats.approved++;
        } else if (status === 'LIVE') {
            stats.live++;
        } else if (status === 'DIE' || status === 'DEAD' || status === 'DECLINED') {
            stats.die++;
        } else if (status === 'ERROR' || status === 'RETRY') {
            stats.error++;
        }
    }

    stats.total = stats.approved + stats.live + stats.die + stats.error;
    return stats;
}

/**
 * Filter results by status category
 * @param {Array} results - Array of result objects
 * @param {string} filter - Filter type: 'all', 'live', 'dead', 'die', 'error', 'approved'
 * @returns {Array} Filtered results
 */
export function filterResults(results, filter) {
    if (!Array.isArray(results)) {
        return [];
    }

    if (filter === 'all') {
        return results;
    }

    return results.filter(result => {
        if (!result?.status) return false;
        
        const status = result.status;
        
        switch (filter) {
            case 'live':
                return status.startsWith('LIVE');
            case 'dead':
                return status === 'DEAD';
            case 'die':
                // Include all declined/dead card statuses
                return status === 'DIE' || status === 'DEAD' || status === 'DECLINED';
            case 'error':
                return status === 'ERROR' || status === 'RETRY';
            case 'approved':
                return status === 'APPROVED';
            default:
                return true;
        }
    });
}

/**
 * Count non-empty lines in input string
 * For keys: counts lines starting with 'sk_'
 * For cards: counts non-empty lines
 * @param {string} input - Input string
 * @param {string} type - 'keys' or 'cards'
 * @returns {number} Line count
 */
export function countInputLines(input, type = 'cards') {
    if (typeof input !== 'string') {
        return 0;
    }

    const lines = input.split('\n');
    
    if (type === 'keys') {
        return lines.filter(line => line.trim() && line.trim().startsWith('sk_')).length;
    }
    
    // For cards, count non-empty lines
    return lines.filter(line => line.trim()).length;
}


/**
 * Delete a result from the results array and return updated stats
 * @param {Array} results - Array of result objects
 * @param {number} index - Index of result to delete
 * @param {string} type - 'keys' or 'cards'
 * @returns {Object} Object containing { newResults, newStats }
 */
export function deleteResultAndUpdateStats(results, index, type = 'keys') {
    if (!Array.isArray(results) || index < 0 || index >= results.length) {
        return {
            newResults: results || [],
            newStats: type === 'keys' ? calculateKeyStats(results) : calculateCardStats(results),
        };
    }

    const deletedResult = results[index];
    const newResults = results.filter((_, i) => i !== index);
    
    // Recalculate stats from the new results array
    const newStats = type === 'keys' 
        ? calculateKeyStats(newResults) 
        : calculateCardStats(newResults);

    return { newResults, newStats, deletedResult };
}
