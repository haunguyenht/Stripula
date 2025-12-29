import { useState, useEffect, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/motion';

/**
 * CursorSpotlight - Cursor-following radial gradient spotlight effect
 * 
 * Creates an immersive lighting effect that follows the cursor position.
 * Uses requestAnimationFrame for smooth 60fps tracking.
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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = prefersReducedMotion();

  const handleMouseMove = useCallback((e) => {
    if (reducedMotion) return;
    
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    });
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
    };
  }, [handleMouseMove, handleMouseLeave, handleMouseEnter, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 pointer-events-none z-0 transition-opacity duration-500",
        breathe && "animate-spotlight-breathe",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
      aria-hidden="true"
    >
      {/* Light mode spotlight */}
      <div
        className="absolute dark:hidden"
        style={{
          left: position.x - size / 2,
          top: position.y - size / 2,
          width: size,
          height: size,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          opacity: opacity,
          transform: 'translateZ(0)',
          transition: 'left 0.15s ease-out, top 0.15s ease-out',
        }}
      />
      
      {/* Dark mode spotlight */}
      <div
        className="absolute hidden dark:block"
        style={{
          left: position.x - size / 2,
          top: position.y - size / 2,
          width: size,
          height: size,
          background: `radial-gradient(circle, ${darkColor} 0%, transparent 70%)`,
          opacity: opacity,
          transform: 'translateZ(0)',
          transition: 'left 0.15s ease-out, top 0.15s ease-out',
        }}
      />
    </div>
  );
});

export { CursorSpotlight };
export default CursorSpotlight;
