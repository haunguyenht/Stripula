import axios from 'axios';
import { localBinLookupClient } from './LocalBinLookupClient.js';

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
 * Uses local CSV database as primary source, falls back to external APIs
 */
export class BinLookupClient {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Lookup BIN data - tries local database first, falls back to external APIs only if not found
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
        
        // Try local database first (primary source)
        let binData = await this._lookupLocal(bin);
        
        // Only fall back to external APIs if BIN not found in local database
        if (binData && binData.error && binData.error.includes('not found')) {
            binData = await this._lookupPrimary(bin);
            
            // If primary API fails, try fallback API
            if (!binData || binData.error) {
                binData = await this._lookupFallback(bin);
            }
        }
        
        // Cache successful results
        if (binData && !binData.error) {
            this.cache.set(bin, binData);
        }
        
        return binData;
    }

    /**
     * Local BIN lookup from CSV database
     * @private
     */
    async _lookupLocal(bin) {
        try {
            const result = await localBinLookupClient.lookup(bin);
            return result;
        } catch (error) {
            return { bin, error: `Local: ${error.message}` };
        }
    }

    /**
     * Primary BIN lookup - system-api.pro
     * @private
     */
    async _lookupPrimary(bin) {
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
                
                return {
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
            }
            
            return { bin, error: 'No data from primary' };
        } catch (error) {
            return { bin, error: `Primary: ${error.message}` };
        }
    }

    /**
     * Fallback BIN lookup - noxter.dev
     * @private
     */
    async _lookupFallback(bin) {
        try {
            const response = await axios.get(`https://noxter.dev/gate/bin?bin=${bin}`, {
                headers: {
                    'accept': 'application/json',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 5000
            });
            
            // Handle noxter.dev response format
            const data = response.data;
            if (data && (data.brand || data.scheme || data.type)) {
                const countryCode = data.country_code || data.countryCode || null;
                const countryEmoji = countryCodeToEmoji(countryCode);
                
                return {
                    bin,
                    scheme: data.brand || data.scheme || null,
                    type: data.type || null,
                    category: data.category || data.level || null,
                    country: data.country || data.country_name || null,
                    countryCode,
                    countryEmoji,
                    bank: data.bank || data.issuer || null,
                    bankPhone: null,
                    bankUrl: null,
                    cardLength: null,
                    luhn: null
                };
            }
            
            return { bin, error: 'No data from fallback' };
        } catch (error) {
            return { bin, error: `Fallback: ${error.message}` };
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
