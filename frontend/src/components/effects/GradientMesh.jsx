import { memo } from 'react';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/motion';

/**
 * GradientMesh - Animated gradient mesh background for light mode
 * 
 * Creates a beautiful, organic-looking background with morphing gradient orbs.
 * Uses pure CSS animations for optimal performance.
 * 
 * Design: OrangeAI warm palette with coral, orange, purple, and pink tones
 */
const GradientMesh = memo(function GradientMesh({ className }) {
  const reducedMotion = prefersReducedMotion();

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden dark:hidden",
        className
      )}
      aria-hidden="true"
    >
      {/* Base gradient layer */}
      <div
        className={cn(
          "absolute inset-0",
          !reducedMotion && "animate-gradient-mesh"
        )}
        style={{
          background: `
            linear-gradient(
              135deg,
              rgba(255, 237, 230, 1) 0%,
              rgba(255, 245, 240, 1) 25%,
              rgba(250, 240, 255, 1) 50%,
              rgba(255, 248, 245, 1) 75%,
              rgba(255, 237, 230, 1) 100%
            )
          `,
          backgroundSize: '400% 400%',
        }}
      />

      {/* Orb 1 - Top left, warm coral */}
      <div
        className={cn(
          "absolute -top-[20%] -left-[10%] w-[60%] h-[60%]",
          !reducedMotion && "animate-orb-1"
        )}
        style={{
          background: 'radial-gradient(circle, rgba(255, 150, 100, 0.4) 0%, rgba(255, 180, 130, 0.2) 40%, transparent 70%)',
          filter: 'blur(60px)',
          transform: 'translateZ(0)',
        }}
      />

      {/* Orb 2 - Bottom right, soft purple */}
      <div
        className={cn(
          "absolute -bottom-[15%] -right-[15%] w-[55%] h-[55%]",
          !reducedMotion && "animate-orb-2"
        )}
        style={{
          background: 'radial-gradient(circle, rgba(200, 150, 255, 0.35) 0%, rgba(180, 130, 255, 0.15) 40%, transparent 70%)',
          filter: 'blur(70px)',
          transform: 'translateZ(0)',
        }}
      />

      {/* Orb 3 - Center, vibrant orange */}
      <div
        className={cn(
          "absolute top-[30%] left-[40%] w-[40%] h-[40%]",
          !reducedMotion && "animate-orb-3"
        )}
        style={{
          background: 'radial-gradient(circle, rgba(255, 100, 50, 0.25) 0%, rgba(255, 130, 80, 0.1) 50%, transparent 70%)',
          filter: 'blur(50px)',
          transform: 'translateZ(0)',
        }}
      />

      {/* Orb 4 - Top right, soft pink */}
      <div
        className={cn(
          "absolute -top-[10%] right-[10%] w-[45%] h-[45%]",
          !reducedMotion && "animate-orb-2"
        )}
        style={{
          background: 'radial-gradient(circle, rgba(255, 180, 200, 0.3) 0%, rgba(255, 200, 220, 0.15) 40%, transparent 70%)',
          filter: 'blur(55px)',
          transform: 'translateZ(0)',
          animationDelay: '-5s',
        }}
      />

      {/* Orb 5 - Bottom left, warm yellow-orange */}
      <div
        className={cn(
          "absolute bottom-[10%] -left-[5%] w-[35%] h-[35%]",
          !reducedMotion && "animate-orb-1"
        )}
        style={{
          background: 'radial-gradient(circle, rgba(255, 200, 100, 0.3) 0%, rgba(255, 220, 150, 0.15) 40%, transparent 70%)',
          filter: 'blur(45px)',
          transform: 'translateZ(0)',
          animationDelay: '-8s',
        }}
      />

      {/* Subtle noise overlay for texture */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'var(--noise-pattern-subtle)',
          backgroundSize: '256px 256px',
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  );
});

export { GradientMesh };
export default GradientMesh;
