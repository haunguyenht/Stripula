import { chromium } from 'playwright';
import { fakeDataService } from '../../utils/FakeDataService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Playwright-based Stripe Client
 * 
 * Uses a real browser to interact with Stripe Elements, generating authentic
 * browser fingerprints and fraud signals that pass Stripe Radar checks.
 * 
 * Flow:
 * 1. Launches headless Chrome via Playwright
 * 2. Loads a local HTML page with Stripe Elements
 * 3. Fills card details using Playwright's iframe handling
 * 4. Submits payment and captures the result
 */
export class PlaywrightStripeClient {
    constructor(siteConfig = {}, options = {}) {
        this.site = {
            id: 'playwright-stripe',
            label: 'Playwright Stripe Gateway',
            pkKey: siteConfig.pkKey || 'pk_live_h5ocNWNpicLCfBJvLialXsb900SaJnJscz',
            // Optional: Secret key for server-side PaymentIntent creation
            skKey: siteConfig.skKey || null,
            chargeAmount: siteConfig.chargeAmount || 100, // cents ($1.00)
            currency: siteConfig.currency || 'usd',
            ...siteConfig
        };

        this.debug = options.debug ?? false;
        this.headless = options.headless ?? true;
        this.timeout = options.timeout ?? 60000;
        this.slowMo = options.slowMo ?? 50; // Slow down actions to seem more human

        // Proxy configuration for browser
        this.proxyConfig = options.proxyConfig || null;

        // HTML page paths
        this.htmlPath = path.join(__dirname, 'stripe-checkout.html');

        // Browser instance (reusable across multiple cards)
        this.browser = null;
    }

    // =========================================================================
    // RESPONSE CLASSIFICATION
    // =========================================================================

    static LIVE_PATTERNS = [
        { pattern: 'address verification failed', code: 'avs_failed' },
        { pattern: 'incorrect_zip', code: 'avs_failed' },
        { pattern: 'zip code', code: 'avs_failed' },
        { pattern: 'insufficient funds', code: 'insufficient_funds' },
        { pattern: 'insufficient_funds', code: 'insufficient_funds' },
        { pattern: '3d secure', code: '3ds_required' },
        { pattern: 'authentication required', code: '3ds_required' },
        { pattern: 'authentication_required', code: '3ds_required' },
        { pattern: 'security code', code: 'incorrect_cvc' },
        { pattern: 'incorrect_cvc', code: 'incorrect_cvc' },
        { pattern: 'cvc check failed', code: 'incorrect_cvc' },
        { pattern: 'card_velocity_exceeded', code: 'velocity_exceeded' },
        { pattern: 'try again later', code: 'rate_limited' },
    ];

    static DEAD_PATTERNS = [
        { pattern: 'card_declined', code: 'card_declined' },
        { pattern: 'generic_decline', code: 'generic_decline' },
        { pattern: 'do_not_honor', code: 'do_not_honor' },
        { pattern: 'lost_card', code: 'lost_card' },
        { pattern: 'stolen_card', code: 'stolen_card' },
        { pattern: 'expired_card', code: 'expired_card' },
        { pattern: 'invalid_number', code: 'invalid_number' },
        { pattern: 'invalid_expiry', code: 'invalid_expiry' },
        { pattern: 'invalid_cvc', code: 'invalid_cvc' },
        { pattern: 'fraudulent', code: 'fraudulent' },
        { pattern: 'pickup_card', code: 'pickup_card' },
        { pattern: 'restricted_card', code: 'restricted_card' },
        { pattern: 'security_violation', code: 'security_violation' },
        { pattern: 'transaction_not_allowed', code: 'transaction_not_allowed' },
    ];

