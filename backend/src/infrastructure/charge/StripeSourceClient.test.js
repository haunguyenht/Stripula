/**
 * Property-based tests for StripeSourceClient
 * Using fast-check for property-based testing
 * 
 * **Feature: skbased-charge, Property 5: Source Creation Includes Required Fingerprints**
 * **Validates: Requirements 4.2**
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import axios from 'axios';
import { StripeSourceClient } from './StripeSourceClient.js';

// Mock axios to capture request data
vi.mock('axios');

describe('Property 5: Source Creation Includes Required Fingerprints', () => {
    let client;
    let capturedRequests;

    beforeEach(() => {
        client = new StripeSourceClient();
        capturedRequests = [];
        
        // Mock axios.post to capture request data
        axios.post.mockImplementation((url, data, config) => {
            capturedRequests.push({ url, data, config });
            // Return a mock successful response
            return Promise.resolve({
                status: 200,
                data: {
                    id: 'src_test_123',
                    card: {
                        brand: 'visa',
                        country: 'US',
                        last4: '4242',
                        funding: 'credit'
                    }
                }
            });
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // Arbitrary for valid card data
    const cardDataArb = fc.record({
        number: fc.stringMatching(/^[0-9]{16}$/),
        expMonth: fc.integer({ min: 1, max: 12 }),
        expYear: fc.integer({ min: 24, max: 35 }),
        cvc: fc.stringMatching(/^[0-9]{3,4}$/)
    });

    // Arbitrary for valid PK keys
    const pkKeyArb = fc.constantFrom(
        'pk_live_test123456789',
        'pk_test_test123456789',
        'pk_live_abcdefghijklmnop',
        'pk_test_abcdefghijklmnop'
    );

    /**
     * **Feature: skbased-charge, Property 5: Source Creation Includes Required Fingerprints**
     * **Validates: Requirements 4.2**
     * 
     * For any Source creation request, the request body SHALL include non-empty 
     * guid, muid, and sid fingerprint values.
     */
    it('includes non-empty guid, muid, and sid in all source creation requests', async () => {
        await fc.assert(
            fc.asyncProperty(cardDataArb, pkKeyArb, async (cardData, pkKey) => {
                capturedRequests = [];
                
                await client.createSource(cardData, pkKey);
                
                // Should have made exactly one request
                expect(capturedRequests.length).toBe(1);
                
                const requestData = capturedRequests[0].data;
                const params = new URLSearchParams(requestData);
                
                // Check guid is present and non-empty
                const guid = params.get('guid');
                expect(guid).toBeTruthy();
                expect(guid.length).toBeGreaterThan(0);
                
                // Check muid is present and non-empty
                const muid = params.get('muid');
                expect(muid).toBeTruthy();
                expect(muid.length).toBeGreaterThan(0);
                
                // Check sid is present and non-empty
                const sid = params.get('sid');
                expect(sid).toBeTruthy();
                expect(sid.length).toBeGreaterThan(0);
            }),
            { numRuns: 100 }
        );
    });

    it('fingerprints are valid UUID format', async () => {
        await fc.assert(
            fc.asyncProperty(cardDataArb, pkKeyArb, async (cardData, pkKey) => {
                capturedRequests = [];
                
                await client.createSource(cardData, pkKey);
                
                const requestData = capturedRequests[0].data;
                const params = new URLSearchParams(requestData);
                
                // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                
                const guid = params.get('guid');
                const muid = params.get('muid');
                const sid = params.get('sid');
                
                expect(guid).toMatch(uuidRegex);
                expect(muid).toMatch(uuidRegex);
                expect(sid).toMatch(uuidRegex);
            }),
            { numRuns: 100 }
        );
    });

    it('fingerprints are unique per request', async () => {
        const seenGuids = new Set();
        const seenMuids = new Set();
        const seenSids = new Set();
        
        await fc.assert(
            fc.asyncProperty(cardDataArb, pkKeyArb, async (cardData, pkKey) => {
                capturedRequests = [];
                
                await client.createSource(cardData, pkKey);
                
                const requestData = capturedRequests[0].data;
                const params = new URLSearchParams(requestData);
                
                const guid = params.get('guid');
                const muid = params.get('muid');
                const sid = params.get('sid');
                
                // Each fingerprint should be unique (not seen before)
                expect(seenGuids.has(guid)).toBe(false);
                expect(seenMuids.has(muid)).toBe(false);
                expect(seenSids.has(sid)).toBe(false);
                
                seenGuids.add(guid);
                seenMuids.add(muid);
                seenSids.add(sid);
            }),
            { numRuns: 50 }
        );
    });

    it('uses checkout.stripe.com origin header', async () => {
        await fc.assert(
            fc.asyncProperty(cardDataArb, pkKeyArb, async (cardData, pkKey) => {
                capturedRequests = [];
                
                await client.createSource(cardData, pkKey);
                
                const config = capturedRequests[0].config;
                
                // Origin must be checkout.stripe.com for Radar bypass
                expect(config.headers['Origin']).toBe('https://checkout.stripe.com');
                expect(config.headers['Referer']).toBe('https://checkout.stripe.com/');
            }),
            { numRuns: 100 }
        );
    });

    it('includes payment_user_agent with checkout suffix', async () => {
        await fc.assert(
            fc.asyncProperty(cardDataArb, pkKeyArb, async (cardData, pkKey) => {
                capturedRequests = [];
                
                await client.createSource(cardData, pkKey);
                
                const requestData = capturedRequests[0].data;
                const params = new URLSearchParams(requestData);
                
                const paymentUserAgent = params.get('payment_user_agent');
                
                // Must include 'checkout' suffix
                expect(paymentUserAgent).toBeTruthy();
                expect(paymentUserAgent.toLowerCase()).toContain('checkout');
            }),
            { numRuns: 100 }
        );
    });

    it('includes owner name and address country', async () => {
        await fc.assert(
            fc.asyncProperty(cardDataArb, pkKeyArb, async (cardData, pkKey) => {
                capturedRequests = [];
                
                await client.createSource(cardData, pkKey);
                
                const requestData = capturedRequests[0].data;
                const params = new URLSearchParams(requestData);
                
                // Owner name should be present
                const ownerName = params.get('owner[name]');
                expect(ownerName).toBeTruthy();
                expect(ownerName.length).toBeGreaterThan(0);
                
                // Address country should be present
                const country = params.get('owner[address][country]');
                expect(country).toBeTruthy();
                expect(country.length).toBe(2); // ISO country code
            }),
            { numRuns: 100 }
        );
    });

    it('includes time_on_page as positive number', async () => {
        await fc.assert(
            fc.asyncProperty(cardDataArb, pkKeyArb, async (cardData, pkKey) => {
                capturedRequests = [];
                
                await client.createSource(cardData, pkKey);
                
                const requestData = capturedRequests[0].data;
                const params = new URLSearchParams(requestData);
                
                const timeOnPage = params.get('time_on_page');
                expect(timeOnPage).toBeTruthy();
                
                const timeValue = parseInt(timeOnPage, 10);
                expect(timeValue).toBeGreaterThan(0);
            }),
            { numRuns: 100 }
        );
    });

    it('sends request to correct Stripe Sources endpoint', async () => {
        await fc.assert(
            fc.asyncProperty(cardDataArb, pkKeyArb, async (cardData, pkKey) => {
                capturedRequests = [];
                
                await client.createSource(cardData, pkKey);
                
                const url = capturedRequests[0].url;
                
                // Must use HTTPS and correct endpoint
                expect(url).toBe('https://api.stripe.com/v1/sources');
            }),
            { numRuns: 100 }
        );
    });
});

