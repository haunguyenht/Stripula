import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useState, useEffect, useRef, memo, useMemo } from 'react';
import { motion } from 'motion/react';

// Generate floating dust motes for light mode (like aged paper)
const generateDustMotes = (count = 8) => {
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
  
  // Memoize dust motes for light mode
  const dustMotes = useMemo(() => generateDustMotes(8), []);

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
  // DARK MODE: Obsidian Nebula Background (Static CSS - No Lag)
  // ============================================
  return (
    <div 
      className={cn(
        "fixed inset-0 -z-10 overflow-hidden",
        className
      )}
      aria-hidden="true"
      style={{
        // Rich gradient base - deep obsidian with purple/blue undertones
        background: `
          radial-gradient(ellipse 80% 50% at 20% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse 60% 80% at 80% 30%, rgba(34, 211, 238, 0.12) 0%, transparent 45%),
          radial-gradient(ellipse 70% 60% at 70% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
          radial-gradient(ellipse 50% 50% at 30% 70%, rgba(99, 102, 241, 0.12) 0%, transparent 45%),
          radial-gradient(ellipse 100% 100% at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 60%),
          linear-gradient(180deg, hsl(250, 30%, 8%) 0%, hsl(240, 25%, 6%) 50%, hsl(250, 20%, 5%) 100%)
        `,
      }}
    >
      {/* Layer 1: Subtle dot grid pattern */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(139, 92, 246, 0.2) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          opacity: 0.25,
        }}
      />

      {/* Layer 2: Mesh gradient overlay for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            conic-gradient(from 45deg at 25% 25%, rgba(139, 92, 246, 0.06) 0deg, transparent 90deg, rgba(34, 211, 238, 0.04) 180deg, transparent 270deg),
            conic-gradient(from 225deg at 75% 75%, rgba(236, 72, 153, 0.05) 0deg, transparent 90deg, rgba(99, 102, 241, 0.04) 180deg, transparent 270deg)
          `,
        }}
      />

      {/* Layer 3: Large aurora glow spots (static) */}
      <div 
        className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.08) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div 
        className="absolute -top-[10%] -right-[10%] w-[55%] h-[55%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(34, 211, 238, 0.18) 0%, rgba(6, 182, 212, 0.06) 45%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />
      <div 
        className="absolute -bottom-[15%] left-[20%] w-[50%] h-[50%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(236, 72, 153, 0.15) 0%, rgba(244, 114, 182, 0.05) 45%, transparent 70%)',
          filter: 'blur(65px)',
        }}
      />
      <div 
        className="absolute bottom-[10%] -right-[5%] w-[40%] h-[45%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.12) 0%, transparent 60%)',
          filter: 'blur(55px)',
        }}
      />

      {/* Layer 4: Center ambient glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[60%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.1) 0%, rgba(34, 211, 238, 0.05) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Layer 5: Grainy texture overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-opux-grainy pointer-events-none",
          "transition-opacity duration-500 ease-out",
          isVisible && grainyLoaded ? "opacity-25" : "opacity-0"
        )}
        style={{ mixBlendMode: 'overlay' }}
      />

      {/* Layer 6: Top specular gradient */}
      <div 
        className="absolute inset-x-0 top-0 h-[45%] pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, rgba(99, 102, 241, 0.04) 30%, transparent 100%)',
        }}
      />

      {/* Layer 7: Edge aurora accents */}
      <div 
        className="absolute inset-y-0 left-0 w-[12%] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.08) 0%, transparent 100%)',
        }}
      />
      <div 
        className="absolute inset-y-0 right-0 w-[12%] pointer-events-none"
        style={{
          background: 'linear-gradient(-90deg, rgba(34, 211, 238, 0.06) 0%, transparent 100%)',
        }}
      />

      {/* Layer 8: Bottom depth shadow */}
      <div 
        className="absolute inset-x-0 bottom-0 h-[25%] pointer-events-none"
        style={{
          background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0%, transparent 100%)',
        }}
      />

      {/* Layer 9: Vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          boxShadow: `
            inset 0 0 300px 100px hsl(250, 30%, 4%),
            inset 0 0 120px 40px hsl(240, 25%, 5%)
          `,
        }}
      />
    </div>
  );
});

export { AppBackground };
export default AppBackground;
