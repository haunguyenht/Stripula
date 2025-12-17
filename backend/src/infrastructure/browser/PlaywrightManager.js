import { chromium } from 'playwright';
import { IBrowserService } from '../../interfaces/IBrowserService.js';
import { getRandomBrowserUserAgent, getRandomViewport } from '../../utils/helpers.js';
import { generateRealisticIdentity, generateIdentityForBin } from '../../utils/identity.js';
import { binLookupClient } from '../external/BinLookupClient.js';

/**
 * Playwright Browser Manager
 * Optimized for speed with anti-fraud measures
 */
export class PlaywrightManager extends IBrowserService {
    constructor(options = {}) {
        super();
        this.browser = null;
        this.headless = options.headless ?? true;
        this.serverPort = options.serverPort || process.env.PORT || 5001;
        
        // Page pool for batch operations
        this.pagePool = [];
        this.maxPoolSize = options.maxPoolSize || 3;
    }

    /**
     * Get or create browser instance
     * @private
     */
    async getBrowser() {
        if (this.browser && this.browser.isConnected()) {
            return this.browser;
        }

        const launchOptions = {
            headless: this.headless,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-infobars',
                '--window-size=1920,1080',
            ]
        };

        console.log(`[Playwright] Launching browser (headless: ${this.headless})`);
        this.browser = await chromium.launch(launchOptions);
        return this.browser;
    }

    /**
     * Create a new browser context with anti-detection
     * @private
     */
    async createContext() {
        const browser = await this.getBrowser();
        const userAgent = getRandomBrowserUserAgent();
        const viewport = getRandomViewport();

        const context = await browser.newContext({
            userAgent,
            viewport,
            locale: 'en-US',
            timezoneId: this.getRandomTimezone(),
            geolocation: this.getRandomGeolocation(),
            permissions: ['geolocation'],
            bypassCSP: true,
            colorScheme: 'light',
            deviceScaleFactor: Math.random() > 0.5 ? 1 : 2,
            hasTouch: Math.random() > 0.7,
            isMobile: false,
        });

        // Advanced anti-detection
        await context.addInitScript(() => {
            // Hide webdriver
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            
            // Fake plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => {
                    const plugins = [
                        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                        { name: 'Native Client', filename: 'internal-nacl-plugin' }
                    ];
                    plugins.length = 3;
                    return plugins;
                }
            });
            
            // Fake languages
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            
            // Fake hardware concurrency
            Object.defineProperty(navigator, 'hardwareConcurrency', { 
                get: () => [2, 4, 8, 12, 16][Math.floor(Math.random() * 5)] 
            });
            
            // Fake device memory
            Object.defineProperty(navigator, 'deviceMemory', { 
                get: () => [4, 8, 16][Math.floor(Math.random() * 3)] 
            });
            
            // Override permissions query
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => {
                if (parameters.name === 'notifications') {
                    return Promise.resolve({ state: 'denied' });
                }
                return originalQuery(parameters);
            };
            
            // Add fake Chrome runtime
            window.chrome = { runtime: {} };
        });

        return { context, userAgent, viewport };
    }

    /**
     * Get random US timezone
     * @private
     */
    getRandomTimezone() {
        const timezones = [
            'America/New_York', 'America/Chicago', 'America/Denver',
            'America/Los_Angeles', 'America/Phoenix', 'America/Detroit'
        ];
        return timezones[Math.floor(Math.random() * timezones.length)];
    }

    /**
     * Get random US geolocation
     * @private
     */
    getRandomGeolocation() {
        const locations = [
            { latitude: 40.7128, longitude: -74.0060 },  // NYC
            { latitude: 34.0522, longitude: -118.2437 }, // LA
            { latitude: 41.8781, longitude: -87.6298 },  // Chicago
            { latitude: 29.7604, longitude: -95.3698 },  // Houston
            { latitude: 33.4484, longitude: -112.0740 }, // Phoenix
        ];
        return locations[Math.floor(Math.random() * locations.length)];
    }

    /**
     * Human-like delay
     * @private
     */
    async humanDelay(min = 50, max = 150) {
        const delay = Math.floor(Math.random() * (max - min) + min);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Type with human-like speed (character by character with random delays)
     * @private
     */
    async humanType(frame, selector, text) {
        const element = frame.locator(selector);
        for (const char of text) {
            await element.type(char, { delay: Math.floor(Math.random() * 50) + 30 });
        }
    }

    /**
     * Create PaymentMethod with anti-fraud measures
     * @param {string} pkKey - Stripe publishable key
     * @param {Card} card - Card entity
     * @param {Object} options - Optional: billingDetails, binData (to avoid duplicate lookups)
     * @returns {Promise<Object>}
     */
    async createPaymentMethod(pkKey, card, options = {}) {
        const { context, userAgent, viewport } = await this.createContext();
        const page = await context.newPage();

        console.log(`[Playwright] Creating PaymentMethod for ${card.number}`);
        console.log(`[Playwright] UA: ${userAgent.slice(0, 50)}... | Viewport: ${viewport.width}x${viewport.height}`);

        try {
            // Use provided BIN data or lookup (avoid duplicate lookups)
            const binData = options.binData || await binLookupClient.lookup(card.number);
            
            // Generate identity matching card country (anti-fraud)
            const identity = options.billingDetails || await generateIdentityForBin(binData);
            console.log(`[Playwright] Identity: ${identity.fullName} | ${identity.city}, ${identity.state} ${identity.zip} | ${identity.country}`);

            // Build checkout URL with billing params
            const billingParams = new URLSearchParams({
                pk: pkKey,
                name: identity.fullName,
                email: identity.email,
                street: identity.street,
                city: identity.city,
                state: identity.state,
                zip: identity.zip,
                country: identity.country,
                phone: identity.phone || ''
            });

            const checkoutUrl = `http://localhost:${this.serverPort}/checkout?${billingParams.toString()}`;
            console.log(`[Playwright] Loading checkout page...`);

            // Load page
            await page.goto(checkoutUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 12000
            });

            // Wait for Stripe elements to be ready
            console.log(`[Playwright] Waiting for Stripe elements...`);
            await page.waitForFunction(() => window.stripeElementsReady === true, { timeout: 12000 });

            // Human-like delay before filling
            await this.humanDelay(100, 300);

            // Get iframe locators - use specific selector to avoid Link button iframes
            // Stripe adds additional iframes for Link, we want only the input frames
            const cardNumberFrame = page.frameLocator('#card-number iframe[name^="__privateStripeFrame"]').first();
            const cardExpiryFrame = page.frameLocator('#card-expiry iframe[name^="__privateStripeFrame"]').first();
            const cardCvcFrame = page.frameLocator('#card-cvc iframe[name^="__privateStripeFrame"]').first();

            // Fill card number with slight human-like behavior
            console.log(`[Playwright] Filling card: ${card.number}`);
            
            // Fill sequentially with small delays between fields (more human-like)
            await cardNumberFrame.locator('input[name="cardnumber"]').fill(card.number);
            await this.humanDelay(80, 200);
            
            const expStr = `${card.expMonth}${card.expYear.slice(-2)}`;
            await cardExpiryFrame.locator('input[name="exp-date"]').fill(expStr);
            await this.humanDelay(60, 150);
            
            await cardCvcFrame.locator('input[name="cvc"]').fill(card.cvv);
            await this.humanDelay(100, 250);

            // Wait for card validation
            await page.waitForFunction(() => window.isCardComplete() || window.getCardErrors(), { timeout: 3000 }).catch(() => {});
            
            // Check for input errors
            const inputError = await page.evaluate(() => window.getCardErrors());
            if (inputError) {
                console.log(`[Playwright] ✗ Input error: ${inputError}`);
                await context.close();
                return { success: false, error: inputError };
            }

            // Wait for Radar session to be created (if not already)
            await page.waitForFunction(() => window.getRadarSession() !== null, { timeout: 2000 }).catch(() => {});

            // Submit with human-like delay
            await this.humanDelay(150, 350);
            console.log(`[Playwright] Submitting...`);
            
            await page.evaluate(() => {
                window.stripeResult = undefined;
                window.submitCard();
            });

            // Wait for result
            await page.waitForFunction(() => window.stripeResult !== undefined, { timeout: 20000 });
            const result = await page.evaluate(() => window.stripeResult);

            await context.close();

            if (result.error) {
                console.log(`[Playwright] ✗ Failed: ${result.error}`);
                return { 
                    success: false, 
                    error: result.error,
                    code: result.code,
                    decline_code: result.decline_code,
                    type: result.type
                };
            }

            console.log(`[Playwright] ✓ PaymentMethod: ${result.paymentMethodId}`);
            return {
                success: true,
                paymentMethodId: result.paymentMethodId,
                card: result.card,
                billingDetails: result.billingDetails,
                radarSession: result.radarSession,
                binData
            };

        } catch (error) {
            console.log(`[Playwright] ✗ Error: ${error.message}`);
            await context.close();
            return { success: false, error: error.message };
        }
    }

    /**
     * Create PaymentMethod with page reuse for batch operations
     * @param {string} pkKey - Stripe publishable key
     * @param {Card} card - Card entity
     * @param {Object} options - Options including reuseContext
     * @returns {Promise<Object>}
     */
    async createPaymentMethodFast(pkKey, card, options = {}) {
        const { context: existingContext, page: existingPage } = options;
        
        let context = existingContext;
        let page = existingPage;
        let shouldCloseContext = false;

        try {
            if (!context || !page) {
                const created = await this.createContext();
                context = created.context;
                page = await context.newPage();
                shouldCloseContext = true;

                const binData = await binLookupClient.lookup(card.number);
                const identity = await generateIdentityForBin(binData);
                
                const billingParams = new URLSearchParams({
                    pk: pkKey,
                    name: identity.fullName,
                    email: identity.email,
                    street: identity.street,
                    city: identity.city,
                    state: identity.state,
                    zip: identity.zip,
                    country: identity.country,
                    phone: identity.phone || ''
                });

                const checkoutUrl = `http://localhost:${this.serverPort}/checkout?${billingParams.toString()}`;
                await page.goto(checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
                await page.waitForFunction(() => window.stripeElementsReady === true, { timeout: 12000 });
            }

            // Clear previous inputs
            await page.evaluate(() => {
                window.stripeResult = undefined;
                if (window.stripeElements) {
                    window.stripeElements.cardNumber.clear();
                    window.stripeElements.cardExpiry.clear();
                    window.stripeElements.cardCvc.clear();
                }
            });

            await this.humanDelay(50, 100);

            // Fill card data - use specific selector to avoid Link button iframes
            const cardNumberFrame = page.frameLocator('#card-number iframe[name^="__privateStripeFrame"]').first();
            const cardExpiryFrame = page.frameLocator('#card-expiry iframe[name^="__privateStripeFrame"]').first();
            const cardCvcFrame = page.frameLocator('#card-cvc iframe[name^="__privateStripeFrame"]').first();
            const expStr = `${card.expMonth}${card.expYear.slice(-2)}`;

            await cardNumberFrame.locator('input[name="cardnumber"]').fill(card.number);
            await this.humanDelay(50, 100);
            await cardExpiryFrame.locator('input[name="exp-date"]').fill(expStr);
            await this.humanDelay(50, 100);
            await cardCvcFrame.locator('input[name="cvc"]').fill(card.cvv);

            await this.humanDelay(100, 200);

            // Submit
            await page.evaluate(() => {
                window.stripeResult = undefined;
                window.submitCard();
            });

            await page.waitForFunction(() => window.stripeResult !== undefined, { timeout: 20000 });
            const result = await page.evaluate(() => window.stripeResult);

            if (shouldCloseContext) {
                await context.close();
            }

            if (result.error) {
                return { 
                    success: false, 
                    error: result.error,
                    code: result.code,
                    decline_code: result.decline_code
                };
            }

            return {
                success: true,
                paymentMethodId: result.paymentMethodId,
                card: result.card,
                context: shouldCloseContext ? null : context,
                page: shouldCloseContext ? null : page
            };

        } catch (error) {
            if (shouldCloseContext && context) {
                await context.close();
            }
            return { success: false, error: error.message };
        }
    }

    /**
     * Confirm SetupIntent with card - Most accurate CVV validation
     * Uses confirmCardSetup which provides real cvc_check result
     * @param {string} pkKey - Stripe publishable key
     * @param {string} clientSecret - SetupIntent client_secret
     * @param {Card} card - Card entity
     * @param {Object} billingDetails - Optional billing details
     * @returns {Promise<Object>}
     */
    async confirmSetupIntent(pkKey, clientSecret, card, billingDetails = null) {
        const { context, userAgent, viewport } = await this.createContext();
        const page = await context.newPage();

        console.log(`[Playwright] Confirming SetupIntent for ${card.number}`);

        try {
            // Lookup BIN to get card country
            const binData = await binLookupClient.lookup(card.number);
            
            // Generate identity matching card country
            const identity = billingDetails || await generateIdentityForBin(binData);
            console.log(`[Playwright] Identity: ${identity.fullName} | ${identity.country}`);

            // Build setup checkout URL
            const billingParams = new URLSearchParams({
                pk: pkKey,
                client_secret: clientSecret,
                name: identity.fullName,
                email: identity.email,
                street: identity.street,
                city: identity.city,
                state: identity.state,
                zip: identity.zip,
                country: identity.country,
                phone: identity.phone || ''
            });

            const checkoutUrl = `http://localhost:${this.serverPort}/setup-checkout?${billingParams.toString()}`;
            console.log(`[Playwright] Loading setup page...`);

            await page.goto(checkoutUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 12000
            });

            // Wait for elements
            await page.waitForFunction(() => window.stripeElementsReady === true, { timeout: 12000 });
            await this.humanDelay(100, 300);

            // Get iframe locators - use specific selector to avoid Link button iframes
            const cardNumberFrame = page.frameLocator('#card-number iframe[name^="__privateStripeFrame"]').first();
            const cardExpiryFrame = page.frameLocator('#card-expiry iframe[name^="__privateStripeFrame"]').first();
            const cardCvcFrame = page.frameLocator('#card-cvc iframe[name^="__privateStripeFrame"]').first();

            // Fill card with human-like delays
            console.log(`[Playwright] Filling card: ${card.number}`);
            
            await cardNumberFrame.locator('input[name="cardnumber"]').fill(card.number);
            await this.humanDelay(80, 200);
            
            const expStr = `${card.expMonth}${card.expYear.slice(-2)}`;
            await cardExpiryFrame.locator('input[name="exp-date"]').fill(expStr);
            await this.humanDelay(60, 150);
            
            await cardCvcFrame.locator('input[name="cvc"]').fill(card.cvv);
            await this.humanDelay(100, 250);

            // Wait for validation
            await page.waitForFunction(() => window.isCardComplete() || window.getCardErrors(), { timeout: 3000 }).catch(() => {});
            
            const inputError = await page.evaluate(() => window.getCardErrors());
            if (inputError) {
                console.log(`[Playwright] ✗ Input error: ${inputError}`);
                await context.close();
                return { success: false, error: inputError };
            }

            // Wait for Radar
            await page.waitForFunction(() => window.getRadarSession() !== null, { timeout: 2000 }).catch(() => {});

            // Confirm SetupIntent
            await this.humanDelay(150, 350);
            console.log(`[Playwright] Confirming SetupIntent...`);
            
            await page.evaluate(() => {
                window.stripeResult = undefined;
                window.confirmSetup();
            });

            // Wait for result (SetupIntent confirmation can take longer)
            await page.waitForFunction(() => window.stripeResult !== undefined, { timeout: 30000 });
            const result = await page.evaluate(() => window.stripeResult);

            await context.close();

            if (result.error) {
                console.log(`[Playwright] ✗ Failed: ${result.error}`);
                return { 
                    success: false, 
                    error: result.error,
                    code: result.code,
                    decline_code: result.decline_code,
                    type: result.type
                };
            }

            console.log(`[Playwright] ✓ SetupIntent confirmed | CVV: ${result.cvcCheck}`);
            return {
                success: true,
                setupIntentId: result.setupIntentId,
                paymentMethodId: result.paymentMethodId,
                status: result.status,
                cvcCheck: result.cvcCheck,
                radarSession: result.radarSession,
                binData
            };

        } catch (error) {
            console.log(`[Playwright] ✗ Error: ${error.message}`);
            await context.close();
            return { success: false, error: error.message };
        }
    }

    /**
     * Fill Checkout Session form (Stripe Checkout Sessions API with custom UI)
     * @param {string} pkKey - Stripe publishable key
     * @param {string} clientSecret - Checkout Session client_secret
     * @param {Card} card - Card entity
     * @returns {Promise<Object>}
     */
    async fillCheckoutSession(pkKey, clientSecret, card) {
        const { context, userAgent, viewport } = await this.createContext();
        const page = await context.newPage();

        console.log(`[Playwright] Checkout Session for ${card.number}`);
        console.log(`[Playwright] UA: ${userAgent.slice(0, 50)}... | Viewport: ${viewport.width}x${viewport.height}`);

        try {
            // Lookup BIN for identity
            const binData = await binLookupClient.lookup(card.number);
            const identity = await generateIdentityForBin(binData);
            console.log(`[Playwright] Identity: ${identity.fullName} | ${identity.country}`);

            // Build URL with params
            const params = new URLSearchParams({
                pk: pkKey,
                client_secret: clientSecret,
                email: identity.email,
                name: identity.fullName
            });

            const checkoutUrl = `http://localhost:${this.serverPort}/checkout-sessions?${params.toString()}`;
            console.log(`[Playwright] Loading checkout session page...`);

            await page.goto(checkoutUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 15000
            });

            // Wait for checkout to be ready
            console.log(`[Playwright] Waiting for checkout to initialize...`);
            await page.waitForFunction(() => window.isCheckoutReady?.() === true, { timeout: 20000 });

            await this.humanDelay(200, 400);

            // The Payment Element in Checkout Sessions uses a different structure
            // It's a single iframe with all card fields
            const paymentFrame = page.frameLocator('#payment-element iframe').first();
            
            // Wait for card number field
            await paymentFrame.locator('input[name="cardnumber"], input[name="number"]').waitFor({ timeout: 10000 });
            
            console.log(`[Playwright] Filling card: ${card.number}`);
            
            // Fill card number
            await paymentFrame.locator('input[name="cardnumber"], input[name="number"]').fill(card.number);
            await this.humanDelay(80, 150);
            
            // Fill expiry
            const expStr = `${card.expMonth}${card.expYear.slice(-2)}`;
            await paymentFrame.locator('input[name="exp-date"], input[name="expiry"]').fill(expStr);
            await this.humanDelay(60, 120);
            
            // Fill CVC
            await paymentFrame.locator('input[name="cvc"]').fill(card.cvv);
            await this.humanDelay(100, 200);

            // Submit
            console.log(`[Playwright] Submitting checkout...`);
            await page.evaluate(() => window.submitCheckout());

            // Wait for result
            await page.waitForFunction(() => window.getCheckoutResult?.() !== undefined, { timeout: 30000 });
            const result = await page.evaluate(() => window.getCheckoutResult());

            await context.close();

            if (result.error) {
                console.log(`[Playwright] ✗ Checkout failed: ${result.error}`);
                return {
                    success: false,
                    error: result.error,
                    code: result.code,
                    decline_code: result.decline_code
                };
            }

            console.log(`[Playwright] ✓ Checkout succeeded`);
            return {
                success: true,
                binData
            };

        } catch (error) {
            console.log(`[Playwright] ✗ Error: ${error.message}`);
            await context.close();
            return { success: false, error: error.message };
        }
    }

    /**
     * Fill and submit card on Stripe Checkout page
     * @param {string} checkoutUrl - Stripe Checkout URL
     * @param {Card} card - Card entity
     * @returns {Promise<Object>}
     */
    async fillCheckoutPage(checkoutUrl, card) {
        const { context } = await this.createContext();
        const page = await context.newPage();

        console.log(`[Playwright] Loading Checkout URL...`);

        try {
            await page.goto(checkoutUrl, { waitUntil: 'networkidle', timeout: 30000 });

            const cardInput = page.locator('#cardNumber, input[name="cardNumber"]');
            await cardInput.waitFor({ state: 'visible', timeout: 15000 });

            await cardInput.fill(card.number);
            await page.locator('#cardExpiry, input[name="cardExpiry"]').fill(`${card.expMonth}${card.expYear.slice(-2)}`);
            await page.locator('#cardCvc, input[name="cardCvc"]').fill(card.cvv);

            const submitButton = page.locator('button[type="submit"]').first();
            await submitButton.click();

            const startTime = Date.now();
            let result = { success: false, error: 'timeout' };

            while (Date.now() - startTime < 30000) {
                if (page.url().includes('success')) {
                    result = { success: true };
                    break;
                }

                const errorText = await page.locator('.StripeError, [class*="Error"]').textContent().catch(() => null);
                if (errorText) {
                    result = { success: false, error: errorText };
                    break;
                }

                await page.waitForTimeout(500);
            }

            await context.close();
            return result;

        } catch (error) {
            await context.close();
            return { success: false, error: error.message };
        }
    }

    /**
     * Close browser instance
     */
    async closeBrowser() {
        for (const { context } of this.pagePool) {
            try { await context.close(); } catch (e) {}
        }
        this.pagePool = [];
        
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
        console.log('[Playwright] Browser closed');
    }

    /**
     * Set headless mode
     * @param {boolean} value
     */
    setHeadless(value) {
        this.headless = value;
        console.log(`[Playwright] Headless mode: ${value ? 'ON (hidden)' : 'OFF (visible)'}`);
        
        if (this.browser) {
            this.closeBrowser();
        }
    }
}

// Export singleton
export const playwrightManager = new PlaywrightManager();
