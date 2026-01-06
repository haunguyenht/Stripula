import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useState, useEffect, useRef, memo, useMemo } from 'react';
import { motion } from 'motion/react';

/**
 * AppBackground - Dual Theme Design System Background
 * 
 * LIGHT MODE: Vintage Banking / Treasury Certificate Aesthetic
 * Layers (bottom to top):
 * 1. Aged cream parchment base with warm gradient
 * 2. Guilloche security pattern - fine engraved lines like currency
 * 3. Watermark rosette - circular security mark like banknotes
 * 4. Decorative corner filigree elements
 * 5. Subtle copper/sepia vignette
 * 6. Paper fiber texture overlay
 * 
 * DARK MODE: Liquid Aurora Design System
 * Layers (bottom to top):
 * 1. Deep cosmic blue base (hsl(220 18% 7%))
 * 2. Tile pattern - subtle geometric texture
 * 3. Aurora nebula layer - multi-colored animated gradient blobs
 * 4. Floating aurora particles - subtle point lights
 * 5. Grainy texture overlay - film grain effect
 * 6. Top specular gradient - depth illusion
 * 7. Vignette - edge darkening for focus
 * 
 * Performance optimizations:
 * - Progressive loading for textures
 * - CSS containment for paint isolation
 * - GPU-accelerated layers with translateZ(0)
 * - Reduced motion support
 * - Memoized particle generation
 */

// Generate floating aurora particles with memoization (dark mode) - Enhanced for premium feel
const generateParticles = (count = 24) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 1.5,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 18 + 22,
    delay: Math.random() * 12,
    color: [
      'rgba(139, 92, 246, 0.5)',  // Indigo - richer
      'rgba(34, 211, 238, 0.4)',   // Cyan - richer
      'rgba(236, 72, 153, 0.45)', // Pink - richer
      'rgba(168, 85, 247, 0.45)', // Purple - new
    ][Math.floor(Math.random() * 4)],
    blur: Math.random() * 2.5 + 1.5,
  }));
};

// Generate floating dust motes for light mode (like aged paper)
const generateDustMotes = (count = 12) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 2 + 0.5,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 25 + 30,
    delay: Math.random() * 15,
    opacity: Math.random() * 0.15 + 0.05,
  }));
};

