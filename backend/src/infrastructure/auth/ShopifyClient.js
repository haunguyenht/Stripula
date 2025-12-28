import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { SHOPIFY_API, API_USER_AGENTS } from '../../utils/constants.js';
import { fakeDataService } from '../../utils/FakeDataService.js';

/**
 * Shopify Client
 * Handles Shopify checkout flow for card validation
 * Flow: Cart → Contact → Shipping → Payment → ShopifyCS → Submit → Poll
 */
export class ShopifyClient {
    constructor(siteConfig, options = {}) {
        this.site = siteConfig;
        this.proxyManager = options.proxyManager || null;
        this.timeout = 30000;
        this.maxRetries = 3;
    }

    getRandomUserAgent() {
        return API_USER_AGENTS[Math.floor(Math.random() * API_USER_AGENTS.length)];
    }

    generateFakeUser() {
        return fakeDataService.generateFakeUser();
    }

    createSession(proxy = null) {
        const jar = new CookieJar();
        const userAgent = this.getRandomUserAgent();
        
        const config = {
            timeout: this.timeout,
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            },
            maxRedirects: 10,
            jar,
            withCredentials: true,
            validateStatus: (status) => status < 500
        };

        // Handle proxy - can be string URL or object {type, host, port, username?, password?}
        if (proxy) {
            let proxyAgent;
            
            if (typeof proxy === 'string' && proxy.startsWith('http')) {
                // Legacy string URL format
                proxyAgent = new HttpsProxyAgent(proxy);
            } else if (typeof proxy === 'object' && proxy.host && proxy.port) {
                // Object format from gateway proxy config
                const proxyType = proxy.type || 'http';
                let proxyUrl;
                
                if (proxy.username && proxy.password) {
                    proxyUrl = `${proxyType}://${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@${proxy.host}:${proxy.port}`;
                } else {
                    proxyUrl = `${proxyType}://${proxy.host}:${proxy.port}`;
                }
                
                // Use appropriate agent based on proxy type
                if (proxyType === 'socks4' || proxyType === 'socks5' || proxyType === 'socks') {
                    proxyAgent = new SocksProxyAgent(proxyUrl);
                } else {
                    proxyAgent = new HttpsProxyAgent(proxyUrl);
                }
            }
            
            if (proxyAgent) {
                config.httpsAgent = proxyAgent;
                config.httpAgent = proxyAgent;
            }
        }

