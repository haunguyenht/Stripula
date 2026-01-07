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
  // DARK MODE: Cyberpunk Premium Background (Optimized)
  // Based on Material Design dark theme best practices
  // Base: ~8% lightness for better readability
  // ============================================
  return (
    <div 
      className={cn(
        "fixed inset-0 -z-10 overflow-hidden",
        className
      )}
      aria-hidden="true"
      style={{
        // Optimized base: #121212 equivalent with blue-violet tint
        // 8% lightness instead of 5% for better contrast
        background: `
          linear-gradient(180deg, 
            hsl(230, 18%, 9%) 0%, 
            hsl(235, 16%, 8%) 50%,
            hsl(240, 14%, 7%) 100%
          )
        `,
      }}
    >
      {/* Layer 1: Subtle grid pattern - more visible */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 30%, transparent 75%)',
        }}
      />

      {/* Layer 2: Center ambient light - key for visibility */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[80%] pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 50% 45%, rgba(100, 180, 255, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 80% 70% at 50% 50%, rgba(139, 92, 246, 0.05) 0%, transparent 60%)
          `,
          filter: 'blur(60px)',
        }}
      />

      {/* Layer 3: Neon glow - Cyan (top-right) - increased intensity */}
      <div 
        className="absolute -top-[10%] -right-[5%] w-[50%] h-[50%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 255, 255, 0.18) 0%, rgba(0, 200, 255, 0.08) 35%, transparent 60%)',
          filter: 'blur(70px)',
        }}
      />

      {/* Layer 4: Neon glow - Magenta (bottom-left) - increased intensity */}
      <div 
        className="absolute -bottom-[15%] -left-[5%] w-[45%] h-[50%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255, 0, 128, 0.15) 0%, rgba(200, 0, 100, 0.06) 40%, transparent 60%)',
          filter: 'blur(65px)',
        }}
      />

      {/* Layer 5: Violet accent (top-left) */}
      <div 
        className="absolute -top-[5%] -left-[5%] w-[40%] h-[40%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.12) 0%, rgba(124, 58, 237, 0.04) 45%, transparent 65%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Layer 6: Electric blue accent (bottom-right) */}
      <div 
        className="absolute bottom-[10%] -right-[5%] w-[35%] h-[40%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.12) 0%, transparent 55%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Layer 7: Subtle scan lines - reduced opacity */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(0, 0, 0, 0.015) 3px,
            rgba(0, 0, 0, 0.015) 4px
          )`,
        }}
      />

      {/* Layer 8: Grainy texture overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-opux-grainy pointer-events-none",
          "transition-opacity duration-500 ease-out",
          isVisible && grainyLoaded ? "opacity-15" : "opacity-0"
        )}
        style={{ mixBlendMode: 'overlay' }}
      />

      {/* Layer 9: Top edge glow - cyan accent */}
      <div 
        className="absolute inset-x-0 top-0 h-[1px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, rgba(0, 255, 255, 0.2) 25%, rgba(0, 255, 255, 0.35) 50%, rgba(0, 255, 255, 0.2) 75%, transparent 95%)',
          boxShadow: '0 0 30px 3px rgba(0, 255, 255, 0.15), 0 0 60px 6px rgba(0, 255, 255, 0.08)',
        }}
      />

      {/* Layer 10: Top specular gradient - brighter */}
      <div 
        className="absolute inset-x-0 top-0 h-[40%] pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(100, 200, 255, 0.06) 0%, rgba(139, 92, 246, 0.03) 30%, transparent 100%)',
        }}
      />

      {/* Layer 11: Left edge accent - magenta */}
      <div 
        className="absolute inset-y-0 left-0 w-[1px] pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 15%, rgba(255, 0, 128, 0.2) 50%, transparent 85%)',
          boxShadow: '0 0 20px 2px rgba(255, 0, 128, 0.12)',
        }}
      />

      {/* Layer 12: Right edge accent - cyan */}
      <div 
        className="absolute inset-y-0 right-0 w-[1px] pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 25%, rgba(0, 255, 255, 0.15) 55%, transparent 85%)',
          boxShadow: '0 0 20px 2px rgba(0, 255, 255, 0.1)',
        }}
      />

      {/* Layer 13: Bottom depth gradient - softer */}
      <div 
        className="absolute inset-x-0 bottom-0 h-[25%] pointer-events-none"
        style={{
          background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.25) 0%, transparent 100%)',
        }}
      />

      {/* Layer 14: Corner accent glows - brighter */}
      <div 
        className="absolute top-0 right-0 w-[250px] h-[250px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 100% 0%, rgba(0, 255, 255, 0.1) 0%, transparent 55%)',
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-[250px] h-[250px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 0% 100%, rgba(255, 0, 128, 0.08) 0%, transparent 55%)',
        }}
      />

      {/* Layer 15: Vignette overlay - softer for better visibility */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          boxShadow: `
            inset 0 0 200px 60px hsl(235, 20%, 5%),
            inset 0 0 80px 20px hsl(240, 15%, 6%)
          `,
        }}
      />
    </div>
  );
});

export { AppBackground };
export default AppBackground;
