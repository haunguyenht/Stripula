/**
 * Property-based tests for SK-Based Decline Code Classifier
 * Using fast-check for property-based testing
 * 
 * **Feature: skbased-charge, Property 6: Decline Code Classification Consistency**
 * **Validates: Requirements 9.1-9.23**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
    classifyDecline, 
    DECLINE_CLASSIFICATION, 
    getAllDeclineCodes,
    isLiveCard 
} from './skbasedClassifier.js';

/**
 * **Feature: skbased-charge, Property 6: Decline Code Classification Consistency**
 * **Validates: Requirements 9.1-9.23**
 * 
 * For any Stripe decline code, the classification function SHALL return a consistent 
 * status (APPROVED, LIVE, DECLINED, or ERROR) and message according to the defined mapping.
 */
describe('Property 6: Decline Code Classification Consistency', () => {
    // Valid status values
    const VALID_STATUSES = ['APPROVED', 'LIVE', 'DECLINED', 'ERROR'];
    
    // Arbitrary for known decline codes
    const knownDeclineCodeArb = fc.constantFrom(...getAllDeclineCodes());
    
    // Arbitrary for CVC check results
    const cvcCheckArb = fc.constantFrom('pass', 'fail', 'unavailable', 'unchecked', null);
    
    // Arbitrary for network status
    const networkStatusArb = fc.constantFrom(
        'approved_by_network', 
        'declined_by_network', 
        'not_sent_to_network',
        null
    );

    it('classifies all known decline codes to valid statuses', () => {
        fc.assert(
            fc.property(knownDeclineCodeArb, (declineCode) => {
                const result = classifyDecline(declineCode);
                
                // Result should have status and message
                expect(result).toHaveProperty('status');
                expect(result).toHaveProperty('message');
                
                // Status should be one of the valid values
                expect(VALID_STATUSES).toContain(result.status);
                
                // Message should be a non-empty string
                expect(typeof result.message).toBe('string');
                expect(result.message.length).toBeGreaterThan(0);
            }),
            { numRuns: 100 }
        );
    });

    it('returns consistent classification for the same decline code', () => {
        fc.assert(
            fc.property(knownDeclineCodeArb, (declineCode) => {
                // Call classifyDecline multiple times with the same code
                const result1 = classifyDecline(declineCode);
                const result2 = classifyDecline(declineCode);
                const result3 = classifyDecline(declineCode);
                
                // All results should be identical
                expect(result1.status).toBe(result2.status);
                expect(result2.status).toBe(result3.status);
                expect(result1.message).toBe(result2.message);
                expect(result2.message).toBe(result3.message);
            }),
            { numRuns: 100 }
        );
    });

    it('classification matches the DECLINE_CLASSIFICATION mapping', () => {
        fc.assert(
            fc.property(knownDeclineCodeArb, (declineCode) => {
                const result = classifyDecline(declineCode);
                const expected = DECLINE_CLASSIFICATION[declineCode];
                
                // Result should match the mapping
                expect(result.status).toBe(expected.status);
                expect(result.message).toBe(expected.message);
            }),
            { numRuns: 100 }
        );
    });

    it('handles case-insensitive decline codes', () => {
        fc.assert(
            fc.property(knownDeclineCodeArb, (declineCode) => {
                const lowerResult = classifyDecline(declineCode.toLowerCase());
                const upperResult = classifyDecline(declineCode.toUpperCase());
                const mixedResult = classifyDecline(
                    declineCode.split('').map((c, i) => 
                        i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()
                    ).join('')
                );
                
                // All should produce the same status
                expect(lowerResult.status).toBe(upperResult.status);
                expect(upperResult.status).toBe(mixedResult.status);
            }),
            { numRuns: 100 }
        );
    });

    it('handles null/undefined decline codes with CVC check', () => {
        fc.assert(
            fc.property(cvcCheckArb, (cvcCheck) => {
                const resultNull = classifyDecline(null, cvcCheck);
                const resultUndefined = classifyDecline(undefined, cvcCheck);
                
                // Both should return valid results
                expect(VALID_STATUSES).toContain(resultNull.status);
                expect(VALID_STATUSES).toContain(resultUndefined.status);
                expect(typeof resultNull.message).toBe('string');
                expect(typeof resultUndefined.message).toBe('string');
            }),
            { numRuns: 100 }
        );
    });

    it('CVC pass with null decline code returns APPROVED', () => {
        const result = classifyDecline(null, 'pass');
        expect(result.status).toBe('APPROVED');
        expect(result.message).toBe('CVV Approved');
    });

    it('CVC unchecked returns ERROR status', () => {
        const result = classifyDecline(null, 'unchecked');
        expect(result.status).toBe('ERROR');
        expect(result.message).toContain('Unchecked');
    });

    it('CVC fail returns DECLINED status', () => {
        const result = classifyDecline(null, 'fail');
        expect(result.status).toBe('DECLINED');
        expect(result.message).toContain('CVC');
    });

    it('isLiveCard returns true only for LIVE and APPROVED statuses', () => {
        fc.assert(
            fc.property(knownDeclineCodeArb, (declineCode) => {
                const classification = DECLINE_CLASSIFICATION[declineCode];
                const isLive = isLiveCard(declineCode);
                
                if (classification.status === 'LIVE' || classification.status === 'APPROVED') {
                    expect(isLive).toBe(true);
                } else {
                    expect(isLive).toBe(false);
                }
            }),
            { numRuns: 100 }
        );
    });

    // Specific requirement tests
    describe('Specific Decline Code Requirements', () => {
        it('Requirement 9.5: generic_decline returns DECLINED', () => {
            const result = classifyDecline('generic_decline');
            expect(result.status).toBe('DECLINED');
            expect(result.message).toBe('Generic Decline');
        });

        it('Requirement 9.6: insufficient_funds returns LIVE', () => {
            const result = classifyDecline('insufficient_funds');
            expect(result.status).toBe('LIVE');
            expect(result.message).toContain('Insufficient Funds');
        });

        it('Requirement 9.7: fraudulent returns DECLINED (DIE card)', () => {
            const result = classifyDecline('fraudulent');
            expect(result.status).toBe('DECLINED');
            expect(result.message).toContain('Fraudulent');
        });

        it('Requirement 9.8: do_not_honor returns DECLINED', () => {
            const result = classifyDecline('do_not_honor');
            expect(result.status).toBe('DECLINED');
            expect(result.message).toBe('Do Not Honor');
        });

        it('Requirement 9.9: lost_card returns DECLINED', () => {
            const result = classifyDecline('lost_card');
            expect(result.status).toBe('DECLINED');
            expect(result.message).toBe('Lost Card');
        });

        it('Requirement 9.10: stolen_card returns DECLINED', () => {
            const result = classifyDecline('stolen_card');
            expect(result.status).toBe('DECLINED');
            expect(result.message).toBe('Stolen Card');
        });

        it('Requirement 9.11: pickup_card returns DECLINED', () => {
            const result = classifyDecline('pickup_card');
            expect(result.status).toBe('DECLINED');
            expect(result.message).toContain('Pickup Card');
        });

        it('Requirement 9.12: incorrect_cvc returns LIVE', () => {
            const result = classifyDecline('incorrect_cvc');
            expect(result.status).toBe('LIVE');
            expect(result.message).toContain('CCN');
        });

        it('Requirement 9.13: invalid_cvc returns LIVE', () => {
            const result = classifyDecline('invalid_cvc');
            expect(result.status).toBe('LIVE');
            expect(result.message).toContain('CCN');
        });

        it('Requirement 9.14: expired_card returns DECLINED', () => {
            const result = classifyDecline('expired_card');
            expect(result.status).toBe('DECLINED');
            expect(result.message).toBe('Expired Card');
        });

        it('Requirement 9.15: processing_error returns ERROR', () => {
            const result = classifyDecline('processing_error');
            expect(result.status).toBe('ERROR');
            expect(result.message).toBe('Processing Error');
        });

        it('Requirement 9.16: incorrect_number returns DECLINED', () => {
            const result = classifyDecline('incorrect_number');
            expect(result.status).toBe('DECLINED');
            expect(result.message).toContain('Card Number');
        });

        it('Requirement 9.17: service_not_allowed returns DECLINED', () => {
            const result = classifyDecline('service_not_allowed');
            expect(result.status).toBe('DECLINED');
            expect(result.message).toBe('Service Not Allowed');
        });

        it('Requirement 9.18: transaction_not_allowed returns DECLINED', () => {
            const result = classifyDecline('transaction_not_allowed');
            expect(result.status).toBe('DECLINED');
            expect(result.message).toBe('Transaction Not Allowed');
        });

        it('Requirement 9.19: invalid_account returns DECLINED', () => {
            const result = classifyDecline('invalid_account');
            expect(result.status).toBe('DECLINED');
            expect(result.message).toBe('Invalid Account');
        });
    });

    it('handles unknown decline codes gracefully', () => {
        // Reserved JavaScript property names that could cause issues
        const reservedNames = ['constructor', 'prototype', '__proto__', 'toString', 'valueOf', 'hasOwnProperty'];
        
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
                    !getAllDeclineCodes().includes(s.toLowerCase()) && 
                    !reservedNames.includes(s.toLowerCase())
                ),
                (unknownCode) => {
                    const result = classifyDecline(unknownCode);
                    
                    // Should still return a valid result
                    expect(VALID_STATUSES).toContain(result.status);
                    expect(typeof result.message).toBe('string');
                    expect(result.message.length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('handles decline codes with different separators', () => {
        // Test that underscores, hyphens, and spaces are normalized
        const testCases = [
            ['generic_decline', 'generic-decline', 'generic decline'],
            ['do_not_honor', 'do-not-honor', 'do not honor'],
            ['insufficient_funds', 'insufficient-funds', 'insufficient funds'],
        ];

        for (const [underscore, hyphen, space] of testCases) {
            const result1 = classifyDecline(underscore);
            const result2 = classifyDecline(hyphen);
            const result3 = classifyDecline(space);

            expect(result1.status).toBe(result2.status);
            expect(result2.status).toBe(result3.status);
        }
    });
});
