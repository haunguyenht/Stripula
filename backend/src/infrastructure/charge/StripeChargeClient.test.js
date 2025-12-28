/**
 * Property-based tests for StripeChargeClient
 * Using fast-check for property-based testing
 * 
 * **Feature: skbased-charge, Property 9: 3DS Browser Data Stripping**
 * **Validates: Requirements 6.3**
 * 
 * **Feature: skbased-charge, Property 12: HTTPS for All Stripe Communications**
 * **Validates: Requirements 10.6**
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import axios from 'axios';
import { StripeChargeClient } from './StripeChargeClient.js';

// Mock axios to capture request data
vi.mock('axios');

describe('Property 9: 3DS Browser Data Stripping', () => {
    let client;
    let capturedRequests;

    beforeEach(() => {
        client = new StripeChargeClient();
        capturedRequests = [];
        
        // Mock axios.post to capture request data
        axios.post.mockImplementation((url, data, config) => {
            capturedRequests.push({ url, data, config });
            // Return a mock successful 3DS response
            return Promise.resolve({
                status: 200,
                data: {
                    id: 'threeds_test_123',
                    state: 'succeeded'
                }
            });
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // Arbitrary for payment intent IDs
    const paymentIntentIdArb = fc.constantFrom(
        'pi_test_123456789',
        'pi_live_abcdefghij',
        'pi_test_xyz123abc',
        'pi_live_987654321'
    );

    // Arbitrary for PK keys
    const pkKeyArb = fc.constantFrom(
        'pk_live_test123456789',
        'pk_test_test123456789',
        'pk_live_abcdefghijklmnop',
        'pk_test_abcdefghijklmnop'
    );

    /**
     * **Feature: skbased-charge, Property 9: 3DS Browser Data Stripping**
     * **Validates: Requirements 6.3**
     * 
     * For any 3DS bypass attempt, the browser data object SHALL have empty strings 
     * for browserLanguage and browserTZ fields.
     */
    it('strips browserLanguage and browserTZ fields in all 3DS bypass attempts', async () => {
        await fc.assert(
            fc.asyncProperty(paymentIntentIdArb, pkKeyArb, async (paymentIntentId, pkKey) => {
                capturedRequests = [];
                
                await client.attempt3DSBypass(paymentIntentId, pkKey);
                
                // Should have made exactly one request
                expect(capturedRequests.length).toBe(1);
                
                const requestData = capturedRequests[0].data;
                const params = new URLSearchParams(requestData);
                
                // Get the browser data JSON
                const browserDataStr = params.get('browser');
                expect(browserDataStr).toBeTruthy();
                
                const browserData = JSON.parse(browserDataStr);
                
                // CRITICAL: browserLanguage and browserTZ must be empty strings
                expect(browserData.browserLanguage).toBe('');
                expect(browserData.browserTZ).toBe('');
            }),
            { numRuns: 100 }
        );
    });

    it('includes required browser data fields', async () => {
        await fc.assert(
            fc.asyncProperty(paymentIntentIdArb, pkKeyArb, async (paymentIntentId, pkKey) => {
                capturedRequests = [];
                
                await client.attempt3DSBypass(paymentIntentId, pkKey);
                
                const requestData = capturedRequests[0].data;
                const params = new URLSearchParams(requestData);
                
                const browserDataStr = params.get('browser');
                const browserData = JSON.parse(browserDataStr);
                
                // Required fields should be present
                expect(browserData).toHaveProperty('browserJavaEnabled');
                expect(browserData).toHaveProperty('browserJavascriptEnabled');
                expect(browserData).toHaveProperty('browserColorDepth');
                expect(browserData).toHaveProperty('browserScreenHeight');
                expect(browserData).toHaveProperty('browserScreenWidth');
                expect(browserData).toHaveProperty('browserLanguage');
                expect(browserData).toHaveProperty('browserTZ');
            }),
            { numRuns: 100 }
        );
    });

    it('sends request to correct 3DS authenticate endpoint', async () => {
        await fc.assert(
            fc.asyncProperty(paymentIntentIdArb, pkKeyArb, async (paymentIntentId, pkKey) => {
                capturedRequests = [];
                
                await client.attempt3DSBypass(paymentIntentId, pkKey);
                
                const url = capturedRequests[0].url;
                
                // Must use HTTPS and correct endpoint
                expect(url).toBe('https://api.stripe.com/v1/3ds2/authenticate');
            }),
            { numRuns: 100 }
        );
    });

    it('includes source parameter with payment intent ID', async () => {
        await fc.assert(
            fc.asyncProperty(paymentIntentIdArb, pkKeyArb, async (paymentIntentId, pkKey) => {
                capturedRequests = [];
                
                await client.attempt3DSBypass(paymentIntentId, pkKey);
                
                const requestData = capturedRequests[0].data;
                const params = new URLSearchParams(requestData);
                
                const source = params.get('source');
                expect(source).toBe(paymentIntentId);
            }),
            { numRuns: 100 }
        );
    });

    it('includes PK key in request', async () => {
        await fc.assert(
            fc.asyncProperty(paymentIntentIdArb, pkKeyArb, async (paymentIntentId, pkKey) => {
                capturedRequests = [];
                
                await client.attempt3DSBypass(paymentIntentId, pkKey);
                
                const requestData = capturedRequests[0].data;
                const params = new URLSearchParams(requestData);
                
                const key = params.get('key');
                expect(key).toBe(pkKey);
            }),
            { numRuns: 100 }
        );
    });

    it('uses js.stripe.com origin for 3DS requests', async () => {
        await fc.assert(
            fc.asyncProperty(paymentIntentIdArb, pkKeyArb, async (paymentIntentId, pkKey) => {
                capturedRequests = [];
                
                await client.attempt3DSBypass(paymentIntentId, pkKey);
                
                const config = capturedRequests[0].config;
                
                // 3DS requests use js.stripe.com origin
                expect(config.headers['Origin']).toBe('https://js.stripe.com');
                expect(config.headers['Referer']).toBe('https://js.stripe.com/');
            }),
            { numRuns: 100 }
        );
    });
});

