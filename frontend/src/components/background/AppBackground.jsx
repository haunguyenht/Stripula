import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useState, useEffect, useCallback, memo } from 'react';

/**
 * AppBackground - OPUX Design System Background
 * 
 * Layers (bottom to top):
 * 1. Tile pattern (bg-tile.png) - small, repeating
 * 2. Grainy texture (grainy-background-new.png) - full cover
 * 3. Wireframe landscape (bottom-section-bg.png) - decorative
 * 4. Vignette - CSS shadow effect
 * 
 * Performance optimizations:
 * - Progressive loading: tile → grainy → landscape
 * - requestIdleCallback for non-critical images
 * - CSS containment for paint isolation
 * - GPU-accelerated layers with translateZ(0)
 */
const AppBackground = memo(function AppBackground({ className }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [grainyLoaded, setGrainyLoaded] = useState(false);
  const [landscapeLoaded, setLandscapeLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Preload WebP images progressively (96% smaller than PNG!)
  const preloadImages = useCallback(() => {
    if (!isDark) return;
    
    const loadImage = (src, onLoad) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      
      if (img.complete) {
        onLoad();
      } else {
        img.onload = onLoad;
      }
    };

    // Load grainy first (64KB WebP vs 1.9MB PNG)
    const loadGrainy = () => {
      loadImage('/grainy-background-new.webp', () => {
        setGrainyLoaded(true);
        // Then load landscape (119KB WebP vs 2.9MB PNG)
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            loadImage('/bottom-section-bg.webp', () => setLandscapeLoaded(true));
          }, { timeout: 3000 });
        } else {
          setTimeout(() => {
            loadImage('/bottom-section-bg.webp', () => setLandscapeLoaded(true));
          }, 500);
        }
      });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadGrainy, { timeout: 1500 });
    } else {
      setTimeout(loadGrainy, 100);
    }
  }, [isDark]);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsVisible(true);
      preloadImages();
    });
    
    return () => cancelAnimationFrame(timer);
  }, [preloadImages]);

  // Light mode: simple solid background
  if (!isDark) {
  return (
    <div 
      className={cn(
        "fixed inset-0 -z-10 bg-background",
        className
      )}
      aria-hidden="true"
    />
  );
}

  return (
    <div 
      className={cn(
        "fixed inset-0 -z-10 overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      {/* Layer 1: Base tile pattern - instant */}
      <div 
        className="absolute inset-0 bg-opux-tile"
        style={{ transform: 'translateZ(0)' }}
      />

      {/* Layer 2: Grainy texture overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-opux-grainy",
          "transition-opacity duration-700 ease-out",
          isVisible && grainyLoaded ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          transform: 'translateZ(0)',
          mixBlendMode: 'overlay'
        }}
      />

      {/* Layer 3: Wireframe landscape */}
      <div 
        className={cn(
          "absolute inset-0 bg-opux-landscape",
          "transition-opacity duration-1000 ease-out",
          isVisible && landscapeLoaded ? "opacity-60" : "opacity-0"
        )}
        style={{ transform: 'translateZ(0)' }}
      />

      {/* Layer 4: Vignette overlay */}
      <div 
        className="absolute inset-0 bg-opux-vignette"
        style={{ transform: 'translateZ(0)' }}
      />
    </div>
  );
});

export { AppBackground };
