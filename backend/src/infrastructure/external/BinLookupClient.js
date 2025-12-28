import axios from 'axios';

/**
 * Convert country code (ISO 3166-1 alpha-2) to flag emoji
 * @param {string} countryCode - Two-letter country code (e.g., 'US', 'GB')
 * @returns {string} Flag emoji or empty string
 */
function countryCodeToEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '';
    const code = countryCode.toUpperCase();
    // Convert each letter to regional indicator symbol
    const offset = 0x1F1E6 - 65; // 'A' = 65, regional indicator A = 0x1F1E6
    return String.fromCodePoint(
        code.charCodeAt(0) + offset,
        code.charCodeAt(1) + offset
    );
}

/**
 * BIN Lookup Client
 * Caches results to avoid repeated API calls
 */
export class BinLookupClient {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Lookup BIN data from system-api.pro
     * @param {string} cardNumber - Full card number or first 6-8 digits
     * @returns {Promise<Object>}
     */
    async lookup(cardNumber) {
        if (!cardNumber) return null;
        const bin = cardNumber.replace(/\s/g, '').slice(0, 6);
        
        // Check cache first
        if (this.cache.has(bin)) {
            return this.cache.get(bin);
        }
        
        try {
            const response = await axios.get(`https://system-api.pro/bin/${bin}`, {
                headers: {
                    'accept': 'application/json',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 5000
            });
            
            if (response.data && response.data.success === true) {
                const countryCode = response.data.country?.code || null;
                const countryEmoji = countryCodeToEmoji(countryCode);
                
                const binData = {
                    bin,
                    scheme: response.data.card?.brand || null,
                    type: response.data.card?.type || null,
                    category: response.data.card?.category || null,
                    country: response.data.country?.name || null,
                    countryCode,
                    countryEmoji,
                    bank: response.data.issuer?.name || null,
                    bankPhone: response.data.issuer?.phone || null,
                    bankUrl: response.data.issuer?.website || null,
                    cardLength: null,
                    luhn: null
                };
                
                this.cache.set(bin, binData);
                return binData;
            }
            
            return { bin, error: 'No data' };
        } catch (error) {
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
