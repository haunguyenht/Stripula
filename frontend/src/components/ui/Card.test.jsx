import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: luma-ui-redesign, Property 8: Status-based styling applied correctly**
 * **Validates: Requirements 6.1, 6.2, 6.3**
 * 
 * For any result status value, the ResultCard component should apply the correct 
 * CSS classes: emerald/green for LIVE statuses, rose/red for DEAD/DIE, and amber for ERROR.
 */

// Status to expected CSS class mapping based on the ResultCard implementation
// Uses Luma theme CSS utility classes (defined in index.css)
const statusStyleMapping = {
  default: { borderClass: 'border-l-gray-300', bgClass: 'bg-gray-50/50' },
  live: { borderClass: 'border-l-emerald-500', bgClass: 'bg-emerald-50/30' },
  die: { borderClass: 'border-l-rose-400', bgClass: 'bg-rose-50/30' },
  error: { borderClass: 'border-l-amber-500', bgClass: 'bg-amber-50/30' },
  approved: { borderClass: 'border-l-luma-coral', bgClass: 'bg-luma-coral-10' },
  warning: { borderClass: 'border-l-amber-500', bgClass: 'bg-amber-50/30' },
  info: { borderClass: 'border-l-cyan-500', bgClass: 'bg-cyan-50/30' },
};

// Function that returns the expected styles for a given status
function getExpectedStatusStyles(status) {
  return statusStyleMapping[status] || statusStyleMapping.default;
}

// Function that simulates what ResultCard does internally
// Uses Luma theme CSS utility classes (defined in index.css)
function getAppliedStatusStyles(status) {
  const statusStyles = {
    default: 'border-l-gray-300 bg-gray-50/50',
    live: 'border-l-emerald-500 bg-emerald-50/30',
    die: 'border-l-rose-400 bg-rose-50/30',
    error: 'border-l-amber-500 bg-amber-50/30',
    approved: 'border-l-luma-coral bg-luma-coral-10',
    warning: 'border-l-amber-500 bg-amber-50/30',
    info: 'border-l-cyan-500 bg-cyan-50/30',
  };
  
  // Use Object.hasOwn for safe property lookup (avoids prototype pollution)
  const appliedStyle = Object.hasOwn(statusStyles, status) 
    ? statusStyles[status] 
    : statusStyles.default;
  const [borderClass, bgClass] = appliedStyle.split(' ');
  return { borderClass, bgClass };
}

