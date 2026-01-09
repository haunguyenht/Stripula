import { config } from '../config/index.js';

/**
 * Shared constants across the application
 */

// ═══════════════════════════════════════════════════════════════
// CENTRALIZED GATEWAY IDs
// All gateway IDs should be referenced from here
// ═══════════════════════════════════════════════════════════════

export const GATEWAY_IDS = {
    // Auth gateways (WooCommerce SetupIntent)
    AUTH_1: 'auth-1',
    AUTH_2: 'auth-2',
    AUTH_3: 'auth-3',
    
    // Charge gateways (PK-based)
    CHARGE_1: 'charge-1',
    CHARGE_2: 'charge-2',
    CHARGE_3: 'charge-3',
    
    // Auto Shopify API gateway (external API - charge type)
    AUTO_SHOPIFY_1: 'auto-shopify-1',
    
    // SK-Based Auth gateway (SetupIntent $0 auth with backend SK/PK keys)
    SKBASED_AUTH_1: 'skbased-auth-1',
    
    // SK-Based Charge gateway (user provides SK/PK keys from frontend)
    SKBASED_CHARGE_1: 'skbased-1',
    
    // Braintree Auth gateways
    BRAINTREE_AUTH_1: 'braintree-auth-1',
    BRAINTREE_AUTH_2: 'braintree-auth-2',
    BRAINTREE_AUTH_3: 'braintree-auth-3',
    
    // Braintree Charge gateways
    BRAINTREE_CHARGE_1: 'braintree-charge-1',
    BRAINTREE_CHARGE_2: 'braintree-charge-2',
    BRAINTREE_CHARGE_3: 'braintree-charge-3',
    
    // PayPal Charge gateways
    PAYPAL_CHARGE_1: 'paypal-charge-1',
    PAYPAL_CHARGE_2: 'paypal-charge-2',
    PAYPAL_CHARGE_3: 'paypal-charge-3',
    
    // Other Gate gateways
    CHARGE_AVS_1: 'charge-avs-1',
    SQUARE_CHARGE_1: 'square-charge-1',
    
    // Adyen Auth gateways
    ADYEN_AUTH_1: 'adyen-auth-1',
    ADYEN_AUTH_2: 'adyen-auth-2',
    ADYEN_AUTH_3: 'adyen-auth-3',
    
    // Adyen Charge gateways
    ADYEN_CHARGE_1: 'adyen-charge-1',
    ADYEN_CHARGE_2: 'adyen-charge-2',
    ADYEN_CHARGE_3: 'adyen-charge-3',
    
    // Target Charge gateways
    TARGET_CHARGE_1: 'target-charge-1',
    TARGET_CHARGE_2: 'target-charge-2',
    TARGET_CHARGE_3: 'target-charge-3',
};

// Default gateway IDs for each type
export const DEFAULT_GATEWAY_IDS = {
    AUTH: GATEWAY_IDS.AUTH_1,
    CHARGE: GATEWAY_IDS.CHARGE_1,
    AUTO_SHOPIFY: GATEWAY_IDS.AUTO_SHOPIFY_1,
    SKBASED_AUTH: GATEWAY_IDS.SKBASED_AUTH_1,
    SKBASED_CHARGE: GATEWAY_IDS.SKBASED_CHARGE_1,
    BRAINTREE_AUTH: GATEWAY_IDS.BRAINTREE_AUTH_1,
    BRAINTREE_CHARGE: GATEWAY_IDS.BRAINTREE_CHARGE_1,
    PAYPAL_CHARGE: GATEWAY_IDS.PAYPAL_CHARGE_1,
    CHARGE_AVS: GATEWAY_IDS.CHARGE_AVS_1,
    SQUARE_CHARGE: GATEWAY_IDS.SQUARE_CHARGE_1,
    ADYEN_AUTH: GATEWAY_IDS.ADYEN_AUTH_1,
    ADYEN_CHARGE: GATEWAY_IDS.ADYEN_CHARGE_1,
    TARGET_CHARGE: GATEWAY_IDS.TARGET_CHARGE_1,
};

// ═══════════════════════════════════════════════════════════════

