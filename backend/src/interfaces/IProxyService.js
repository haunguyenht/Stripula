/**
 * Interface for proxy management services
 * Handles proxy rotation, health checking, and statistics
 */
export class IProxyService {
    /**
     * Get the next available proxy from the pool
     * @param {string|null} preferredType - Optional preferred proxy type
     * @returns {Promise<Proxy|null>}
     */
    async getNextProxy(preferredType = null) {
        throw new Error('Not implemented');
    }

    /**
     * Test if a proxy is working
     * @param {Proxy} proxy - Proxy to test
     * @returns {Promise<boolean>}
     */
    async testProxy(proxy) {
        throw new Error('Not implemented');
    }

    /**
     * Mark a proxy as failed
     * @param {string} proxyId - ID of the failed proxy
     */
    markProxyFailed(proxyId) {
        throw new Error('Not implemented');
    }

    /**
     * Mark a proxy as successful
     * @param {string} proxyId - ID of the successful proxy
     */
    markProxySuccess(proxyId) {
        throw new Error('Not implemented');
    }

    /**
     * Get proxy pool statistics
     * @returns {Object}
     */
    getStats() {
        throw new Error('Not implemented');
    }
}