describe('Property 12: HTTPS for All Stripe Communications', () => {
    let client;
    let capturedRequests;

    beforeEach(() => {
        client = new StripeChargeClient();
        capturedRequests = [];
        
        // Mock axios methods to capture request data
        axios.post.mockImplementation((url, data, config) => {
            capturedRequests.push({ method: 'POST', url, data, config });
            return Promise.resolve({
                status: 200,
                data: {
                    id: 'ch_test_123',
                    status: 'succeeded',
                    outcome: { network_status: 'approved_by_network', risk_level: 'normal' },
                    payment_method_details: { card: { checks: {} } }
                }
            });
        });
        
        axios.get.mockImplementation((url, config) => {
            capturedRequests.push({ method: 'GET', url, config });
            return Promise.resolve({
                status: 200,
                data: { id: 'ch_test_123' }
            });
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // Arbitrary for source IDs
    const sourceIdArb = fc.constantFrom(
        'src_test_123456789',
        'src_live_abcdefghij',
        'src_test_xyz123abc'
    );

    // Arbitrary for SK keys
    const skKeyArb = fc.constantFrom(
        'sk_live_test123456789',
        'sk_test_test123456789',
        'sk_live_abcdefghijklmnop'
    );

    // Arbitrary for charge IDs
    const chargeIdArb = fc.constantFrom(
        'ch_test_123456789',
        'ch_live_abcdefghij',
        'ch_test_xyz123abc'
    );

    /**
     * **Feature: skbased-charge, Property 12: HTTPS for All Stripe Communications**
     * **Validates: Requirements 10.6**
     * 
     * For any HTTP request to Stripe APIs, the URL SHALL use the HTTPS protocol.
     */
    it('charge requests use HTTPS', async () => {
        await fc.assert(
            fc.asyncProperty(sourceIdArb, skKeyArb, async (sourceId, skKey) => {
                capturedRequests = [];
                
                await client.charge(sourceId, skKey);
                
                // All requests should use HTTPS
                for (const req of capturedRequests) {
                    expect(req.url).toMatch(/^https:\/\//);
                    expect(req.url).toContain('api.stripe.com');
                }
            }),
            { numRuns: 100 }
        );
    });

    it('refund requests use HTTPS', async () => {
        await fc.assert(
            fc.asyncProperty(chargeIdArb, skKeyArb, async (chargeId, skKey) => {
                capturedRequests = [];
                
                await client.refund(chargeId, skKey);
                
                // All requests should use HTTPS
                for (const req of capturedRequests) {
                    expect(req.url).toMatch(/^https:\/\//);
                    expect(req.url).toContain('api.stripe.com');
                }
            }),
            { numRuns: 100 }
        );
    });

    it('retrieve charge requests use HTTPS', async () => {
        await fc.assert(
            fc.asyncProperty(chargeIdArb, skKeyArb, async (chargeId, skKey) => {
                capturedRequests = [];
                
                await client.retrieveCharge(chargeId, skKey);
                
                // All requests should use HTTPS
                for (const req of capturedRequests) {
                    expect(req.url).toMatch(/^https:\/\//);
                    expect(req.url).toContain('api.stripe.com');
                }
            }),
            { numRuns: 100 }
        );
    });

    it('charge requests use correct Stripe charges endpoint', async () => {
        await fc.assert(
            fc.asyncProperty(sourceIdArb, skKeyArb, async (sourceId, skKey) => {
                capturedRequests = [];
                
                await client.charge(sourceId, skKey);
                
                expect(capturedRequests.length).toBeGreaterThan(0);
                const chargeReq = capturedRequests.find(r => r.url.includes('/charges'));
                expect(chargeReq).toBeTruthy();
                expect(chargeReq.url).toBe('https://api.stripe.com/v1/charges');
            }),
            { numRuns: 100 }
        );
    });

    it('refund requests use correct Stripe refunds endpoint', async () => {
        await fc.assert(
            fc.asyncProperty(chargeIdArb, skKeyArb, async (chargeId, skKey) => {
                capturedRequests = [];
                
                await client.refund(chargeId, skKey);
                
                expect(capturedRequests.length).toBeGreaterThan(0);
                const refundReq = capturedRequests.find(r => r.url.includes('/refunds'));
                expect(refundReq).toBeTruthy();
                expect(refundReq.url).toBe('https://api.stripe.com/v1/refunds');
            }),
            { numRuns: 100 }
        );
    });

    it('uses Bearer authentication for SK key requests', async () => {
        await fc.assert(
            fc.asyncProperty(sourceIdArb, skKeyArb, async (sourceId, skKey) => {
                capturedRequests = [];
                
                await client.charge(sourceId, skKey);
                
                const chargeReq = capturedRequests.find(r => r.url.includes('/charges'));
                expect(chargeReq).toBeTruthy();
                expect(chargeReq.config.headers['Authorization']).toBe(`Bearer ${skKey}`);
            }),
            { numRuns: 100 }
        );
    });
});

