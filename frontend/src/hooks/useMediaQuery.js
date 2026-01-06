import { useState, useEffect, useSyncExternalStore, useCallback, useRef } from 'react';

/**
 * Custom hook for responsive breakpoint detection
 * Uses useSyncExternalStore for better SSR/hydration support
 */
export function useMediaQuery(query) {
    const subscribe = (callback) => {
        const media = window.matchMedia(query);
        media.addEventListener('change', callback);
        return () => media.removeEventListener('change', callback);
    };

    const getSnapshot = () => {
        return window.matchMedia(query).matches;
    };

    const getServerSnapshot = () => false;

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Hook to detect if content overflows its container
 * Returns true if the content needs more space than available
 * 
 * @param {Object} options
 * @param {number} options.buffer - Extra buffer space to consider (default: 20px)
 * @param {number} options.debounceMs - Debounce time for resize events (default: 100ms)
 */
export function useContentOverflow(options = {}) {
    const { buffer = 20, debounceMs = 100 } = options;
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const timeoutRef = useRef(null);

    const checkOverflow = useCallback(() => {
        if (!containerRef.current || !contentRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const contentWidth = contentRef.current.scrollWidth;
        
        // Check if content is wider than container (with buffer)
        const overflows = contentWidth > containerWidth - buffer;
        setIsOverflowing(overflows);
    }, [buffer]);

    useEffect(() => {
        const debouncedCheck = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(checkOverflow, debounceMs);
        };

        // Initial check
        checkOverflow();

        // Check on resize
        window.addEventListener('resize', debouncedCheck);
        
        // Use ResizeObserver for more accurate detection
        const resizeObserver = new ResizeObserver(debouncedCheck);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        if (contentRef.current) {
            resizeObserver.observe(contentRef.current);
        }

        return () => {
            window.removeEventListener('resize', debouncedCheck);
            resizeObserver.disconnect();
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [checkOverflow, debounceMs]);

    return { containerRef, contentRef, isOverflowing, checkOverflow };
}

/**
 * Alternative simpler hook using useState/useEffect
 */
export function useMediaQuerySimple(query) {
    const [matches, setMatches] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches;
        }
        return false;
    });

    useEffect(() => {
        const media = window.matchMedia(query);
        setMatches(media.matches);

        const handler = (e) => setMatches(e.matches);
        media.addEventListener('change', handler);
        
        // Also listen to resize for edge cases
        const resizeHandler = () => setMatches(window.matchMedia(query).matches);
        window.addEventListener('resize', resizeHandler);
        
        return () => {
            media.removeEventListener('change', handler);
            window.removeEventListener('resize', resizeHandler);
        };
    }, [query]);

    return matches;
}

/**
 * Tailwind breakpoint hooks
 */
export function useBreakpoint() {
    const isXs = useMediaQuerySimple('(min-width: 480px)');
    const isSm = useMediaQuerySimple('(min-width: 640px)');
    const isMd = useMediaQuerySimple('(min-width: 768px)');
    const isLg = useMediaQuerySimple('(min-width: 1024px)');
    const isXl = useMediaQuerySimple('(min-width: 1280px)');
    const is2xl = useMediaQuerySimple('(min-width: 1536px)');

    return {
        isVerySmall: !isXs,        // < 480px (very small phones)
        isMobile: !isMd,           // < 768px
        isTablet: isMd && !isLg,   // 768px - 1023px
        isDesktop: isLg,           // >= 1024px
        isLargeDesktop: isXl,      // >= 1280px
        isXs,
        isSm,
        isMd,
        isLg,
        isXl,
        is2xl
    };
}
