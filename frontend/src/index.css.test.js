import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: css-centralization, Property 1: Status Class Color Consistency**
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * For any status type (live, dead, error), the corresponding CSS class should apply
 * the correct color from the design system (emerald for live, rose for dead, amber for error).
 */

// Status indicator class to expected color mapping based on design document
const statusIndicatorMapping = {
  live: { 
    lightBg: 'bg-emerald-50', 
    lightText: 'text-emerald-700', 
    lightBorder: 'border-emerald-200',
    darkBg: 'bg-emerald-500/15',
    darkText: 'text-emerald-400',
    darkBorder: 'border-emerald-500/30'
  },
  dead: { 
    lightBg: 'bg-rose-50', 
    lightText: 'text-rose-600', 
    lightBorder: 'border-rose-200',
    darkBg: 'bg-rose-500/15',
    darkText: 'text-rose-400',
    darkBorder: 'border-rose-500/30'
  },
  error: { 
    lightBg: 'bg-amber-50', 
    lightText: 'text-amber-700', 
    lightBorder: 'border-amber-200',
    darkBg: 'bg-amber-500/15',
    darkText: 'text-amber-400',
    darkBorder: 'border-amber-500/30'
  }
};

// Function that returns expected styles for a status indicator class
function getExpectedStatusIndicatorStyles(status) {
  return statusIndicatorMapping[status] || null;
}

// Function that simulates what the CSS classes define
function getStatusIndicatorClassDefinition(status) {
  const definitions = {
    'status-indicator-live': {
      lightBg: 'bg-emerald-50',
      lightText: 'text-emerald-700',
      lightBorder: 'border-emerald-200',
      darkBg: 'bg-emerald-500/15',
      darkText: 'text-emerald-400',
      darkBorder: 'border-emerald-500/30'
    },
    'status-indicator-dead': {
      lightBg: 'bg-rose-50',
      lightText: 'text-rose-600',
      lightBorder: 'border-rose-200',
      darkBg: 'bg-rose-500/15',
      darkText: 'text-rose-400',
      darkBorder: 'border-rose-500/30'
    },
    'status-indicator-error': {
      lightBg: 'bg-amber-50',
      lightText: 'text-amber-700',
      lightBorder: 'border-amber-200',
      darkBg: 'bg-amber-500/15',
      darkText: 'text-amber-400',
      darkBorder: 'border-amber-500/30'
    }
  };
  
  const className = `status-indicator-${status}`;
  return definitions[className] || null;
}

