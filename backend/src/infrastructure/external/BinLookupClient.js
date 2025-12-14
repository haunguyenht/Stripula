import axios from 'axios';

/**
 * BIN Lookup Client
 * Caches results to avoid repeated API calls
 */
export class BinLookupClient {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Lookup BIN data from binlist.io
     * @param {string} cardNumber - Full card number or first 6-8 digits
     * @returns {Promise<Object>}
     */
    async lookup(cardNumber) {
        const bin = cardNumber.replace(/\s/g, '').slice(0, 6);
        
        // Check cache first
        if (this.cache.has(bin)) {
            console.log(`[BIN] Cache hit for ${bin}`);
            return this.cache.get(bin);
        }
        
        try {
            const response = await axios.get(`https://binlist.io/lookup/${bin}/`, {
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    'referer': `https://binlist.io/${bin}/`,
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 5000
            });
            
            if (response.data && response.data.success !== false) {
                const binData = {
                    bin,
                    scheme: response.data.scheme || null,
                    type: response.data.type || null,
                    category: response.data.category || null,
                    country: response.data.country?.name || null,
                    countryCode: response.data.country?.alpha2 || null,
                    countryEmoji: response.data.country?.emoji || null,
                    bank: response.data.bank?.name || null,
                    bankPhone: response.data.bank?.phone || null,
                    bankUrl: response.data.bank?.url || null,
                    cardLength: response.data.number?.length || null,
                    luhn: response.data.number?.luhn || null
                };
                
                this.cache.set(bin, binData);
                console.log(`[BIN] ${bin} → ${binData.scheme} ${binData.type} | ${binData.bank} | ${binData.country}`);
                return binData;
            }
            
            return { bin, error: 'No data' };
        } catch (error) {
            console.log(`[BIN] Lookup failed for ${bin}: ${error.message}`);
            return { bin, error: error.message };
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Export singleton
export const binLookupClient = new BinLookupClient();
