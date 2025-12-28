/**
 * Motion.dev animation presets and utilities
 * 
 * Provides consistent animation patterns across the app
 * with built-in reduced-motion support
 * 
 * OPUX Design System: subtle, elegant transitions
 */

// Check if user prefers reduced motion
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Subscribe to reduced motion preference changes
export const onReducedMotionChange = (callback) => {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (e) => callback(e.matches);
  
  // Use addEventListener for modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }
  
  // Fallback for older browsers
  mediaQuery.addListener(handler);
  return () => mediaQuery.removeListener(handler);
};

// Get animation duration respecting reduced motion
export const getAnimationDuration = (normalDuration) => {
  return prefersReducedMotion() ? 0 : normalDuration;
};

// Animation durations (in seconds)
export const duration = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  slower: 0.5,
  // OPUX specific
  softEnter: 0.25,
  softExit: 0.2,
};

// Easing functions
export const ease = {
  default: [0.4, 0, 0.2, 1],
  in: [0.4, 0, 1, 1],
  out: [0, 0, 0.2, 1],
  inOut: [0.4, 0, 0.2, 1],
  bounce: [0.34, 1.56, 0.64, 1],
  // OPUX specific - smoother, more elegant
  soft: [0.25, 0.1, 0.25, 1],
  softOut: [0, 0, 0.15, 1],
  // OPUX smooth
  opux: [0.16, 1, 0.3, 1],
};

// Spring configurations
export const spring = {
  default: { type: 'spring', stiffness: 400, damping: 30 },
  gentle: { type: 'spring', stiffness: 200, damping: 25 },
  bouncy: { type: 'spring', stiffness: 500, damping: 20 },
  stiff: { type: 'spring', stiffness: 600, damping: 35 },
  // OPUX specific - very smooth, no bounce
  soft: { type: 'spring', stiffness: 300, damping: 30 },
  softGentle: { type: 'spring', stiffness: 150, damping: 20 },
};

// Common animation variants
export const variants = {
  // Fade in/out
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  
  // Slide from right (for sheets/drawers)
  slideRight: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
  },
  
  // Slide from bottom (for mobile sheets)
  slideUp: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
  },
  
  // Scale and fade (for modals/dropdowns)
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  
  // Subtle hover/press for buttons
  buttonHover: {
    scale: 1.02,
  },
  buttonTap: {
    scale: 0.98,
  },
  
  // Card hover - OPUX lift effect
  cardHover: {
    y: -4,
    scale: 1.01,
    transition: spring.softGentle,
  },
  
  // ===== OPUX SPECIFIC VARIANTS =====
  
  // Soft surface enter (for cards, panels)
  softEnter: {
    initial: { opacity: 0, y: 8, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 4, scale: 0.99 },
  },
  
  // Soft popover/menu enter
  softPopover: {
    initial: { opacity: 0, y: -4, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -2, scale: 0.98 },
  },
  
  // Soft sheet/drawer enter
  softSheet: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 10 },
  },
  
  // Soft hover lift for interactive cards
  softLift: {
    y: -3,
    scale: 1.005,
    boxShadow: '0 8px 24px -6px hsl(var(--foreground) / 0.12), 0 16px 48px -12px hsl(var(--foreground) / 0.18)',
  },
  
  // Soft press effect
  softPress: {
    scale: 0.98,
    y: 1,
  },
  
  // Floating dot drift animation values
  floatDrift: {
    y: [0, -15, 5, -10, 0],
    x: [0, 8, -5, 3, 0],
    scale: [1, 1.1, 0.95, 1.05, 1],
  },

  // OPUX liquid hover - smooth lift
  liquidHover: {
    y: -4,
    scale: 1.01,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },

  // OPUX glass reveal - for modals/sheets
  glassReveal: {
    initial: { 
      opacity: 0, 
      backdropFilter: 'blur(0px)',
      scale: 0.95,
    },
    animate: { 
      opacity: 1, 
      backdropFilter: 'blur(20px)',
      scale: 1,
    },
    exit: { 
      opacity: 0, 
      backdropFilter: 'blur(0px)',
      scale: 0.98,
    },
  },
};