        const client = wrapper(axios.create(config));
        client.jar = jar;
        client.userAgent = userAgent;
        return client;
    }

    extractBetween(str, start, end) {
        const startIdx = str.indexOf(start);
        if (startIdx === -1) return '';
        const afterStart = str.substring(startIdx + start.length);
        const endIdx = afterStart.indexOf(end);
        if (endIdx === -1) return '';
        return afterStart.substring(0, endIdx);
    }

    extractDomain(url) {
        if (!url) return '';
        try {
            const match = url.match(/:\/\/([^\/]+)/);
            return match ? match[1] : '';
        } catch {
            return '';
        }
    }

    async extractProductId(session, prodUrl, domain) {
        if (this.site.prodId) return this.site.prodId;

        try {
            // If URL doesn't have /products/, try to find one
            if (!prodUrl.includes('/products/')) {
                const collectionUrl = `https://${domain}/collections/all?sort_by=price-ascending`;
                const resp = await session.get(collectionUrl);
                if (!resp.data) return null;
            }

            const resp = await session.get(prodUrl);
            if (!resp.data) return null;

            // Try different patterns to extract variant ID
            let prodId = this.extractBetween(resp.data, 'variants":[{"id":', ',');
            if (!prodId) {
                prodId = this.extractBetween(resp.data, 'variantId":', ',');
            }
            if (!prodId) {
                prodId = this.extractBetween(resp.data, '"variant_id":', ',');
            }
            
            return prodId ? String(prodId).replace(/\D/g, '') : null;
        } catch (error) {

            return null;
        }
    }

    async addToCart(session, domain, productId) {
        const cartUrl = `https://${domain}/cart/${productId}:1?traffic_source=buy_now`;
        
        try {
            const resp = await session.get(cartUrl, {
                headers: { 'User-Agent': session.userAgent }
            });

            if (!resp.data) {
                return { success: false, error: 'Empty response from cart' };
            }

            const body = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);

            // Check for common errors
            if (body.includes('Out of stock')) {
                return { success: false, error: 'Item out of stock' };
            }
            if (body.includes('Access denied')) {
                return { success: false, error: 'Access denied' };
            }
            if (body.includes('Link expired')) {
                return { success: false, error: 'Link expired' };
            }
            if (resp.request?.res?.responseUrl?.includes('account/login')) {
                return { success: false, error: 'Login required' };
            }
            // Check for unsupported checkout versions (new Shopify checkout)
            const redirectUrl = resp.request?.res?.responseUrl || resp.request?._redirectable?._currentUrl || '';
            if (redirectUrl.includes('/checkouts/c/') || redirectUrl.includes('/checkouts/cn/')) {
                return { success: false, error: 'Site uses new Shopify checkout (unsupported)' };
            }

            // Get final URL after redirects - try multiple sources
            let rawUrl = '';
            if (resp.request?.res?.responseUrl) {
                rawUrl = resp.request.res.responseUrl;
            } else if (resp.request?._redirectable?._currentUrl) {
                rawUrl = resp.request._redirectable._currentUrl;
            } else if (resp.config?.url) {
                rawUrl = resp.config.url;
            }
            const checkoutUrl = String(rawUrl).replace('?traffic_source=buy_now', '');



            if (!checkoutUrl || !checkoutUrl.includes('/checkouts/')) {
                // Check if we got redirected to checkout via body content
                if (body.includes('authenticity_token')) {

                } else {


                    return { success: false, error: 'Checkout URL not found' };
                }
            }

            // Try multiple patterns for auth token
            let authToken = this.extractBetween(body, 'authenticity_token" value="', '"');
            if (!authToken) {
                authToken = this.extractBetween(body, "authenticity_token' value='", "'");
            }
            if (!authToken) {
                // Try regex pattern
                const authMatch = body.match(/authenticity_token['"]\s*value=['"]([\w\-+=]+)['"]/);
                authToken = authMatch ? authMatch[1] : '';
            }
            
            const nextStep = this.extractBetween(body, 'hidden" name="step" value="', '"');

            if (!authToken) {

                return { success: false, error: 'Auth token not found' };
            }

            return {
                success: true,
                checkoutUrl,
                authToken,
                nextStep: nextStep || 'contact_information',
                body
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async submitContactAndShipping(session, checkoutUrl, authToken, nextStep, fake) {
        const address = this.site.customAddress || {
            address1: '12 Main Street',
            city: 'Brewster',
            country: 'United States',
            province: 'NY',
            zip: '10509'
        };

        try {
            let data;
            let targetStep;

            if (nextStep === 'shipping_method') {
                targetStep = 'shipping_method';
                data = new URLSearchParams({
                    '_method': 'patch',
                    'authenticity_token': authToken,
                    'previous_step': 'contact_information',
                    'step': 'shipping_method',
                    'checkout[email]': fake.email,
                    'checkout[buyer_accepts_marketing]': '0',
                    'checkout[shipping_address][first_name]': fake.first,
                    'checkout[shipping_address][last_name]': fake.last,
                    'checkout[shipping_address][company]': '',
                    'checkout[shipping_address][address1]': address.address1,
                    'checkout[shipping_address][address2]': '',
                    'checkout[shipping_address][city]': address.city,
                    'checkout[shipping_address][country]': address.country,
                    'checkout[shipping_address][province]': address.province,
                    'checkout[shipping_address][zip]': address.zip,
                    'checkout[shipping_address][phone]': fake.phone,
                    'checkout[remember_me]': '0',
                    'checkout[client_details][browser_width]': '1920',
                    'checkout[client_details][browser_height]': '1080',
                    'checkout[client_details][javascript_enabled]': '1',
                    'checkout[client_details][color_depth]': '24',
                    'checkout[client_details][java_enabled]': 'false',
                    'checkout[client_details][browser_tz]': '300',
                });
            } else if (nextStep === 'payment_method') {
                targetStep = 'payment_method';
                data = new URLSearchParams({
                    '_method': 'patch',
                    'authenticity_token': authToken,
                    'previous_step': 'contact_information',
                    'step': 'payment_method',
                    'checkout[email]': fake.email,
                    'checkout[buyer_accepts_marketing]': '0',
                    'checkout[billing_address][first_name]': fake.first,
                    'checkout[billing_address][last_name]': fake.last,
                    'checkout[billing_address][company]': '',
                    'checkout[billing_address][address1]': address.address1,
                    'checkout[billing_address][address2]': '',
                    'checkout[billing_address][city]': address.city,
                    'checkout[billing_address][country]': address.country,
                    'checkout[billing_address][province]': address.province,
                    'checkout[billing_address][zip]': address.zip,
                    'checkout[billing_address][phone]': fake.phone,
                    'checkout[client_details][browser_width]': '1920',
                    'checkout[client_details][browser_height]': '1080',
                    'checkout[client_details][javascript_enabled]': '1',
                    'checkout[client_details][color_depth]': '24',
                    'checkout[client_details][java_enabled]': 'false',
                    'checkout[client_details][browser_tz]': '300',
                });
            } else {
                return { success: false, error: `Unknown step: ${nextStep}` };
            }

            const resp = await session.post(checkoutUrl, data.toString(), {
                headers: {
                    'User-Agent': session.userAgent,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': `https://${this.site.domain}`,
                    'Referer': checkoutUrl
                }
            });

            if (!resp.data) {
                return { success: false, error: 'Empty response from contact step' };
            }

            // Check for errors
            const errorMatch = resp.data.match(/field__message field__message--error[^>]*>([^<]+)/);
            if (errorMatch) {
                return { success: false, error: errorMatch[1].trim() };
            }

            return {
                success: true,
                body: resp.data,
                targetStep
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getShippingRate(session, checkoutUrl, body) {
        try {
            let currentBody = body;

            // Try to find shipping method in current body
            if (!currentBody.includes('data-shipping-method="')) {
                const resp = await session.get(`${checkoutUrl}?step=shipping_method`);
                currentBody = resp.data || '';
            }

            if (!currentBody.includes('data-shipping-method="')) {
                const resp = await session.get(`${checkoutUrl}/shipping_rates?step=shipping_method`);
                currentBody = resp.data || '';
            }

            const shipId = this.extractBetween(currentBody, 'data-shipping-method="', '"');
            if (!shipId) {
                return { success: false, error: 'Shipping method not found' };
            }

            return { success: true, shipId: String(shipId).replace(/amp%3B/g, '') };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async submitShippingAndGetPayment(session, checkoutUrl, authToken, shipId) {
        try {
            const data = new URLSearchParams({
                '_method': 'patch',
                'authenticity_token': authToken,
                'previous_step': 'shipping_method',
                'step': 'payment_method',
                'checkout[shipping_rate][id]': shipId,
                'checkout[client_details][browser_width]': '1920',
                'checkout[client_details][browser_height]': '1080',
                'checkout[client_details][javascript_enabled]': '1',
                'checkout[client_details][color_depth]': '24',
                'checkout[client_details][java_enabled]': 'false',
                'checkout[client_details][browser_tz]': '300',
            });

            const resp = await session.post(checkoutUrl, data.toString(), {
                headers: {
                    'User-Agent': session.userAgent,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': `https://${this.site.domain}`,
                    'Referer': checkoutUrl
                }
            });

            if (!resp.data) {
                return { success: false, error: 'Empty response from shipping step' };
            }

            // Check for errors
            const errorMatch = resp.data.match(/field__message field__message--error[^>]*>([^<]+)/);
            if (errorMatch) {
                return { success: false, error: errorMatch[1].trim() };
            }

            return { success: true, body: resp.data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getPaymentPage(session, checkoutUrl, previousStep) {
        try {
            const resp = await session.get(`${checkoutUrl}?previous_step=${previousStep}&step=payment_method`, {
                headers: { 'User-Agent': session.userAgent }
            });

            if (!resp.data) {
                return { success: false, error: 'Empty payment page' };
            }

            const gateway = this.extractBetween(resp.data, 'gateway="', '"');
            const price = this.extractBetween(resp.data, 'payment-due-target="', '"');
            const priceDisplay = this.extractBetween(
                this.extractBetween(resp.data, 'payment-due-target="', '/'),
                '>', '<'
            );

            if (!gateway) {
                return { success: false, error: 'Payment gateway not found' };
            }

            return {
                success: true,
                gateway,
                price: price || '0',
                priceDisplay: priceDisplay?.trim() || price || '0',
                body: resp.data,
                hasBillingAddress: resp.data.includes('billing_address'),
                hasSameAsShipping: resp.data.includes('Same as shipping address')
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async createCardSession(session, cardInfo, domain) {
        try {
            const payload = {
                credit_card: {
                    number: cardInfo.number,
                    name: `${cardInfo.firstName || 'John'} ${cardInfo.lastName || 'Doe'}`,
                    month: parseInt(cardInfo.expMonth),
                    year: parseInt(cardInfo.expYear.length === 2 ? `20${cardInfo.expYear}` : cardInfo.expYear),
                    verification_value: cardInfo.cvc
                },
                payment_session_scope: domain
            };

            const resp = await session.post(SHOPIFY_API.CARD_SESSION, JSON.stringify(payload), {
                headers: {
                    'User-Agent': session.userAgent,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!resp.data?.id) {
                return { success: false, error: 'Session ID not returned' };
            }

            return { success: true, sessionId: resp.data.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async submitPayment(session, checkoutUrl, authToken, gateway, price, sessionId, paymentInfo, fake) {
        try {
            const address = this.site.customAddress || {
                address1: '12 Main Street',
                city: 'Brewster',
                country: 'United States',
                province: 'NY',
                zip: '10509'
            };

            let data = new URLSearchParams({
                '_method': 'patch',
                'authenticity_token': authToken,
                'previous_step': 'payment_method',
                'step': '',
                's': sessionId,
                'checkout[payment_gateway]': gateway,
                'checkout[credit_card][vault]': 'false',
                'checkout[total_price]': price,
                'complete': '1',
                'checkout[client_details][browser_width]': '1920',
                'checkout[client_details][browser_height]': '1080',
                'checkout[client_details][javascript_enabled]': '1',
                'checkout[client_details][color_depth]': '24',
                'checkout[client_details][java_enabled]': 'false',
                'checkout[client_details][browser_tz]': '300',
            });

            if (paymentInfo.hasBillingAddress) {
                data.append('checkout[billing_address][first_name]', fake.first);
                data.append('checkout[billing_address][last_name]', fake.last);
                data.append('checkout[billing_address][company]', '');
                data.append('checkout[billing_address][address1]', address.address1);
                data.append('checkout[billing_address][address2]', '');
                data.append('checkout[billing_address][city]', address.city);
                data.append('checkout[billing_address][country]', address.country);
                data.append('checkout[billing_address][province]', address.province);
                data.append('checkout[billing_address][zip]', address.zip);
                data.append('checkout[billing_address][phone]', fake.phone);
            }

            if (paymentInfo.hasSameAsShipping) {
                data.append('checkout[different_billing_address]', 'false');
            }

            const resp = await session.post(checkoutUrl, data.toString(), {
                headers: {
                    'User-Agent': session.userAgent,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': `https://${this.site.domain}`,
                    'Referer': checkoutUrl
                }
            });

            return { success: true, body: resp.data || '' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async pollProcessing(session, checkoutUrl, maxAttempts = 10) {
        try {
            let attempts = 0;
            let resp;

            // Initial processing request
            resp = await session.get(`${checkoutUrl}/processing?from_processing_page=1`, {
                headers: { 'User-Agent': session.userAgent }
            });

            const finalUrl = resp.request?.res?.responseUrl || resp.config?.url || '';
            
            // Poll until validate=true or thank_you
            while (!finalUrl.includes('validate=true') && !finalUrl.includes('thank_you') && attempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 1000));
                resp = await session.get(`${checkoutUrl}?from_processing_page=1&validate=true`, {
                    headers: { 'User-Agent': session.userAgent }
                });
                attempts++;
            }

            if (!resp.data) {
                return { success: false, error: 'Empty processing response' };
            }

            // Extract error message if present
            const errorMatch = resp.data.match(/class="notice__content"><p class="notice__text">([^<]+)/);
            const errorMessage = errorMatch ? errorMatch[1].trim() : null;

            return {
                success: true,
                body: resp.data,
                errorMessage
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Full checkout validation flow
     */
    async validateCard(cardInfo) {

        const startTime = Date.now();
        
        if (!this.site) {

            return { success: false, error: 'Site config is undefined', duration: 0 };
        }
        
        const prodUrl = this.site.prodUrl;
        const cardPrefix = cardInfo.number?.slice(0, 6) || 'UNKNOWN';


        if (!prodUrl) {

            return {
                success: false,
                error: 'Site not configured (missing prodUrl)',
                duration: Date.now() - startTime
            };
        }

        // Auto-derive domain from prodUrl if not explicitly set (after null check)
        const domain = this.site.domain || this.extractDomain(prodUrl);

        if (!domain) {

            return {
                success: false,
                error: 'Could not extract domain from prodUrl',
                duration: Date.now() - startTime
            };
        }

        // Get proxy if available
        let session, fake;
        try {
            const proxy = await this.proxyManager?.getNextProxy() || null;


            session = this.createSession(proxy);

            fake = this.generateFakeUser();

        } catch (initError) {


            return { success: false, error: initError.message, duration: Date.now() - startTime };
        }

        try {
            // Step 1: Extract product ID if needed

            const productId = await this.extractProductId(session, prodUrl, domain);
            if (!productId) {

                return { success: false, error: 'Product ID not found', duration: Date.now() - startTime };
            }

            // Step 2: Add to cart

            const cartResult = await this.addToCart(session, domain, productId);
            if (!cartResult.success) {

                return { success: false, error: cartResult.error, duration: Date.now() - startTime };
            }


            // Step 3: Submit contact info

            const contactResult = await this.submitContactAndShipping(
                session, cartResult.checkoutUrl, cartResult.authToken, cartResult.nextStep, fake
            );
            if (!contactResult.success) {

                return { success: false, error: contactResult.error, duration: Date.now() - startTime };
            }

            let paymentBody = contactResult.body;
            const checkoutUrl = cartResult.checkoutUrl;
            let authToken = cartResult.authToken;

            // Step 4: Handle shipping if needed
            if (contactResult.targetStep === 'shipping_method') {

                const shipResult = await this.getShippingRate(session, checkoutUrl, paymentBody);
                if (!shipResult.success) {

                    return { success: false, error: shipResult.error, duration: Date.now() - startTime };
                }

                const shipSubmitResult = await this.submitShippingAndGetPayment(
                    session, checkoutUrl, authToken, shipResult.shipId
                );
                if (!shipSubmitResult.success) {

                    return { success: false, error: shipSubmitResult.error, duration: Date.now() - startTime };
                }

                paymentBody = shipSubmitResult.body;
            } else {

            }

            // Step 5: Get payment page info

            let paymentInfo = {
                gateway: this.extractBetween(paymentBody, 'gateway="', '"'),
                price: this.extractBetween(paymentBody, 'payment-due-target="', '"'),
                hasBillingAddress: paymentBody.includes('billing_address'),
                hasSameAsShipping: paymentBody.includes('Same as shipping address'),
                body: paymentBody
            };

            if (!paymentInfo.gateway) {

                const paymentPageResult = await this.getPaymentPage(session, checkoutUrl, contactResult.targetStep);
                if (!paymentPageResult.success) {

                    return { success: false, error: paymentPageResult.error, duration: Date.now() - startTime };
                }
                paymentInfo = paymentPageResult;
            }

            // Step 6: Create card session via ShopifyCS

            const cardSessionResult = await this.createCardSession(session, {
                ...cardInfo,
                firstName: fake.first,
                lastName: fake.last
            }, domain);
            if (!cardSessionResult.success) {

                return { success: false, error: cardSessionResult.error, duration: Date.now() - startTime };
            }

            // Step 7: Submit payment

            const paymentResult = await this.submitPayment(
                session, checkoutUrl, authToken, paymentInfo.gateway, 
                paymentInfo.price, cardSessionResult.sessionId, paymentInfo, fake
            );
            if (!paymentResult.success) {

                return { success: false, error: paymentResult.error, duration: Date.now() - startTime };
            }

            // Step 8: Poll processing

            const processingResult = await this.pollProcessing(session, checkoutUrl);
            if (!processingResult.success) {

                return { success: false, error: processingResult.error, duration: Date.now() - startTime };
            }

            if (processingResult.errorMessage) {

            }

            const duration = Date.now() - startTime;



            return {
                success: true,
                body: processingResult.body,
                errorMessage: processingResult.errorMessage,
                gateway: paymentInfo.gateway,
                price: paymentInfo.price || paymentInfo.priceDisplay,
                duration
            };

        } catch (error) {


            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }
}
