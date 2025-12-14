import { IProxyService } from '../interfaces/IProxyService.js';
import { Proxy } from '../domain/Proxy.js';
import { proxyAgentFactory } from '../infrastructure/http/ProxyAgentFactory.js';
import axios from 'axios';

/**
 * Proxy Manager Service
 * Manages proxy pool with automatic failover and rotation
 * Implements IProxyService interface
 */
export class ProxyManagerService extends IProxyService {
    constructor(options = {}) {
        super();
        this.proxies = [];
        this.enabled = false;
        this.failedProxies = new Set();
        this.testUrl = options.testUrl || 'https://www.google.com';
        this.maxFailCount = options.maxFailCount || 3;
        this.testTimeout = options.testTimeout || 5000;
        this.proxyFactory = options.proxyFactory || proxyAgentFactory;
    }

    /**
     * Add a proxy to the pool
     */
    addProxy(proxy) {
        const proxyEntity = proxy instanceof Proxy ? proxy : new Proxy(proxy);
        this.proxies.push(proxyEntity);
        return proxyEntity;
    }

    /**
     * Set proxy list
     */
    setProxies(proxies) {
        this.proxies = proxies.map(p => p instanceof Proxy ? p : new Proxy(p));
        this.failedProxies.clear();
    }

    /**
     * Get all proxies
     */
    getAllProxies() {
        return this.proxies;
    }

    /**
     * Remove proxy by ID
     */
    removeProxy(id) {
        const index = this.proxies.findIndex(p => p.id === id);
        if (index !== -1) {
            this.proxies.splice(index, 1);
            this.failedProxies.delete(id);
            return true;
        }
        return false;
    }

    /**
     * Enable/disable proxy usage
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Check if proxies are enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Get next working proxy
     */
    async getNextProxy(preferredType = null) {
        if (!this.enabled || this.proxies.length === 0) {
            return null;
        }

        let candidates = this.proxies.filter(p => p.enabled);
        if (candidates.length === 0) return null;

        // Filter by type if specified
        if (preferredType) {
            const typeFiltered = candidates.filter(p => p.type === preferredType);
            if (typeFiltered.length > 0) {
                candidates = typeFiltered;
            }
        }

        // Exclude failed proxies
        const working = candidates.filter(p => 
            !this.failedProxies.has(p.id) && p.status !== 'failed'
        );

        if (working.length === 0) {
            // Reset failed proxies and try again
            this.failedProxies.clear();
            return this.getNextProxy(preferredType);
        }

        // Random selection
        const randomIndex = Math.floor(Math.random() * working.length);
        return working[randomIndex];
    }

    /**
     * Test a proxy
     */
    async testProxy(proxy) {
        const agent = this.proxyFactory.create(proxy);
        if (!agent) {
            return { success: false, error: 'Failed to create proxy agent' };
        }

        try {
            const startTime = Date.now();
            const response = await axios.get(this.testUrl, {
                httpAgent: agent,
                httpsAgent: agent,
                proxy: false,
                timeout: this.testTimeout,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const responseTime = Date.now() - startTime;
            return {
                success: response.status === 200,
                responseTime: `${responseTime}ms`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Test all proxies with auto-removal of dead ones
     */
    async testAllProxies(concurrency = 50) {
        console.log(`[ProxyManager] Testing ${this.proxies.length} proxies...`);
        const startTime = Date.now();
        const results = [];
        const removed = [];

        for (let i = 0; i < this.proxies.length; i += concurrency) {
            const batch = this.proxies.slice(i, i + concurrency);
            
            const batchResults = await Promise.all(
                batch.map(async (proxy) => {
                    const result = await this.testProxy(proxy);
                    
                    if (result.success) {
                        proxy.status = 'working';
                        proxy.successCount++;
                        proxy.failCount = 0;
                        this.failedProxies.delete(proxy.id);
                    } else {
                        proxy.status = 'failed';
                        proxy.failCount++;
                        this.failedProxies.add(proxy.id);
                        
                        if (proxy.failCount >= this.maxFailCount) {
                            removed.push({ id: proxy.id, host: proxy.toString(), reason: result.error });
                            proxy.markedForRemoval = true;
                        }
                    }
                    
                    proxy.lastTested = new Date().toISOString();
                    return { id: proxy.id, ...result };
                })
            );

            results.push(...batchResults);
        }

        // Remove dead proxies
        if (removed.length > 0) {
            this.proxies = this.proxies.filter(p => !p.markedForRemoval);
            console.log(`[ProxyManager] Removed ${removed.length} dead proxies`);
        }

        const elapsed = Date.now() - startTime;
        const working = results.filter(r => r.success).length;
        console.log(`[ProxyManager] Test complete: ${working}/${this.proxies.length} working in ${elapsed}ms`);

        return {
            results,
            removed,
            stats: {
                total: this.proxies.length,
                working,
                failed: results.filter(r => !r.success).length,
                removed: removed.length,
                elapsed: `${elapsed}ms`
            }
        };
    }

    /**
     * Mark proxy as failed
     */
    markProxyFailed(proxyId) {
        this.failedProxies.add(proxyId);
        const proxy = this.proxies.find(p => p.id === proxyId);
        if (proxy) {
            proxy.failCount++;
            proxy.status = 'failed';
        }
    }

    /**
     * Mark proxy as successful
     */
    markProxySuccess(proxyId) {
        this.failedProxies.delete(proxyId);
        const proxy = this.proxies.find(p => p.id === proxyId);
        if (proxy) {
            proxy.successCount++;
            proxy.status = 'working';
        }
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            total: this.proxies.length,
            enabled: this.proxies.filter(p => p.enabled).length,
            working: this.proxies.filter(p => p.status === 'working').length,
            failed: this.proxies.filter(p => p.status === 'failed').length,
            untested: this.proxies.filter(p => p.status === 'untested').length,
            proxyEnabled: this.enabled
        };
    }
}