    _classifyResponse(errorMsg) {
        if (!errorMsg) return { status: 'Declined', code: 'card_declined', originalMessage: null };
        const lower = errorMsg.toLowerCase();

        for (const item of PlaywrightStripeClient.LIVE_PATTERNS) {
            if (lower.includes(item.pattern)) {
                return { status: 'Live', code: item.code, originalMessage: errorMsg };
            }
        }

        for (const item of PlaywrightStripeClient.DEAD_PATTERNS) {
            if (lower.includes(item.pattern)) {
                return { status: 'Declined', code: item.code, originalMessage: errorMsg };
            }
        }

        return { status: 'Declined', code: 'generic_decline', originalMessage: errorMsg };
    }

    _log(step, message) {
        // No-op: debug logging disabled
    }

    generateFakeUser() {
        return fakeDataService.generateFakeUser();
    }

    /**
     * Ensure the HTML checkout page exists
     */
    async ensureHtmlPage() {
        if (!fs.existsSync(this.htmlPath)) {
            this._log('INIT', 'Creating Stripe checkout HTML page...');
            await this._createHtmlPage();
        }
    }

    /**
     * Create the local HTML page with Stripe Elements
     */
    async _createHtmlPage() {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Checkout</title>
    <script src="https://js.stripe.com/v3/"></script>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            padding: 40px;
            max-width: 450px;
            width: 100%;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }
        h1 { font-size: 24px; margin-bottom: 8px; color: #1a1a2e; }
        .subtitle { color: #666; margin-bottom: 24px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 500; color: #333; }
        input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
        }
        input:focus { outline: none; border-color: #667eea; }
        #card-element {
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: white;
        }
        #card-element.StripeElement--focus { border-color: #667eea; }
        #card-element.StripeElement--invalid { border-color: #fa755a; }
        #card-errors { color: #fa755a; margin-top: 8px; font-size: 14px; }
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(102,126,234,0.4); }
        button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .result { margin-top: 20px; padding: 16px; border-radius: 8px; display: none; }
        .result.success { background: #d4edda; color: #155724; }
        .result.error { background: #f8d7da; color: #721c24; display: block; }
        .hidden { display: none; }
        #status-message { font-size: 14px; color: #666; margin-top: 12px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Secure Payment</h1>
        <p class="subtitle">Complete your donation</p>
        
        <form id="payment-form">
            <div class="form-group">
                <label for="name">Full Name</label>
                <input type="text" id="name" name="name" required>
            </div>
            
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="address">Address</label>
                <input type="text" id="address" name="address" required>
            </div>
            
            <div class="form-group">
                <label for="city">City</label>
                <input type="text" id="city" name="city" required>
            </div>
            
            <div class="form-group" style="display: flex; gap: 12px;">
                <div style="flex: 1;">
                    <label for="state">State</label>
                    <input type="text" id="state" name="state" required>
                </div>
                <div style="flex: 1;">
                    <label for="zip">ZIP Code</label>
                    <input type="text" id="zip" name="zip" required>
                </div>
            </div>
            
            <div class="form-group">
                <label>Card Details</label>
                <div id="card-element"></div>
                <div id="card-errors" role="alert"></div>
            </div>
            
            <button type="submit" id="submit-btn">
                <span id="button-text">Pay $1.00</span>
            </button>
            
            <div id="status-message"></div>
        </form>
        
        <div id="result" class="result"></div>
        
        <!-- Hidden fields for automation -->
        <input type="hidden" id="pk-key" value="">
        <input type="hidden" id="client-secret" value="">
        <input type="hidden" id="payment-result" value="">
    </div>

    <script>
        // Global state
        let stripe = null;
        let elements = null;
        let cardElement = null;
        
        // Initialize Stripe when PK key is set
        function initStripe(pkKey) {
            stripe = Stripe(pkKey);
            elements = stripe.elements();
            
            cardElement = elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#1a1a2e',
                        '::placeholder': { color: '#aab7c4' },
                    },
                    invalid: { color: '#fa755a', iconColor: '#fa755a' }
                },
                hidePostalCode: true
            });
            
            cardElement.mount('#card-element');
            
            cardElement.on('change', (event) => {
                const displayError = document.getElementById('card-errors');
                displayError.textContent = event.error ? event.error.message : '';
            });
            
            // Signal that Stripe is ready
            document.getElementById('pk-key').value = 'initialized';
        }
        
        // Set card details programmatically (for Playwright)
        async function setCardDetails(number, expMonth, expYear, cvc) {
            // We can't set card details directly due to Stripe's security
            // Playwright will type into the iframe instead
            return true;
        }
        
        // Create PaymentMethod only (for validation without charge)
        async function createPaymentMethod(billingDetails) {
            try {
                document.getElementById('status-message').textContent = 'Creating payment method...';
                
                const { paymentMethod, error } = await stripe.createPaymentMethod({
                    type: 'card',
                    card: cardElement,
                    billing_details: billingDetails
                });
                
                if (error) {
                    const result = { success: false, error: error.message, code: error.code };
                    document.getElementById('payment-result').value = JSON.stringify(result);
                    document.getElementById('status-message').textContent = 'Error: ' + error.message;
                    return result;
                }
                
                const result = {
                    success: true,
                    paymentMethodId: paymentMethod.id,
                    brand: paymentMethod.card.brand,
                    last4: paymentMethod.card.last4,
                    country: paymentMethod.card.country
                };
                document.getElementById('payment-result').value = JSON.stringify(result);
                document.getElementById('status-message').textContent = 'Payment method created: ' + paymentMethod.id;
                return result;
                
            } catch (err) {
                const result = { success: false, error: err.message };
                document.getElementById('payment-result').value = JSON.stringify(result);
                return result;
            }
        }
        
        // Confirm PaymentIntent (actually charges the card)
        async function confirmPayment(clientSecret, billingDetails) {
            try {
                document.getElementById('status-message').textContent = 'Processing payment...';
                
                const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: {
                        card: cardElement,
                        billing_details: billingDetails
                    }
                });
                
                if (error) {
                    const result = { 
                        success: false, 
                        error: error.message, 
                        code: error.code,
                        decline_code: error.decline_code 
                    };
                    document.getElementById('payment-result').value = JSON.stringify(result);
                    document.getElementById('status-message').textContent = 'Declined: ' + error.message;
                    return result;
                }
                
                const result = {
                    success: true,
                    status: paymentIntent.status,
                    paymentIntentId: paymentIntent.id,
                    amount: paymentIntent.amount
                };
                document.getElementById('payment-result').value = JSON.stringify(result);
                document.getElementById('status-message').textContent = 'Payment ' + paymentIntent.status;
                return result;
                
            } catch (err) {
                const result = { success: false, error: err.message };
                document.getElementById('payment-result').value = JSON.stringify(result);
                return result;
            }
        }
        
        // Form submission handler (for manual testing)
        document.getElementById('payment-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submit-btn');
            submitBtn.disabled = true;
            document.getElementById('button-text').textContent = 'Processing...';
            
            const billingDetails = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                address: {
                    line1: document.getElementById('address').value,
                    city: document.getElementById('city').value,
                    state: document.getElementById('state').value,
                    postal_code: document.getElementById('zip').value,
                    country: 'US'
                }
            };
            
            const clientSecret = document.getElementById('client-secret').value;
            
            if (clientSecret) {
                await confirmPayment(clientSecret, billingDetails);
            } else {
                await createPaymentMethod(billingDetails);
            }
            
            submitBtn.disabled = false;
            document.getElementById('button-text').textContent = 'Pay $1.00';
        });
    </script>
