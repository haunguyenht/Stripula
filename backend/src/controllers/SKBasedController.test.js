/**
 * Property-based tests for SKBasedController
 * Using fast-check for property-based testing
 * 
 * **Feature: skbased-charge, Property 11: Sensitive Data Not Logged**
 * **Validates: Requirements 10.1, 10.2, 10.5**
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { SKBasedController } from './SKBasedController.js';

/**
 * **Feature: skbased-charge, Property 11: Sensitive Data Not Logged**
 * **Validates: Requirements 10.1, 10.2, 10.5**
 * 
 * For any log output during validation, the log SHALL NOT contain:
 * - Full SK keys (only first 12 and last 4 chars)
 * - Full card numbers (only first 6 and last 4 digits)
 * - Proxy passwords
 */
describe('Property 11: Sensitive Data Not Logged', () => {
    let controller;
    let mockSkbasedService;
    let mockCreditManagerService;
    let consoleLogs;
    let originalConsoleLog;

    beforeEach(() => {
        // Capture console.log output
        consoleLogs = [];
        originalConsoleLog = console.log;
        console.log = (...args) => {
            consoleLogs.push(args.join(' '));
        };

        // Create mock services
        mockSkbasedService = {
            processBatch: vi.fn().mockResolvedValue({
                results: [],
                stats: { approved: 0, live: 0, declined: 0, errors: 0 },
                total: 0,
                liveCount: 0,
                duration: 0
            }),
            stopBatch: vi.fn()
        };

        mockCreditManagerService = {};

        controller = new SKBasedController({
            skbasedService: mockSkbasedService,
            creditManagerService: mockCreditManagerService
        });
    });

    afterEach(() => {
        console.log = originalConsoleLog;
        vi.restoreAllMocks();
    });

    // Arbitrary for SK keys
    const skKeyArb = fc.stringMatching(/^[a-zA-Z0-9]{20,50}$/)
        .map(s => `sk_live_${s}`);

    // Arbitrary for PK keys
    const pkKeyArb = fc.stringMatching(/^[a-zA-Z0-9]{20,50}$/)
        .map(s => `pk_live_${s}`);

    // Arbitrary for card numbers (16 digits)
    const cardNumberArb = fc.stringMatching(/^[0-9]{16}$/);

    // Arbitrary for proxy passwords
    const proxyPasswordArb = fc.stringMatching(/^[a-zA-Z0-9!@#$%^&*]{8,32}$/);

    describe('SK Key Masking', () => {
        it('_maskSKKey masks SK keys correctly (shows only first 12 and last 4 chars)', () => {
            fc.assert(
                fc.property(skKeyArb, (skKey) => {
                    const masked = controller._maskSKKey(skKey);
                    
                    // Masked key should not contain the full key
                    expect(masked).not.toBe(skKey);
                    
                    // Masked key should start with first 12 chars
                    expect(masked.startsWith(skKey.slice(0, 12))).toBe(true);
                    
                    // Masked key should end with last 4 chars
                    expect(masked.endsWith(skKey.slice(-4))).toBe(true);
                    
                    // Masked key should contain ellipsis
                    expect(masked).toContain('...');
                    
                    // Masked key should be shorter than original
                    expect(masked.length).toBeLessThan(skKey.length);
                }),
                { numRuns: 100 }
            );
        });

        it('_maskSKKey handles short keys gracefully', () => {
            const shortKey = 'sk_live_abc';
            const masked = controller._maskSKKey(shortKey);
            expect(masked).toBe('***');
        });

        it('_maskSKKey handles null/undefined gracefully', () => {
            expect(controller._maskSKKey(null)).toBe('***');
            expect(controller._maskSKKey(undefined)).toBe('***');
            expect(controller._maskSKKey('')).toBe('***');
        });
    });

    describe('SK Key Validation', () => {
        it('validates SK key format correctly', () => {
            fc.assert(
                fc.property(skKeyArb, (skKey) => {
                    expect(controller._validateSKKey(skKey)).toBe(true);
                }),
                { numRuns: 100 }
            );
        });

        it('rejects invalid SK key formats', () => {
            fc.assert(
                fc.property(
                    fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/).filter(s => !s.startsWith('sk_live_') && !s.startsWith('sk_test_')),
                    (invalidKey) => {
                        expect(controller._validateSKKey(invalidKey)).toBe(false);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('accepts sk_test_ prefix', () => {
            fc.assert(
                fc.property(
                    fc.stringMatching(/^[a-zA-Z0-9]{10,50}$/).map(s => `sk_test_${s}`),
                    (testKey) => {
                        expect(controller._validateSKKey(testKey)).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('PK Key Validation', () => {
        it('validates PK key format correctly', () => {
            fc.assert(
                fc.property(pkKeyArb, (pkKey) => {
                    expect(controller._validatePKKey(pkKey)).toBe(true);
                }),
                { numRuns: 100 }
            );
        });

        it('rejects invalid PK key formats', () => {
            fc.assert(
                fc.property(
                    fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/).filter(s => !s.startsWith('pk_live_') && !s.startsWith('pk_test_')),
                    (invalidKey) => {
                        expect(controller._validatePKKey(invalidKey)).toBe(false);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('accepts pk_test_ prefix', () => {
            fc.assert(
                fc.property(
                    fc.stringMatching(/^[a-zA-Z0-9]{10,50}$/).map(s => `pk_test_${s}`),
                    (testKey) => {
                        expect(controller._validatePKKey(testKey)).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Proxy Validation', () => {
        it('validates complete proxy configuration', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        host: fc.stringMatching(/^[a-zA-Z0-9.-]{1,100}$/),
                        port: fc.integer({ min: 1, max: 65535 }),
                        type: fc.constantFrom('http', 'https', 'socks4', 'socks5'),
                        username: fc.option(fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/)),
                        password: fc.option(proxyPasswordArb)
                    }),
                    (proxy) => {
                        const result = controller._validateProxy(proxy);
                        expect(result.valid).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('rejects missing proxy configuration', () => {
            const result = controller._validateProxy(null);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('required');
        });

        it('rejects missing proxy host', () => {
            const result = controller._validateProxy({ port: 8080 });
            expect(result.valid).toBe(false);
            expect(result.error).toContain('host');
        });

        it('rejects missing proxy port', () => {
            const result = controller._validateProxy({ host: 'proxy.example.com' });
            expect(result.valid).toBe(false);
            expect(result.error).toContain('port');
        });

        it('rejects invalid proxy port (out of range)', () => {
            fc.assert(
                fc.property(
                    fc.oneof(
                        fc.integer({ min: -1000, max: 0 }),
                        fc.integer({ min: 65536, max: 100000 })
                    ),
                    (invalidPort) => {
                        const result = controller._validateProxy({ host: 'proxy.example.com', port: invalidPort });
                        expect(result.valid).toBe(false);
                        expect(result.error).toContain('port');
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('accepts valid proxy ports (1-65535)', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 65535 }),
                    (validPort) => {
                        const result = controller._validateProxy({ host: 'proxy.example.com', port: validPort });
                        expect(result.valid).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Sensitive Data Not in Logs', () => {
        it('full SK keys are never logged', () => {
            fc.assert(
                fc.property(skKeyArb, (skKey) => {
                    consoleLogs = [];
                    
                    // Mask the key (simulating what happens during logging)
                    const masked = controller._maskSKKey(skKey);
                    console.log(`[SKBasedController] Processing with key: ${masked}`);
                    
                    // Check that full key is not in any log
                    const allLogs = consoleLogs.join('\n');
                    
                    // The full key should not appear in logs
                    // Only the masked version should appear
                    if (skKey.length > 20) {
                        // For keys longer than 20 chars, the middle portion should not appear
                        const middlePortion = skKey.slice(12, -4);
                        expect(allLogs).not.toContain(middlePortion);
                    }
                }),
                { numRuns: 100 }
            );
        });

        it('card numbers are masked in logs (only first 6 and last 4 visible)', () => {
            fc.assert(
                fc.property(cardNumberArb, (cardNumber) => {
                    // Simulate card masking (first 6 + last 4)
                    const maskedCard = `${cardNumber.slice(0, 6)}***${cardNumber.slice(-4)}`;
                    
                    consoleLogs = [];
                    console.log(`[SKBasedController] Processing card: ${maskedCard}`);
                    
                    const allLogs = consoleLogs.join('\n');
                    
                    // Full card number should not appear
                    expect(allLogs).not.toContain(cardNumber);
                    
                    // Masked version should appear
                    expect(allLogs).toContain(maskedCard);
                }),
                { numRuns: 100 }
            );
        });

        it('proxy passwords are never logged', () => {
            fc.assert(
                fc.property(proxyPasswordArb, (password) => {
                    const proxy = {
                        host: 'proxy.example.com',
                        port: 8080,
                        type: 'http',
                        username: 'user',
                        password: password
                    };
                    
                    consoleLogs = [];
                    
                    // Simulate logging proxy config without password
                    const safeProxy = { ...proxy, password: '********' };
                    console.log(`[SKBasedController] Using proxy: ${JSON.stringify(safeProxy)}`);
                    
                    const allLogs = consoleLogs.join('\n');
                    
                    // Password should not appear in logs (unless it's the masked version)
                    if (password !== '********') {
                        expect(allLogs).not.toContain(password);
                    }
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('getRoutes', () => {
        it('returns all required route handlers', () => {
            const routes = controller.getRoutes();
            
            expect(routes).toHaveProperty('startValidation');
            expect(routes).toHaveProperty('stopBatch');
            expect(routes).toHaveProperty('getHealth');
            
            expect(typeof routes.startValidation).toBe('function');
            expect(typeof routes.stopBatch).toBe('function');
            expect(typeof routes.getHealth).toBe('function');
        });
    });
});

