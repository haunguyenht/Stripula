/**
 * Property-based tests for file import/export utilities
 * Using fast-check for property-based testing
 * 
 * **Feature: batch-import-export, Property 17: Import-Export Round Trip**
 * **Validates: Requirements 1.2, 1.3, 8.4**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  parseCSV,
  parseTXT,
  formatCardsOnly,
  formatCSV,
  formatJSON,
  parseCSVLine,
  mapCSVRow,
  detectCSVColumns,
} from './file-utils';

/**
 * Arbitrary for generating valid card numbers (13-19 digits)
 * Uses Luhn-valid prefixes for realistic card numbers
 */
const cardNumberArb = fc.integer({ min: 4000000000000000, max: 4999999999999999 })
  .map(n => String(n));

/**
 * Arbitrary for generating valid expiry month (01-12)
 */
const expMonthArb = fc.integer({ min: 1, max: 12 })
  .map(m => String(m).padStart(2, '0'));

/**
 * Arbitrary for generating valid expiry year (2-digit, future years)
 */
const expYearArb = fc.integer({ min: 25, max: 35 })
  .map(y => String(y).padStart(2, '0'));

/**
 * Arbitrary for generating valid CVV (3-4 digits)
 */
const cvvArb = fc.integer({ min: 100, max: 9999 })
  .map(c => String(c));

/**
 * Arbitrary for generating a valid card object
 */
const cardArb = fc.record({
  number: cardNumberArb,
  expMonth: expMonthArb,
  expYear: expYearArb,
  cvv: cvvArb,
});

/**
 * Generate a card line in TXT format (number|mm|yy|cvv)
 */
function cardToTxtLine(card) {
  return `${card.number}|${card.expMonth}|${card.expYear}|${card.cvv}`;
}

/**
 * Generate a card line in CSV format
 */
function cardToCsvLine(card) {
  return `${card.number},${card.expMonth},${card.expYear},${card.cvv}`;
}

/**
 * Normalize card data for comparison (handles padding differences)
 */
function normalizeCard(card) {
  return {
    number: card.number,
    expMonth: card.expMonth.padStart(2, '0'),
    expYear: card.expYear.length === 4 ? card.expYear.substring(2) : card.expYear.padStart(2, '0'),
    cvv: card.cvv,
  };
}

/**
 * Compare two cards for equality (ignoring raw field)
 */
function cardsEqual(a, b) {
  const normA = normalizeCard(a);
  const normB = normalizeCard(b);
  return normA.number === normB.number &&
         normA.expMonth === normB.expMonth &&
         normA.expYear === normB.expYear &&
         normA.cvv === normB.cvv;
}