</body>
</html>`;

        fs.writeFileSync(this.htmlPath, html);
        this._log('INIT', `Created HTML page at: ${this.htmlPath}`);
    }

    /**
     * Launch or reuse browser instance
     */
    async getBrowser() {
        if (this.browser && this.browser.isConnected()) {
            return this.browser;
        }

        this._log('BROWSER', 'Launching browser...');

        const launchOptions = {
            headless: this.headless,
            slowMo: this.slowMo,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--window-size=1920,1080',
                '--start-maximized'
            ]
        };

        // Add proxy if configured
        if (this.proxyConfig) {
            launchOptions.proxy = {
                server: `http://${this.proxyConfig.host}:${this.proxyConfig.port}`,
                username: this.proxyConfig.username,
                password: this.proxyConfig.password
            };
            this._log('BROWSER', `Using proxy: ${this.proxyConfig.host}:${this.proxyConfig.port}`);
        }

        this.browser = await chromium.launch(launchOptions);
        return this.browser;
    }

    /**
     * Create a new browser context with realistic fingerprints
     */
    async createContext() {
        const browser = await this.getBrowser();

        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'en-US',
            timezoneId: 'America/New_York',
            geolocation: { longitude: -73.935242, latitude: 40.730610 },
            permissions: ['geolocation'],
            colorScheme: 'light',
            deviceScaleFactor: 1,
            hasTouch: false,
            isMobile: false,
            javaScriptEnabled: true,
        });

        // Add anti-detection scripts
        await context.addInitScript(() => {
            // Override webdriver detection
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

            // Override plugins to look like real Chrome
            Object.defineProperty(navigator, 'plugins', {
                get: () => [
                    { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                    { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                    { name: 'Native Client', filename: 'internal-nacl-plugin' }
                ]
            });

            // Override chrome runtime
            window.chrome = { runtime: {} };

            // Override permissions query
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => {
                return parameters.name === 'notifications'
                    ? Promise.resolve({ state: Notification.permission })
                    : originalQuery(parameters);
            };
        });

        return context;
    }

    /**
     * Fill card details into Stripe Elements iframe
     */
    async fillCardDetails(page, cardData) {
        this._log('CARD', `Filling card: ${cardData.number?.slice(0, 6)}****`);

        // Wait for Stripe iframe to be ready
        const cardFrame = await page.frameLocator('iframe[name^="__privateStripeFrame"]').first();

        // Stripe's card element is a single input in newer versions
        // or separate inputs in older versions
        try {
            // Try the combined card input first (newer Stripe)
            const cardInput = cardFrame.locator('input[name="cardnumber"]');

            if (await cardInput.count() > 0) {
                // Combined input - type all details with realistic delays
                await cardInput.click();
                await this._humanType(page, cardData.number);

                // Format expiry as MM/YY
                const expiry = `${cardData.expMonth.toString().padStart(2, '0')}${cardData.expYear.toString().slice(-2)}`;
                await this._humanType(page, expiry);

                await this._humanType(page, cardData.cvv || cardData.cvc);
            } else {
                // Separate inputs (older Stripe or different element style)
                await cardFrame.locator('[placeholder*="Card number"], [name="cardnumber"]').first().fill(cardData.number);

                const expiry = `${cardData.expMonth.toString().padStart(2, '0')} / ${cardData.expYear.toString().slice(-2)}`;
                await cardFrame.locator('[placeholder*="MM"], [name="exp-date"]').first().fill(expiry);

                await cardFrame.locator('[placeholder*="CVC"], [name="cvc"]').first().fill(cardData.cvv || cardData.cvc);
            }
        } catch (error) {
            this._log('CARD', `Error filling card: ${error.message}`);
            throw error;
        }
    }

    /**
     * Type text with human-like delays
     */
    async _humanType(page, text) {
        for (const char of text) {
            await page.keyboard.type(char, { delay: Math.random() * 100 + 50 });
        }
    }

    /**
     * Create a PaymentIntent on the server (requires SK key)
     */
    async createPaymentIntent() {
        if (!this.site.skKey) {
            throw new Error('Secret key required to create PaymentIntent');
        }

        const response = await fetch('https://api.stripe.com/v1/payment_intents', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.site.skKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                amount: this.site.chargeAmount.toString(),
                currency: this.site.currency,
                'automatic_payment_methods[enabled]': 'true',
                'automatic_payment_methods[allow_redirects]': 'never',
            }).toString()
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return {
            id: data.id,
            clientSecret: data.client_secret,
            amount: data.amount
        };
    }

    /**
     * Validate a card by creating a PaymentMethod (no charge)
     */
    async validateCard(cardData) {
        const cardNum = cardData.number;
        const cardPreview = `${cardNum.slice(0, 6)}****${cardNum.slice(-4)}`;

        await this.ensureHtmlPage();
        const context = await this.createContext();
        const page = await context.newPage();

        try {
            this._log('VALIDATE', `Processing ${cardPreview}`);

            // Load the checkout page
            const fileUrl = `file://${this.htmlPath}`;
            await page.goto(fileUrl, { waitUntil: 'networkidle' });

            // Initialize Stripe with PK key
            await page.evaluate((pkKey) => {
                window.initStripe(pkKey);
            }, this.site.pkKey);

            // Wait for Stripe to initialize
            await page.waitForFunction(() => {
                return document.getElementById('pk-key').value === 'initialized';
            }, { timeout: 10000 });

            this._log('VALIDATE', 'Stripe initialized');

            // Fill billing details
            const fakeUser = this.generateFakeUser();
            await page.fill('#name', `${fakeUser.firstName} ${fakeUser.lastName}`);
            await page.fill('#email', fakeUser.email);
            await page.fill('#address', fakeUser.address || '123 Main St');
            await page.fill('#city', fakeUser.city || 'New York');
            await page.fill('#state', fakeUser.state || 'NY');
            await page.fill('#zip', cardData.zip || fakeUser.postalCode || '10001');

            // Small delay to simulate human behavior
            await page.waitForTimeout(500 + Math.random() * 500);

            // Fill card details
            await this.fillCardDetails(page, cardData);

            // Wait a bit before submitting (human behavior)
            await page.waitForTimeout(1000 + Math.random() * 1000);

            // Create PaymentMethod via JavaScript
            const billingDetails = {
                name: `${fakeUser.firstName} ${fakeUser.lastName}`,
                email: fakeUser.email,
                address: {
                    line1: fakeUser.address || '123 Main St',
                    city: fakeUser.city || 'New York',
                    state: fakeUser.state || 'NY',
                    postal_code: cardData.zip || fakeUser.postalCode || '10001',
                    country: 'US'
                }
            };

            await page.evaluate((details) => {
                return window.createPaymentMethod(details);
            }, billingDetails);

            // Wait for result
            await page.waitForFunction(() => {
                return document.getElementById('payment-result').value !== '';
            }, { timeout: 30000 });

            // Get result
            const resultJson = await page.locator('#payment-result').inputValue();
            const result = JSON.parse(resultJson);

            this._log('VALIDATE', `Result: ${JSON.stringify(result)}`);

            if (result.success) {
                return {
                    status: 'Live',
                    code: 'payment_method_created',
                    paymentMethodId: result.paymentMethodId,
                    brand: result.brand,
                    last4: result.last4,
                    country: result.country,
                    card: cardPreview
                };
            } else {
                const classification = this._classifyResponse(result.error);
                return {
                    status: classification.status,
                    code: result.code || classification.code,
                    message: result.error,
                    card: cardPreview
                };
            }

        } catch (error) {
            this._log('VALIDATE', `Error: ${error.message}`);
            return {
                status: 'Error',
                code: 'browser_error',
                message: error.message,
                card: cardPreview
            };
        } finally {
            await context.close();
        }
    }

    /**
     * Charge a card (creates PaymentIntent and confirms it)
     */
    async chargeCard(cardData) {
        const cardNum = cardData.number;
        const cardPreview = `${cardNum.slice(0, 6)}****${cardNum.slice(-4)}`;

        if (!this.site.skKey) {
            return {
                status: 'Error',
                code: 'no_secret_key',
                message: 'Secret key required for charging',
                card: cardPreview
            };
        }

        await this.ensureHtmlPage();
        const context = await this.createContext();
        const page = await context.newPage();

        try {
            this._log('CHARGE', `Processing ${cardPreview}`);

            // Create PaymentIntent on server first
            this._log('CHARGE', 'Creating PaymentIntent...');
            const pi = await this.createPaymentIntent();
            this._log('CHARGE', `PaymentIntent created: ${pi.id}`);

            // Load the checkout page
            const fileUrl = `file://${this.htmlPath}`;
            await page.goto(fileUrl, { waitUntil: 'networkidle' });

            // Initialize Stripe with PK key
            await page.evaluate((pkKey) => {
                window.initStripe(pkKey);
            }, this.site.pkKey);

            // Wait for Stripe to initialize
            await page.waitForFunction(() => {
                return document.getElementById('pk-key').value === 'initialized';
            }, { timeout: 10000 });

            // Set the client secret
            await page.evaluate((secret) => {
                document.getElementById('client-secret').value = secret;
            }, pi.clientSecret);

            this._log('CHARGE', 'Stripe initialized');

            // Fill billing details
            const fakeUser = this.generateFakeUser();
            await page.fill('#name', `${fakeUser.firstName} ${fakeUser.lastName}`);
            await page.fill('#email', fakeUser.email);
            await page.fill('#address', fakeUser.address || '123 Main St');
            await page.fill('#city', fakeUser.city || 'New York');
            await page.fill('#state', fakeUser.state || 'NY');
            await page.fill('#zip', cardData.zip || fakeUser.postalCode || '10001');

            // Small delay to simulate human behavior
            await page.waitForTimeout(500 + Math.random() * 500);

            // Fill card details
            await this.fillCardDetails(page, cardData);

            // Wait a bit before submitting (human behavior)
            await page.waitForTimeout(1000 + Math.random() * 1000);

            // Confirm payment via JavaScript
            const billingDetails = {
                name: `${fakeUser.firstName} ${fakeUser.lastName}`,
                email: fakeUser.email,
                address: {
                    line1: fakeUser.address || '123 Main St',
                    city: fakeUser.city || 'New York',
                    state: fakeUser.state || 'NY',
                    postal_code: cardData.zip || fakeUser.postalCode || '10001',
                    country: 'US'
                }
            };

            await page.evaluate((params) => {
                return window.confirmPayment(params.clientSecret, params.billingDetails);
            }, { clientSecret: pi.clientSecret, billingDetails });

            // Wait for result
            await page.waitForFunction(() => {
                return document.getElementById('payment-result').value !== '';
            }, { timeout: 30000 });

            // Get result
            const resultJson = await page.locator('#payment-result').inputValue();
            const result = JSON.parse(resultJson);

            this._log('CHARGE', `Result: ${JSON.stringify(result)}`);

            if (result.success) {
                if (result.status === 'succeeded') {
                    return {
                        status: 'Charged',
                        code: 'payment_succeeded',
                        paymentIntentId: result.paymentIntentId,
                        amount: result.amount,
                        card: cardPreview
                    };
                } else if (result.status === 'requires_action') {
                    return {
                        status: 'Live',
                        code: '3ds_required',
                        paymentIntentId: result.paymentIntentId,
                        card: cardPreview
                    };
                } else {
                    return {
                        status: 'Live',
                        code: result.status,
                        paymentIntentId: result.paymentIntentId,
                        card: cardPreview
                    };
                }
            } else {
                const classification = this._classifyResponse(result.error);
                return {
                    status: classification.status,
                    code: result.decline_code || result.code || classification.code,
                    message: result.error,
                    card: cardPreview
                };
            }

        } catch (error) {
            this._log('CHARGE', `Error: ${error.message}`);
            return {
                status: 'Error',
                code: 'browser_error',
                message: error.message,
                card: cardPreview
            };
        } finally {
            await context.close();
        }
    }

    /**
     * Main validate method (compatible with existing interface)
     * Uses chargeCard if SK key is available, otherwise validateCard
     */
    async validate(cardData) {
        if (this.site.skKey) {
            return this.chargeCard(cardData);
        } else {
            return this.validateCard(cardData);
        }
    }

    /**
     * Close browser instance
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

export default PlaywrightStripeClient;
