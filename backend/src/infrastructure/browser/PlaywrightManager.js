import { chromium } from 'playwright';
import { IBrowserService } from '../../interfaces/IBrowserService.js';
import { getRandomBrowserUserAgent, getRandomViewport } from '../../utils/helpers.js';
import { generateRealisticIdentity } from '../../utils/identity.js';

/**
 * Playwright Browser Manager
 * Handles browser lifecycle and Stripe.js interactions
 * Implements IBrowserService interface
 */
export class PlaywrightManager extends IBrowserService {
    constructor(options = {}) {
        super();
        this.browser = null;
        this.headless = options.headless ?? true;
        this.serverPort = options.serverPort || process.env.PORT || 5001;
        
        // Cache for setup page context
        this.setupCache = {
            context: null,
            page: null,
            pkKey: null,
            pageReady: false,
            lastUsed: 0
        };
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
            ]
        };

        console.log(`[Playwright] Launching browser (headless: ${this.headless})`);
        this.browser = await chromium.launch(launchOptions);
        return this.browser;
    }

    /**
     * Create a new browser context
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
            timezoneId: 'America/New_York',
        });

        // Anti-detection
        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        return { context, userAgent, viewport };
    }

    /**
     * Create PaymentMethod using real Stripe.js
     * @param {string} pkKey - Stripe publishable key
     * @param {Card} card - Card entity
     * @param {Object} billingDetails - Optional billing details
     * @returns {Promise<Object>}
     */
    async createPaymentMethod(pkKey, card, billingDetails = null) {
        const { context, userAgent, viewport } = await this.createContext();
        const page = await context.newPage();

        console.log(`[Playwright] Creating PaymentMethod for ****${card.last4}`);
        console.log(`[Playwright] UA: ${userAgent.slice(0, 50)}... | Viewport: ${viewport.width}x${viewport.height}`);

        try {
            // Generate realistic identity
            const identity = billingDetails || await generateRealisticIdentity();
            console.log(`[Playwright] Identity: ${identity.fullName} | ${identity.city}, ${identity.state} ${identity.zip}`);

            // Build checkout URL with billing params
            const billingParams = new URLSearchParams({
                pk: pkKey,
                name: identity.fullName,
                email: identity.email,
                street: identity.street,
                city: identity.city,
                state: identity.state,
                zip: identity.zip,
                country: identity.country
            });

            const checkoutUrl = `http://localhost:${this.serverPort}/checkout?${billingParams.toString()}`;
            console.log(`[Playwright] Loading checkout page...`);

            await page.goto(checkoutUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 10000
            });

            // Wait for Stripe iframe
            console.log(`[Playwright] Waiting for Stripe iframe...`);
            await page.waitForSelector('#card-element iframe[title="Secure card payment input frame"]', { timeout: 10000 });
            await page.waitForTimeout(200);

            // Get iframe
            const stripeFrame = page.frameLocator('#card-element iframe[title="Secure card payment input frame"]');

            // Fill card details
            console.log(`[Playwright] Filling card: ${card.maskedNumber}`);
            await stripeFrame.locator('input[name="cardnumber"]').fill(card.number);

            const expStr = `${card.expMonth}${card.expYear.slice(-2)}`;
            await stripeFrame.locator('input[name="exp-date"]').fill(expStr);
            await stripeFrame.locator('input[name="cvc"]').fill(card.cvv);

            // Submit
            console.log(`[Playwright] Submitting...`);
            await page.evaluate(() => {
                window.stripeResult = undefined;
                const btn = document.getElementById('submit-btn');
                if (btn) btn.disabled = false;
            });
            await page.click('#submit-btn');

            // Wait for result
            await page.waitForFunction(() => window.stripeResult !== undefined, { timeout: 15000 });
            const result = await page.evaluate(() => window.stripeResult);

            await context.close();

            if (result.error) {
                console.log(`[Playwright] ✗ Failed: ${result.error}`);
                return { success: false, error: result.error };
            }

            console.log(`[Playwright] ✓ PaymentMethod: ${result.paymentMethodId}`);
            return {
                success: true,
                paymentMethodId: result.paymentMethodId,
                card: result.card,
                radarSession: result.radarSession || null
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
        const { context, userAgent, viewport } = await this.createContext();
        const page = await context.newPage();

        console.log(`[Playwright] Loading Checkout URL...`);

        try {
            await page.goto(checkoutUrl, { waitUntil: 'networkidle', timeout: 30000 });

            // Wait for card input
            const cardInput = page.locator('#cardNumber, input[name="cardNumber"]');
            await cardInput.waitFor({ state: 'visible', timeout: 15000 });

            // Fill card details
            await cardInput.fill(card.number);
            await page.locator('#cardExpiry, input[name="cardExpiry"]').fill(`${card.expMonth}${card.expYear.slice(-2)}`);
            await page.locator('#cardCvc, input[name="cardCvc"]').fill(card.cvv);

            // Submit
            const submitButton = page.locator('button[type="submit"]').first();
            await submitButton.click();

            // Wait for result
            const startTime = Date.now();
            let result = { success: false, error: 'timeout' };

            while (Date.now() - startTime < 30000) {
                // Check for success redirect
                if (page.url().includes('success')) {
                    result = { success: true };
                    break;
                }

                // Check for error
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
        if (this.setupCache.context) {
            try { await this.setupCache.context.close(); } catch (e) {}
            this.setupCache = { context: null, page: null, pkKey: null, pageReady: false, lastUsed: 0 };
        }
        
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
        console.log('[Playwright] Browser closed');
    }

    /**
     * Set headless mode
     * @param {boolean} value - true for headless, false for visible
     */
    setHeadless(value) {
        this.headless = value;
        console.log(`[Playwright] Headless mode: ${value ? 'ON (hidden)' : 'OFF (visible)'}`);
        
        // Close existing browser to apply new setting
        if (this.browser) {
            this.closeBrowser();
        }
    }
}

// Export singleton
export const playwrightManager = new PlaywrightManager();
