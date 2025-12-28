import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client
 * 
 * Provides configured Supabase client instance for database operations.
 * Uses service key for backend operations (bypasses RLS).
 */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Validate required environment variables
const _isConfigured = Boolean(supabaseUrl && supabaseServiceKey);
if (!_isConfigured) {
}

/**
 * Supabase client instance configured with service key
 * Service key bypasses Row Level Security for backend operations
 * Only created if environment variables are configured
 */
export const supabase = _isConfigured 
    ? createClient(
        supabaseUrl,
        supabaseServiceKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            },
            db: {
                schema: 'public'
            }
        }
    )
    : null;

/**
 * Check if Supabase is properly configured
 * @returns {boolean} True if configured
 */
export function isSupabaseConfigured() {
    return _isConfigured && supabase !== null;
}

/**
 * Test database connection
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function testConnection() {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { data, error } = await supabase
            .from('gateway_configs')
            .select('gateway_id')
            .limit(1);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

export default supabase;
