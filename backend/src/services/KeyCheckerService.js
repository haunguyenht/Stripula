/**
 * Key Checker Service
 * Handles Stripe API key validation
 */
export class KeyCheckerService {
    constructor(options = {}) {
        this.stripeClient = options.stripeClient;
    }

    /**
     * Check a single SK key
     * @param {string} skKey - Stripe secret key
     * @returns {Promise<Object>}
     */
    async checkKey(skKey) {
        if (!skKey || !skKey.startsWith('sk_')) {
            return { status: 'ERROR', message: 'Invalid SK key format' };
        }

        console.log(`[KeyChecker] Checking: ${skKey.slice(0, 12)}...${skKey.slice(-4)}`);

        try {
            const result = await this.stripeClient.checkKey(skKey);
            
            const logMsg = result.status === 'DEAD' 
                ? `✗ DEAD - ${result.message}`
                : `✓ ${result.status} | ${result.accountEmail} | ${(result.availableBalance / 100).toFixed(2)} ${result.currency}`;
            
            console.log(`[KeyChecker] ${logMsg}`);
            return result;

        } catch (error) {
            const message = error.response?.data?.error?.message || error.message;
            console.log(`[KeyChecker] ✗ ERROR - ${message}`);
            return { status: 'DEAD', message };
        }
    }

    /**
     * Check multiple SK keys
     * @param {string[]} keys - Array of SK keys
     * @param {Object} options - { onProgress, onResult }
     * @returns {Promise<Object>}
     */
    async checkKeys(keys, options = {}) {
        const { onProgress = null, onResult = null, delayMs = 500 } = options;

        const results = [];
        const summary = { live: 0, livePlus: 0, liveZero: 0, liveNeg: 0, dead: 0, error: 0, total: 0 };

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i].trim();
            if (!key.startsWith('sk_')) continue;

            const result = await this.checkKey(key);
            result.key = `${key.slice(0, 12)}...${key.slice(-4)}`;
            result.fullKey = key;

            if (result.status?.startsWith('LIVE')) {
                results.push(result);
                summary.live++;
                if (result.status === 'LIVE+') summary.livePlus++;
                else if (result.status === 'LIVE0') summary.liveZero++;
                else if (result.status === 'LIVE-') summary.liveNeg++;
            } else if (result.status === 'DEAD') {
                summary.dead++;
            } else {
                summary.error++;
            }

            summary.total = summary.live + summary.dead + summary.error;

            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: keys.length,
                    percentage: Math.round(((i + 1) / keys.length) * 100),
                    summary
                });
            }

            if (onResult) {
                onResult(result);
            }

            // Delay between requests
            if (i < keys.length - 1 && delayMs > 0) {
                await new Promise(r => setTimeout(r, delayMs));
            }
        }

        return { results, summary };
    }
}
