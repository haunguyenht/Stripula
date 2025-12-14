import axios from 'axios';
import { IStripeAPIClient } from '../../interfaces/IStripeAPIClient.js';
import { proxyAgentFactory } from '../http/ProxyAgentFactory.js';
import { retryHandler } from '../http/RetryHandler.js';
import { STRIPE_API } from '../../utils/constants.js';
import { getRandomAPIUserAgent, generateStripeIds, getRandomTimeOnPage } from '../../utils/helpers.js';

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
     * Check Stripe SK key validity and get account info
     */
    async checkKey(skKey) {
        const headers = { 'Authorization': `Bearer ${skKey}` };

        // Get balance
        const balanceRes = await axios.get(STRIPE_API.BALANCE, { headers });
        const balanceData = balanceRes.data;

        if (balanceData.error) {
            return { status: 'DEAD', message: balanceData.error.message };
        }

        // Get account info
        const accountRes = await axios.get(STRIPE_API.ACCOUNT, { headers });
        const accountData = accountRes.data;

        // Parse balance
        const available = balanceData.available?.[0] || {};
        const pending = balanceData.pending?.[0] || {};
        const availableAmount = available.amount || 0;
        const pendingAmount = pending.amount || 0;
        const currency = available.currency || accountData.default_currency || 'usd';
        const livemode = balanceData.livemode;

        // Determine status
        let status;
        if (availableAmount > 0) status = 'LIVE+';
        else if (availableAmount === 0) status = 'LIVE0';
        else status = 'LIVE-';

        return {
            status,
            type: livemode ? 'LIVE' : 'TEST',
            accountId: accountData.id || 'N/A',
            accountName: accountData.business_profile?.name || accountData.settings?.dashboard?.display_name || 'N/A',
            accountEmail: accountData.email || 'N/A',
            country: accountData.country || 'N/A',
            defaultCurrency: (accountData.default_currency || 'usd').toUpperCase(),
            currency: currency.toUpperCase(),
            availableBalance: availableAmount,
            pendingBalance: pendingAmount,
            chargesEnabled: accountData.charges_enabled || false,
            payoutsEnabled: accountData.payouts_enabled || false,
            livemode
        };
    }

    /**
     * Create a PaymentIntent
     */
    async createPaymentIntent(skKey, params, proxy = null) {
        const { amount, currency = 'usd', paymentMethod, confirm = false, captureMethod = 'automatic' } = params;
        
        const formData = new URLSearchParams({
            'amount': amount.toString(),
            'currency': currency,
            'payment_method_types[]': 'card',
            'capture_method': captureMethod,
        });

        if (paymentMethod) {
            formData.append('payment_method', paymentMethod);
        }
        if (confirm) {
            formData.append('confirm', 'true');
            formData.append('return_url', 'https://example.com/complete');
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
            formData.append('address[line1]', address.line1 || '123 Main St');
            formData.append('address[city]', address.city || 'New York');
            formData.append('address[state]', address.state || 'NY');
            formData.append('address[postal_code]', address.postalCode || '10001');
            formData.append('address[country]', address.country || 'US');
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
}

// Export singleton
export const stripeAPIClient = new StripeAPIClient();
