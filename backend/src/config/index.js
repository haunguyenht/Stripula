import dotenv from 'dotenv';

dotenv.config();

// Inline defaults to avoid circular dependency with constants.js
const DEFAULTS = {
    PORT: 5001,
    CONCURRENCY: 3,
    MAX_CONCURRENCY: 10,
    PROXY_TEST_TIMEOUT: 5000,
    CHARGE_AMOUNT_MIN: 50,
    CHARGE_AMOUNT_MAX: 200,
};

/**
 * Application configuration
 * Reload with: POST /api/config/reload
 */
export const config = {
    // Server
    port: parseInt(process.env.PORT) || DEFAULTS.PORT,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Validation
    defaultConcurrency: DEFAULTS.CONCURRENCY,
    maxConcurrency: DEFAULTS.MAX_CONCURRENCY,

    // Proxy test timeout (for per-gateway proxy testing)
    proxyTestTimeout: DEFAULTS.PROXY_TEST_TIMEOUT,

    // Charge amounts
    chargeAmountMin: DEFAULTS.CHARGE_AMOUNT_MIN,
    chargeAmountMax: DEFAULTS.CHARGE_AMOUNT_MAX,

    // Browser
    browserHeadless: process.env.BROWSER_HEADLESS !== 'false',

    // Debug
    debug: process.env.DEBUG === 'true',

    // Auth Sites Credentials (from .env)
    auth: {
        auth2: {
            email: process.env.AUTH2_EMAIL || '',
            password: process.env.AUTH2_PASSWORD || '',
        },
        auth3: {
            email: process.env.AUTH3_EMAIL || '',
            password: process.env.AUTH3_PASSWORD || '',
        }
    }
};

/**
 * Reload config from .env (hot reload)
 */
export function reloadConfig() {
    dotenv.config({ override: true });
    
    config.auth.auth2.email = process.env.AUTH2_EMAIL || '';
    config.auth.auth2.password = process.env.AUTH2_PASSWORD || '';
    config.auth.auth3.email = process.env.AUTH3_EMAIL || '';
    config.auth.auth3.password = process.env.AUTH3_PASSWORD || '';
    config.debug = process.env.DEBUG === 'true';
    
    return config;
}

export default config;
