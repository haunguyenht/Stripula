import { useState, useEffect, useSyncExternalStore } from 'react';

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
    const isSm = useMediaQuerySimple('(min-width: 640px)');
    const isMd = useMediaQuerySimple('(min-width: 768px)');
    const isLg = useMediaQuerySimple('(min-width: 1024px)');
    const isXl = useMediaQuerySimple('(min-width: 1280px)');
    const is2xl = useMediaQuerySimple('(min-width: 1536px)');

    return {
        isMobile: !isMd,           // < 768px
        isTablet: isMd && !isLg,   // 768px - 1023px
        isDesktop: isLg,           // >= 1024px
        isLargeDesktop: isXl,      // >= 1280px
        isSm,
        isMd,
        isLg,
        isXl,
        is2xl
    };
}
