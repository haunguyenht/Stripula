/**
 * Property-based tests for statistics utility functions
 * Using fast-check for property-based testing
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateKeyStats, calculateCardStats, filterResults, countInputLines, deleteResultAndUpdateStats } from './statistics';

/**
 * **Feature: luma-ui-redesign, Property 2: Statistics correctly sum results by status**
 * **Validates: Requirements 3.1**
 * 
 * For any array of validation results, the computed statistics should correctly 
 * count results by status category (live, dead, error) and the total should 
 * equal the sum of all categories.
 */
describe('Property 2: Statistics correctly sum results by status', () => {
    // Arbitrary for key result status
    const keyStatusArb = fc.constantFrom('LIVE+', 'LIVE0', 'LIVE-', 'LIVE', 'DEAD', 'ERROR');
    
    // Arbitrary for key result object
    const keyResultArb = fc.record({
        status: keyStatusArb,
        key: fc.string(),
        fullKey: fc.string(),
    });

    // Arbitrary for card result status
    const cardStatusArb = fc.constantFrom('APPROVED', 'LIVE', 'DIE', 'ERROR', 'RETRY');
    
    // Arbitrary for card result object
    const cardResultArb = fc.record({
        status: cardStatusArb,
        card: fc.string(),
        fullCard: fc.string(),
    });

    it('key stats total equals sum of live + dead + error', () => {
        fc.assert(
            fc.property(fc.array(keyResultArb, { minLength: 0, maxLength: 100 }), (results) => {
                const stats = calculateKeyStats(results);
                
                // Total should equal sum of all categories
                expect(stats.total).toBe(stats.live + stats.dead + stats.error);
            }),
            { numRuns: 100 }
        );
    });

    it('key stats live equals sum of livePlus + liveZero + liveNeg + plain live', () => {
        fc.assert(
            fc.property(fc.array(keyResultArb, { minLength: 0, maxLength: 100 }), (results) => {
                const stats = calculateKeyStats(results);
                
                // Count each live sub-type manually
                let expectedLive = 0;
                for (const r of results) {
                    if (r.status?.startsWith('LIVE')) expectedLive++;
                }
                
                expect(stats.live).toBe(expectedLive);
            }),
            { numRuns: 100 }
        );
    });

    it('key stats counts match actual result statuses', () => {
        fc.assert(
            fc.property(fc.array(keyResultArb, { minLength: 0, maxLength: 100 }), (results) => {
                const stats = calculateKeyStats(results);
                
                // Count manually
                let dead = 0, error = 0;
                for (const r of results) {
                    if (r.status === 'DEAD') dead++;
                    if (r.status === 'ERROR') error++;
                }
                
                expect(stats.dead).toBe(dead);
                expect(stats.error).toBe(error);
            }),
            { numRuns: 100 }
        );
    });

    it('card stats total equals sum of approved + live + die + error', () => {
        fc.assert(
            fc.property(fc.array(cardResultArb, { minLength: 0, maxLength: 100 }), (results) => {
                const stats = calculateCardStats(results);
                
                // Total should equal sum of all categories
                expect(stats.total).toBe(stats.approved + stats.live + stats.die + stats.error);
            }),
            { numRuns: 100 }
        );
    });

    it('card stats counts match actual result statuses', () => {
        fc.assert(
            fc.property(fc.array(cardResultArb, { minLength: 0, maxLength: 100 }), (results) => {
                const stats = calculateCardStats(results);
                
                // Count manually
                let approved = 0, live = 0, die = 0, error = 0;
                for (const r of results) {
                    if (r.status === 'APPROVED') approved++;
                    if (r.status === 'LIVE') live++;
                    if (r.status === 'DIE') die++;
                    if (r.status === 'ERROR' || r.status === 'RETRY') error++;
                }
                
                expect(stats.approved).toBe(approved);
                expect(stats.live).toBe(live);
                expect(stats.die).toBe(die);
                expect(stats.error).toBe(error);
            }),
            { numRuns: 100 }
        );
    });

    it('handles empty arrays correctly', () => {
        const keyStats = calculateKeyStats([]);
        expect(keyStats.total).toBe(0);
        expect(keyStats.live).toBe(0);
        expect(keyStats.dead).toBe(0);
        expect(keyStats.error).toBe(0);

        const cardStats = calculateCardStats([]);
        expect(cardStats.total).toBe(0);
        expect(cardStats.approved).toBe(0);
        expect(cardStats.live).toBe(0);
        expect(cardStats.die).toBe(0);
        expect(cardStats.error).toBe(0);
    });

    it('handles invalid input gracefully', () => {
        expect(calculateKeyStats(null).total).toBe(0);
        expect(calculateKeyStats(undefined).total).toBe(0);
        expect(calculateKeyStats('not an array').total).toBe(0);
        
        expect(calculateCardStats(null).total).toBe(0);
        expect(calculateCardStats(undefined).total).toBe(0);
        expect(calculateCardStats('not an array').total).toBe(0);
    });
});


