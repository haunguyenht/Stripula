import { useState, useCallback, useRef, useEffect } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

/**
 * useTiltEffect - 3D card tilt effect following cursor position
 * 
 * Creates an immersive 3D perspective effect where the card tilts
 * based on cursor position relative to the element's center.
 * 
 * @param {Object} options
 * @param {number} options.maxTilt - Maximum tilt angle in degrees (default: 10)
 * @param {number} options.scale - Scale on hover (default: 1.02)
 * @param {number} options.perspective - CSS perspective value (default: 1000)
 * @param {boolean} options.glare - Enable glare effect (default: true)
 * @param {number} options.glareOpacity - Glare opacity (default: 0.15)
 * @param {number} options.transitionSpeed - Transition speed in ms (default: 150)
 * 
 * @returns {Object} { ref, style, glareStyle, handlers }
 */
export function useTiltEffect({
  maxTilt = 10,
  scale = 1.02,
  perspective = 1000,
  glare = true,
  glareOpacity = 0.15,
  transitionSpeed = 150,
} = {}) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const reducedMotion = prefersReducedMotion();
  const rafRef = useRef(null);

  const calculateTilt = useCallback((e) => {
    if (!ref.current || reducedMotion) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate position relative to center (-1 to 1)
    const relativeX = (e.clientX - centerX) / (rect.width / 2);
    const relativeY = (e.clientY - centerY) / (rect.height / 2);
    
    // Clamp values
    const clampedX = Math.max(-1, Math.min(1, relativeX));
    const clampedY = Math.max(-1, Math.min(1, relativeY));
    
    // Calculate tilt (inverted for natural feel)
    const tiltX = clampedY * -maxTilt;
    const tiltY = clampedX * maxTilt;
    
    // Calculate glare position (0-100%)
    const glareX = ((clampedX + 1) / 2) * 100;
    const glareY = ((clampedY + 1) / 2) * 100;

    return { tiltX, tiltY, glareX, glareY };
  }, [maxTilt, reducedMotion]);

  const handleMouseMove = useCallback((e) => {
    if (reducedMotion) return;

    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Use requestAnimationFrame for smooth updates
    rafRef.current = requestAnimationFrame(() => {
      const result = calculateTilt(e);
      if (result) {
        setTilt({ x: result.tiltX, y: result.tiltY });
        setGlarePos({ x: result.glareX, y: result.glareY });
      }
    });
  }, [calculateTilt, reducedMotion]);

  const handleMouseEnter = useCallback(() => {
    if (!reducedMotion) {
      setIsHovering(true);
    }
  }, [reducedMotion]);

  const handleMouseLeave = useCallback(() => {
    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    setIsHovering(false);
    setTilt({ x: 0, y: 0 });
    setGlarePos({ x: 50, y: 50 });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // If reduced motion, return neutral values
  if (reducedMotion) {
    return {
      ref,
      style: {},
      glareStyle: { display: 'none' },
      handlers: {},
      isHovering: false,
    };
  }

  const style = {
    transform: isHovering
      ? `perspective(${perspective}px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${scale})`
      : `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`,
    transition: `transform ${transitionSpeed}ms ease-out`,
    transformStyle: 'preserve-3d',
  };

  const glareStyle = glare ? {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    borderRadius: 'inherit',
    background: `radial-gradient(
      circle at ${glarePos.x}% ${glarePos.y}%,
      rgba(255, 255, 255, ${isHovering ? glareOpacity : 0}) 0%,
      transparent 60%
    )`,
    transition: `opacity ${transitionSpeed}ms ease-out`,
    opacity: isHovering ? 1 : 0,
  } : { display: 'none' };

  const handlers = {
    onMouseMove: handleMouseMove,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };

  return {
    ref,
    style,
    glareStyle,
    handlers,
    isHovering,
  };
}

export default useTiltEffect;
