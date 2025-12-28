/**
 * Property-based tests for SKBasedValidator
 * Using fast-check for property-based testing
 * 
 * **Feature: skbased-charge, Property 7: Response Contains Required Fields**
 * **Validates: Requirements 9.24-9.32**
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { SKBasedValidator } from './SKBasedValidator.js';
import { SKBasedResult } from '../domain/SKBasedResult.js';

/**
 * **Feature: skbased-charge, Property 7: Response Contains Required Fields**
 * **Validates: Requirements 9.24-9.32**
 * 
 * For any successful validation response, the result object SHALL contain all required fields:
 * status, message, riskLevel, avsCheck, cvcCheck, brand, country, countryFlag, duration, and gateway.
 */
describe('Property 7: Response Contains Required Fields', () => {
    // Required fields that must be present in every response
    const REQUIRED_FIELDS = [
        'status',
        'message',
        'card',
        'gateway',
        'duration'
    ];

    // Optional fields that should be present when available
    const OPTIONAL_FIELDS = [
        'riskLevel',
        'avsCheck',
        'cvcCheck',
        'networkStatus',
        'vbvStatus',
        'brand',
        'type',
        'funding',
        'bank',
        'country',
        'countryFlag',
        'chargeAmount',
        'chargeId',
        'refundId',
        'sourceId',
        'declineCode'
    ];

    // Valid status values
    const VALID_STATUSES = ['APPROVED', 'LIVE', 'DECLINED', 'ERROR'];

    // Arbitrary for card numbers (Luhn-valid-ish for testing)
    const cardNumberArb = fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 13, maxLength: 19 }).map(arr => arr.join(''));
    
    // Arbitrary for expiry month
    const expMonthArb = fc.integer({ min: 1, max: 12 }).map(m => String(m).padStart(2, '0'));
    
    // Arbitrary for expiry year (2 digits)
    const expYearArb = fc.integer({ min: 24, max: 35 }).map(y => String(y));
    
    // Arbitrary for CVC
    const cvcArb = fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 3, maxLength: 4 }).map(arr => arr.join(''));

    // Arbitrary for card info
    const cardInfoArb = fc.record({
        number: cardNumberArb,
        expMonth: expMonthArb,
        expYear: expYearArb,
        cvc: cvcArb
    });

    // Arbitrary for risk levels
    const riskLevelArb = fc.constantFrom('normal', 'elevated', 'highest', null);

    // Arbitrary for check results
    const checkResultArb = fc.constantFrom('pass', 'fail', 'unavailable', 'unchecked', null);

    // Arbitrary for network status
    const networkStatusArb = fc.constantFrom('approved_by_network', 'declined_by_network', 'not_sent_to_network', null);

    // Mock source client response
    const mockSourceResponseArb = fc.record({
        success: fc.boolean(),
        sourceId: fc.string({ minLength: 10, maxLength: 30 }).map(s => `src_${s}`),
        brand: fc.constantFrom('visa', 'mastercard', 'amex', 'discover', null),
        country: fc.constantFrom('US', 'GB', 'CA', 'AU', null),
        last4: fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 4, maxLength: 4 }).map(arr => arr.join('')),
        error: fc.string({ minLength: 5, maxLength: 50 }),
        code: fc.constantFrom('card_declined', 'invalid_number', 'expired_card', null),
        declineCode: fc.constantFrom('generic_decline', 'insufficient_funds', 'fraudulent', null)
    });

    // Mock charge response
    const mockChargeResponseArb = fc.record({
        success: fc.boolean(),
        chargeId: fc.string({ minLength: 10, maxLength: 30 }).map(s => `ch_${s}`),
        status: fc.constantFrom('succeeded', 'pending', 'failed'),
        riskLevel: riskLevelArb,
        avsCheck: checkResultArb,
        cvcCheck: checkResultArb,
        networkStatus: networkStatusArb,
        declineCode: fc.constantFrom('generic_decline', 'insufficient_funds', 'fraudulent', 'do_not_honor', null),
        error: fc.string({ minLength: 5, maxLength: 50 }),
        code: fc.constantFrom('card_error', 'api_error', null)
    });

    describe('SKBasedResult structure validation', () => {
        it('all factory methods produce results with required fields', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        card: fc.string({ minLength: 10, maxLength: 50 }),
                        message: fc.string({ minLength: 1, maxLength: 100 }),
                        gateway: fc.string({ minLength: 1, maxLength: 20 }),
                        duration: fc.integer({ min: 0, max: 60000 })
                    }),
                    (data) => {
                        // Test all factory methods
                        const approved = SKBasedResult.approved(data);
                        const live = SKBasedResult.live(data);
                        const declined = SKBasedResult.declined(data);
                        const error = SKBasedResult.error(data.message, data);

                        const results = [approved, live, declined, error];

                        for (const result of results) {
                            // Check required fields exist
                            expect(result).toHaveProperty('status');
                            expect(result).toHaveProperty('message');
                            expect(result).toHaveProperty('card');
                            expect(result).toHaveProperty('gateway');
                            
                            // Status should be valid
                            expect(VALID_STATUSES).toContain(result.status);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('toJSON() includes all required fields', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        status: fc.constantFrom(...VALID_STATUSES),
                        message: fc.string({ minLength: 1, maxLength: 100 }),
                        card: fc.string({ minLength: 10, maxLength: 50 }),
                        gateway: fc.string({ minLength: 1, maxLength: 20 }),
                        duration: fc.integer({ min: 0, max: 60000 }),
                        riskLevel: riskLevelArb,
                        avsCheck: checkResultArb,
                        cvcCheck: checkResultArb,
                        networkStatus: networkStatusArb,
                        brand: fc.constantFrom('VISA', 'MASTERCARD', 'AMEX', null),
                        country: fc.constantFrom('US', 'GB', 'CA', null),
                        countryFlag: fc.constantFrom('🇺🇸', '🇬🇧', '🇨🇦', null),
                        chargeAmount: fc.constantFrom('$1.00', '$0.50', '$5.00', null)
                    }),
                    (data) => {
                        const result = new SKBasedResult(data);
                        const json = result.toJSON();

                        // Check all required fields are in JSON output
                        expect(json).toHaveProperty('status');
                        expect(json).toHaveProperty('message');
                        expect(json).toHaveProperty('card');
                        expect(json).toHaveProperty('gateway');
                        expect(json).toHaveProperty('duration');

                        // Check optional fields are included
                        expect(json).toHaveProperty('riskLevel');
                        expect(json).toHaveProperty('avsCheck');
                        expect(json).toHaveProperty('cvcCheck');
                        expect(json).toHaveProperty('networkStatus');
                        expect(json).toHaveProperty('brand');
                        expect(json).toHaveProperty('country');
                        expect(json).toHaveProperty('countryFlag');
                        expect(json).toHaveProperty('chargeAmount');
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('status helper methods are consistent with status field', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...VALID_STATUSES),
                    (status) => {
                        const result = new SKBasedResult({ status, message: 'Test' });

                        // Helper methods should match status
                        expect(result.isApproved()).toBe(status === 'APPROVED');
                        expect(result.isDeclined()).toBe(status === 'DECLINED');
                        expect(result.isError()).toBe(status === 'ERROR');
                        
                        // isLive() returns true for both APPROVED and LIVE
                        expect(result.isLive()).toBe(status === 'APPROVED' || status === 'LIVE');
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('factory methods set correct status', () => {
            const data = { message: 'Test', card: '4111111111111111|01|25|123' };

            expect(SKBasedResult.approved(data).status).toBe('APPROVED');
            expect(SKBasedResult.live(data).status).toBe('LIVE');
            expect(SKBasedResult.declined(data).status).toBe('DECLINED');
            expect(SKBasedResult.error('Error message', data).status).toBe('ERROR');
        });
    });

    describe('SKBasedValidator parseCard validation', () => {
        let validator;

        beforeEach(() => {
            validator = new SKBasedValidator({ debug: false });
        });

        it('parses valid card lines correctly', () => {
            fc.assert(
                fc.property(cardInfoArb, (cardInfo) => {
                    const cardLine = `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}|${cardInfo.cvc}`;
                    const parsed = validator.parseCard(cardLine);

                    expect(parsed).not.toBeNull();
                    expect(parsed.number).toBe(cardInfo.number);
                    expect(parsed.expMonth).toBe(cardInfo.expMonth);
                    expect(parsed.cvc).toBe(cardInfo.cvc);
                }),
                { numRuns: 100 }
            );
        });

        it('returns null for invalid card formats', () => {
            const invalidFormats = [
                '',
                null,
                undefined,
                '4111111111111111',  // Missing parts
                '4111111111111111|01',  // Missing parts
                '4111111111111111|01|25',  // Missing CVV
                '123|01|25|123',  // Card number too short
            ];

            for (const format of invalidFormats) {
                expect(validator.parseCard(format)).toBeNull();
            }
        });

        it('normalizes 4-digit year to 2-digit', () => {
            const cardLine = '4111111111111111|01|2025|123';
            const parsed = validator.parseCard(cardLine);

            expect(parsed).not.toBeNull();
            expect(parsed.expYear).toBe('25');
        });

        it('pads single-digit month with zero', () => {
            const cardLine = '4111111111111111|1|25|123';
            const parsed = validator.parseCard(cardLine);

            expect(parsed).not.toBeNull();
            expect(parsed.expMonth).toBe('01');
        });
    });

    describe('Response field requirements (9.24-9.32)', () => {
        it('Requirement 9.24: riskLevel field is included', () => {
            const result = new SKBasedResult({
                status: 'APPROVED',
                message: 'Test',
                riskLevel: 'normal'
            });
            
            expect(result.riskLevel).toBe('normal');
            expect(result.toJSON().riskLevel).toBe('normal');
        });

        it('Requirement 9.25: avsCheck field is included', () => {
            const result = new SKBasedResult({
                status: 'APPROVED',
                message: 'Test',
                avsCheck: 'pass'
            });
            
            expect(result.avsCheck).toBe('pass');
            expect(result.toJSON().avsCheck).toBe('pass');
        });

        it('Requirement 9.26: cvcCheck field is included', () => {
            const result = new SKBasedResult({
                status: 'APPROVED',
                message: 'Test',
                cvcCheck: 'pass'
            });
            
            expect(result.cvcCheck).toBe('pass');
            expect(result.toJSON().cvcCheck).toBe('pass');
        });

        it('Requirement 9.27: vbvStatus field is included', () => {
            const result = new SKBasedResult({
                status: 'LIVE',
                message: '3DS Required',
                vbvStatus: '3DS Required'
            });
            
            expect(result.vbvStatus).toBe('3DS Required');
            expect(result.toJSON().vbvStatus).toBe('3DS Required');
        });

        it('Requirement 9.28: BIN data fields are included', () => {
            const result = new SKBasedResult({
                status: 'APPROVED',
                message: 'Test',
                brand: 'VISA',
                type: 'CREDIT',
                funding: 'credit',
                bank: 'Chase'
            });
            
            expect(result.brand).toBe('VISA');
            expect(result.type).toBe('CREDIT');
            expect(result.funding).toBe('credit');
            expect(result.bank).toBe('Chase');
            
            const json = result.toJSON();
            expect(json.brand).toBe('VISA');
            expect(json.type).toBe('CREDIT');
            expect(json.funding).toBe('credit');
            expect(json.bank).toBe('Chase');
        });

        it('Requirement 9.29: country with flag is included', () => {
            const result = new SKBasedResult({
                status: 'APPROVED',
                message: 'Test',
                country: 'US',
                countryFlag: '🇺🇸'
            });
            
            expect(result.country).toBe('US');
            expect(result.countryFlag).toBe('🇺🇸');
            
            const json = result.toJSON();
            expect(json.country).toBe('US');
            expect(json.countryFlag).toBe('🇺🇸');
        });

        it('Requirement 9.30: duration field is included', () => {
            const result = new SKBasedResult({
                status: 'APPROVED',
                message: 'Test',
                duration: 1500
            });
            
            expect(result.duration).toBe(1500);
            expect(result.toJSON().duration).toBe(1500);
        });

        it('Requirement 9.31: gateway field is included', () => {
            const result = new SKBasedResult({
                status: 'APPROVED',
                message: 'Test',
                gateway: 'skbased-1'
            });
            
            expect(result.gateway).toBe('skbased-1');
            expect(result.toJSON().gateway).toBe('skbased-1');
        });

        it('Requirement 9.32: chargeAmount field is included', () => {
            const result = new SKBasedResult({
                status: 'APPROVED',
                message: 'Test',
                chargeAmount: '$1.00'
            });
            
            expect(result.chargeAmount).toBe('$1.00');
            expect(result.toJSON().chargeAmount).toBe('$1.00');
        });
    });
});
