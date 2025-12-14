import dotenv from 'dotenv';
import { DEFAULTS } from '../utils/constants.js';

dotenv.config();

/**
 * Application configuration
 */
export const config = {
    // Server
    port: parseInt(process.env.PORT) || DEFAULTS.PORT,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Validation
    defaultConcurrency: DEFAULTS.CONCURRENCY,
    maxConcurrency: DEFAULTS.MAX_CONCURRENCY,

    // Proxy
    proxyTestTimeout: DEFAULTS.PROXY_TEST_TIMEOUT,
    proxyMaxFailCount: DEFAULTS.PROXY_MAX_FAIL_COUNT,

    // Charge amounts
    chargeAmountMin: DEFAULTS.CHARGE_AMOUNT_MIN,
    chargeAmountMax: DEFAULTS.CHARGE_AMOUNT_MAX,

    // Browser
    browserHeadless: process.env.BROWSER_HEADLESS !== 'false',

    // Debug
    debug: process.env.DEBUG === 'true'
};

export default config;