// User agents for browser automation (Updated Dec 2024)
export const BROWSER_USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4; rv:133.0) Gecko/20100101 Firefox/133.0',
];

// User agents for API requests (includes mobile) - Updated Dec 2024
// Note: Windows 11 still uses "Windows NT 10.0" in UA string
export const API_USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4; rv:133.0) Gecko/20100101 Firefox/133.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPad; CPU OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
];

// Browser viewport sizes
export const VIEWPORTS = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
];

// US State abbreviations
export const STATE_ABBREV = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'district of columbia': 'DC',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL',
    'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA',
    'maine': 'ME', 'maryland': 'MD', 'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN',
    'mississippi': 'MS', 'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK', 'oregon': 'OR',
    'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD',
    'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT', 'virginia': 'VA',
    'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
};

// Stripe API endpoints
export const STRIPE_API = {
    BASE_URL: 'https://api.stripe.com/v1',
    PAYMENT_INTENTS: 'https://api.stripe.com/v1/payment_intents',
    PAYMENT_METHODS: 'https://api.stripe.com/v1/payment_methods',
    CUSTOMERS: 'https://api.stripe.com/v1/customers',
    CHARGES: 'https://api.stripe.com/v1/charges',
    REFUNDS: 'https://api.stripe.com/v1/refunds',
    TOKENS: 'https://api.stripe.com/v1/tokens',
    SOURCES: 'https://api.stripe.com/v1/sources',
    SETUP_INTENTS: 'https://api.stripe.com/v1/setup_intents',
    BALANCE: 'https://api.stripe.com/v1/balance',
    ACCOUNT: 'https://api.stripe.com/v1/account',
    CHECKOUT_SESSIONS: 'https://api.stripe.com/v1/checkout/sessions',
};

// Validation methods
export const VALIDATION_METHODS = {
    DIRECT_API: 'direct_api' // Direct API: PK token → Customer → Charge → Refund (no browser)
};

// Stripe API version for Checkout Sessions custom UI
export const STRIPE_API_VERSION = '2025-12-15.clover';

// Default configuration
export const DEFAULTS = {
    PORT: 5001,
    CONCURRENCY: 3,
    MAX_CONCURRENCY: 10,
    PROXY_TEST_TIMEOUT: 5000,
    PROXY_MAX_FAIL_COUNT: 3,
    CHARGE_AMOUNT_MIN: 50,  // $0.50 in cents
    CHARGE_AMOUNT_MAX: 200, // $2.00 in cents
};

// Stripe Auth validation methods
export const AUTH_METHODS = {
    WOOCOMMERCE: 'woocommerce',
    // Future: SHOPIFY, MAGENTO, etc.
};

/**
 * Gateway Type Hierarchy
 * 
 * Structure:
 *   STRIPE (parent)
 *     ├── auth - WooCommerce SetupIntent validation
 *     └── charge - SK-based charge validation
 *   SHOPIFY (parent)
 *     └── (amount-based checkout validation)
 * 
 * To add a new gateway:
 *   1. Add config to AUTH_SITES, CHARGE_SITES, or AUTO_SHOPIFY_API below
 *   2. Gateway auto-registers on startup via GatewayManagerService
 *   3. Pricing inherits from type defaults (can override per-gateway in admin)
 */
export const GATEWAY_TYPES = {
    STRIPE: {
        id: 'stripe',
        label: 'Stripe',
        subTypes: {
            AUTH: {
                id: 'auth',
                label: 'Auth (SetupIntent)',
                description: 'WooCommerce SetupIntent validation',
                prefix: 'auth-',
                defaultPricing: {
                    approved: { min: 3, max: 5 },
                    live: { min: 1, max: 3 },
                    dead: 0,
                    error: 0
                }
            },
            CHARGE: {
                id: 'charge',
                label: 'Charge (PK-based)',
                description: 'PK key charge validation',
                prefix: 'charge-',
                defaultPricing: {
                    approved: { min: 3, max: 5 },
                    live: { min: 1, max: 3 },
                    dead: 0,
                    error: 0
                }
            },
            SKBASED_AUTH: {
                id: 'skbased-auth',
                label: 'SK Auth ($0)',
                description: 'SK-based SetupIntent $0 authorization (no credits)',
                prefix: 'skbased-auth-',
                // No pricing - SK-based gateways don't deduct credits
                defaultPricing: null
            }
        }
    },
    SHOPIFY: {
        id: 'shopify',
        label: 'Shopify',
        subTypes: null,
        prefix: 'shopify-',
        description: 'Shopify checkout validation',
        defaultPricing: {
            approved: { min: 3, max: 5 },
            live: { min: 1, max: 3 },
            dead: 0,
            error: 0
        }
    }
};