describe('Property 17: Import-Export Round Trip', () => {
  /**
   * For any valid card list, importing TXT then exporting as cards-only 
   * then importing again should produce the same card data.
   */
  it('TXT import → cards-only export → TXT import produces equivalent cards', () => {
    fc.assert(
      fc.property(
        fc.array(cardArb, { minLength: 1, maxLength: 50 }),
        (cards) => {
          // Step 1: Create TXT content from cards
          const txtContent = cards.map(cardToTxtLine).join('\n');
          
          // Step 2: Import (parse) the TXT content
          const importResult1 = parseTXT(txtContent);
          expect(importResult1.cards.length).toBe(cards.length);
          
          // Step 3: Export as cards-only format
          const exportedContent = formatCardsOnly(importResult1.cards.map(c => ({
            fullCard: c.raw,
            card: c.number,
          })));
          
          // Step 4: Import again
          const importResult2 = parseTXT(exportedContent);
          
          // Step 5: Verify round-trip produces equivalent cards
          expect(importResult2.cards.length).toBe(cards.length);
          
          for (let i = 0; i < cards.length; i++) {
            expect(cardsEqual(importResult1.cards[i], importResult2.cards[i])).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any valid card list, importing CSV then exporting as cards-only 
   * then importing again should produce the same card data.
   */
  it('CSV import → cards-only export → TXT import produces equivalent cards', () => {
    fc.assert(
      fc.property(
        fc.array(cardArb, { minLength: 1, maxLength: 50 }),
        (cards) => {
          // Step 1: Create CSV content with headers
          const csvHeader = 'card_number,exp_month,exp_year,cvv';
          const csvContent = [csvHeader, ...cards.map(cardToCsvLine)].join('\n');
          
          // Step 2: Import (parse) the CSV content
          const importResult1 = parseCSV(csvContent);
          expect(importResult1.cards.length).toBe(cards.length);
          
          // Step 3: Export as cards-only format
          const exportedContent = formatCardsOnly(importResult1.cards.map(c => ({
            fullCard: c.raw,
            card: c.number,
          })));
          
          // Step 4: Import again (as TXT since cards-only uses pipe format)
          const importResult2 = parseTXT(exportedContent);
          
          // Step 5: Verify round-trip produces equivalent cards
          expect(importResult2.cards.length).toBe(cards.length);
          
          for (let i = 0; i < cards.length; i++) {
            expect(cardsEqual(importResult1.cards[i], importResult2.cards[i])).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any valid card, the raw field should be parseable back to the same card data.
   */
  it('parsed card raw field is re-parseable to equivalent card', () => {
    fc.assert(
      fc.property(cardArb, (card) => {
        // Create TXT line
        const txtLine = cardToTxtLine(card);
        
        // Parse it
        const parseResult = parseTXT(txtLine);
        expect(parseResult.cards.length).toBe(1);
        
        const parsedCard = parseResult.cards[0];
        
        // The raw field should be parseable
        const reparseResult = parseTXT(parsedCard.raw);
        expect(reparseResult.cards.length).toBe(1);
        
        // Should produce equivalent card
        expect(cardsEqual(parsedCard, reparseResult.cards[0])).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * For unique cards, import count equals export count equals re-import count.
   */
  it('card count is preserved through round-trip', () => {
    fc.assert(
      fc.property(
        fc.array(cardArb, { minLength: 1, maxLength: 50 }),
        (cards) => {
          // Ensure unique cards by using Set on card numbers
          const uniqueCards = cards.filter((card, index, self) => 
            index === self.findIndex(c => c.number === card.number)
          );
          
          if (uniqueCards.length === 0) return; // Skip if no unique cards
          
          // Create TXT content
          const txtContent = uniqueCards.map(cardToTxtLine).join('\n');
          
          // Import
          const importResult1 = parseTXT(txtContent);
          const importCount = importResult1.cards.length;
          
          // Export
          const exportedContent = formatCardsOnly(importResult1.cards.map(c => ({
            fullCard: c.raw,
            card: c.number,
          })));
          const exportLines = exportedContent.split('\n').filter(l => l.trim());
          const exportCount = exportLines.length;
          
          // Re-import
          const importResult2 = parseTXT(exportedContent);
          const reimportCount = importResult2.cards.length;
          
          // All counts should match
          expect(importCount).toBe(uniqueCards.length);
          expect(exportCount).toBe(uniqueCards.length);
          expect(reimportCount).toBe(uniqueCards.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Card data integrity is preserved through the round-trip.
   * Number, expMonth, expYear, and CVV should all match.
   */
  it('card data integrity is preserved through round-trip', () => {
    fc.assert(
      fc.property(cardArb, (originalCard) => {
        // Create TXT line
        const txtLine = cardToTxtLine(originalCard);
        
        // Import
        const importResult1 = parseTXT(txtLine);
        expect(importResult1.cards.length).toBe(1);
        const importedCard = importResult1.cards[0];
        
        // Verify imported card matches original
        expect(importedCard.number).toBe(originalCard.number);
        expect(importedCard.expMonth).toBe(originalCard.expMonth);
        expect(importedCard.expYear).toBe(originalCard.expYear);
        expect(importedCard.cvv).toBe(originalCard.cvv);
        
        // Export as cards-only
        const exportedContent = formatCardsOnly([{
          fullCard: importedCard.raw,
          card: importedCard.number,
        }]);
        
        // Re-import
        const importResult2 = parseTXT(exportedContent);
        expect(importResult2.cards.length).toBe(1);
        const reimportedCard = importResult2.cards[0];
        
        // Verify re-imported card matches original
        expect(reimportedCard.number).toBe(originalCard.number);
        expect(reimportedCard.expMonth).toBe(originalCard.expMonth);
        expect(reimportedCard.expYear).toBe(originalCard.expYear);
        expect(reimportedCard.cvv).toBe(originalCard.cvv);
      }),
      { numRuns: 100 }
    );
  });
});

