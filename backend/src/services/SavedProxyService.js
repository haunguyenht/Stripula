import { supabase, isSupabaseConfigured } from '../infrastructure/database/SupabaseClient.js';

/**
 * SavedProxyService
 * Manages saved proxy configurations in the database
 */
export class SavedProxyService {
    constructor() {
        this.tableName = 'saved_proxies';
    }

    /**
     * Get all active saved proxies
     * @returns {Promise<Array>} List of saved proxies
     */
    async getAll() {
        if (!isSupabaseConfigured()) {
            return [];
        }

        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('is_active', true)
            .order('last_used_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch saved proxies:', error);
            throw new Error('Failed to fetch saved proxies');
        }

        return data || [];
    }

    /**
     * Get a saved proxy by ID
     * @param {string} id - Proxy ID
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        if (!isSupabaseConfigured()) {
            return null;
        }

        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error('Failed to fetch saved proxy');
        }

        return data;
    }

    /**
     * Save a new proxy or update existing one
     * @param {Object} proxyConfig - Proxy configuration
     * @param {string} adminId - Admin user ID
     * @returns {Promise<Object>} Saved proxy
     */
    async save(proxyConfig, adminId = null) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const { host, port, type, username, password, label } = proxyConfig;

        if (!host || !port) {
            throw new Error('Host and port are required');
        }

        // Check if proxy already exists
        const { data: existing } = await supabase
            .from(this.tableName)
            .select('id')
            .eq('host', host)
            .eq('port', port)
            .eq('username', username || '')
            .single();

        if (existing) {
            // Update existing proxy
            const { data, error } = await supabase
                .from(this.tableName)
                .update({
                    type: type || 'http',
                    password: password || null,
                    label: label || null,
                    updated_at: new Date().toISOString(),
                    last_used_at: new Date().toISOString(),
                    use_count: supabase.rpc ? undefined : existing.use_count + 1,
                    is_active: true
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) {
                throw new Error('Failed to update saved proxy');
            }

            // Increment use count (RPC might not exist, ignore errors)
            try {
                await supabase.rpc('increment_proxy_use_count', { proxy_id: existing.id });
            } catch {
                // RPC function might not exist, ignore
            }

            return data;
        }

        // Create new proxy
        const { data, error } = await supabase
            .from(this.tableName)
            .insert({
                host,
                port: parseInt(port, 10),
                type: type || 'http',
                username: username || null,
                password: password || null,
                label: label || null,
                created_by: adminId || null,
                last_used_at: new Date().toISOString(),
                use_count: 1
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to save proxy:', error);
            throw new Error('Failed to save proxy');
        }

        return data;
    }

    /**
     * Delete a saved proxy (soft delete)
     * @param {string} id - Proxy ID
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const { error } = await supabase
            .from(this.tableName)
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            throw new Error('Failed to delete saved proxy');
        }

        return true;
    }

    /**
     * Record proxy usage (update last_used_at and increment use_count)
     * @param {string} id - Proxy ID
     */
    async recordUsage(id) {
        if (!isSupabaseConfigured()) {
            return;
        }

        try {
            await supabase
                .from(this.tableName)
                .update({
                    last_used_at: new Date().toISOString(),
                    use_count: supabase.sql`use_count + 1`
                })
                .eq('id', id);
        } catch {
            // Ignore errors - usage tracking is not critical
        }
    }

    /**
     * Format proxy for API response (with full password)
     * @param {Object} proxy - Database proxy record
     * @returns {Object}
     */
    formatProxy(proxy) {
        return {
            id: proxy.id,
            label: proxy.label,
            host: proxy.host,
            port: proxy.port,
            type: proxy.type,
            username: proxy.username,
            password: proxy.password,
            lastUsedAt: proxy.last_used_at,
            useCount: proxy.use_count,
            createdAt: proxy.created_at
        };
    }
}

export default SavedProxyService;