/**
 * Helper to get gateway type info from gateway ID
 * @param {string} gatewayId - e.g., 'auth-1', 'charge-2', 'shopify-05', 'skbased-auth-1', 'skbased-1', 'braintree-auth-1'
 * @returns {{ parentType: string, subType: string|null }}
 */
export function getGatewayTypeInfo(gatewayId) {
    // Stripe gateways
    if (gatewayId.startsWith('auth-')) {
        return { parentType: 'stripe', subType: 'auth' };
    }
    if (gatewayId.startsWith('charge-') && !gatewayId.startsWith('charge-avs-')) {
        return { parentType: 'stripe', subType: 'charge' };
    }
    if (gatewayId.startsWith('skbased-auth-')) {
        return { parentType: 'stripe', subType: 'skbased-auth' };
    }
    if (gatewayId.startsWith('skbased-') && !gatewayId.startsWith('skbased-auth-')) {
        return { parentType: 'stripe', subType: 'skbased' };
    }
    
    // Shopify gateways
    if (gatewayId.startsWith('shopify-')) {
        return { parentType: 'shopify', subType: null };
    }
    
    // Braintree gateways
    if (gatewayId.startsWith('braintree-auth-')) {
        return { parentType: 'braintree', subType: 'auth' };
    }
    if (gatewayId.startsWith('braintree-charge-')) {
        return { parentType: 'braintree', subType: 'charge' };
    }
    
    // PayPal gateways
    if (gatewayId.startsWith('paypal-charge-')) {
        return { parentType: 'paypal', subType: 'charge' };
    }
    
    // Adyen gateways
    if (gatewayId.startsWith('adyen-auth-')) {
        return { parentType: 'adyen', subType: 'auth' };
    }
    if (gatewayId.startsWith('adyen-charge-')) {
        return { parentType: 'adyen', subType: 'charge' };
    }
    
    // Target gateways
    if (gatewayId.startsWith('target-charge-')) {
        return { parentType: 'target', subType: 'charge' };
    }
    
    // Other gate gateways
    if (gatewayId.startsWith('charge-avs-')) {
        return { parentType: 'other', subType: 'avs' };
    }
    if (gatewayId.startsWith('square-charge-')) {
        return { parentType: 'other', subType: 'square' };
    }
    
    return { parentType: 'unknown', subType: null };
}