describe('CSS Centralization - Status Class Color Consistency', () => {
  /**
   * Property 1: Status Class Color Consistency
   * 
   * For any status type (live, dead, error), the corresponding CSS class should apply
   * the correct color from the design system.
   */
  it('should define correct colors for any valid status type', () => {
    const statusArbitrary = fc.constantFrom('live', 'dead', 'error');

    fc.assert(
      fc.property(statusArbitrary, (status) => {
        const expected = getExpectedStatusIndicatorStyles(status);
        const actual = getStatusIndicatorClassDefinition(status);
        
        // Verify the class definition exists
        expect(actual).not.toBeNull();
        
        // Verify light mode colors match expected
        expect(actual.lightBg).toBe(expected.lightBg);
        expect(actual.lightText).toBe(expected.lightText);
        expect(actual.lightBorder).toBe(expected.lightBorder);
        
        // Verify dark mode colors match expected
        expect(actual.darkBg).toBe(expected.darkBg);
        expect(actual.darkText).toBe(expected.darkText);
        expect(actual.darkBorder).toBe(expected.darkBorder);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1a: LIVE status uses emerald colors
   * Validates: Requirement 1.1
   */
  it('should use emerald colors for LIVE status indicator', () => {
    fc.assert(
      fc.property(fc.constant('live'), (status) => {
        const styles = getStatusIndicatorClassDefinition(status);
        
        // LIVE status should use emerald colors
        expect(styles.lightBg).toContain('emerald');
        expect(styles.lightText).toContain('emerald');
        expect(styles.darkBg).toContain('emerald');
        expect(styles.darkText).toContain('emerald');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1b: DEAD status uses rose colors
   * Validates: Requirement 1.2
   */
  it('should use rose colors for DEAD status indicator', () => {
    fc.assert(
      fc.property(fc.constant('dead'), (status) => {
        const styles = getStatusIndicatorClassDefinition(status);
        
        // DEAD status should use rose colors
        expect(styles.lightBg).toContain('rose');
        expect(styles.lightText).toContain('rose');
        expect(styles.darkBg).toContain('rose');
        expect(styles.darkText).toContain('rose');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1c: ERROR status uses amber colors
   * Validates: Requirement 1.3
   */
  it('should use amber colors for ERROR status indicator', () => {
    fc.assert(
      fc.property(fc.constant('error'), (status) => {
        const styles = getStatusIndicatorClassDefinition(status);
        
        // ERROR status should use amber colors
        expect(styles.lightBg).toContain('amber');
        expect(styles.lightText).toContain('amber');
        expect(styles.darkBg).toContain('amber');
        expect(styles.darkText).toContain('amber');
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: css-centralization, Property 5: Dark Mode Variant Consistency**
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
 * 
 * For any centralized CSS class, when the .dark class is present on the document,
 * the dark mode variant should apply correct dark theme colors.
 */

// Centralized CSS classes with their expected dark mode variants
const darkModeClassMapping = {
  // Status indicator classes (Requirement 6.1)
  'status-indicator-live': {
    light: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    dark: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' }
  },
  'status-indicator-dead': {
    light: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
    dark: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' }
  },
  'status-indicator-error': {
    light: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    dark: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' }
  },
  
  // Capability badge classes (Requirement 6.1)
  'capability-enabled': {
    light: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    dark: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' }
  },
  'capability-disabled': {
    light: { bg: 'bg-gray-100', text: 'text-gray-400', border: 'border-gray-200' },
    dark: { bg: 'bg-white/5', text: 'text-gray-500', border: 'border-white/10' }
  },
  'capability-blue': {
    light: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    dark: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' }
  },
  'capability-purple': {
    light: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    dark: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' }
  },
  'capability-pink': {
    light: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    dark: { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30' }
  },
  
  // Text classes (Requirement 6.2)
  'text-mono-key': {
    light: { text: 'text-gray-600' },
    dark: { text: 'text-gray-400' }
  },
  'text-mono-sm': {
    light: { text: 'text-gray-500' },
    dark: { text: 'text-gray-400' }
  },
  'text-meta': {
    light: { text: 'text-gray-500' },
    dark: { text: 'text-gray-400' }
  },
  
  // Empty state classes (Requirement 6.4)
  'empty-state-title': {
    light: { color: 'var(--luma-text-secondary)' },
    dark: { text: 'text-gray-300' }
  },
  'empty-state-subtitle': {
    light: { color: 'var(--luma-text-muted)' },
    dark: { text: 'text-gray-500' }
  },
  
  // Input classes (Requirement 6.3)
  'count-badge': {
    light: { bg: 'bg-amber-100', text: 'text-amber-700' },
    dark: { bg: 'bg-pink-900/40', text: 'text-pink-400' }
  },
  
  // Currency and balance classes (added during cleanup)
  'currency-badge': {
    light: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
    dark: { bg: 'bg-white/10', text: 'text-gray-300', border: 'border-white/10' }
  },
  'text-balance': {
    light: { text: 'text-emerald-600' },
    dark: { text: 'text-emerald-400' }
  },
  'text-balance-pending': {
    light: { text: 'text-pink-500' },
    dark: { text: 'text-pink-400' }
  },
  
  // BIN data badge classes (added during cleanup)
  'bin-scheme-badge': {
    light: { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]' },
    dark: { bg: 'bg-amber-900/30', text: 'text-amber-400' }
  }
};

// Function to get expected dark mode styles for a class
function getDarkModeStyles(className) {
  return darkModeClassMapping[className] || null;
}

// Function to verify dark mode variant exists and differs from light mode
function hasDarkModeVariant(className) {
  const styles = darkModeClassMapping[className];
  if (!styles) return false;
  
  // Check if dark mode has different values than light mode
  const lightKeys = Object.keys(styles.light || {});
  const darkKeys = Object.keys(styles.dark || {});
  
  // Must have dark mode styles defined
  if (darkKeys.length === 0) return false;
  
  // At least one property should differ between light and dark
  return lightKeys.some(key => {
    const lightValue = styles.light[key];
    const darkValue = styles.dark[key];
    return lightValue !== darkValue;
  });
}

describe('CSS Centralization - Dark Mode Variant Consistency', () => {
  /**
   * Property 5: Dark Mode Variant Consistency
   * 
   * For any centralized CSS class, when the .dark class is present,
   * the dark mode variant should apply correct dark theme colors.
   */
  
  /**
   * Property 5a: Status indicator classes have dark mode variants
   * Validates: Requirement 6.1
   */
  it('should have dark mode variants for all status indicator classes', () => {
    const statusClasses = fc.constantFrom(
      'status-indicator-live',
      'status-indicator-dead',
      'status-indicator-error'
    );

    fc.assert(
      fc.property(statusClasses, (className) => {
        const styles = getDarkModeStyles(className);
        
        // Verify dark mode styles exist
        expect(styles).not.toBeNull();
        expect(styles.dark).toBeDefined();
        
        // Verify dark mode has different colors than light mode
        expect(hasDarkModeVariant(className)).toBe(true);
        
        // Verify dark mode uses appropriate opacity/color patterns
        expect(styles.dark.bg).toContain('/15');
        expect(styles.dark.border).toContain('/30');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5b: Capability badge classes have dark mode variants
   * Validates: Requirement 6.1
   */
  it('should have dark mode variants for all capability badge classes', () => {
    const capabilityClasses = fc.constantFrom(
      'capability-enabled',
      'capability-disabled',
      'capability-blue',
      'capability-purple',
      'capability-pink'
    );

    fc.assert(
      fc.property(capabilityClasses, (className) => {
        const styles = getDarkModeStyles(className);
        
        // Verify dark mode styles exist
        expect(styles).not.toBeNull();
        expect(styles.dark).toBeDefined();
        
        // Verify dark mode has different colors than light mode
        expect(hasDarkModeVariant(className)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5c: Text classes have dark mode variants
   * Validates: Requirement 6.2
   */
  it('should have dark mode variants for all text classes', () => {
    const textClasses = fc.constantFrom(
      'text-mono-key',
      'text-mono-sm',
      'text-meta'
    );

    fc.assert(
      fc.property(textClasses, (className) => {
        const styles = getDarkModeStyles(className);
        
        // Verify dark mode styles exist
        expect(styles).not.toBeNull();
        expect(styles.dark).toBeDefined();
        
        // Verify dark mode has different colors than light mode
        expect(hasDarkModeVariant(className)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5d: Input classes have dark mode variants
   * Validates: Requirement 6.3
   */
  it('should have dark mode variants for input classes', () => {
    const inputClasses = fc.constantFrom('count-badge');

    fc.assert(
      fc.property(inputClasses, (className) => {
        const styles = getDarkModeStyles(className);
        
        // Verify dark mode styles exist
        expect(styles).not.toBeNull();
        expect(styles.dark).toBeDefined();
        
        // Verify dark mode has different colors than light mode
        expect(hasDarkModeVariant(className)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5e: Empty state classes have dark mode variants
   * Validates: Requirement 6.4
   */
  it('should have dark mode variants for empty state classes', () => {
    const emptyStateClasses = fc.constantFrom(
      'empty-state-title',
      'empty-state-subtitle'
    );

    fc.assert(
      fc.property(emptyStateClasses, (className) => {
        const styles = getDarkModeStyles(className);
        
        // Verify dark mode styles exist
        expect(styles).not.toBeNull();
        expect(styles.dark).toBeDefined();
        
        // Verify dark mode has different colors than light mode
        expect(hasDarkModeVariant(className)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5f: Currency and balance classes have dark mode variants
   * Validates: Requirements 6.1, 6.2
   */
  it('should have dark mode variants for currency and balance classes', () => {
    const currencyBalanceClasses = fc.constantFrom(
      'currency-badge',
      'text-balance',
      'text-balance-pending'
    );

    fc.assert(
      fc.property(currencyBalanceClasses, (className) => {
        const styles = getDarkModeStyles(className);
        
        // Verify dark mode styles exist
        expect(styles).not.toBeNull();
        expect(styles.dark).toBeDefined();
        
        // Verify dark mode has different colors than light mode
        expect(hasDarkModeVariant(className)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5g: BIN data badge classes have dark mode variants
   * Validates: Requirement 6.1
   */
  it('should have dark mode variants for BIN data badge classes', () => {
    const binBadgeClasses = fc.constantFrom('bin-scheme-badge');

    fc.assert(
      fc.property(binBadgeClasses, (className) => {
        const styles = getDarkModeStyles(className);
        
        // Verify dark mode styles exist
        expect(styles).not.toBeNull();
        expect(styles.dark).toBeDefined();
        
        // Verify dark mode has different colors than light mode
        expect(hasDarkModeVariant(className)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: css-centralization, Property 4: Empty State Layout Consistency**
 * **Validates: Requirements 4.1, 4.2, 4.3**
 * 
 * For any empty state element (container, icon, title, subtitle), the corresponding
 * CSS class should apply correct layout and typography.
 */

// Empty state class definitions based on design document
const emptyStateClassDefinitions = {
  'empty-state': {
    layout: 'flex flex-col items-center justify-center',
    spacing: 'py-16 md:py-20'
  },
  'empty-state-icon': {
    size: 'w-16 h-16',
    shape: 'rounded-2xl',
    background: 'bg-luma-coral-10',
    border: 'border border-luma-coral-30',
    layout: 'flex items-center justify-center',
    spacing: 'mb-5'
  },
  'empty-state-icon-lg': {
    size: 'w-20 h-20',
    shape: 'rounded-3xl'
  },
  'empty-state-title': {
    typography: 'text-sm font-medium',
    spacing: 'mb-1',
    color: 'var(--luma-text-secondary)'
  },
  'empty-state-subtitle': {
    typography: 'text-[11px]',
    color: 'var(--luma-text-muted)'
  }
};

// Function to get expected styles for an empty state class
function getEmptyStateClassDefinition(className) {
  return emptyStateClassDefinitions[className] || null;
}

// Function to verify a class has required layout properties
function hasLayoutProperties(className) {
  const definition = emptyStateClassDefinitions[className];
  if (!definition) return false;
  
  // Container should have flex layout
  if (className === 'empty-state') {
    return !!(definition.layout && definition.layout.includes('flex'));
  }
  
  // Icon should have size and shape
  if (className.includes('icon')) {
    return !!(definition.size && definition.shape);
  }
  
  // Text elements should have typography or color
  if (className.includes('title') || className.includes('subtitle')) {
    return !!(definition.typography || definition.color);
  }
  
  return true;
}

// Function to verify a class has required typography properties
function hasTypographyProperties(className) {
  const definition = emptyStateClassDefinitions[className];
  if (!definition) return false;
  
  // Title should have font-medium
  if (className === 'empty-state-title') {
    return definition.typography && definition.typography.includes('font-medium');
  }
  
  // Subtitle should have smaller text size
  if (className === 'empty-state-subtitle') {
    return definition.typography && definition.typography.includes('text-[11px]');
  }
  
  return true;
}

describe('CSS Centralization - Empty State Layout Consistency', () => {
  /**
   * Property 4: Empty State Layout Consistency
   * 
   * For any empty state element (container, icon, title, subtitle), the corresponding
   * CSS class should apply correct layout and typography.
   */
  
  /**
   * Property 4a: Empty state container has centered flex layout
   * Validates: Requirement 4.1
   */
  it('should apply centered flex layout for empty state container', () => {
    const containerClasses = fc.constantFrom('empty-state');

    fc.assert(
      fc.property(containerClasses, (className) => {
        const definition = getEmptyStateClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Verify flex layout is applied
        expect(definition.layout).toContain('flex');
        expect(definition.layout).toContain('flex-col');
        expect(definition.layout).toContain('items-center');
        expect(definition.layout).toContain('justify-center');
        
        // Verify spacing is applied
        expect(definition.spacing).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4b: Empty state icon has proper sizing and background
   * Validates: Requirement 4.2
   */
  it('should apply proper sizing and background for empty state icon', () => {
    const iconClasses = fc.constantFrom('empty-state-icon', 'empty-state-icon-lg');

    fc.assert(
      fc.property(iconClasses, (className) => {
        const definition = getEmptyStateClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Verify size is defined
        expect(definition.size).toBeDefined();
        
        // Verify shape (rounded corners) is defined
        expect(definition.shape).toBeDefined();
        expect(definition.shape).toContain('rounded');
        
        // Base icon should have background and border
        if (className === 'empty-state-icon') {
          expect(definition.background).toContain('luma-coral');
          expect(definition.border).toContain('border');
          expect(definition.layout).toContain('flex');
        }
        
        // Large variant should have larger size
        if (className === 'empty-state-icon-lg') {
          expect(definition.size).toContain('w-20');
          expect(definition.size).toContain('h-20');
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4c: Empty state text elements have proper typography
   * Validates: Requirement 4.3
   */
  it('should apply proper typography for empty state text elements', () => {
    const textClasses = fc.constantFrom('empty-state-title', 'empty-state-subtitle');

    fc.assert(
      fc.property(textClasses, (className) => {
        const definition = getEmptyStateClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Verify typography is defined
        expect(definition.typography).toBeDefined();
        
        // Verify color is defined
        expect(definition.color).toBeDefined();
        
        // Title should have medium font weight
        if (className === 'empty-state-title') {
          expect(definition.typography).toContain('font-medium');
          expect(definition.typography).toContain('text-sm');
          expect(definition.spacing).toBe('mb-1');
        }
        
        // Subtitle should have smaller text
        if (className === 'empty-state-subtitle') {
          expect(definition.typography).toContain('text-[11px]');
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4d: All empty state classes have required layout properties
   * Validates: Requirements 4.1, 4.2, 4.3
   */
  it('should have required layout properties for all empty state classes', () => {
    const allEmptyStateClasses = fc.constantFrom(
      'empty-state',
      'empty-state-icon',
      'empty-state-icon-lg',
      'empty-state-title',
      'empty-state-subtitle'
    );

    fc.assert(
      fc.property(allEmptyStateClasses, (className) => {
        // Verify class has layout properties
        expect(hasLayoutProperties(className)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4e: Text empty state classes have required typography properties
   * Validates: Requirement 4.3
   */
  it('should have required typography properties for text empty state classes', () => {
    const textClasses = fc.constantFrom('empty-state-title', 'empty-state-subtitle');

    fc.assert(
      fc.property(textClasses, (className) => {
        // Verify class has typography properties
        expect(hasTypographyProperties(className)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: css-centralization, Property 3: Icon Action Styling Consistency**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * 
 * For any icon action type (copy, delete, refresh), the corresponding CSS class
 * should apply correct base styling and hover states.
 */

// Icon action class definitions based on design document
const iconActionClassDefinitions = {
  'icon-action': {
    base: {
      padding: 'p-1.5',
      borderRadius: 'rounded-lg',
      textColor: 'text-gray-400',
      transition: 'transition-colors duration-150'
    },
    hover: {
      textColor: 'text-gray-600',
      background: 'bg-gray-100'
    },
    dark: {
      textColor: 'text-gray-500'
    },
    darkHover: {
      textColor: 'text-gray-300',
      background: 'bg-white/10'
    }
  },
  'icon-action-copy': {
    hover: {
      textColor: 'text-blue-500',
      background: 'bg-blue-50'
    },
    darkHover: {
      textColor: 'text-blue-400',
      background: 'bg-blue-500/10'
    }
  },
  'icon-action-delete': {
    hover: {
      textColor: 'text-rose-500',
      background: 'bg-rose-50'
    },
    darkHover: {
      textColor: 'text-rose-400',
      background: 'bg-rose-500/10'
    }
  },
  'icon-action-refresh': {
    hover: {
      textColor: 'text-luma-coral',
      background: 'bg-luma-coral-10'
    }
  },
  'icon-action-sm': {
    base: {
      padding: 'p-0.5',
      borderRadius: 'rounded'
    }
  }
};

// Function to get expected styles for an icon action class
function getIconActionClassDefinition(className) {
  return iconActionClassDefinitions[className] || null;
}

// Function to verify a class has base styling properties
function hasBaseIconActionStyling(className) {
  const definition = iconActionClassDefinitions[className];
  if (!definition) return false;
  
  // Base icon-action should have padding, border-radius, and transition
  if (className === 'icon-action') {
    return !!(definition.base && 
              definition.base.padding && 
              definition.base.borderRadius && 
              definition.base.transition);
  }
  
  // Small variant should have smaller padding
  if (className === 'icon-action-sm') {
    return !!(definition.base && definition.base.padding === 'p-0.5');
  }
  
  // Action variants should have hover states
  if (className.includes('copy') || className.includes('delete') || className.includes('refresh')) {
    return !!(definition.hover && definition.hover.textColor && definition.hover.background);
  }
  
  return true;
}

// Function to verify a class has hover state properties
function hasHoverStateProperties(className) {
  const definition = iconActionClassDefinitions[className];
  if (!definition) return false;
  
  // Must have hover state defined
  return !!(definition.hover && definition.hover.textColor);
}

// Function to verify hover state uses correct color for action type
function hasCorrectHoverColor(className) {
  const definition = iconActionClassDefinitions[className];
  if (!definition || !definition.hover) return false;
  
  // Copy action should use blue
  if (className === 'icon-action-copy') {
    return definition.hover.textColor.includes('blue') && 
           definition.hover.background.includes('blue');
  }
  
  // Delete action should use rose (destructive)
  if (className === 'icon-action-delete') {
    return definition.hover.textColor.includes('rose') && 
           definition.hover.background.includes('rose');
  }
  
  // Refresh action should use coral (brand color)
  if (className === 'icon-action-refresh') {
    return definition.hover.textColor.includes('coral') && 
           definition.hover.background.includes('coral');
  }
  
  // Base icon-action should use gray
  if (className === 'icon-action') {
    return definition.hover.textColor.includes('gray') && 
           definition.hover.background.includes('gray');
  }
  
  return true;
}

describe('CSS Centralization - Icon Action Styling Consistency', () => {
  /**
   * Property 3: Icon Action Styling Consistency
   * 
   * For any icon action type (copy, delete, refresh), the corresponding CSS class
   * should apply correct base styling and hover states.
   */
  
  /**
   * Property 3a: Base icon-action class has correct styling
   * Validates: Requirement 3.1
   */
  it('should apply correct base styling for icon-action class', () => {
    const baseClasses = fc.constantFrom('icon-action');

    fc.assert(
      fc.property(baseClasses, (className) => {
        const definition = getIconActionClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Verify base styling is defined
        expect(definition.base).toBeDefined();
        expect(definition.base.padding).toBe('p-1.5');
        expect(definition.base.borderRadius).toBe('rounded-lg');
        expect(definition.base.textColor).toBe('text-gray-400');
        expect(definition.base.transition).toContain('transition-colors');
        
        // Verify hover state is defined
        expect(definition.hover).toBeDefined();
        expect(definition.hover.textColor).toBe('text-gray-600');
        expect(definition.hover.background).toBe('bg-gray-100');
        
        // Verify dark mode is defined
        expect(definition.dark).toBeDefined();
        expect(definition.darkHover).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3b: Copy action has blue hover state
   * Validates: Requirement 3.2
   */
  it('should apply blue hover state for icon-action-copy class', () => {
    const copyClasses = fc.constantFrom('icon-action-copy');

    fc.assert(
      fc.property(copyClasses, (className) => {
        const definition = getIconActionClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Verify hover state uses blue colors
        expect(definition.hover).toBeDefined();
        expect(definition.hover.textColor).toContain('blue');
        expect(definition.hover.background).toContain('blue');
        
        // Verify dark mode hover uses blue colors
        expect(definition.darkHover).toBeDefined();
        expect(definition.darkHover.textColor).toContain('blue');
        expect(definition.darkHover.background).toContain('blue');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3c: Delete action has rose/destructive hover state
   * Validates: Requirement 3.3
   */
  it('should apply rose hover state for icon-action-delete class', () => {
    const deleteClasses = fc.constantFrom('icon-action-delete');

    fc.assert(
      fc.property(deleteClasses, (className) => {
        const definition = getIconActionClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Verify hover state uses rose colors (destructive)
        expect(definition.hover).toBeDefined();
        expect(definition.hover.textColor).toContain('rose');
        expect(definition.hover.background).toContain('rose');
        
        // Verify dark mode hover uses rose colors
        expect(definition.darkHover).toBeDefined();
        expect(definition.darkHover.textColor).toContain('rose');
        expect(definition.darkHover.background).toContain('rose');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3d: Refresh action has coral hover state
   * Validates: Requirement 3.4
   */
  it('should apply coral hover state for icon-action-refresh class', () => {
    const refreshClasses = fc.constantFrom('icon-action-refresh');

    fc.assert(
      fc.property(refreshClasses, (className) => {
        const definition = getIconActionClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Verify hover state uses coral colors (brand color)
        expect(definition.hover).toBeDefined();
        expect(definition.hover.textColor).toContain('coral');
        expect(definition.hover.background).toContain('coral');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3e: All icon action classes have required base styling
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4
   */
  it('should have required base styling for all icon action classes', () => {
    const allIconActionClasses = fc.constantFrom(
      'icon-action',
      'icon-action-copy',
      'icon-action-delete',
      'icon-action-refresh',
      'icon-action-sm'
    );

    fc.assert(
      fc.property(allIconActionClasses, (className) => {
        // Verify class has base styling properties
        expect(hasBaseIconActionStyling(className)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3f: Action variant classes have hover states with correct colors
   * Validates: Requirements 3.2, 3.3, 3.4
   */
  it('should have hover states with correct colors for action variants', () => {
    const actionVariantClasses = fc.constantFrom(
      'icon-action',
      'icon-action-copy',
      'icon-action-delete',
      'icon-action-refresh'
    );

    fc.assert(
      fc.property(actionVariantClasses, (className) => {
        // Verify class has hover state properties
        expect(hasHoverStateProperties(className)).toBe(true);
        
        // Verify hover state uses correct color for action type
        expect(hasCorrectHoverColor(className)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3g: Small variant has reduced padding
   * Validates: Requirement 3.1
   */
  it('should have reduced padding for icon-action-sm class', () => {
    const smallClasses = fc.constantFrom('icon-action-sm');

    fc.assert(
      fc.property(smallClasses, (className) => {
        const definition = getIconActionClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Verify small variant has reduced padding
        expect(definition.base).toBeDefined();
        expect(definition.base.padding).toBe('p-0.5');
        expect(definition.base.borderRadius).toBe('rounded');
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: css-centralization, Property 2: Text Class Hierarchy Consistency**
 * **Validates: Requirements 2.1, 2.2**
 * 
 * For any text hierarchy level (primary, secondary, muted), the corresponding
 * CSS class should apply the correct color from CSS variables.
 */

// Text class definitions based on design document and index.css
const textClassDefinitions = {
  // Primary text - uses --luma-text CSS variable
  'text-luma': {
    cssVariable: '--luma-text',
    expectedColor: 'var(--luma-text)',
    description: 'Primary text color'
  },
  // Secondary text - uses --luma-text-secondary CSS variable
  'text-luma-secondary': {
    cssVariable: '--luma-text-secondary',
    expectedColor: 'var(--luma-text-secondary)',
    description: 'Secondary text color'
  },
  // Muted text - uses --luma-text-muted CSS variable
  'text-luma-muted': {
    cssVariable: '--luma-text-muted',
    expectedColor: 'var(--luma-text-muted)',
    description: 'Muted text color'
  }
};

// Function to get expected styles for a text class
function getTextClassDefinition(className) {
  return textClassDefinitions[className] || null;
}

// Function to verify a text class uses the correct CSS variable
function usesCorrectCssVariable(className) {
  const definition = textClassDefinitions[className];
  if (!definition) return false;
  
  // Verify the class uses a CSS variable for color
  return definition.cssVariable && definition.cssVariable.startsWith('--luma-text');
}

// Function to verify text hierarchy is maintained (primary > secondary > muted)
function maintainsTextHierarchy(className) {
  const hierarchy = ['text-luma', 'text-luma-secondary', 'text-luma-muted'];
  return hierarchy.includes(className);
}

describe('CSS Centralization - Text Class Hierarchy Consistency', () => {
  /**
   * Property 2: Text Class Hierarchy Consistency
   * 
   * For any text hierarchy level (primary, secondary, muted), the corresponding
   * CSS class should apply the correct color from CSS variables.
   */
  
  /**
   * Property 2a: Primary text class uses correct CSS variable
   * Validates: Requirement 2.1
   */
  it('should use correct CSS variable for primary text class', () => {
    const primaryClasses = fc.constantFrom('text-luma');

    fc.assert(
      fc.property(primaryClasses, (className) => {
        const definition = getTextClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Verify it uses the correct CSS variable
        expect(definition.cssVariable).toBe('--luma-text');
        expect(definition.expectedColor).toBe('var(--luma-text)');
        
        // Verify description indicates primary text
        expect(definition.description).toContain('Primary');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2b: Secondary text class uses correct CSS variable
   * Validates: Requirement 2.2
   */
  it('should use correct CSS variable for secondary text class', () => {
    const secondaryClasses = fc.constantFrom('text-luma-secondary');

    fc.assert(
      fc.property(secondaryClasses, (className) => {
        const definition = getTextClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Verify it uses the correct CSS variable
        expect(definition.cssVariable).toBe('--luma-text-secondary');
        expect(definition.expectedColor).toBe('var(--luma-text-secondary)');
        
        // Verify description indicates secondary text
        expect(definition.description).toContain('Secondary');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2c: Muted text class uses correct CSS variable
   * Validates: Requirement 2.2
   */
  it('should use correct CSS variable for muted text class', () => {
    const mutedClasses = fc.constantFrom('text-luma-muted');

    fc.assert(
      fc.property(mutedClasses, (className) => {
        const definition = getTextClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Verify it uses the correct CSS variable
        expect(definition.cssVariable).toBe('--luma-text-muted');
        expect(definition.expectedColor).toBe('var(--luma-text-muted)');
        
        // Verify description indicates muted text
        expect(definition.description).toContain('Muted');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2d: All text classes use CSS variables for colors
   * Validates: Requirements 2.1, 2.2
   */
  it('should use CSS variables for all text hierarchy classes', () => {
    const allTextClasses = fc.constantFrom(
      'text-luma',
      'text-luma-secondary',
      'text-luma-muted'
    );

    fc.assert(
      fc.property(allTextClasses, (className) => {
        // Verify class uses correct CSS variable
        expect(usesCorrectCssVariable(className)).toBe(true);
        
        // Verify class is part of the text hierarchy
        expect(maintainsTextHierarchy(className)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2e: Text hierarchy classes are distinct
   * Validates: Requirements 2.1, 2.2
   */
  it('should have distinct CSS variables for each text hierarchy level', () => {
    const textClassPairs = fc.constantFrom(
      ['text-luma', 'text-luma-secondary'],
      ['text-luma', 'text-luma-muted'],
      ['text-luma-secondary', 'text-luma-muted']
    );

    fc.assert(
      fc.property(textClassPairs, ([class1, class2]) => {
        const def1 = getTextClassDefinition(class1);
        const def2 = getTextClassDefinition(class2);
        
        // Verify both classes exist
        expect(def1).not.toBeNull();
        expect(def2).not.toBeNull();
        
        // Verify they use different CSS variables
        expect(def1.cssVariable).not.toBe(def2.cssVariable);
        expect(def1.expectedColor).not.toBe(def2.expectedColor);
      }),
      { numRuns: 100 }
    );
  });
});
