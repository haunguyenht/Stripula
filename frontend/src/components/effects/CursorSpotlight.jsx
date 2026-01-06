import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/motion';

/**
 * CursorSpotlight - Cursor-following radial gradient spotlight effect
 * 
 * Creates an immersive lighting effect that follows the cursor position.
 * Uses CSS custom properties for smooth tracking without React re-renders.
 * 
 * @param {string} className - Additional CSS classes
 * @param {string} color - Spotlight color (CSS color value)
 * @param {number} size - Spotlight size in pixels
 * @param {number} opacity - Spotlight opacity (0-1)
 * @param {boolean} breathe - Enable breathing animation
 */
const CursorSpotlight = memo(function CursorSpotlight({
  className,
  color = 'rgba(255, 120, 50, 0.15)',
  darkColor = 'rgba(100, 180, 255, 0.12)',
  size = 600,
  opacity = 0.2,
  breathe = true,
}) {
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = prefersReducedMotion();

  const handleMouseMove = useCallback((e) => {
    if (reducedMotion || !containerRef.current) return;
    
    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    // Use RAF to batch DOM updates, but update CSS variables directly (no React state)
    rafRef.current = requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.style.setProperty('--spotlight-x', `${e.clientX}px`);
        containerRef.current.style.setProperty('--spotlight-y', `${e.clientY}px`);
      }
    });
    
    if (!isVisible) setIsVisible(true);
  }, [reducedMotion, isVisible]);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!reducedMotion) {
      setIsVisible(true);
    }
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseenter', handleMouseEnter);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleMouseMove, handleMouseLeave, handleMouseEnter, reducedMotion]);

  if (reducedMotion) return null;

  const halfSize = size / 2;

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 pointer-events-none z-0 transition-opacity duration-500",
        breathe && "animate-spotlight-breathe",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
      style={{
        '--spotlight-x': '50vw',
        '--spotlight-y': '50vh',
      }}
      aria-hidden="true"
    >
      {/* Light mode spotlight - uses CSS variables for position */}
      <div
        className="absolute dark:hidden will-change-transform"
        style={{
          left: `calc(var(--spotlight-x) - ${halfSize}px)`,
          top: `calc(var(--spotlight-y) - ${halfSize}px)`,
          width: size,
          height: size,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          opacity: opacity,
          transform: 'translateZ(0)',
        }}
      />
      
      {/* Dark mode spotlight - uses CSS variables for position */}
      <div
        className="absolute hidden dark:block will-change-transform"
        style={{
          left: `calc(var(--spotlight-x) - ${halfSize}px)`,
          top: `calc(var(--spotlight-y) - ${halfSize}px)`,
          width: size,
          height: size,
          background: `radial-gradient(circle, ${darkColor} 0%, transparent 70%)`,
          opacity: opacity,
          transform: 'translateZ(0)',
        }}
      />
    </div>
  );
});

export { CursorSpotlight };
export default CursorSpotlight;