// Auth site configurations for WooCommerce-based validation
// Labels are user-friendly gateway names
export const AUTH_SITES = {
    AUTH_1: {
        id: GATEWAY_IDS.AUTH_1,
        label: 'Gateway A',
        type: 'woocommerce',
        baseUrl: 'https://truegarden.com',
        accountUrl: 'https://truegarden.com/my-account/',
        paymentMethodUrl: 'https://truegarden.com/my-account/add-payment-method/',
        ajaxUrl: 'https://truegarden.com/wp-admin/admin-ajax.php',
        pkKey: 'pk_live_51RqREyFXs0h7m4DndIIaJHUxCxXjSIYGHupwS7aamIYaBn4lSbQrD3cqBCEQTnHzTSGbRFGjRrBtf39aBwwhgO9K00WC7ahRmC',
        patterns: {
            registerNonce: /name="woocommerce-register-nonce" value="([a-f0-9]+)"/,
            setupIntentNonce: /"createAndConfirmSetupIntentNonce":"([^"]+)"/,
            ajaxNonce: /name="_ajax_nonce" value="([^"]+)"/,
            ajaxUrl: /"ajax_url":"([^"]+)"/,
        },
        actions: {
            setupIntent: 'wc_stripe_create_and_confirm_setup_intent',
        }
    },
    AUTH_2: {
        id: GATEWAY_IDS.AUTH_2,
        label: 'Gateway B',
        type: 'woocommerce',
        baseUrl: 'https://www.cancelcancerafrica.org',
        accountUrl: 'https://www.cancelcancerafrica.org/my-account/',
        paymentMethodUrl: 'https://www.cancelcancerafrica.org/my-account/add-payment-method/',
        ajaxUrl: 'https://www.cancelcancerafrica.org/wp-admin/admin-ajax.php',
        pkKey: 'pk_live_Soug0XWw5V2JmpnWUpnrqNUz0006gfQ6CP',
        timeout: 45000,
        maxConcurrentRegistrations: 1, // For on-demand fallback only
        useSessionPool: true, // Pre-register sessions in background
        sessionPoolSize: 5, // Keep 5 sessions ready
        sessionPoolConcurrency: 2, // 2 parallel workers refilling pool
        patterns: {
            registerNonce: /name="woocommerce-register-nonce" value="([a-f0-9]+)"/,
            setupIntentNonce: /"createAndConfirmSetupIntentNonce":"([^"]+)"/,
        },
        actions: {
            setupIntent: 'wc_stripe_create_and_confirm_setup_intent',
        }
    },
    AUTH_3: {
        id: GATEWAY_IDS.AUTH_3,
        label: 'Gateway C',
        type: 'setupintent-login',
        baseUrl: 'https://www.yogateket.com',
        addCardUrl: 'https://www.yogateket.com/account/card/new?en',
        pkKey: 'pk_live_rGaysgmUgwTelyrFdWCUolmm',
        // Credentials loaded from .env via config
        get credentials() {
            return {
                email: config.auth.auth3.email,
                password: config.auth.auth3.password
            };
        },
        patterns: {
            setupIntentSecret: /data-secret="([^"]+)"/,
        }
    },
};

// Default auth site
export const DEFAULT_AUTH_SITE = AUTH_SITES.AUTH_1;

// Auto Shopify API configuration
// Uses external API: https://autoshopi.up.railway.app/?cc=cc&url=site&proxy=proxy
// User provides Shopify URL via frontend
export const AUTO_SHOPIFY_API = {
    BASE_URL: 'https://autoshopi.up.railway.app/',
    GATEWAY_ID: GATEWAY_IDS.AUTO_SHOPIFY_1,
    LABEL: 'Auto Shopify',
    DESCRIPTION: 'External Auto Shopify API - charge validation',
};

// Charge site configurations for donation-based validation
// Gateway 1: Remember.org (Australia) - $1 donation charge via API
// Gateway 2: Islamic Relief USA (Classy.org) - $1 donation charge via API
export const CHARGE_SITES = {
    CHARGE_1: {
        id: GATEWAY_IDS.CHARGE_1,
        label: 'Gateway 1',
        type: 'remember-org',
        chargeAmount: '$1',
        baseUrl: 'https://remember.org.au',
        donateUrl: 'https://remember.org.au/donate/',
        ajaxUrl: 'https://remember.org.au/wp-admin/admin-ajax.php',
        pkKey: 'pk_live_51P0v83B09gpyA2Juu5SSq35nUSMyDWVutWv5RAWYv2XeUviqlqhfV5JlBgK64uhOVb0LWcthjR2aJwo5NkNfimZr00g4SiBFrz',
        campaignId: '13890',
    },
    CHARGE_2: {
        id: GATEWAY_IDS.CHARGE_2,
        label: 'Gateway 2',
        type: 'irusa-classy',
        chargeAmount: '$1',
        baseUrl: 'https://donate.irusa.org',
        checkoutUrl: 'https://donate.irusa.org/checkout',
        apiUrl: 'https://donate.irusa.org/checkout/api',
        pkKey: 'pk_live_h5ocNWNpicLCfBJvLialXsb900SaJnJscz',
        campaignId: '577773',
        organizationId: '50681',
        designationId: '1835374',
        recaptchaSiteKey: '6LcwtHkpAAAAABHUXtvKCZQ645083zUdeimy8NlP',
    },
    CHARGE_3: {
        id: GATEWAY_IDS.CHARGE_3,
        label: 'Gateway 3',
        type: 'nmdp-classy',
        chargeAmount: '$1',
        baseUrl: 'https://giving.nmdp.org',
        checkoutUrl: 'https://giving.nmdp.org/checkout',
        apiUrl: 'https://giving.nmdp.org/checkout/api',
        pkKey: 'pk_live_h5ocNWNpicLCfBJvLialXsb900SaJnJscz',
        campaignId: '601169',
        organizationId: '85850',
        designationId: '1840090',
        recaptchaSiteKey: '6LcwtHkpAAAAABHUXtvKCZQ645083zUdeimy8NlP',
    },
};

