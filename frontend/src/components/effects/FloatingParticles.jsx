import { useState, useEffect, useMemo, memo } from 'react';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/motion';

/**
 * FloatingParticles - Floating particles with parallax depth effect
 * 
 * Creates an immersive starfield/particle effect for dark mode.
 * Particles have varying sizes, colors, and animation speeds for depth.
 * Includes aurora wave overlays for extra visual interest.
 * 
 * @param {number} count - Number of particles to render
 * @param {boolean} showAurora - Show aurora wave effects
 */
const FloatingParticles = memo(function FloatingParticles({
  count = 30,
  showAurora = true,
  className,
}) {
  const reducedMotion = prefersReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay visibility for entrance effect
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Generate particles with random properties
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const size = Math.random() * 3 + 1; // 1-4px
      const depth = Math.random(); // 0-1, affects speed and opacity
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = 4 + Math.random() * 4 + (1 - depth) * 3; // Slower for "distant" particles
      
      // Color variations - blues, purples, teals, and some warm accents
      const colors = [
        'rgba(100, 180, 255, 0.8)',  // Blue
        'rgba(150, 130, 255, 0.7)',  // Purple
        'rgba(80, 200, 200, 0.75)',  // Teal
        'rgba(255, 150, 100, 0.6)',  // Warm coral (accent)
        'rgba(200, 180, 255, 0.65)', // Lavender
        'rgba(100, 220, 180, 0.7)',  // Mint
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      return {
        id: i,
        size,
        depth,
        x,
        y,
        delay,
        duration,
        color,
        isTwinkle: Math.random() > 0.7, // 30% chance to twinkle
      };
    });
  }, [count]);

  if (reducedMotion) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden hidden dark:block",
        "transition-opacity duration-1000",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
      aria-hidden="true"
    >
      {/* Aurora waves */}
      {showAurora && (
        <>
          {/* Aurora wave 1 - Blue/Purple */}
          <div
            className="absolute inset-0 animate-aurora"
            style={{
              background: `
                linear-gradient(
                  180deg,
                  transparent 0%,
                  rgba(60, 100, 180, 0.08) 30%,
                  rgba(100, 80, 200, 0.12) 50%,
                  rgba(60, 100, 180, 0.08) 70%,
                  transparent 100%
                )
              `,
              transform: 'translateZ(0)',
            }}
          />
          
          {/* Aurora wave 2 - Teal/Cyan */}
          <div
            className="absolute inset-0 animate-aurora-2"
            style={{
              background: `
                linear-gradient(
                  180deg,
                  transparent 0%,
                  rgba(50, 180, 180, 0.06) 40%,
                  rgba(80, 150, 200, 0.1) 60%,
                  transparent 100%
                )
              `,
              transform: 'translateZ(0)',
            }}
          />
          
          {/* Aurora wave 3 - Subtle pink accent */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(
                  ellipse 80% 50% at 70% 80%,
                  rgba(180, 100, 150, 0.08) 0%,
                  transparent 60%
                )
              `,
              animation: 'aurora-wave 12s ease-in-out infinite reverse',
              transform: 'translateZ(0)',
            }}
          />
        </>
      )}

      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={cn(
            "absolute rounded-full",
            particle.isTwinkle ? "animate-twinkle" : "animate-particle"
          )}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: 0.3 + particle.depth * 0.5,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            transform: 'translateZ(0)',
          }}
        />
      ))}

      {/* Larger glow orbs for depth */}
      <div
        className="absolute top-[20%] left-[15%] w-32 h-32 rounded-full animate-orb-1"
        style={{
          background: 'radial-gradient(circle, rgba(100, 150, 255, 0.15) 0%, transparent 70%)',
          filter: 'blur(30px)',
          transform: 'translateZ(0)',
        }}
      />
      <div
        className="absolute bottom-[30%] right-[20%] w-40 h-40 rounded-full animate-orb-2"
        style={{
          background: 'radial-gradient(circle, rgba(150, 100, 200, 0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
          transform: 'translateZ(0)',
        }}
      />
      <div
        className="absolute top-[60%] left-[60%] w-24 h-24 rounded-full animate-orb-3"
        style={{
          background: 'radial-gradient(circle, rgba(80, 180, 180, 0.1) 0%, transparent 70%)',
          filter: 'blur(25px)',
          transform: 'translateZ(0)',
        }}
      />
    </div>
  );
});

export { FloatingParticles };
export default FloatingParticles;