/**
 * **Feature: luma-ui-redesign, Property 3: Filter shows only matching items**
 * **Validates: Requirements 3.3**
 * 
 * For any filter selection and any results array, the filtered results should 
 * only contain items whose status matches the filter criteria.
 */
describe('Property 3: Filter shows only matching items', () => {
    // Arbitrary for key result status
    const keyStatusArb = fc.constantFrom('LIVE+', 'LIVE0', 'LIVE-', 'LIVE', 'DEAD', 'ERROR');
    
    // Arbitrary for key result object
    const keyResultArb = fc.record({
        status: keyStatusArb,
        key: fc.string(),
        fullKey: fc.string(),
    });

    // Arbitrary for card result status
    const cardStatusArb = fc.constantFrom('APPROVED', 'LIVE', 'DIE', 'ERROR', 'RETRY');
    
    // Arbitrary for card result object
    const cardResultArb = fc.record({
        status: cardStatusArb,
        card: fc.string(),
        fullCard: fc.string(),
    });

    // Filter types for keys
    const keyFilterArb = fc.constantFrom('all', 'live', 'dead', 'error');
    
    // Filter types for cards
    const cardFilterArb = fc.constantFrom('all', 'live', 'die', 'error', 'approved');

    it('filter "all" returns all results unchanged', () => {
        fc.assert(
            fc.property(fc.array(keyResultArb, { minLength: 0, maxLength: 100 }), (results) => {
                const filtered = filterResults(results, 'all');
                expect(filtered.length).toBe(results.length);
                expect(filtered).toEqual(results);
            }),
            { numRuns: 100 }
        );
    });

    it('filter "live" returns only results with LIVE status prefix', () => {
        fc.assert(
            fc.property(fc.array(keyResultArb, { minLength: 0, maxLength: 100 }), (results) => {
                const filtered = filterResults(results, 'live');
                
                // All filtered results should have LIVE status
                for (const result of filtered) {
                    expect(result.status.startsWith('LIVE')).toBe(true);
                }
                
                // Count should match manual count
                const expectedCount = results.filter(r => r.status?.startsWith('LIVE')).length;
                expect(filtered.length).toBe(expectedCount);
            }),
            { numRuns: 100 }
        );
    });

    it('filter "dead" returns only results with DEAD status', () => {
        fc.assert(
            fc.property(fc.array(keyResultArb, { minLength: 0, maxLength: 100 }), (results) => {
                const filtered = filterResults(results, 'dead');
                
                // All filtered results should have DEAD status
                for (const result of filtered) {
                    expect(result.status).toBe('DEAD');
                }
                
                // Count should match manual count
                const expectedCount = results.filter(r => r.status === 'DEAD').length;
                expect(filtered.length).toBe(expectedCount);
            }),
            { numRuns: 100 }
        );
    });

    it('filter "error" returns only results with ERROR or RETRY status', () => {
        fc.assert(
            fc.property(fc.array(cardResultArb, { minLength: 0, maxLength: 100 }), (results) => {
                const filtered = filterResults(results, 'error');
                
                // All filtered results should have ERROR or RETRY status
                for (const result of filtered) {
                    expect(['ERROR', 'RETRY']).toContain(result.status);
                }
                
                // Count should match manual count
                const expectedCount = results.filter(r => r.status === 'ERROR' || r.status === 'RETRY').length;
                expect(filtered.length).toBe(expectedCount);
            }),
            { numRuns: 100 }
        );
    });

    it('filter "die" returns only results with DIE status', () => {
        fc.assert(
            fc.property(fc.array(cardResultArb, { minLength: 0, maxLength: 100 }), (results) => {
                const filtered = filterResults(results, 'die');
                
                // All filtered results should have DIE status
                for (const result of filtered) {
                    expect(result.status).toBe('DIE');
                }
                
                // Count should match manual count
                const expectedCount = results.filter(r => r.status === 'DIE').length;
                expect(filtered.length).toBe(expectedCount);
            }),
            { numRuns: 100 }
        );
    });

    it('filter "approved" returns only results with APPROVED status', () => {
        fc.assert(
            fc.property(fc.array(cardResultArb, { minLength: 0, maxLength: 100 }), (results) => {
                const filtered = filterResults(results, 'approved');
                
                // All filtered results should have APPROVED status
                for (const result of filtered) {
                    expect(result.status).toBe('APPROVED');
                }
                
                // Count should match manual count
                const expectedCount = results.filter(r => r.status === 'APPROVED').length;
                expect(filtered.length).toBe(expectedCount);
            }),
            { numRuns: 100 }
        );
    });

    it('filtered results are a subset of original results', () => {
        fc.assert(
            fc.property(
                fc.array(keyResultArb, { minLength: 0, maxLength: 100 }),
                keyFilterArb,
                (results, filter) => {
                    const filtered = filterResults(results, filter);
                    
                    // Filtered length should be <= original length
                    expect(filtered.length).toBeLessThanOrEqual(results.length);
                    
                    // Every filtered item should exist in original
                    for (const item of filtered) {
                        expect(results).toContain(item);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('handles invalid input gracefully', () => {
        expect(filterResults(null, 'all')).toEqual([]);
        expect(filterResults(undefined, 'live')).toEqual([]);
        expect(filterResults('not an array', 'dead')).toEqual([]);
    });
});


/**
 * **Feature: luma-ui-redesign, Property 4: Input line counting**
 * **Validates: Requirements 4.1**
 * 
 * For any input string, the line count should equal the number of non-empty lines 
 * (for cards) or lines starting with "sk_" (for keys).
 */
describe('Property 4: Input line counting', () => {
    // Arbitrary for valid SK key format
    const skKeyArb = fc.string({ minLength: 1, maxLength: 50 }).map(s => `sk_${s.replace(/\n/g, '')}`);
    
    // Arbitrary for non-SK key line (doesn't start with sk_)
    const nonSkKeyArb = fc.string({ minLength: 0, maxLength: 50 })
        .filter(s => !s.startsWith('sk_'))
        .map(s => s.replace(/\n/g, ''));
    
    // Arbitrary for any line (could be SK key or not)
    const anyLineArb = fc.oneof(skKeyArb, nonSkKeyArb, fc.constant(''));

    it('counts only lines starting with sk_ for keys type', () => {
        fc.assert(
            fc.property(fc.array(anyLineArb, { minLength: 0, maxLength: 50 }), (lines) => {
                const input = lines.join('\n');
                const count = countInputLines(input, 'keys');
                
                // Manual count of lines starting with sk_
                const expectedCount = lines.filter(line => line.trim() && line.trim().startsWith('sk_')).length;
                
                expect(count).toBe(expectedCount);
            }),
            { numRuns: 100 }
        );
    });

    it('counts all non-empty lines for cards type', () => {
        fc.assert(
            fc.property(fc.array(anyLineArb, { minLength: 0, maxLength: 50 }), (lines) => {
                const input = lines.join('\n');
                const count = countInputLines(input, 'cards');
                
                // Manual count of non-empty lines
                const expectedCount = lines.filter(line => line.trim()).length;
                
                expect(count).toBe(expectedCount);
            }),
            { numRuns: 100 }
        );
    });

    it('returns 0 for empty string', () => {
        expect(countInputLines('', 'keys')).toBe(0);
        expect(countInputLines('', 'cards')).toBe(0);
    });

    it('returns 0 for whitespace-only input', () => {
        fc.assert(
            fc.property(
                fc.array(fc.constantFrom(' ', '\t', '\n'), { minLength: 0, maxLength: 20 }),
                (chars) => {
                    const whitespace = chars.join('');
                    expect(countInputLines(whitespace, 'keys')).toBe(0);
                    expect(countInputLines(whitespace, 'cards')).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('handles invalid input gracefully', () => {
        expect(countInputLines(null, 'keys')).toBe(0);
        expect(countInputLines(undefined, 'cards')).toBe(0);
        expect(countInputLines(123, 'keys')).toBe(0);
        expect(countInputLines({}, 'cards')).toBe(0);
    });

    it('key count is always <= total non-empty line count', () => {
        fc.assert(
            fc.property(fc.array(anyLineArb, { minLength: 0, maxLength: 50 }), (lines) => {
                const input = lines.join('\n');
                const keyCount = countInputLines(input, 'keys');
                const cardCount = countInputLines(input, 'cards');
                
                // Key count should always be <= card count since keys are a subset
                expect(keyCount).toBeLessThanOrEqual(cardCount);
            }),
            { numRuns: 100 }
        );
    });
});


/**
 * **Feature: luma-ui-redesign, Property 6: Delete removes result and updates stats**
 * **Validates: Requirements 4.6**
 * 
 * For any results array and valid index, deleting a result should reduce the 
 * array length by 1 and update the corresponding status count in statistics.
 */
describe('Property 6: Delete removes result and updates stats', () => {
    // Arbitrary for key result status
    const keyStatusArb = fc.constantFrom('LIVE+', 'LIVE0', 'LIVE-', 'LIVE', 'DEAD', 'ERROR');
    
    // Arbitrary for key result object
    const keyResultArb = fc.record({
        status: keyStatusArb,
        key: fc.string(),
        fullKey: fc.string(),
    });

    // Arbitrary for card result status
    const cardStatusArb = fc.constantFrom('APPROVED', 'LIVE', 'DIE', 'ERROR', 'RETRY');
    
    // Arbitrary for card result object
    const cardResultArb = fc.record({
        status: cardStatusArb,
        card: fc.string(),
        fullCard: fc.string(),
    });

    it('deleting a key result reduces array length by 1', () => {
        fc.assert(
            fc.property(
                fc.array(keyResultArb, { minLength: 1, maxLength: 50 }),
                (results) => {
                    // Pick a random valid index
                    const index = Math.floor(Math.random() * results.length);
                    const originalLength = results.length;
                    
                    const { newResults } = deleteResultAndUpdateStats(results, index, 'keys');
                    
                    expect(newResults.length).toBe(originalLength - 1);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('deleting a card result reduces array length by 1', () => {
        fc.assert(
            fc.property(
                fc.array(cardResultArb, { minLength: 1, maxLength: 50 }),
                (results) => {
                    // Pick a random valid index
                    const index = Math.floor(Math.random() * results.length);
                    const originalLength = results.length;
                    
                    const { newResults } = deleteResultAndUpdateStats(results, index, 'cards');
                    
                    expect(newResults.length).toBe(originalLength - 1);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('stats are correctly updated after deleting a key result', () => {
        fc.assert(
            fc.property(
                fc.array(keyResultArb, { minLength: 1, maxLength: 50 }),
                (results) => {
                    const index = Math.floor(Math.random() * results.length);
                    
                    const { newResults, newStats } = deleteResultAndUpdateStats(results, index, 'keys');
                    
                    // Verify stats match the new results array
                    const expectedStats = calculateKeyStats(newResults);
                    
                    expect(newStats.live).toBe(expectedStats.live);
                    expect(newStats.dead).toBe(expectedStats.dead);
                    expect(newStats.error).toBe(expectedStats.error);
                    expect(newStats.total).toBe(expectedStats.total);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('stats are correctly updated after deleting a card result', () => {
        fc.assert(
            fc.property(
                fc.array(cardResultArb, { minLength: 1, maxLength: 50 }),
                (results) => {
                    const index = Math.floor(Math.random() * results.length);
                    
                    const { newResults, newStats } = deleteResultAndUpdateStats(results, index, 'cards');
                    
                    // Verify stats match the new results array
                    const expectedStats = calculateCardStats(newResults);
                    
                    expect(newStats.approved).toBe(expectedStats.approved);
                    expect(newStats.live).toBe(expectedStats.live);
                    expect(newStats.die).toBe(expectedStats.die);
                    expect(newStats.error).toBe(expectedStats.error);
                    expect(newStats.total).toBe(expectedStats.total);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('deleted result is no longer in the array', () => {
        fc.assert(
            fc.property(
                fc.array(keyResultArb, { minLength: 1, maxLength: 50 }),
                (results) => {
                    const index = Math.floor(Math.random() * results.length);
                    const deletedItem = results[index];
                    
                    const { newResults } = deleteResultAndUpdateStats(results, index, 'keys');
                    
                    // The specific item at that index should be removed
                    // Check that the item before and after the deleted index are now adjacent
                    if (index > 0 && index < results.length - 1) {
                        expect(newResults[index - 1]).toBe(results[index - 1]);
                        expect(newResults[index]).toBe(results[index + 1]);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('handles invalid index gracefully', () => {
        const results = [{ status: 'LIVE+', key: 'test', fullKey: 'sk_test' }];
        
        // Negative index
        const { newResults: r1, newStats: s1 } = deleteResultAndUpdateStats(results, -1, 'keys');
        expect(r1.length).toBe(1);
        expect(s1.total).toBe(1);
        
        // Index out of bounds
        const { newResults: r2, newStats: s2 } = deleteResultAndUpdateStats(results, 10, 'keys');
        expect(r2.length).toBe(1);
        expect(s2.total).toBe(1);
    });

    it('handles empty array gracefully', () => {
        const { newResults, newStats } = deleteResultAndUpdateStats([], 0, 'keys');
        expect(newResults.length).toBe(0);
        expect(newStats.total).toBe(0);
    });

    it('handles null/undefined input gracefully', () => {
        const { newResults: r1, newStats: s1 } = deleteResultAndUpdateStats(null, 0, 'keys');
        expect(r1.length).toBe(0);
        expect(s1.total).toBe(0);
        
        const { newResults: r2, newStats: s2 } = deleteResultAndUpdateStats(undefined, 0, 'cards');
        expect(r2.length).toBe(0);
        expect(s2.total).toBe(0);
    });

    it('total stats decrease by 1 when deleting any result', () => {
        fc.assert(
            fc.property(
                fc.array(keyResultArb, { minLength: 1, maxLength: 50 }),
                (results) => {
                    const index = Math.floor(Math.random() * results.length);
                    const originalStats = calculateKeyStats(results);
                    
                    const { newStats } = deleteResultAndUpdateStats(results, index, 'keys');
                    
                    // Total should decrease by exactly 1
                    expect(newStats.total).toBe(originalStats.total - 1);
                }
            ),
            { numRuns: 100 }
        );
    });
});