const AppBackground = memo(function AppBackground({ className }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [grainyLoaded, setGrainyLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const hasLoadedRef = useRef(false);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false
  );
  
  // Memoize particles/motes to prevent regeneration on re-renders - Enhanced counts
  const particles = useMemo(() => generateParticles(24), []);
  const dustMotes = useMemo(() => generateDustMotes(12), []);

  useEffect(() => {
    if (!isDark) {
      setIsVisible(true);
      return;
    }

    if (hasLoadedRef.current) {
      setIsVisible(true);
      return;
    }

    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
        
        if (img.complete) {
          resolve();
        } else {
          img.onload = resolve;
          img.onerror = resolve;
        }
      });
    };

    const loadImages = async () => {
      setIsVisible(true);
      
      await loadImage('/grainy-background-new.webp');
      setGrainyLoaded(true);
      hasLoadedRef.current = true;
    };

    loadImages();
  }, [isDark]);

  useEffect(() => {
    if (!isDark) {
      setIsVisible(true);
    } else {
      setGrainyLoaded(false);
      hasLoadedRef.current = false;
    }
  }, [isDark]);

  // ============================================
  // LIGHT MODE: Vintage Banking Background
  // ============================================
  if (!isDark) {
    return (
      <div 
        className={cn(
          "fixed inset-0 -z-10 overflow-hidden",
          className
        )}
        aria-hidden="true"
      >
        {/* Layer 1: Aged parchment base - warm cream gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 120% 80% at 30% 20%, hsl(42, 55%, 97%) 0%, transparent 50%),
              radial-gradient(ellipse 100% 60% at 80% 80%, hsl(35, 45%, 94%) 0%, transparent 40%),
              linear-gradient(175deg, 
                hsl(42, 52%, 97%) 0%, 
                hsl(40, 48%, 96%) 25%,
                hsl(38, 45%, 95%) 50%,
                hsl(36, 42%, 94%) 75%,
                hsl(34, 40%, 93%) 100%
              )
            `,
            transform: 'translateZ(0)',
          }}
        />

        {/* Layer 2: Guilloche security pattern - fine engraved lines */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 8px,
                hsl(30, 25%, 85%, 0.3) 8px,
                hsl(30, 25%, 85%, 0.3) 9px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 8px,
                hsl(30, 25%, 85%, 0.3) 8px,
                hsl(30, 25%, 85%, 0.3) 9px
              ),
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 20px,
                hsl(25, 35%, 80%, 0.08) 20px,
                hsl(25, 35%, 80%, 0.08) 21px
              ),
              repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 20px,
                hsl(25, 35%, 80%, 0.08) 20px,
                hsl(25, 35%, 80%, 0.08) 21px
              )
            `,
            opacity: 0.6,
            transform: 'translateZ(0)',
          }}
        />

        {/* Layer 3: Central watermark rosette - like banknote security mark */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: '60vw',
            height: '60vw',
            maxWidth: '600px',
            maxHeight: '600px',
            background: `
              repeating-conic-gradient(
                from 0deg at 50% 50%,
                transparent 0deg 15deg,
                hsl(30, 30%, 88%, 0.04) 15deg 30deg
              ),
              radial-gradient(
                circle at 50% 50%,
                transparent 20%,
                hsl(30, 35%, 85%, 0.06) 35%,
                transparent 50%,
                hsl(30, 30%, 88%, 0.04) 65%,
                transparent 80%
              )
            `,
            transform: 'translateZ(0)',
            opacity: 0.8,
          }}
        />

        {/* Layer 4: Decorative corner filigree elements */}
        {/* Top-left corner ornament */}
        <div 
          className="absolute top-0 left-0 w-48 h-48 pointer-events-none"
          style={{
            background: `
              linear-gradient(135deg, hsl(25, 50%, 60%, 0.08) 0%, transparent 60%),
              radial-gradient(ellipse 80% 80% at 0% 0%, hsl(30, 40%, 75%, 0.12) 0%, transparent 50%)
            `,
            transform: 'translateZ(0)',
          }}
        />
        {/* Top-right corner ornament */}
        <div 
          className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
          style={{
            background: `
              linear-gradient(-135deg, hsl(25, 50%, 60%, 0.08) 0%, transparent 60%),
              radial-gradient(ellipse 80% 80% at 100% 0%, hsl(30, 40%, 75%, 0.12) 0%, transparent 50%)
            `,
            transform: 'translateZ(0)',
          }}
        />
        {/* Bottom-left corner ornament */}
        <div 
          className="absolute bottom-0 left-0 w-48 h-48 pointer-events-none"
          style={{
            background: `
              linear-gradient(45deg, hsl(25, 50%, 60%, 0.08) 0%, transparent 60%),
              radial-gradient(ellipse 80% 80% at 0% 100%, hsl(30, 40%, 75%, 0.12) 0%, transparent 50%)
            `,
            transform: 'translateZ(0)',
          }}
        />
        {/* Bottom-right corner ornament */}
        <div 
          className="absolute bottom-0 right-0 w-48 h-48 pointer-events-none"
          style={{
            background: `
              linear-gradient(-45deg, hsl(25, 50%, 60%, 0.08) 0%, transparent 60%),
              radial-gradient(ellipse 80% 80% at 100% 100%, hsl(30, 40%, 75%, 0.12) 0%, transparent 50%)
            `,
            transform: 'translateZ(0)',
          }}
        />

        {/* Layer 5: Subtle floating copper accent orbs */}
        {!prefersReducedMotion.current && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%]"
              style={{
                background: 'radial-gradient(ellipse at center, hsl(28, 55%, 70%, 0.08) 0%, transparent 60%)',
                filter: 'blur(60px)',
              }}
              animate={{
                x: [0, 30, 10, 0],
                y: [0, 20, -10, 0],
                scale: [1, 1.05, 1.02, 1],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute -bottom-[10%] -right-[5%] w-[35%] h-[35%]"
              style={{
                background: 'radial-gradient(ellipse at center, hsl(25, 50%, 65%, 0.06) 0%, transparent 60%)',
                filter: 'blur(50px)',
              }}
              animate={{
                x: [0, -25, -10, 0],
                y: [0, -20, 10, 0],
                scale: [1, 1.08, 1, 1],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 5,
              }}
            />
          </div>
        )}

        {/* Layer 6: Floating dust motes - aged paper effect */}
        {!prefersReducedMotion.current && (
          <div 
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ transform: 'translateZ(0)' }}
          >
            {dustMotes.map((mote) => (
              <motion.div
                key={mote.id}
                className="absolute rounded-full bg-[hsl(30,35%,60%)]"
                style={{
                  width: mote.size,
                  height: mote.size,
                  left: `${mote.x}%`,
                  top: `${mote.y}%`,
                  opacity: mote.opacity,
                }}
                animate={{
                  y: [0, -20, -10, 0],
                  x: [0, 8, -5, 0],
                  opacity: [mote.opacity, mote.opacity * 1.5, mote.opacity * 0.8, mote.opacity],
                }}
                transition={{
                  duration: mote.duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: mote.delay,
                }}
              />
            ))}
          </div>
        )}

        {/* Layer 7: Paper fiber texture overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: 0.03,
            mixBlendMode: 'multiply',
            transform: 'translateZ(0)',
          }}
        />

        {/* Layer 8: Copper/sepia vignette */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            boxShadow: `
              inset 0 0 200px 80px hsl(38, 45%, 96%, 0.4),
              inset 0 0 100px 40px hsl(30, 35%, 90%, 0.2)
            `,
            transform: 'translateZ(0)',
          }}
        />

        {/* Layer 9: Subtle top warm gradient */}
        <div 
          className="absolute inset-x-0 top-0 h-[30%] pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, hsl(40, 50%, 98%, 0.6) 0%, transparent 100%)',
            transform: 'translateZ(0)',
          }}
        />

        {/* Layer 10: Bottom edge shadow for depth */}
        <div 
          className="absolute inset-x-0 bottom-0 h-[20%] pointer-events-none"
          style={{
            background: 'linear-gradient(0deg, hsl(30, 30%, 88%, 0.15) 0%, transparent 100%)',
            transform: 'translateZ(0)',
          }}
        />
      </div>
    );
  }

  // ============================================
  // DARK MODE: Liquid Aurora Background
  // ============================================
  return (
    <div 
      className={cn(
        "fixed inset-0 -z-10 overflow-hidden",
        "bg-[hsl(220_18%_7%)]",
        className
      )}
      aria-hidden="true"
    >
      {/* Layer 1: Base tile pattern */}
      <div 
        className="absolute inset-0 bg-opux-tile opacity-60"
        style={{ transform: 'translateZ(0)' }}
      />

      {/* Layer 2: Aurora nebula layer - PREMIUM enhanced animated gradient blobs */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ transform: 'translateZ(0)' }}
      >
        {/* Primary aurora blob - indigo/violet (top-left) - ENHANCED */}
        <motion.div
          className="absolute -top-[25%] -left-[15%] w-[70%] h-[70%]"
          style={{
            background: 'radial-gradient(ellipse 100% 80% at center, rgba(139, 92, 246, 0.25) 0%, rgba(124, 58, 237, 0.12) 35%, transparent 65%)',
            filter: 'blur(80px)',
          }}
          animate={prefersReducedMotion.current ? {} : {
            x: [0, 70, 25, 0],
            y: [0, 50, -25, 0],
            scale: [1, 1.1, 1.15, 1],
            rotate: [0, 6, -4, 0],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Secondary aurora blob - cyan/teal (top-right) - ENHANCED */}
        <motion.div
          className="absolute -top-[15%] -right-[10%] w-[60%] h-[60%]"
          style={{
            background: 'radial-gradient(ellipse 90% 100% at center, rgba(34, 211, 238, 0.22) 0%, rgba(6, 182, 212, 0.1) 40%, transparent 65%)',
            filter: 'blur(90px)',
          }}
          animate={prefersReducedMotion.current ? {} : {
            x: [0, -60, -25, 0],
            y: [0, 70, 35, 0],
            scale: [1, 1.15, 1.08, 1],
            rotate: [0, -10, 5, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3,
          }}
        />

        {/* Tertiary aurora blob - pink/rose (bottom) - ENHANCED */}
        <motion.div
          className="absolute -bottom-[20%] left-[15%] w-[55%] h-[55%]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(236, 72, 153, 0.18) 0%, rgba(244, 114, 182, 0.08) 40%, transparent 65%)',
            filter: 'blur(85px)',
          }}
          animate={prefersReducedMotion.current ? {} : {
            x: [0, 80, 35, 0],
            y: [0, -60, -25, 0],
            scale: [1, 1.18, 1.1, 1],
            rotate: [0, 8, -5, 0],
          }}
          transition={{
            duration: 26,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 5,
          }}
        />

        {/* Quaternary aurora blob - mixed indigo-cyan (center-right) - ENHANCED */}
        <motion.div
          className="absolute top-[25%] right-[5%] w-[45%] h-[50%]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.15) 0%, rgba(34, 211, 238, 0.1) 50%, transparent 70%)',
            filter: 'blur(100px)',
          }}
          animate={prefersReducedMotion.current ? {} : {
            x: [0, -50, 25, 0],
            y: [0, 40, -50, 0],
            opacity: [0.75, 1, 0.85, 0.75],
            scale: [1, 1.12, 0.95, 1],
          }}
          transition={{
            duration: 34,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />

        {/* NEW: Fifth aurora blob - purple accent (bottom-right) */}
        <motion.div
          className="absolute -bottom-[10%] -right-[10%] w-[45%] h-[45%]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.15) 0%, rgba(139, 92, 246, 0.06) 45%, transparent 70%)',
            filter: 'blur(75px)',
          }}
          animate={prefersReducedMotion.current ? {} : {
            x: [0, -40, -15, 0],
            y: [0, -35, 15, 0],
            scale: [1, 1.1, 1.05, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 7,
          }}
        />

        {/* Ambient center glow - subtle breathing - ENHANCED */}
        <motion.div
          className="absolute top-[30%] left-[25%] w-[50%] h-[45%]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.1) 0%, rgba(34, 211, 238, 0.06) 40%, transparent 70%)',
            filter: 'blur(120px)',
          }}
          animate={prefersReducedMotion.current ? {} : {
            opacity: [0.6, 0.9, 0.7, 0.6],
            scale: [1, 1.08, 0.96, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
      </div>

      {/* Layer 3: Floating aurora particles */}
      {!prefersReducedMotion.current && (
        <div 
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ transform: 'translateZ(0)' }}
        >
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                background: particle.color,
                filter: `blur(${particle.blur}px)`,
                boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`,
              }}
              animate={{
                y: [0, -30, -15, 0],
                x: [0, 15, -10, 0],
                opacity: [0.3, 0.7, 0.5, 0.3],
                scale: [1, 1.2, 0.9, 1],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: particle.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* Layer 4: Grainy texture overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-opux-grainy",
          "transition-opacity duration-500 ease-out",
          isVisible && grainyLoaded ? "opacity-30" : "opacity-0"
        )}
        style={{ 
          transform: 'translateZ(0)',
          mixBlendMode: 'overlay'
        }}
      />

      {/* Layer 5: Top specular gradient - PREMIUM enhanced aurora tint */}
      <div 
        className="absolute inset-x-0 top-0 h-[50%]"
        style={{
          background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.06) 0%, rgba(34, 211, 238, 0.03) 35%, transparent 100%)',
          transform: 'translateZ(0)',
        }}
      />

      {/* Layer 6: Bottom subtle depth - very subtle, no bright glow */}
      <div 
        className="absolute inset-x-0 bottom-0 h-[25%]"
        style={{
          background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.15) 0%, transparent 100%)',
          transform: 'translateZ(0)',
        }}
      />

      {/* Layer 7: Vignette overlay - PREMIUM deeper depth */}
      <div 
        className="absolute inset-0"
        style={{ 
          boxShadow: 'inset 0 0 300px 120px hsl(222 20% 4% / 0.6), inset 0 0 120px 50px hsl(222 20% 4% / 0.35)',
          transform: 'translateZ(0)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
});

export { AppBackground };
export default AppBackground;
