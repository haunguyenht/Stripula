/**
 * Session Pool for WooCommerce sites
 * Pre-registers sessions in background to speed up card validation
 * 
 * Instead of: validate card → register → get nonces → validate (slow)
 * Now: validate card → grab pre-registered session → validate (fast)
 */
export class SessionPool {
    constructor(wooClientFactory, options = {}) {
        this.wooClientFactory = wooClientFactory; // Function that creates WooCommerceClient
        this.poolSize = options.poolSize || 3;
        this.minReady = options.minReady || 1;
        this.refillConcurrency = options.refillConcurrency || 2; // Parallel refill workers
        this.siteId = options.siteId;
        
        this.readySessions = []; // Sessions ready to use
        this.refillInProgress = 0; // Count of active refill workers
        this.enabled = true;
        
        // Stats
        this.stats = {
            created: 0,
            used: 0,
            failed: 0,
            poolHits: 0,
            poolMisses: 0
        };
    }

    /**
     * Start the pool - begin pre-registering sessions
     */
    async start() {
        console.log(`[SessionPool:${this.siteId}] Starting pool (size: ${this.poolSize}, concurrency: ${this.refillConcurrency})`);
        this.enabled = true;
        // Start multiple refill workers in parallel
        for (let i = 0; i < this.refillConcurrency; i++) {
            this._refillWorker();
        }
    }

    /**
     * Stop the pool
     */
    stop() {
        console.log(`[SessionPool:${this.siteId}] Stopping pool`);
        this.enabled = false;
        this.readySessions = [];
    }

    /**
     * Get a ready session from pool, or create one on-demand
     * Returns: { session, nonces, fingerprint, pkKey, ... } or null
     */
    async getSession() {
        // Try to get from pool first
        if (this.readySessions.length > 0) {
            const sessionData = this.readySessions.shift();
            this.stats.poolHits++;
            this.stats.used++;
            console.log(`[SessionPool:${this.siteId}] Pool HIT - ${this.readySessions.length} remaining`);
            
            // Trigger refill if needed
            this._triggerRefill();
            
            return sessionData;
        }

        // Pool empty - create on demand (slower path)
        this.stats.poolMisses++;
        console.log(`[SessionPool:${this.siteId}] Pool MISS - creating on demand`);
        
        const client = this.wooClientFactory();
        const result = await client.registerAndGetNonces();
        
        if (result.success) {
            this.stats.created++;
            return result;
        }
        
        this.stats.failed++;
        return null;
    }

    /**
     * Trigger refill workers if pool is low
     */
    _triggerRefill() {
        const needed = this.poolSize - this.readySessions.length - this.refillInProgress;
        const workersToStart = Math.min(needed, this.refillConcurrency - this.refillInProgress);
        
        for (let i = 0; i < workersToStart; i++) {
            this._refillWorker();
        }
    }

    /**
     * Single refill worker - creates sessions until pool is full
     */
    async _refillWorker() {
        if (!this.enabled) return;
        if (this.readySessions.length >= this.poolSize) return;
        if (this.refillInProgress >= this.refillConcurrency) return;

        this.refillInProgress++;
        
        try {
            while (this.enabled && this.readySessions.length + this.refillInProgress <= this.poolSize) {
                console.log(`[SessionPool:${this.siteId}] Worker creating session... (${this.readySessions.length}/${this.poolSize}, ${this.refillInProgress} workers)`);
                
                const client = this.wooClientFactory();
                const result = await client.registerAndGetNonces();
                
                if (result.success) {
                    this.readySessions.push(result);
                    this.stats.created++;
                    console.log(`[SessionPool:${this.siteId}] Session ready (${this.readySessions.length}/${this.poolSize})`);
                    
                    // Check if pool is full
                    if (this.readySessions.length >= this.poolSize) {
                        break;
                    }
                } else {
                    this.stats.failed++;
                    console.log(`[SessionPool:${this.siteId}] Session creation failed: ${result.error}`);
                    // Small delay before retry on failure
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        } finally {
            this.refillInProgress--;
        }
    }

    /**
     * Get pool stats
     */
    getStats() {
        return {
            ...this.stats,
            ready: this.readySessions.length,
            poolSize: this.poolSize,
            refillInProgress: this.refillInProgress,
            hitRate: this.stats.poolHits / (this.stats.poolHits + this.stats.poolMisses) || 0
        };
    }

    /**
     * Check if pool has ready sessions
     */
    hasReadySessions() {
        return this.readySessions.length > 0;
    }

    /**
     * Get count of ready sessions
     */
    getReadyCount() {
        return this.readySessions.length;
    }
}

// Global pools per site
const pools = new Map();

/**
 * Get or create pool for a site
 */
export function getSessionPool(siteId, wooClientFactory, options = {}) {
    if (!pools.has(siteId)) {
        const pool = new SessionPool(wooClientFactory, { ...options, siteId });
        pools.set(siteId, pool);
    }
    return pools.get(siteId);
}

/**
 * Check if pool exists for site
 */
export function hasSessionPool(siteId) {
    return pools.has(siteId);
}

/**
 * Get all pool stats
 */
export function getAllPoolStats() {
    const stats = {};
    for (const [siteId, pool] of pools) {
        stats[siteId] = pool.getStats();
    }
    return stats;
}
