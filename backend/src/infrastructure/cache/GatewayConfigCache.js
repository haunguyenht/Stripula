/**
 * GatewayConfigCache - TTL-based caching for gateway configurations
 * 
 * Provides efficient caching with automatic expiration to reduce database queries.
 * Implements get, set, invalidate, and getAll methods for gateway config management.
 * 
 * Requirements: 9.2 - Cache gateway configurations with 60-second TTL
 */
export class GatewayConfigCache {
    /**
     * Create a new GatewayConfigCache instance
     * 
     * @param {number} ttlMs - Time-to-live in milliseconds (default: 60000 = 60 seconds)
     */
    constructor(ttlMs = 60000) {
        this._cache = new Map();
        this._ttlMs = ttlMs;
    }

    /**
     * Get a cached value by key
     * 
     * Returns null if the key doesn't exist or has expired.
     * Automatically removes expired entries on access.
     * 
     * @param {string} key - Cache key (typically gateway_id)
     * @returns {*} Cached value or null if not found/expired
     */
    get(key) {
        const entry = this._cache.get(key);
        if (!entry) {
            return null;
        }

        // Check if entry has expired
        if (Date.now() > entry.expiresAt) {
            this._cache.delete(key);
            return null;
        }

        return entry.value;
    }

    /**
     * Set a value in the cache
     * 
     * The value will automatically expire after the configured TTL.
     * 
     * @param {string} key - Cache key (typically gateway_id)
     * @param {*} value - Value to cache
     */
    set(key, value) {
        this._cache.set(key, {
            value,
            expiresAt: Date.now() + this._ttlMs
        });
    }

    /**
     * Set multiple values in the cache at once
     * 
     * Useful for bulk loading gateway configs.
     * 
     * @param {Object} entries - Object with key-value pairs to cache
     */
    setAll(entries) {
        const expiresAt = Date.now() + this._ttlMs;
        for (const [key, value] of Object.entries(entries)) {
            this._cache.set(key, { value, expiresAt });
        }
    }

    /**
     * Invalidate cache entries
     * 
     * If a key is provided, only that entry is removed.
     * If no key is provided, the entire cache is cleared.
     * 
     * @param {string} [key] - Optional key to invalidate (clears all if not provided)
     */
    invalidate(key) {
        if (key) {
            this._cache.delete(key);
        } else {
            this._cache.clear();
        }
    }

    /**
     * Get all valid (non-expired) entries from the cache
     * 
     * Automatically removes expired entries during retrieval.
     * 
     * @returns {Object} Object with all valid cached entries keyed by gateway_id
     */
    getAll() {
        const now = Date.now();
        const result = {};

        for (const [key, entry] of this._cache) {
            if (now <= entry.expiresAt) {
                result[key] = entry.value;
            } else {
                // Clean up expired entry
                this._cache.delete(key);
            }
        }

        return result;
    }

    /**
     * Check if a key exists and is not expired
     * 
     * @param {string} key - Cache key to check
     * @returns {boolean} True if key exists and is valid
     */
    has(key) {
        const entry = this._cache.get(key);
        if (!entry) {
            return false;
        }

        if (Date.now() > entry.expiresAt) {
            this._cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Get the number of valid (non-expired) entries in the cache
     * 
     * Note: This performs a cleanup of expired entries.
     * 
     * @returns {number} Count of valid entries
     */
    size() {
        // Clean up expired entries and return count
        const now = Date.now();
        let count = 0;

        for (const [key, entry] of this._cache) {
            if (now <= entry.expiresAt) {
                count++;
            } else {
                this._cache.delete(key);
            }
        }

        return count;
    }

    /**
     * Get the configured TTL in milliseconds
     * 
     * @returns {number} TTL in milliseconds
     */
    getTTL() {
        return this._ttlMs;
    }

    /**
     * Update the TTL for future entries
     * 
     * Note: This does not affect existing cached entries.
     * 
     * @param {number} ttlMs - New TTL in milliseconds
     */
    setTTL(ttlMs) {
        if (typeof ttlMs !== 'number' || ttlMs <= 0) {
            throw new Error('TTL must be a positive number');
        }
        this._ttlMs = ttlMs;
    }

    /**
     * Clear all entries from the cache
     * 
     * Alias for invalidate() with no arguments.
     */
    clear() {
        this._cache.clear();
    }
}

export default GatewayConfigCache;
