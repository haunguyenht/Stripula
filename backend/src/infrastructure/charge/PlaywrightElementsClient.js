/**
 * PlaywrightElementsClient - Stripe Card Elements Client
 * 
 * Uses real browser with Stripe Card Elements for authentic fraud signals.
 * Features:
 * - Human-like typing (not paste)
 * - Proxy support
 * - Card Elements (no hCaptcha)
 * - Detailed Radar outcomes
 */

import { chromium } from 'playwright';

export class PlaywrightElementsClient {
    constructor(config = {}) {
        this.pkKey = config.pkKey;
        this.skKey = config.skKey;
        this.currency = config.currency || 'gbp';
        this.amount = config.amount || 100;

        // Proxy configuration
        this.proxy = config.proxy || null; // { host, port, username, password }

        // External page URL (required) - e.g., https://stripula.dev/card-elements.html
        this.externalPageUrl = config.externalPageUrl || process.env.PAYMENT_PAGE_URL;

        if (!this.externalPageUrl) {
            throw new Error('externalPageUrl is required. Set PAYMENT_PAGE_URL in .env');
        }

        // Options
        this.headless = config.headless ?? true;
        this.debug = config.debug ?? false;
        this.timeout = config.timeout || 60000;

        // Browser instance (reusable)
        this.browser = null;
    }

    _log(step, message) {
        // No-op: debug logging disabled
    }

    /**
     * Parse proxy string into config object
     */
    parseProxy(proxyString) {
        if (!proxyString) return null;
        try {
            if (proxyString.includes('@')) {
                const url = new URL(proxyString.startsWith('http') ? proxyString : `http://${proxyString}`);
                return {
                    host: url.hostname,
                    port: parseInt(url.port),
                    username: decodeURIComponent(url.username),
                    password: decodeURIComponent(url.password)
                };
            }
            const [host, port, username, password] = proxyString.split(':');
            return { host, port: parseInt(port), username, password };
        } catch {
            return null;
        }
    }

    /**
     * Launch or reuse browser
     */
    async getBrowser() {
        if (this.browser) return this.browser;

        const launchOptions = {
            headless: this.headless,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox'
            ]
        };

        // Add proxy if configured
        if (this.proxy) {
            launchOptions.proxy = {
                server: `http://${this.proxy.host}:${this.proxy.port}`,
                username: this.proxy.username,
                password: this.proxy.password,
                bypass: 'localhost,127.0.0.1'
            };
            this._log('BROWSER', `Using proxy: ${this.proxy.host}:${this.proxy.port}`);
        }

        this.browser = await chromium.launch(launchOptions);
        return this.browser;
    }

    /**
     * Create context with anti-detection
     */
    async createContext() {
        const browser = await this.getBrowser();

        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            locale: 'en-US',
            timezoneId: 'America/New_York'
        });

        // Anti-detection
        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            window.chrome = { runtime: {} };
        });

        return context;
    }

    /**
     * Random mouse movement
     */
    async randomMouseMove(page) {
        const x = 100 + Math.random() * 200;
        const y = 100 + Math.random() * 200;
        await page.mouse.move(x, y, { steps: 5 + Math.floor(Math.random() * 5) });
    }

    /**
     * Human-like typing with random delays
     */
    async humanType(locator, text, options = {}) {
        const minDelay = options.minDelay || 30;
        const maxDelay = options.maxDelay || 80;

        await locator.click();
        await this.delay(50 + Math.random() * 50);

        for (const char of text) {
            await locator.press(char);
            await this.delay(minDelay + Math.random() * (maxDelay - minDelay));
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Charge a card using Card Elements
     */
    async chargeCard(cardData) {
        const cardNum = cardData.number;
        const cardPreview = `${cardNum.slice(0, 6)}****${cardNum.slice(-4)}`;

        this._log('CHARGE', `Using external page: ${this.externalPageUrl}`);

        const context = await this.createContext();
        const page = await context.newPage();
        const startTime = Date.now();

        try {
            this._log('CHARGE', `Processing ${cardPreview}`);

            // Load Card Elements page
            await page.goto(this.externalPageUrl, { timeout: 30000, waitUntil: 'domcontentloaded' });

            // Wait for Stripe.js to load
            await page.waitForFunction(() => typeof window.Stripe !== 'undefined', { timeout: 30000 });

            // Check for initStripe function
            const hasInitStripe = await page.evaluate(() => typeof window.initStripe === 'function');
            if (!hasInitStripe) {
                throw new Error('Page does not have initStripe function. Make sure card-elements.html is loaded.');
            }

            // Init Card Elements
            await page.evaluate((pk) => window.initStripe(pk), this.pkKey);

            // Wait for Elements to be ready
            await page.waitForFunction(() => document.getElementById('status').value === 'ready', { timeout: 30000 });

            this._log('CHARGE', 'Card Elements ready, typing card...');

            // Random mouse movement
            await this.randomMouseMove(page);
            await this.delay(100 + Math.random() * 100);

            // Type card number
            const cardNumberFrame = page.frameLocator('#card-number iframe').first();
            const cardInput = cardNumberFrame.locator('input[name="cardnumber"]');
            await this.humanType(cardInput, cardNum);
            await this.delay(150 + Math.random() * 100);

            // Type expiry
            const expiryFrame = page.frameLocator('#card-expiry iframe').first();
            const expiryInput = expiryFrame.locator('input[name="exp-date"]');
            const exp = cardData.exp_month.padStart(2, '0') + cardData.exp_year.slice(-2);
            await this.humanType(expiryInput, exp);
            await this.delay(150 + Math.random() * 100);

            // Type CVC
            const cvcFrame = page.frameLocator('#card-cvc iframe').first();
            const cvcInput = cvcFrame.locator('input[name="cvc"]');
            await this.humanType(cvcInput, cardData.cvc);

            // Small pause before submitting
            await this.delay(200 + Math.random() * 150);

            // Process payment
            this._log('CHARGE', 'Processing payment...');

            await page.evaluate((params) => window.processPayment(params.sk, params.amount, params.currency), {
                sk: this.skKey,
                amount: this.amount,
                currency: this.currency
            });

            // Wait for result
            await page.waitForFunction(() => document.getElementById('status').value === 'done', { timeout: 120000 });

            const resultJson = await page.evaluate(() => document.getElementById('json-result').value);
            const result = JSON.parse(resultJson);

            this._log('CHARGE', `Result: ${result.success ? 'SUCCESS' : result.decline_code || result.code || result.error}`);

            const is3DS = result.status === 'requires_action' || result.threeDs === 'required';

            await context.close().catch(() => { });

            return {
                card: cardPreview,
                ...result,
                status: result.success ? 'Charged' : (is3DS ? 'Live' : 'Declined'),
                originalStatus: result.status
            };

        } catch (error) {
            const errorMsg = error.message;
            this._log('CHARGE', `Error: ${errorMsg}`);

            await context.close().catch(() => { });

            const isNavigationError = errorMsg.includes('context was destroyed') ||
                errorMsg.includes('navigation') ||
                errorMsg.includes('Target page, context or browser has been closed');

            return {
                card: cardPreview,
                status: isNavigationError ? 'Cancelled' : 'Error',
                error: errorMsg,
                recoverable: isNavigationError
            };
        }
    }

    /**
     * Close browser
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

export default PlaywrightElementsClient;
