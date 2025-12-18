import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

const COLORS = [
  '#E8836B', // coral
  '#FF6B9D', // pink
  '#10B981', // emerald
  '#F59E0B', // amber
  '#0EA5E9', // sky
  '#8B5CF6', // purple
  '#F43F5E', // rose
];

// Throttle interval in ms - prevents celebration spam during mass checks
const THROTTLE_INTERVAL = 2000;

// Reduced particle counts for better performance during mass checks
const PARTICLE_COUNT = 12; // Was 20 per burst point
const CONFETTI_COUNT = 25; // Was 50
const SPARKLE_COUNT = 15; // Was 30

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function Particle({ x, y, color, delay }) {
  const angle = randomBetween(0, Math.PI * 2);
  const distance = randomBetween(50, 150);
  const tx = Math.cos(angle) * distance;
  const ty = Math.sin(angle) * distance;

  return (
    <div
      className="firework-particle"
      style={{
        left: x,
        top: y,
        background: color,
        '--tx': `${tx}px`,
        '--ty': `${ty}px`,
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

function Confetti({ x, color, delay }) {
  const shapes = ['square', 'circle', 'triangle'];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  
  return (
    <div
      className="confetti"
      style={{
        left: x,
        top: -10,
        background: shape !== 'triangle' ? color : 'transparent',
        borderRadius: shape === 'circle' ? '50%' : '2px',
        borderLeft: shape === 'triangle' ? '5px solid transparent' : 'none',
        borderRight: shape === 'triangle' ? '5px solid transparent' : 'none',
        borderBottom: shape === 'triangle' ? `10px solid ${color}` : 'none',
        animationDelay: `${delay}ms`,
        animationDuration: `${randomBetween(2, 4)}s`,
      }}
    />
  );
}

function Sparkle({ x, y, delay }) {
  return (
    <div
      className="sparkle"
      style={{
        left: x,
        top: y,
        animationDelay: `${delay}ms`,
        boxShadow: `0 0 6px 2px ${COLORS[Math.floor(Math.random() * COLORS.length)]}`,
      }}
    />
  );
}

function RingExplosion({ x, y, delay }) {
  return (
    <div
      className="ring-explosion"
      style={{
        left: x,
        top: y,
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

export function Celebration({ trigger, duration = 3000 }) {
  const [particles, setParticles] = useState([]);
  const [confetti, setConfetti] = useState([]);
  const [sparkles, setSparkles] = useState([]);
  const [rings, setRings] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const lastTriggerRef = useRef(0);
  const timeoutRef = useRef(null);

  const createCelebration = useCallback(() => {
    // Throttle: skip if triggered too recently
    const now = Date.now();
    if (now - lastTriggerRef.current < THROTTLE_INTERVAL) {
      return;
    }
    lastTriggerRef.current = now;

    // Clear any pending cleanup
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Create firework particles at multiple points (reduced count)
    const newParticles = [];
    const burstPoints = [
      { x: centerX, y: centerY - 100 },
      { x: centerX - 150, y: centerY },
      { x: centerX + 150, y: centerY },
    ];

    burstPoints.forEach((point, burstIndex) => {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        newParticles.push({
          id: `particle-${burstIndex}-${i}`,
          x: point.x,
          y: point.y,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          delay: burstIndex * 200,
        });
      }
    });

    // Create confetti falling from top (reduced count)
    const newConfetti = [];
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      newConfetti.push({
        id: `confetti-${i}`,
        x: randomBetween(0, window.innerWidth),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: randomBetween(0, 500),
      });
    }

    // Create sparkles around the screen (reduced count)
    const newSparkles = [];
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      newSparkles.push({
        id: `sparkle-${i}`,
        x: randomBetween(100, window.innerWidth - 100),
        y: randomBetween(100, window.innerHeight - 100),
        delay: randomBetween(0, 800),
      });
    }

    // Create ring explosions
    const newRings = burstPoints.map((point, i) => ({
      id: `ring-${i}`,
      x: point.x,
      y: point.y,
      delay: i * 150,
    }));

    setParticles(newParticles);
    setConfetti(newConfetti);
    setSparkles(newSparkles);
    setRings(newRings);
    setIsActive(true);

    // Clear after duration
    timeoutRef.current = setTimeout(() => {
      setIsActive(false);
      setParticles([]);
      setConfetti([]);
      setSparkles([]);
      setRings([]);
    }, duration);
  }, [duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (trigger > 0) {
      createCelebration();
    }
  }, [trigger, createCelebration]);

  if (!isActive) return null;

  return createPortal(
    <div className="firework-container">
      {rings.map((ring) => (
        <RingExplosion key={ring.id} {...ring} />
      ))}
      {particles.map((particle) => (
        <Particle key={particle.id} {...particle} />
      ))}
      {confetti.map((c) => (
        <Confetti key={c.id} {...c} />
      ))}
      {sparkles.map((sparkle) => (
        <Sparkle key={sparkle.id} {...sparkle} />
      ))}
    </div>,
    document.body
  );
}

/**
 * useCelebration hook with built-in throttling
 * Prevents celebration spam during mass card validation
 */
export function useCelebration() {
  const [trigger, setTrigger] = useState(0);
  const lastCelebrateRef = useRef(0);

  const celebrate = useCallback(() => {
    // Additional throttle at hook level for extra safety
    const now = Date.now();
    if (now - lastCelebrateRef.current < THROTTLE_INTERVAL) {
      return;
    }
    lastCelebrateRef.current = now;
    setTrigger((prev) => prev + 1);
  }, []);

  return { trigger, celebrate };
}