// Transition presets
export const transition = {
  default: { duration: duration.normal, ease: ease.default },
  fast: { duration: duration.fast, ease: ease.default },
  slow: { duration: duration.slow, ease: ease.default },
  spring: spring.default,
  springGentle: spring.gentle,
  springBouncy: spring.bouncy,
  // OPUX specific
  soft: { duration: duration.softEnter, ease: ease.soft },
  softFast: { duration: duration.fast, ease: ease.soft },
  softSlow: { duration: duration.slow, ease: ease.softOut },
  springSoft: spring.soft,
  springSoftGentle: spring.softGentle,
  // OPUX smooth
  opux: { duration: 0.3, ease: ease.opux },
  opuxFast: { duration: 0.2, ease: ease.opux },
};

// Animation props with reduced motion support
export const getMotionProps = (variant, options = {}) => {
  if (prefersReducedMotion()) {
    return {
      initial: false,
      animate: false,
      exit: false,
    };
  }
  
  const v = variants[variant];
  if (!v) return {};
  
  return {
    initial: v.initial,
    animate: v.animate,
    exit: v.exit,
    transition: options.transition || transition.default,
    ...options,
  };
};

// Hover/tap props with reduced motion support
export const getInteractionProps = (options = {}) => {
  if (prefersReducedMotion()) {
    return {};
  }
  
  return {
    whileHover: options.hover || variants.buttonHover,
    whileTap: options.tap || variants.buttonTap,
    transition: options.transition || spring.default,
  };
};

// OPUX specific interaction props
export const getSoftInteractionProps = (options = {}) => {
  if (prefersReducedMotion()) {
    return {};
  }
  
  return {
    whileHover: options.hover || variants.softLift,
    whileTap: options.tap || variants.softPress,
    transition: options.transition || spring.softGentle,
  };
};

// Stagger children animation
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

// OPUX stagger - more subtle
export const softStaggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

export const softStaggerItem = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
};

// Float animation for decorative elements (respects reduced motion)
export const getFloatAnimation = (duration = 20, delay = 0) => {
  if (prefersReducedMotion()) {
    return {};
  }
  
  return {
    animate: variants.floatDrift,
    transition: {
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    },
  };
};

// Get liquid hover interaction props (for glass elements)
export const getLiquidHoverProps = (options = {}) => {
  if (prefersReducedMotion()) {
    return {};
  }

  return {
    whileHover: variants.liquidHover,
    whileTap: variants.softPress,
    transition: transition.opux,
  };
};

// Get OPUX card enter animation props
export const getCardEnterProps = (options = {}) => {
  if (prefersReducedMotion()) {
    return {
      initial: false,
      animate: false,
      exit: false,
    };
  }

  return {
    initial: variants.softEnter.initial,
    animate: variants.softEnter.animate,
    exit: variants.softEnter.exit,
    transition: options.transition || transition.opux,
  };
};

/**
 * Will-change optimization utilities
 * 
 * will-change should be applied sparingly and only during animations
 * to hint the browser about upcoming changes. It should be removed
 * after the animation completes to free up GPU memory.
 */

// CSS classes for will-change optimization
export const willChangeClasses = {
  transform: 'will-change-transform',
  opacity: 'will-change-opacity',
  transformOpacity: 'will-change-[transform,opacity]',
  auto: 'will-change-auto',
};

// Get will-change props for motion components
// Automatically applies will-change during animation and removes after
export const getWillChangeProps = (properties = ['transform', 'opacity']) => {
  if (prefersReducedMotion()) {
    return {};
  }
  
  const willChangeValue = properties.join(', ');
  
  return {
    style: { willChange: 'auto' },
    onAnimationStart: (e) => {
      if (e.target) {
        e.target.style.willChange = willChangeValue;
      }
    },
    onAnimationComplete: (e) => {
      if (e.target) {
        e.target.style.willChange = 'auto';
      }
    },
  };
};

// Hook for managing will-change in React components
export const useWillChange = (isAnimating, properties = ['transform', 'opacity']) => {
  if (prefersReducedMotion()) {
    return { willChange: 'auto' };
  }
  
  return {
    willChange: isAnimating ? properties.join(', ') : 'auto',
  };
};
