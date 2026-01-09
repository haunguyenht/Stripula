import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert country code (ISO 3166-1 alpha-2) to flag emoji
 * @param {string} countryCode - Two-letter country code (e.g., 'US', 'GB')
 * @returns {string} Flag emoji or empty string
 */
function countryCodeToEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '';
    const code = countryCode.toUpperCase();
    const offset = 0x1F1E6 - 65;
    return String.fromCodePoint(
        code.charCodeAt(0) + offset,
        code.charCodeAt(1) + offset
    );
}

/**
 * Parse a CSV line handling quoted fields
 * @param {string} line - CSV line
 * @returns {string[]} Array of field values
 */
function parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    fields.push(current.trim());
    return fields;
}

/**
 * Local BIN Lookup Client
 * Uses local CSV database for instant lookups without external API calls
 */
export class LocalBinLookupClient {
    constructor() {
        this.binMap = new Map();
        this.loaded = false;
        this.loadPromise = null;
    }

    /**
     * Load BIN database from CSV file
     * @returns {Promise<void>}
     */
    async loadDatabase() {
        if (this.loaded) return;
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = this._loadFromCSV();
        await this.loadPromise;
        this.loaded = true;
    }

    /**
     * Internal method to load CSV data
     * @private
     */
    async _loadFromCSV() {
        const csvPath = path.resolve(__dirname, '../../utils/bin_database.csv');
        
        try {
            const content = fs.readFileSync(csvPath, 'utf-8');
            const lines = content.split('\n');
            
            // Skip header line
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const fields = parseCSVLine(line);
                if (fields.length < 10) continue;
                
                const [bin, brand, type, category, issuer, issuerPhone, issuerUrl, isoCode2, isoCode3, countryName] = fields;
                
                // Store with 6-digit BIN as key (pad with leading zeros if needed)
                const binKey = bin.padStart(6, '0');
                
                this.binMap.set(binKey, {
                    bin: binKey,
                    scheme: brand || null,
                    type: type || null,
                    category: category || null,
                    country: countryName || null,
                    countryCode: isoCode2 || null,
                    countryEmoji: countryCodeToEmoji(isoCode2),
                    bank: issuer || null,
                    bankPhone: issuerPhone || null,
                    bankUrl: issuerUrl || null,
                    cardLength: null,
                    luhn: null
                });
            }
            
            console.log(`[LocalBinLookup] Loaded ${this.binMap.size} BIN entries from database`);
        } catch (error) {
            console.error(`[LocalBinLookup] Failed to load BIN database: ${error.message}`);
            throw error;
        }
    }

    /**
     * Lookup BIN data from local database
     * @param {string} cardNumber - Full card number or first 6-8 digits
     * @returns {Promise<Object|null>}
     */
    async lookup(cardNumber) {
        if (!cardNumber) return null;
        
        // Ensure database is loaded
        await this.loadDatabase();
        
        const cleanNumber = cardNumber.replace(/\s/g, '');
        
        // Try 8-digit BIN first (extended BIN), then 6-digit
        const bin8 = cleanNumber.slice(0, 8).padStart(8, '0');
        const bin6 = cleanNumber.slice(0, 6).padStart(6, '0');
        
        // Check 8-digit first
        let binData = this.binMap.get(bin8);
        
        // Fall back to 6-digit
        if (!binData) {
            binData = this.binMap.get(bin6);
        }
        
        if (binData) {
            return { ...binData };
        }
        
        return { bin: bin6, error: 'BIN not found in local database' };
    }

    /**
     * Get database statistics
     * @returns {Object}
     */
    getStats() {
        return {
            loaded: this.loaded,
            totalEntries: this.binMap.size
        };
    }

    /**
     * Clear loaded data (for testing/memory management)
     */
    clear() {
        this.binMap.clear();
        this.loaded = false;
        this.loadPromise = null;
    }
}

// Export singleton
export const localBinLookupClient = new LocalBinLookupClient();
