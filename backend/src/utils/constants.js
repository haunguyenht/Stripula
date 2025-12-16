/**
 * Shared constants across the application
 */

// User agents for browser automation
export const BROWSER_USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
];

// User agents for API requests (includes mobile)
export const API_USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
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
    API_KEYS: 'https://api.stripe.com/v1/api_keys',
};

// Validation methods
export const VALIDATION_METHODS = {
    CHARGE: 'charge',
    NO_CHARGE: 'nocharge',
    SETUP: 'setup',
    DIRECT: 'direct'
};

// Default configuration
export const DEFAULTS = {
    PORT: 5001,
    CONCURRENCY: 3,
    MAX_CONCURRENCY: 10,
    PROXY_TEST_TIMEOUT: 5000,
    PROXY_MAX_FAIL_COUNT: 3,
    CHARGE_AMOUNT_MIN: 50,  // $0.50 in cents
    CHARGE_AMOUNT_MAX: 5000, // $50.00 in cents
};