// Default charge site
export const DEFAULT_CHARGE_SITE = CHARGE_SITES.CHARGE_1;

// SK-Based Auth site configurations for SetupIntent $0 authorization
// Uses backend-configured SK/PK keys for direct Stripe API validation
// NOTE: SK-Based gateways do NOT deduct credits - users provide their own keys
export const SKBASED_AUTH_SITES = {
    SKBASED_AUTH_1: {
        id: GATEWAY_IDS.SKBASED_AUTH_1,
        label: 'SK Auth 1',
        type: 'setupintent',
        description: 'SetupIntent $0 authorization with backend SK/PK keys (no credits)',
    },
};

// Default SK-based auth site
export const DEFAULT_SKBASED_AUTH_SITE = SKBASED_AUTH_SITES.SKBASED_AUTH_1;

// SK-Based Charge site configurations
// Uses user-provided SK/PK keys from frontend for charge with refund validation
// NOTE: SK-Based gateways do NOT deduct credits - users provide their own keys
export const SKBASED_CHARGE_SITES = {
    SKBASED_1: {
        id: GATEWAY_IDS.SKBASED_CHARGE_1,
        label: 'SK Charge 1',
        type: 'charge',
        description: 'SK-based charge with refund validation (no credits)',
    },
};

// Default SK-based charge site
export const DEFAULT_SKBASED_CHARGE_SITE = SKBASED_CHARGE_SITES.SKBASED_1;

// ═══════════════════════════════════════════════════════════════
// BRAINTREE GATEWAY CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════

// Braintree Auth site configurations
export const BRAINTREE_AUTH_SITES = {
    BRAINTREE_AUTH_1: {
        id: GATEWAY_IDS.BRAINTREE_AUTH_1,
        label: 'Braintree Auth 1',
        type: 'braintree-auth',
        baseUrl: '',
        description: 'Braintree authentication validation',
    },
    BRAINTREE_AUTH_2: {
        id: GATEWAY_IDS.BRAINTREE_AUTH_2,
        label: 'Braintree Auth 2',
        type: 'braintree-auth',
        baseUrl: '',
        description: 'Braintree authentication validation',
    },
    BRAINTREE_AUTH_3: {
        id: GATEWAY_IDS.BRAINTREE_AUTH_3,
        label: 'Braintree Auth 3',
        type: 'braintree-auth',
        baseUrl: '',
        description: 'Braintree authentication validation',
    },
};

// Default Braintree auth site
export const DEFAULT_BRAINTREE_AUTH_SITE = BRAINTREE_AUTH_SITES.BRAINTREE_AUTH_1;

// Braintree Charge site configurations
export const BRAINTREE_CHARGE_SITES = {
    BRAINTREE_CHARGE_1: {
        id: GATEWAY_IDS.BRAINTREE_CHARGE_1,
        label: 'Braintree Charge 1',
        type: 'braintree-charge',
        baseUrl: '',
        description: 'Braintree charge validation',
    },
    BRAINTREE_CHARGE_2: {
        id: GATEWAY_IDS.BRAINTREE_CHARGE_2,
        label: 'Braintree Charge 2',
        type: 'braintree-charge',
        baseUrl: '',
        description: 'Braintree charge validation',
    },
    BRAINTREE_CHARGE_3: {
        id: GATEWAY_IDS.BRAINTREE_CHARGE_3,
        label: 'Braintree Charge 3',
        type: 'braintree-charge',
        baseUrl: '',
        description: 'Braintree charge validation',
    },
};

