/**
 * Stripe utility functions for data transformation and normalization
 * 
 * Note: calculateCardStats and calculateKeyStats have been moved to statistics.js
 * to avoid duplication. Import from '@/utils/statistics' if needed.
 */

/**
 * Transform legacy card results that stored card as object
 * Shows full card number without masking
 */
export function transformLegacyCardResults(results) {
    if (!Array.isArray(results)) return [];
    return results.map(r => {
        if (r.card && typeof r.card === 'object') {
            const cardInfo = r.card;
            const fullCard = cardInfo.number 
                ? `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}`
                : r.fullCard;
            return {
                ...r,
                card: fullCard,
                fullCard: fullCard
            };
        }
        return r;
    });
}