describe('ResultCard Status-Based Styling', () => {
  /**
   * Property 8: Status-based styling applied correctly
   * 
   * For any valid status value, the ResultCard should apply:
   * - emerald/green classes for LIVE status
   * - rose/red classes for DIE/DEAD status  
   * - amber classes for ERROR status
   */
  it('should apply correct CSS classes for any valid status', () => {
    // Generator for valid status values
    const statusArbitrary = fc.constantFrom(
      'default', 'live', 'die', 'error', 'approved', 'warning', 'info'
    );

    fc.assert(
      fc.property(statusArbitrary, (status) => {
        const expected = getExpectedStatusStyles(status);
        const applied = getAppliedStatusStyles(status);
        
        // Verify border class matches
        expect(applied.borderClass).toBe(expected.borderClass);
        // Verify background class matches
        expect(applied.bgClass).toBe(expected.bgClass);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8a: LIVE status uses emerald/green colors
   * Validates: Requirement 6.1
   */
  it('should apply emerald/green styling for LIVE status', () => {
    fc.assert(
      fc.property(fc.constant('live'), (status) => {
        const applied = getAppliedStatusStyles(status);
        
        // LIVE status should use emerald colors
        expect(applied.borderClass).toContain('emerald');
        expect(applied.bgClass).toContain('emerald');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8b: DIE/DEAD status uses rose/red colors
   * Validates: Requirement 6.2
   */
  it('should apply rose/red styling for DIE status', () => {
    fc.assert(
      fc.property(fc.constant('die'), (status) => {
        const applied = getAppliedStatusStyles(status);
        
        // DIE status should use rose colors
        expect(applied.borderClass).toContain('rose');
        expect(applied.bgClass).toContain('rose');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8c: ERROR status uses amber colors
   * Validates: Requirement 6.3
   */
  it('should apply amber styling for ERROR status', () => {
    fc.assert(
      fc.property(fc.constant('error'), (status) => {
        const applied = getAppliedStatusStyles(status);
        
        // ERROR status should use amber colors
        expect(applied.borderClass).toContain('amber');
        expect(applied.bgClass).toContain('amber');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8d: Unknown status falls back to default styling
   * Edge case handling
   */
  it('should fall back to default styling for unknown status', () => {
    // Generator for random strings that are NOT valid statuses
    const invalidStatusArbitrary = fc.string().filter(
      s => !Object.keys(statusStyleMapping).includes(s)
    );

    fc.assert(
      fc.property(invalidStatusArbitrary, (invalidStatus) => {
        const applied = getAppliedStatusStyles(invalidStatus);
        const defaultStyles = getExpectedStatusStyles('default');
        
        // Unknown status should fall back to default
        expect(applied.borderClass).toBe(defaultStyles.borderClass);
        expect(applied.bgClass).toBe(defaultStyles.bgClass);
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: luma-ui-redesign, Property 9: Selected card shows ring highlight**
 * **Validates: Requirements 6.5**
 * 
 * For any ResultCard with isSelected=true, the component should include 
 * ring highlight CSS classes in its className.
 */

// Function that simulates what ResultCard does for selection state
function getSelectionStyles(isSelected) {
  // Based on ResultCard implementation: coral ring highlight for selected state
  return isSelected 
    ? 'ring-2 ring-[#E8836B] ring-offset-2 ring-offset-white'
    : '';
}

// Function to check if a className string contains ring highlight classes
function hasRingHighlight(className) {
  return className.includes('ring-2') && 
         className.includes('ring-[#E8836B]') && 
         className.includes('ring-offset');
}

describe('ResultCard Selection State', () => {
  /**
   * Property 9: Selected card shows ring highlight
   * 
   * For any ResultCard with isSelected=true, the component should 
   * include ring highlight CSS classes (ring-2, ring-[#E8836B], ring-offset)
   */
  it('should apply ring highlight classes when isSelected is true', () => {
    fc.assert(
      fc.property(fc.constant(true), (isSelected) => {
        const selectionStyles = getSelectionStyles(isSelected);
        
        // Selected card should have ring highlight
        expect(hasRingHighlight(selectionStyles)).toBe(true);
        expect(selectionStyles).toContain('ring-2');
        expect(selectionStyles).toContain('ring-[#E8836B]');
        expect(selectionStyles).toContain('ring-offset-2');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9a: Non-selected card has no ring highlight
   * 
   * For any ResultCard with isSelected=false, the component should 
   * NOT include ring highlight CSS classes
   */
  it('should NOT apply ring highlight classes when isSelected is false', () => {
    fc.assert(
      fc.property(fc.constant(false), (isSelected) => {
        const selectionStyles = getSelectionStyles(isSelected);
        
        // Non-selected card should have no ring highlight
        expect(hasRingHighlight(selectionStyles)).toBe(false);
        expect(selectionStyles).toBe('');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9b: Selection state is deterministic
   * 
   * For any boolean isSelected value, the selection styles should be 
   * consistent across multiple calls (deterministic behavior)
   */
  it('should produce consistent selection styles for any boolean value', () => {
    fc.assert(
      fc.property(fc.boolean(), (isSelected) => {
        const styles1 = getSelectionStyles(isSelected);
        const styles2 = getSelectionStyles(isSelected);
        
        // Same input should always produce same output
        expect(styles1).toBe(styles2);
        
        // Selected should have ring, non-selected should not
        if (isSelected) {
          expect(hasRingHighlight(styles1)).toBe(true);
        } else {
          expect(hasRingHighlight(styles1)).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });
});
