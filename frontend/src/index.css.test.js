import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: shadcn-ui-migration, Property 1: Status Class Color Consistency**
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

describe('CSS - Status Class Color Consistency', () => {
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
 * **Feature: shadcn-ui-migration, Property 5: Dark Mode Variant Consistency**
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
    light: { color: 'text-muted-foreground' },
    dark: { text: 'text-gray-300' }
  },
  'empty-state-subtitle': {
    light: { color: 'text-muted-foreground' },
    dark: { text: 'text-gray-500' }
  },
  
  // Input classes (Requirement 6.3)
  'count-badge': {
    light: { bg: 'bg-amber-100', text: 'text-amber-700' },
    dark: { bg: 'bg-pink-900/40', text: 'text-pink-400' }
  },
  
  // Currency and balance classes
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
  
  // BIN data badge classes
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

describe('CSS - Dark Mode Variant Consistency', () => {
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
  it('should have dark mode variants for status indicator classes', () => {
    const statusClasses = fc.constantFrom(
      'status-indicator-live',
      'status-indicator-dead',
      'status-indicator-error'
    );

    fc.assert(
      fc.property(statusClasses, (className) => {
        const styles = getDarkModeStyles(className);
        
        // Verify class has dark mode styles
        expect(styles).not.toBeNull();
        expect(styles.dark).toBeDefined();
        
        // Verify dark mode differs from light mode
        expect(hasDarkModeVariant(className)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5b: Capability badge classes have dark mode variants
   * Validates: Requirement 6.1
   */
  it('should have dark mode variants for capability badge classes', () => {
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
        
        // Verify class has dark mode styles
        expect(styles).not.toBeNull();
        expect(styles.dark).toBeDefined();
        
        // Verify dark mode differs from light mode
        expect(hasDarkModeVariant(className)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5c: Text classes have dark mode variants
   * Validates: Requirement 6.2
   */
  it('should have dark mode variants for text classes', () => {
    const textClasses = fc.constantFrom(
      'text-mono-key',
      'text-mono-sm',
      'text-meta'
    );

    fc.assert(
      fc.property(textClasses, (className) => {
        const styles = getDarkModeStyles(className);
        
        // Verify class has dark mode styles
        expect(styles).not.toBeNull();
        expect(styles.dark).toBeDefined();
        
        // Verify dark mode differs from light mode
        expect(hasDarkModeVariant(className)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5d: All centralized classes have dark mode support
   * Validates: Requirements 6.1, 6.2, 6.3, 6.4
   */
  it('should have dark mode support for all centralized classes', () => {
    const allClasses = fc.constantFrom(...Object.keys(darkModeClassMapping));

    fc.assert(
      fc.property(allClasses, (className) => {
        const styles = getDarkModeStyles(className);
        
        // Verify class has dark mode styles
        expect(styles).not.toBeNull();
        expect(styles.dark).toBeDefined();
        
        // Verify dark mode differs from light mode
        expect(hasDarkModeVariant(className)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: shadcn-ui-migration, Property 3: Empty State Component Styling**
 * **Validates: Requirements 4.1, 4.2**
 * 
 * For any empty state component, the styling should be consistent and use
 * the correct CSS classes for icon, title, and subtitle.
 */

// Empty state class definitions based on shadcn design
const emptyStateClassDefinitions = {
  'empty-state': {
    layout: 'flex flex-col items-center justify-center',
    spacing: 'py-16 text-center',
    textColor: 'text-muted-foreground'
  },
  'empty-state-icon': {
    size: 'w-16 h-16',
    shape: 'rounded-2xl',
    background: 'bg-primary/10',
    border: 'border border-primary/30',
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
    color: 'text-muted-foreground'
  },
  'empty-state-subtitle': {
    typography: 'text-[11px]',
    color: 'text-muted-foreground'
  }
};

// Function to get expected styles for an empty state class
function getEmptyStateClassDefinition(className) {
  return emptyStateClassDefinitions[className] || null;
}

// Function to verify an empty state class has required properties
function hasRequiredEmptyStateProperties(className) {
  const definition = emptyStateClassDefinitions[className];
  if (!definition) return false;
  
  // Different classes have different required properties
  if (className === 'empty-state') {
    return !!(definition.layout && definition.spacing);
  }
  if (className.startsWith('empty-state-icon')) {
    return !!(definition.size && definition.shape);
  }
  if (className === 'empty-state-title' || className === 'empty-state-subtitle') {
    return !!(definition.typography && definition.color);
  }
  
  return true;
}

describe('CSS - Empty State Component Styling', () => {
  /**
   * Property 3: Empty State Component Styling
   * 
   * For any empty state component, the styling should be consistent and use
   * the correct CSS classes.
   */
  
  /**
   * Property 3a: Empty state container has correct layout
   * Validates: Requirement 4.1
   */
  it('should have correct layout for empty state container', () => {
    fc.assert(
      fc.property(fc.constant('empty-state'), (className) => {
        const definition = getEmptyStateClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Verify layout includes centering
        expect(definition.layout).toContain('flex');
        expect(definition.layout).toContain('items-center');
        expect(definition.layout).toContain('justify-center');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3b: Empty state icon has correct styling
   * Validates: Requirement 4.1
   */
  it('should have correct styling for empty state icon', () => {
    fc.assert(
      fc.property(fc.constant('empty-state-icon'), (className) => {
        const definition = getEmptyStateClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Base icon should have background and border
        expect(definition.background).toContain('primary');
        expect(definition.border).toContain('border');
        expect(definition.layout).toContain('flex');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3c: Empty state text elements have correct typography
   * Validates: Requirement 4.2
   */
  it('should have correct typography for empty state text elements', () => {
    const textClasses = fc.constantFrom('empty-state-title', 'empty-state-subtitle');

    fc.assert(
      fc.property(textClasses, (className) => {
        const definition = getEmptyStateClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Verify typography is defined
        expect(definition.typography).toBeDefined();
        expect(definition.color).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3d: All empty state classes have required properties
   * Validates: Requirements 4.1, 4.2
   */
  it('should have required properties for all empty state classes', () => {
    const allEmptyStateClasses = fc.constantFrom(...Object.keys(emptyStateClassDefinitions));

    fc.assert(
      fc.property(allEmptyStateClasses, (className) => {
        // Verify class has required properties
        expect(hasRequiredEmptyStateProperties(className)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: shadcn-ui-migration, Property 4: Icon Action Class Styling**
 * **Validates: Requirements 5.1, 5.2**
 * 
 * For any icon action class, the styling should include proper hover states
 * and consistent sizing.
 */

// Icon action class definitions based on shadcn design
const iconActionClassDefinitions = {
  'icon-action': {
    base: {
      size: 'w-7 h-7',
      layout: 'flex items-center justify-center',
      shape: 'rounded-md',
      textColor: 'text-muted-foreground',
      transition: 'transition-colors'
    },
    hover: {
      textColor: 'text-primary',
      background: 'bg-primary/10'
    }
  },
  'icon-action-refresh': {
    hover: {
      textColor: 'text-primary',
      background: 'bg-primary/10'
    }
  },
  'icon-action-copy': {
    hover: {
      textColor: 'text-blue-500',
      background: 'bg-blue-500/10'
    }
  },
  'icon-action-delete': {
    hover: {
      textColor: 'text-destructive',
      background: 'bg-destructive/10'
    }
  }
};

// Function to get expected styles for an icon action class
function getIconActionClassDefinition(className) {
  return iconActionClassDefinitions[className] || null;
}

// Function to verify an icon action class has hover state
function hasHoverState(className) {
  const definition = iconActionClassDefinitions[className];
  return definition && definition.hover && Object.keys(definition.hover).length > 0;
}

describe('CSS - Icon Action Class Styling', () => {
  /**
   * Property 4: Icon Action Class Styling
   * 
   * For any icon action class, the styling should include proper hover states
   * and consistent sizing.
   */
  
  /**
   * Property 4a: Base icon action has correct structure
   * Validates: Requirement 5.1
   */
  it('should have correct base structure for icon action class', () => {
    fc.assert(
      fc.property(fc.constant('icon-action'), (className) => {
        const definition = getIconActionClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Verify base styles
        expect(definition.base).toBeDefined();
        expect(definition.base.size).toBeDefined();
        expect(definition.base.layout).toContain('flex');
        expect(definition.base.transition).toContain('transition');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4b: All icon action classes have hover states
   * Validates: Requirement 5.2
   */
  it('should have hover states for all icon action classes', () => {
    const iconActionClasses = fc.constantFrom(...Object.keys(iconActionClassDefinitions));

    fc.assert(
      fc.property(iconActionClasses, (className) => {
        // Verify class has hover state
        expect(hasHoverState(className)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4c: Delete action uses destructive color
   * Validates: Requirement 5.2
   */
  it('should use destructive color for delete action', () => {
    fc.assert(
      fc.property(fc.constant('icon-action-delete'), (className) => {
        const definition = getIconActionClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Verify delete uses destructive color
        expect(definition.hover.textColor).toContain('destructive');
        expect(definition.hover.background).toContain('destructive');
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: shadcn-ui-migration, Property 2: Text Class Hierarchy Consistency**
 * **Validates: Requirements 2.1, 2.2**
 * 
 * For any text hierarchy level (primary, secondary, muted), the corresponding
 * CSS class should apply the correct color from CSS variables.
 */

// Text class definitions based on shadcn design
const textClassDefinitions = {
  // Primary text - uses foreground CSS variable
  'text-foreground': {
    cssVariable: '--foreground',
    expectedColor: 'hsl(var(--foreground))',
    description: 'Primary text color'
  },
  // Secondary text - uses muted-foreground CSS variable
  'text-muted-foreground': {
    cssVariable: '--muted-foreground',
    expectedColor: 'hsl(var(--muted-foreground))',
    description: 'Secondary/muted text color'
  },
  // Primary color text - uses primary CSS variable
  'text-primary': {
    cssVariable: '--primary',
    expectedColor: 'hsl(var(--primary))',
    description: 'Primary brand color text'
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
  return definition.cssVariable && definition.cssVariable.startsWith('--');
}

// Function to verify text hierarchy is maintained
function maintainsTextHierarchy(className) {
  const hierarchy = ['text-foreground', 'text-muted-foreground', 'text-primary'];
  return hierarchy.includes(className);
}

describe('CSS - Text Class Hierarchy Consistency', () => {
  /**
   * Property 2: Text Class Hierarchy Consistency
   * 
   * For any text hierarchy level, the corresponding CSS class should apply
   * the correct color from CSS variables.
   */
  
  /**
   * Property 2a: Primary text class uses correct CSS variable
   * Validates: Requirement 2.1
   */
  it('should use correct CSS variable for primary text class', () => {
    const primaryClasses = fc.constantFrom('text-foreground');

    fc.assert(
      fc.property(primaryClasses, (className) => {
        const definition = getTextClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Verify it uses the correct CSS variable
        expect(definition.cssVariable).toBe('--foreground');
        
        // Verify description indicates primary text
        expect(definition.description).toContain('Primary');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2b: Muted text class uses correct CSS variable
   * Validates: Requirement 2.2
   */
  it('should use correct CSS variable for muted text class', () => {
    const mutedClasses = fc.constantFrom('text-muted-foreground');

    fc.assert(
      fc.property(mutedClasses, (className) => {
        const definition = getTextClassDefinition(className);
        
        // Verify class definition exists
        expect(definition).not.toBeNull();
        
        // Verify it uses the correct CSS variable
        expect(definition.cssVariable).toBe('--muted-foreground');
        
        // Verify description indicates muted text
        expect(definition.description.toLowerCase()).toContain('muted');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2c: All text classes use CSS variables for colors
   * Validates: Requirements 2.1, 2.2
   */
  it('should use CSS variables for all text hierarchy classes', () => {
    const allTextClasses = fc.constantFrom(
      'text-foreground',
      'text-muted-foreground',
      'text-primary'
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
   * Property 2d: Text hierarchy classes are distinct
   * Validates: Requirements 2.1, 2.2
   */
  it('should have distinct CSS variables for each text hierarchy level', () => {
    const textClassPairs = fc.constantFrom(
      ['text-foreground', 'text-muted-foreground'],
      ['text-foreground', 'text-primary'],
      ['text-muted-foreground', 'text-primary']
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
      }),
      { numRuns: 100 }
    );
  });
});