// Default Braintree charge site
export const DEFAULT_BRAINTREE_CHARGE_SITE = BRAINTREE_CHARGE_SITES.BRAINTREE_CHARGE_1;

// ═══════════════════════════════════════════════════════════════
// PAYPAL GATEWAY CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════

// PayPal Charge site configurations
export const PAYPAL_CHARGE_SITES = {
    PAYPAL_CHARGE_1: {
        id: GATEWAY_IDS.PAYPAL_CHARGE_1,
        label: 'PayPal Charge 1',
        type: 'paypal-charge',
        baseUrl: '',
        description: 'PayPal charge validation',
    },
    PAYPAL_CHARGE_2: {
        id: GATEWAY_IDS.PAYPAL_CHARGE_2,
        label: 'PayPal Charge 2',
        type: 'paypal-charge',
        baseUrl: '',
        description: 'PayPal charge validation',
    },
    PAYPAL_CHARGE_3: {
        id: GATEWAY_IDS.PAYPAL_CHARGE_3,
        label: 'PayPal Charge 3',
        type: 'paypal-charge',
        baseUrl: '',
        description: 'PayPal charge validation',
    },
};

// Default PayPal charge site
export const DEFAULT_PAYPAL_CHARGE_SITE = PAYPAL_CHARGE_SITES.PAYPAL_CHARGE_1;

// ═══════════════════════════════════════════════════════════════
// OTHER GATE CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════

// Charge AVS site configurations
// Gateway: Qgiv (Fidya) - $1 donation charge with AVS validation
export const CHARGE_AVS_SITES = {
    CHARGE_AVS_1: {
        id: GATEWAY_IDS.CHARGE_AVS_1,
        label: 'Charge AVS 1',
        type: 'qgiv',
        chargeAmount: '$1',
        baseUrl: 'https://secure.qgiv.com',
        formUrl: 'https://secure.qgiv.com/for/fidy/embed',
        tokenizeUrl: 'https://secure.qgiv.com/api/v1/payment/tokenizePayment',
        submitUrl: 'https://secure.qgiv.com/api/v1/submit',
        formId: '1104493',
        description: 'Qgiv AVS charge validation',
    },
};

// Default Charge AVS site
export const DEFAULT_CHARGE_AVS_SITE = CHARGE_AVS_SITES.CHARGE_AVS_1;

// Square Charge site configurations
export const SQUARE_CHARGE_SITES = {
    SQUARE_CHARGE_1: {
        id: GATEWAY_IDS.SQUARE_CHARGE_1,
        label: 'Square Charge 1',
        type: 'square-charge',
        description: 'Square payment validation',
    },
};

// Default Square charge site
export const DEFAULT_SQUARE_CHARGE_SITE = SQUARE_CHARGE_SITES.SQUARE_CHARGE_1;

// ═══════════════════════════════════════════════════════════════
// ADYEN GATEWAY CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════

// Adyen Auth site configurations
export const ADYEN_AUTH_SITES = {
    ADYEN_AUTH_1: {
        id: GATEWAY_IDS.ADYEN_AUTH_1,
        label: 'Adyen Auth 1',
        type: 'adyen-auth',
        baseUrl: '',
        description: 'Adyen authentication validation',
    },
    ADYEN_AUTH_2: {
        id: GATEWAY_IDS.ADYEN_AUTH_2,
        label: 'Adyen Auth 2',
        type: 'adyen-auth',
        baseUrl: '',
        description: 'Adyen authentication validation',
    },
    ADYEN_AUTH_3: {
        id: GATEWAY_IDS.ADYEN_AUTH_3,
        label: 'Adyen Auth 3',
        type: 'adyen-auth',
        baseUrl: '',
        description: 'Adyen authentication validation',
    },
};

// Default Adyen auth site
export const DEFAULT_ADYEN_AUTH_SITE = ADYEN_AUTH_SITES.ADYEN_AUTH_1;

