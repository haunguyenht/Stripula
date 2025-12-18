import { useState, useEffect, useCallback, useRef } from 'react';
import { useBreakpoint } from '@/hooks/useMediaQuery';

// Estimated min width needed for desktop nav (will be updated after first measurement)
const DEFAULT_NAV_WIDTH = 500;

/**
 * useResponsiveNav - Hook for responsive navigation layout
 * 
 * Combines breakpoint detection with dynamic measurement:
 * - Always mobile nav on mobile breakpoint (< 768px)
 * - On desktop, measures if nav content fits in container
 * - Remembers last measured nav width to know when to switch back
 * 
 * @param {React.RefObject} containerRef - Ref to the container element
 * @param {React.RefObject} contentRef - Ref to the nav content element
 * @returns {Object} { shouldUseMobileNav, isMobileBreakpoint }
 */
export function useResponsiveNav(containerRef, contentRef) {
  const { isMobile: isMobileBreakpoint } = useBreakpoint();
  const [shouldUseMobileNav, setShouldUseMobileNav] = useState(false);
  
  // Remember the last measured nav width so we know when to switch back
  const lastNavWidthRef = useRef(DEFAULT_NAV_WIDTH);
  const hasInitializedRef = useRef(false);

  // Get container width
  const getContainerWidth = useCallback(() => {
    return containerRef?.current?.offsetWidth || 0;
  }, [containerRef]);

  // Get nav content width
  const getNavWidth = useCallback(() => {
    if (contentRef?.current) {
      const width = contentRef.current.scrollWidth;
      if (width > 0) {
        lastNavWidthRef.current = width + 60; // Add buffer
      }
    }
    return lastNavWidthRef.current;
  }, [contentRef]);

  // Determine if we should use mobile nav
  const updateNavMode = useCallback(() => {
    if (isMobileBreakpoint) {
      setShouldUseMobileNav(true);
      return;
    }

    const containerWidth = getContainerWidth();
    if (containerWidth === 0) return;

    // If content ref exists, measure it
    if (contentRef?.current) {
      const navWidth = getNavWidth();
      const shouldBeMobile = containerWidth < navWidth;
      setShouldUseMobileNav(shouldBeMobile);
      hasInitializedRef.current = true;
    } else {
      // Content not rendered (we're in mobile mode)
      // Use last known width to determine if we should switch back
      const shouldBeMobile = containerWidth < lastNavWidthRef.current;
      setShouldUseMobileNav(shouldBeMobile);
    }
  }, [isMobileBreakpoint, getContainerWidth, getNavWidth, contentRef]);

  // Initial setup and resize handling
  useEffect(() => {
    // Initial check
    const timer = setTimeout(updateNavMode, 50);

    // Handle resize
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateNavMode, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateNavMode]);

  // Re-measure when desktop nav is rendered
  useEffect(() => {
    if (!shouldUseMobileNav && contentRef?.current) {
      const timer = setTimeout(() => {
        getNavWidth(); // Update the stored width
        updateNavMode();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [shouldUseMobileNav, contentRef, getNavWidth, updateNavMode]);

  return {
    shouldUseMobileNav,
    isMobileBreakpoint,
  };
}



