/**
 * PlaywrightElementsClient - Enhanced Stripe Elements Client
 * 
 * Uses real browser with Stripe Elements for authentic fraud signals.
 * Features:
 * - Human-like typing (not paste)
 * - Proxy support
 * - hCaptcha handling
 * - Detailed Radar outcomes
 * - HTTP server (not file://) for better Radar scores
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple HTTP server for serving payment page (better than file://)
let httpServer = null;
let serverPort = null;
let pageHtml = '';

async function getServerUrl() {
    if (httpServer && serverPort) {
        return `http://localhost:${serverPort}`;
    }

    // Create simple HTTP server
    httpServer = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(pageHtml);
    });

    // Find available port (start from 9100)
    serverPort = 9100 + Math.floor(Math.random() * 100);
    await new Promise((resolve, reject) => {
        httpServer.listen(serverPort, '127.0.0.1', () => resolve());
        httpServer.on('error', () => {
            serverPort++;
            httpServer.listen(serverPort, '127.0.0.1', () => resolve());
        });
    });

    return `http://localhost:${serverPort}`;
}

export class PlaywrightElementsClient {
    constructor(config = {}) {
        this.pkKey = config.pkKey;
        this.skKey = config.skKey;
        this.currency = config.currency || 'gbp';
        this.amount = config.amount || 100;

        // Proxy configuration
        this.proxy = config.proxy || null; // { host, port, username, password }

        // External page URL (optional) - if set, use this instead of localhost
        // Example: https://pay.yourdomain.com/payment.html
        this.externalPageUrl = config.externalPageUrl || null;

        // Options
        this.headless = config.headless ?? true;
        this.debug = config.debug ?? false;
        this.timeout = config.timeout || 60000;

        // Browser instance (reusable)
        this.browser = null;
        this.htmlPath = path.join(__dirname, 'stripe-elements-page.html');
    }

    _log(step, message) {
        if (this.debug) {
            console.log(`[${new Date().toISOString().slice(11, 23)}][PW-${step}] ${message}`);
        }
    }

    /**
     * Parse proxy string into config object
     * Supports formats:
     * - host:port:username:password
     * - http://username:password@host:port
     */
    static parseProxy(proxyString) {
        if (!proxyString) return null;

        // Format: host:port:username:password
        if (!proxyString.includes('@') && proxyString.split(':').length === 4) {
            const [host, port, username, password] = proxyString.split(':');
            return { host, port: parseInt(port), username, password };
        }

        // Format: http://username:password@host:port
        try {
            const url = new URL(proxyString);
            return {
                host: url.hostname,
                port: parseInt(url.port),
                username: decodeURIComponent(url.username),
                password: decodeURIComponent(url.password)
            };
        } catch {
            return null;
        }
    }

    /**
     * Create HTML page for Stripe Payment Element (modern approach)
     */
    _createHtmlPage() {
        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Checkout</title>
    <script src="https://js.stripe.com/v3/"></script>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            margin: 0;
        }
        .container { 
            max-width: 450px; 
            margin: 40px auto; 
            background: white; 
            padding: 32px; 
            border-radius: 16px; 
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h2 { margin: 0 0 8px 0; color: #1a1a2e; font-size: 24px; }
        .subtitle { color: #666; margin-bottom: 24px; font-size: 14px; }
        #payment-element { margin-bottom: 24px; }
        button { 
            width: 100%; 
            padding: 16px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 16px;
            font-weight: 600;
        }
        button:disabled { background: #ccc; cursor: not-allowed; }
        #error-message { color: #df1b41; margin-top: 16px; font-size: 14px; }
        .amount-display {
            background: #f8f9fa;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
            text-align: center;
        }
        .amount { font-size: 32px; font-weight: 700; color: #1a1a2e; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Complete Payment</h2>
        <p class="subtitle">Enter your card details below</p>
        <div class="amount-display">
            <div class="amount" id="display-amount">0.00</div>
        </div>
        <div id="payment-element"></div>
        <button id="submit-btn" disabled>Pay Now</button>
        <div id="error-message"></div>
    </div>
    
    <input type="hidden" id="status" value="loading">
    <input type="hidden" id="json-result" value="">
    <input type="hidden" id="client-secret" value="">
    <input type="hidden" id="pi-id" value="">
    
    <script>
        let stripe, elements, paymentElement;
        const names = ['James Smith', 'Sarah Johnson', 'Michael Brown', 'Emma Davis', 'David Wilson'];
        
        window.initPayment = async function(sk, pk, amount, currency) {
            try {
                document.getElementById('display-amount').textContent = (amount/100).toFixed(2) + ' ' + currency.toUpperCase();
                
                const piRes = await fetch('https://api.stripe.com/v1/payment_intents', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + sk, 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        amount: amount.toString(),
                        currency: currency,
                        'automatic_payment_methods[enabled]': 'true',
                        'automatic_payment_methods[allow_redirects]': 'never'
                    })
                });
                const pi = await piRes.json();
                
                if (pi.error) {
                    document.getElementById('status').value = 'error';
                    return;
                }
                
                document.getElementById('client-secret').value = pi.client_secret;
                document.getElementById('pi-id').value = pi.id;
                
                stripe = Stripe(pk);
                elements = stripe.elements({ clientSecret: pi.client_secret, appearance: { theme: 'stripe' } });
                
                paymentElement = elements.create('payment', {
                    layout: 'tabs',
                    defaultValues: { billingDetails: { name: names[Math.floor(Math.random() * names.length)] } }
                });
                
                paymentElement.mount('#payment-element');
                paymentElement.on('ready', () => {
                    document.getElementById('submit-btn').disabled = false;
                    document.getElementById('status').value = 'ready';
                });
            } catch (err) {
                document.getElementById('status').value = 'error';
            }
        };
        
        window.confirmPayment = async function(sk) {
            const startTime = Date.now();
            document.getElementById('status').value = 'processing';
            
            try {
                const { error, paymentIntent } = await stripe.confirmPayment({
                    elements,
                    confirmParams: { return_url: window.location.href },
                    redirect: 'if_required'
                });
                
                const piId = document.getElementById('pi-id').value;
                const chargeRes = await fetch('https://api.stripe.com/v1/charges?payment_intent=' + piId + '&limit=1', {
                    headers: { 'Authorization': 'Bearer ' + sk }
                });
                const chargeData = await chargeRes.json();
                const charge = chargeData.data?.[0];
                const cardDetails = charge?.payment_method_details?.card || {};
                const outcome = charge?.outcome || {};
                const checks = cardDetails?.checks || {};
                
                const result = {
                    success: !error && paymentIntent?.status === 'succeeded',
                    status: error ? 'declined' : paymentIntent?.status,
                    amount: paymentIntent?.amount || 0,
                    risk_level: outcome.risk_level || 'unknown',
                    avs_check: checks.address_postal_code_check || 'N/A',
                    cvc_check: checks.cvc_check || 'N/A',
                    brand: cardDetails?.brand,
                    funding: cardDetails?.funding,
                    country: cardDetails?.country,
                    threeDs: paymentIntent?.status === 'requires_action' ? 'required' : (paymentIntent?.status === 'succeeded' ? 'passed' : 'none'),
                    decline_code: error?.decline_code || outcome?.reason || error?.code,
                    pm_id: paymentIntent?.payment_method,
                    pi_id: piId,
                    network_status: outcome?.network_status
                };
                
                result.time_taken = (Date.now() - startTime) / 1000;
                document.getElementById('json-result').value = JSON.stringify(result);
                document.getElementById('status').value = 'done';
                return result;
            } catch (err) {
                const result = { success: false, error: err.message, time_taken: (Date.now() - startTime) / 1000 };
                document.getElementById('json-result').value = JSON.stringify(result);
                document.getElementById('status').value = 'done';
                return result;
            }
        };
    </script>
</body>
</html>`;
        fs.writeFileSync(this.htmlPath, html);
    }

    /**
     * Launch or reuse browser
     */
    async getBrowser() {
        if (this.browser && this.browser.isConnected()) {
            return this.browser;
        }

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
                bypass: 'localhost,127.0.0.1'  // Don't proxy localhost requests
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
     * Random mouse movement to simulate human behavior
     */
    async randomMouseMove(page) {
        const x = 100 + Math.random() * 200;
        const y = 100 + Math.random() * 200;
        await page.mouse.move(x, y, { steps: 3 });
    }

    /**
     * Human-like typing with random delays and occasional corrections
     */
    async humanType(locator, text, options = {}) {
        await locator.click();
        await this.delay(80 + Math.random() * 70);

        // 15% chance to make a typo and correct it (only for longer fields)
        const makeTypo = text.length > 8 && Math.random() < 0.15;
        const typoPos = makeTypo ? Math.floor(Math.random() * Math.min(4, text.length - 2)) + 2 : -1;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            // Simulate typo: type wrong char, pause, delete, type correct
            if (i === typoPos) {
                // Type wrong character
                await locator.press(String.fromCharCode(char.charCodeAt(0) + 1));
                await this.delay(150 + Math.random() * 100);
                // Delete it
                await locator.press('Backspace');
                await this.delay(100 + Math.random() * 80);
            }

            // Type correct character with variable speed
            await locator.press(char);

            // Variable delay: faster in middle, slower at start/end
            const isEdge = i < 2 || i > text.length - 3;
            const baseDelay = isEdge ? 70 : 40;
            await this.delay(baseDelay + Math.random() * 60);
        }
    }

    /**
     * Human-like field focus using Tab key
     */
    async humanTabToField(page, fromLocator) {
        await fromLocator.press('Tab');
        await this.delay(100 + Math.random() * 100);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Charge a card using Payment Element
     */
    async chargeCard(cardData) {
        const cardNum = cardData.number;
        const cardPreview = `${cardNum.slice(0, 6)}****${cardNum.slice(-4)}`;

        // Determine page URL - use external if configured, else localhost
        let pageUrl;
        if (this.externalPageUrl) {
            pageUrl = this.externalPageUrl;
            this._log('CHARGE', `Using external page: ${pageUrl}`);
        } else {
            // Fallback to localhost HTTP server
            this._createHtmlPage();
            pageHtml = fs.readFileSync(this.htmlPath, 'utf-8');
            pageUrl = await getServerUrl();
        }

        const context = await this.createContext();
        const page = await context.newPage();
        const startTime = Date.now();

        try {
            this._log('CHARGE', `Processing ${cardPreview}`);

            // Load page
            await page.goto(pageUrl, { timeout: 60000, waitUntil: 'networkidle' });

            // Wait for Stripe.js to load from CDN
            await page.waitForFunction(() => typeof window.Stripe !== 'undefined', { timeout: 30000 });

            // Init Payment Element (creates PI and mounts element)
            await page.evaluate((params) => window.initPayment(params.sk, params.pk, params.amount, params.currency), {
                sk: this.skKey,
                pk: this.pkKey,
                amount: this.amount,
                currency: this.currency
            });

            // Wait for Payment Element to be ready
            await page.waitForFunction(() => document.getElementById('status').value === 'ready', { timeout: 30000 });

            this._log('CHARGE', 'Payment Element ready, typing card...');

            // Random mouse movement before starting
            await this.randomMouseMove(page);
            await this.delay(100 + Math.random() * 100);

            // Payment Element uses iframes - need to find the right one
            // The Payment Element has multiple iframes, we need to type into the card fields
            const frames = page.frames();
            this._log('CHARGE', `Found ${frames.length} frames`);

            // Find the iframe containing the card number input
            let cardFrame = null;
            for (const frame of frames) {
                const url = frame.url();
                if (url.includes('js.stripe.com')) {
                    const hasCardInput = await frame.locator('input[name="cardnumber"], input[name="number"], input[autocomplete*="cc-number"]').count() > 0;
                    if (hasCardInput) {
                        cardFrame = frame;
                        break;
                    }
                }
            }

            if (!cardFrame) {
                // Fallback: try using frameLocator
                cardFrame = page.frameLocator('iframe[name*="privateStripe"]').first();
            }

            // Type card number - try different selectors
            const cardInput = cardFrame.locator('input[name="cardnumber"], input[name="number"], input[autocomplete*="cc-number"]').first();
            await this.humanType(cardInput, cardNum);
            await this.delay(150 + Math.random() * 100);

            // Type expiry
            const expiryInput = cardFrame.locator('input[name="exp-date"], input[name="expiry"], input[autocomplete*="cc-exp"]').first();
            const exp = cardData.exp_month.padStart(2, '0') + cardData.exp_year.slice(-2);
            await this.humanType(expiryInput, exp);
            await this.delay(150 + Math.random() * 100);

            // Type CVC
            const cvcInput = cardFrame.locator('input[name="cvc"], input[autocomplete*="csc"]').first();
            await this.humanType(cvcInput, cardData.cvc);

            // Small pause before submitting
            await this.delay(200 + Math.random() * 150);

            // Confirm payment by calling JavaScript
            this._log('CHARGE', 'Processing payment...');

            await page.evaluate((sk) => window.confirmPayment(sk), this.skKey);

            // Wait for result (120s timeout for 3DS/hCaptcha handling)
            await page.waitForFunction(() => document.getElementById('status').value === 'done', { timeout: 120000 });

            const resultJson = await page.evaluate(() => document.getElementById('json-result').value);
            const result = JSON.parse(resultJson);

            this._log('CHARGE', `Result: ${result.success ? 'SUCCESS' : result.decline_code || result.status || result.error}`);

            // Check if status indicates 3DS was required
            const is3DS = result.status === 'requires_action' || result.threeDs === 'required';

            // Close context before returning
            await context.close().catch(() => { });

            return {
                card: cardPreview,
                ...result,
                status: result.success ? 'Charged' : (is3DS ? 'Live' : 'Declined'),
                originalStatus: result.status
            };

        } catch (error) {
            this._log('CHARGE', `Error: ${error.message}`);

            // Close context
            await context.close().catch(() => { });

            return {
                card: cardPreview,
                status: 'Error',
                error: error.message
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