// Adyen Charge site configurations
export const ADYEN_CHARGE_SITES = {
    ADYEN_CHARGE_1: {
        id: GATEWAY_IDS.ADYEN_CHARGE_1,
        label: 'Adyen Charge 1',
        type: 'adyen-charge',
        baseUrl: '',
        description: 'Adyen charge validation',
    },
    ADYEN_CHARGE_2: {
        id: GATEWAY_IDS.ADYEN_CHARGE_2,
        label: 'Adyen Charge 2',
        type: 'adyen-charge',
        baseUrl: '',
        description: 'Adyen charge validation',
    },
    ADYEN_CHARGE_3: {
        id: GATEWAY_IDS.ADYEN_CHARGE_3,
        label: 'Adyen Charge 3',
        type: 'adyen-charge',
        baseUrl: '',
        description: 'Adyen charge validation',
    },
};

// Default Adyen charge site
export const DEFAULT_ADYEN_CHARGE_SITE = ADYEN_CHARGE_SITES.ADYEN_CHARGE_1;

// ═══════════════════════════════════════════════════════════════
// TARGET GATEWAY CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════

// Target Charge site configurations
export const TARGET_CHARGE_SITES = {
    TARGET_CHARGE_1: {
        id: GATEWAY_IDS.TARGET_CHARGE_1,
        label: 'Target Charge 1',
        type: 'target-charge',
        baseUrl: '',
        description: 'Target charge validation',
    },
    TARGET_CHARGE_2: {
        id: GATEWAY_IDS.TARGET_CHARGE_2,
        label: 'Target Charge 2',
        type: 'target-charge',
        baseUrl: '',
        description: 'Target charge validation',
    },
    TARGET_CHARGE_3: {
        id: GATEWAY_IDS.TARGET_CHARGE_3,
        label: 'Target Charge 3',
        type: 'target-charge',
        baseUrl: '',
        description: 'Target charge validation',
    },
};

// Default Target charge site
export const DEFAULT_TARGET_CHARGE_SITE = TARGET_CHARGE_SITES.TARGET_CHARGE_1;

// ═══════════════════════════════════════════════════════════════
// GATEWAY LABELS - Friendly display names for gateway IDs
// ═══════════════════════════════════════════════════════════════

export const GATEWAY_LABELS = {
    // Auth gateways
    'auth-1': 'Auth 1',
    'auth-2': 'Auth 2',
    'auth-3': 'Auth 3',
    // Charge gateways
    'charge-1': 'Charge 1',
    'charge-2': 'Charge 2',
    'charge-3': 'Charge 3',
    // SK-Based gateways
    'skbased-auth-1': 'SK Auth 1',
    'skbased-auth': 'SK Auth',
    'skbased-1': 'SK Charge 1',
    // Auto Shopify
    'auto-shopify-1': 'Auto Shopify',
    // Braintree gateways
    'braintree-auth-1': 'BT Auth 1',
    'braintree-auth-2': 'BT Auth 2',
    'braintree-auth-3': 'BT Auth 3',
    'braintree-charge-1': 'BT Charge 1',
    'braintree-charge-2': 'BT Charge 2',
    'braintree-charge-3': 'BT Charge 3',
    // PayPal gateways
    'paypal-charge-1': 'PayPal 1',
    'paypal-charge-2': 'PayPal 2',
    'paypal-charge-3': 'PayPal 3',
    // Other gateways
    'charge-avs-1': 'AVS Charge 1',
    'square-charge-1': 'Square 1',
    // Adyen gateways
    'adyen-auth-1': 'Adyen Auth 1',
    'adyen-auth-2': 'Adyen Auth 2',
    'adyen-auth-3': 'Adyen Auth 3',
    'adyen-charge-1': 'Adyen Charge 1',
    'adyen-charge-2': 'Adyen Charge 2',
    'adyen-charge-3': 'Adyen Charge 3',
    // Target gateways
    'target-charge-1': 'Target 1',
    'target-charge-2': 'Target 2',
    'target-charge-3': 'Target 3',
};

/**
 * Get friendly label for a gateway ID
 * @param {string} gatewayId - The gateway ID
 * @returns {string} Friendly label or the original ID if not found
 */
export function getGatewayLabel(gatewayId) {
    if (!gatewayId) return '';
    return GATEWAY_LABELS[gatewayId] || gatewayId;
}


