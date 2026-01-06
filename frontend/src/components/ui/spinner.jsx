import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Spinner Component - Dual Theme Loading Indicators
 * 
 * LIGHT MODE: Vintage Banking - Copper Coin/Seal Aesthetic
 * - Copper coin with embossed details
 * - Wax seal rotating effects
 * - Aged metallic patina
 * 
 * DARK MODE: Liquid Aurora
 * - Electric indigo/cyan with neon glow
 * - Morphing aurora blobs
 */

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
  '2xl': 'h-16 w-16',
};

const sizeScale = {
  xs: 0.4, sm: 0.5, md: 0.75, lg: 1, xl: 1.5, '2xl': 2,
};

// ============================================
// MERCURY VARIANT - Morphing blob
// Light: Vintage copper/sepia | Dark: Chrome silver
// ============================================
function MercurySpinner({ size = 'md', className }) {
  const scale = sizeScale[size];
  
  return (
    <div 
      className={cn('relative flex items-center justify-center', sizeClasses[size], className)}
      style={{ transform: `scale(${scale})` }}
    >
      <svg viewBox="0 0 48 48" className="w-12 h-12">
        <defs>
          {/* Light theme: vintage copper/sepia gradient */}
          <linearGradient id="mercury-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b4784a" />
            <stop offset="25%" stopColor="#9c6640" />
            <stop offset="50%" stopColor="#c48c5c" />
            <stop offset="75%" stopColor="#b4784a" />
            <stop offset="100%" stopColor="#8b5a2b" />
          </linearGradient>
          {/* Dark theme: aurora indigo/cyan gradient */}
          <linearGradient id="mercury-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="25%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="75%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <filter id="mercury-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        <motion.path
          className="fill-[url(#mercury-light)] dark:fill-[url(#mercury-dark)]"
          filter="url(#mercury-glow)"
          animate={{
            d: [
              "M24 8 C32 8, 40 16, 40 24 C40 32, 32 40, 24 40 C16 40, 8 32, 8 24 C8 16, 16 8, 24 8",
              "M24 6 C35 10, 42 18, 40 26 C38 36, 28 42, 20 40 C10 38, 6 28, 8 20 C10 12, 18 6, 24 6",
              "M24 10 C30 6, 42 14, 38 24 C36 34, 26 44, 18 38 C8 32, 6 20, 14 12 C18 8, 20 10, 24 10",
              "M24 8 C32 8, 40 16, 40 24 C40 32, 32 40, 24 40 C16 40, 8 32, 8 24 C8 16, 16 8, 24 8",
            ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Highlight reflection */}
        <motion.ellipse
          cx="20"
          cy="18"
          rx="6"
          ry="4"
          className="fill-white/70 dark:fill-white/30"
          animate={{
            cx: [20, 22, 18, 20],
            cy: [18, 20, 16, 18],
            rx: [6, 5, 7, 6],
            ry: [4, 3, 5, 4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </svg>
    </div>
  );
}

// ============================================
// PRISM VARIANT - Rotating glass prism
// Light: Vintage sepia/copper tones | Dark: Cool rainbow
// ============================================
function PrismSpinner({ size = 'md', className }) {
  const scale = sizeScale[size];
  
  return (
    <div 
      className={cn('relative flex items-center justify-center', sizeClasses[size], className)}
      style={{ transform: `scale(${scale})`, perspective: '150px' }}
    >
      <motion.div
        className="relative w-10 h-10"
        animate={{ rotateY: 360 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Prism faces - vintage copper for light, cool for dark */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className={cn(
              'absolute inset-0 border backdrop-blur-sm',
              'bg-gradient-to-br',
              // Light: vintage copper/sepia tones
              i === 0 && 'from-[#c49a6c]/50 to-[#a67c52]/40 border-[#b4784a]/60 dark:from-rose-500/20 dark:to-purple-600/20 dark:border-rose-400/30',
              i === 1 && 'from-[#d4a574]/50 to-[#c49a6c]/40 border-[#c48c5c]/60 dark:from-amber-500/20 dark:to-rose-600/20 dark:border-amber-400/30',
              i === 2 && 'from-[#e8c99b]/50 to-[#d4a574]/40 border-[#d4a574]/60 dark:from-cyan-500/20 dark:to-blue-600/20 dark:border-cyan-400/30',
              i === 3 && 'from-[#a67c52]/50 to-[#8b5a2b]/40 border-[#9c6640]/60 dark:from-emerald-500/20 dark:to-cyan-600/20 dark:border-emerald-400/30',
            )}
            style={{
              transform: `rotateY(${i * 90}deg) translateZ(20px)`,
              backfaceVisibility: 'visible',
            }}
          />
        ))}
        
        {/* Light beam through center */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <motion.div
            className="w-1 h-8 bg-gradient-to-b from-transparent via-[#b4784a]/80 to-transparent dark:via-white/50 rounded-full"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ============================================
// RIPPLE VARIANT - Concentric water ripples
// Light: Copper/sepia ripples | Dark: Aurora ripples
// ============================================
function RippleSpinner({ size = 'md', className }) {
  return (
    <div className={cn('relative flex items-center justify-center', sizeClasses[size], className)}>
      {/* Center droplet */}
      <motion.div
        className={cn(
          'absolute w-2 h-2 rounded-full z-10',
          'bg-gradient-to-br from-[#b4784a] to-[#8b5a2b]',
          'dark:from-violet-400 dark:to-cyan-400',
          'shadow-lg shadow-[#b4784a]/40 dark:shadow-violet-400/50'
        )}
        animate={{ 
          scale: [1, 0.8, 1],
          y: [0, -2, 0]
        }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Ripple rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(
            'absolute rounded-full',
            'border-2 border-[#b4784a]/60 dark:border-violet-400/50',
          )}
          style={{
            background: `radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 50%)`,
          }}
          initial={{ width: 8, height: 8, opacity: 0.8 }}
          animate={{
            width: [8, 48],
            height: [8, 48],
            opacity: [0.8, 0],
            borderWidth: [2, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// COIN VARIANT - Rotating copper coin/medallion
// Light: Premium copper coin with embossed details | Dark: Aurora ring
// ============================================
function CoinSpinner({ size = 'md', className }) {
  const scale = sizeScale[size];
  
  return (
    <div 
      className={cn('relative flex items-center justify-center', sizeClasses[size], className)}
      style={{ transform: `scale(${scale})`, perspective: '200px' }}
    >
      <motion.div
        className="relative w-12 h-12"
        animate={{ rotateY: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Coin front face - Copper with embossed center */}
        <div 
          className={cn(
            'absolute inset-0 rounded-full',
            'bg-gradient-to-br from-[hsl(28,75%,58%)] via-[hsl(25,72%,48%)] to-[hsl(22,68%,38%)]',
            'dark:from-violet-400 dark:via-indigo-500 dark:to-cyan-500',
            'shadow-[inset_0_2px_4px_rgba(255,200,150,0.5),inset_0_-2px_4px_rgba(100,50,20,0.3),0_4px_16px_rgba(166,100,50,0.4)]',
            'dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_0_20px_rgba(139,92,246,0.4)]',
          )}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Outer ring border */}
          <div className="absolute inset-1 rounded-full border-2 border-[hsl(30,60%,55%)]/50 dark:border-white/20" />
          
          {/* Inner embossed circle */}
          <div className="absolute inset-3 rounded-full border border-[hsl(30,60%,60%)]/40 dark:border-white/15 shadow-[inset_0_1px_2px_rgba(255,200,150,0.4)]" />
          
          {/* Center symbol - stylized S for banking */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className={cn(
                'text-lg font-bold',
                'text-[hsl(42,70%,85%)]',
                'dark:text-white/80',
                '[text-shadow:0_1px_0_rgba(100,50,20,0.4),0_-1px_0_rgba(255,200,150,0.3)]',
                'dark:[text-shadow:0_0_8px_rgba(255,255,255,0.5)]'
              )}
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              $
            </span>
          </div>
          
          {/* Highlight reflection */}
          <motion.div
            className="absolute top-1 left-1 w-4 h-4 rounded-full bg-gradient-to-br from-white/60 to-transparent dark:from-white/30"
            animate={{ opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
        
        {/* Coin back face - Slightly darker */}
        <div 
          className={cn(
            'absolute inset-0 rounded-full',
            'bg-gradient-to-br from-[hsl(25,70%,45%)] via-[hsl(22,68%,38%)] to-[hsl(20,65%,30%)]',
            'dark:from-indigo-500 dark:via-purple-600 dark:to-pink-500',
            'shadow-[inset_0_2px_4px_rgba(255,180,120,0.4),inset_0_-2px_4px_rgba(80,40,15,0.4),0_4px_16px_rgba(139,69,19,0.4)]',
            'dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),0_0_20px_rgba(236,72,153,0.4)]',
          )}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {/* Decorative pattern */}
          <div className="absolute inset-1 rounded-full border-2 border-[hsl(25,55%,48%)]/50 dark:border-white/20" />
          <div className="absolute inset-3 rounded-full border border-[hsl(25,50%,42%)]/40 dark:border-white/15" />
          
          {/* Guilloche-like pattern (simplified) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="w-6 h-6 rounded-full border border-[hsl(30,60%,60%)] dark:border-white/30" />
          </div>
        </div>
      </motion.div>
      
      {/* Subtle shadow beneath coin */}
      <motion.div
        className="absolute -bottom-1 w-10 h-2 rounded-full bg-[hsl(25,30%,20%)]/20 dark:bg-black/30 blur-sm"
        animate={{ scaleX: [0.8, 1, 0.8], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
}

// ============================================
// ORBITAL VARIANT - Floating spheres in orbit
// Light: Vintage copper/sepia | Dark: Aurora glow
// ============================================
function OrbitalSpinner({ size = 'md', className }) {
  const scale = sizeScale[size];
  
  return (
    <div 
      className={cn('relative flex items-center justify-center', sizeClasses[size], className)}
      style={{ transform: `scale(${scale})` }}
    >
      <div className="relative w-10 h-10">
        {/* Center nucleus */}
        <motion.div
          className={cn(
            'absolute top-1/2 left-1/2 w-3 h-3 -ml-1.5 -mt-1.5 rounded-full',
            'bg-gradient-to-br from-[#c49a6c] via-[#b4784a] to-[#8b5a2b]',
            'dark:from-violet-300 dark:via-violet-500 dark:to-cyan-500',
            'shadow-lg shadow-[#b4784a]/40 dark:shadow-violet-400/40'
          )}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-white/70" />
        </motion.div>
        
        {/* Orbiting spheres */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-full h-full -ml-5 -mt-5"
            animate={{ rotate: 360 }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.3,
            }}
            style={{ transform: `rotate(${i * 60}deg)` }}
          >
            <motion.div
              className={cn(
                'absolute w-2 h-2 rounded-full',
                'bg-gradient-to-br from-[#d4a574] via-[#b4784a] to-[#8b5a2b]',
                'dark:from-cyan-300 dark:via-violet-400 dark:to-pink-400',
                'shadow-md shadow-[#b4784a]/50 dark:shadow-violet-400/40'
              )}
              style={{ top: 0, left: '50%', marginLeft: -4 }}
              animate={{ scale: [0.8, 1.1, 0.8] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            >
              <div className="absolute top-0 left-0 w-1 h-0.5 rounded-full bg-white/80" />
            </motion.div>
          </motion.div>
        ))}
        
        {/* Orbital paths */}
        <div className="absolute inset-0 border border-[#c49a6c]/40 dark:border-violet-400/20 rounded-full" />
      </div>
    </div>
  );
}

// ============================================
// PULSE VARIANT - Breathing ring with gradient
// Light: Vintage copper/sepia | Dark: Cyan/purple aurora
// ============================================
function PulseSpinner({ size = 'md', className }) {
  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <svg viewBox="0 0 50 50" className="w-full h-full">
        <defs>
          {/* Light theme: vintage copper/sepia gradient */}
          <linearGradient id="pulse-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <motion.stop
              offset="0%"
              animate={{ stopColor: ['#b4784a', '#c49a6c', '#a67c52', '#b4784a'] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.stop
              offset="50%"
              animate={{ stopColor: ['#c49a6c', '#d4a574', '#c49a6c', '#c49a6c'] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.stop
              offset="100%"
              animate={{ stopColor: ['#8b5a2b', '#9c6640', '#8b5a2b', '#8b5a2b'] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </linearGradient>
          {/* Dark theme: liquid aurora gradient - indigo/cyan/pink */}
          <linearGradient id="pulse-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <motion.stop
              offset="0%"
              animate={{ stopColor: ['#8b5cf6', '#22d3ee', '#ec4899', '#8b5cf6'] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.stop
              offset="50%"
              animate={{ stopColor: ['#a78bfa', '#67e8f9', '#f472b6', '#a78bfa'] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.stop
              offset="100%"
              animate={{ stopColor: ['#7c3aed', '#06b6d4', '#db2777', '#7c3aed'] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </linearGradient>
          <filter id="pulse-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Background ring */}
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[#e8d4c4] dark:text-slate-700"
        />
        
        {/* Animated gradient ring */}
        <motion.circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          className="stroke-[url(#pulse-light)] dark:stroke-[url(#pulse-dark)]"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#pulse-glow)"
          strokeDasharray="31.4 94.2"
          animate={{ 
            rotate: 360,
            strokeDasharray: ['31.4 94.2', '62.8 62.8', '31.4 94.2']
          }}
          transition={{ 
            rotate: { duration: 1.8, repeat: Infinity, ease: 'linear' },
            strokeDasharray: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
          }}
          style={{ transformOrigin: 'center' }}
        />
      </svg>
      
      {/* Inner glow - copper warmth for light, aurora neon for dark */}
      <motion.div
        className="absolute inset-[25%] rounded-full bg-gradient-to-br from-[#b4784a]/15 via-[#c49a6c]/10 to-[#8b5a2b]/15 dark:from-violet-500/20 dark:via-cyan-400/15 dark:to-pink-500/20 blur-md"
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ============================================
// AURORA VARIANT - Liquid Aurora spinner (2025 design)
// Light: Vintage copper patina | Dark: Neon glow effects
// ============================================
function AuroraSpinner({ size = 'md', className }) {
  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <svg viewBox="0 0 50 50" className="w-full h-full">
        <defs>
          {/* Light theme: vintage copper/sepia gradient */}
          <linearGradient id="aurora-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <motion.stop
              offset="0%"
              animate={{ stopColor: ['#b4784a', '#c49a6c', '#a67c52', '#b4784a'] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.stop
              offset="100%"
              animate={{ stopColor: ['#8b5a2b', '#9c6640', '#8b5a2b', '#8b5a2b'] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </linearGradient>
          {/* Dark theme: liquid aurora - cyan/indigo/pink cycle */}
          <linearGradient id="aurora-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <motion.stop
              offset="0%"
              animate={{ stopColor: ['#22d3ee', '#8b5cf6', '#ec4899', '#22d3ee'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.stop
              offset="50%"
              animate={{ stopColor: ['#8b5cf6', '#ec4899', '#22d3ee', '#8b5cf6'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.stop
              offset="100%"
              animate={{ stopColor: ['#ec4899', '#22d3ee', '#8b5cf6', '#ec4899'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </linearGradient>
          {/* Neon glow filter */}
          <filter id="aurora-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Background ring with subtle opacity */}
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="2"
          className="stroke-[#e8d4c4] dark:stroke-white/[0.06]"
        />
        
        {/* Outer glow ring (dark mode only) */}
        <motion.circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          className="stroke-transparent dark:stroke-[url(#aurora-dark)]"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="20 105.6"
          filter="url(#aurora-glow)"
          style={{ opacity: 0.4 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Main animated ring */}
        <motion.circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          className="stroke-[url(#aurora-light)] dark:stroke-[url(#aurora-dark)]"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="31.4 94.2"
          animate={{ 
            rotate: 360,
            strokeDasharray: ['20 105.6', '50 75.6', '20 105.6']
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
            strokeDasharray: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }}
          style={{ transformOrigin: 'center' }}
        />
        
        {/* Secondary arc for depth */}
        <motion.circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          className="stroke-[url(#aurora-light)] dark:stroke-[url(#aurora-dark)]"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="15 110.6"
          style={{ opacity: 0.5 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </svg>
      
      {/* Central glow orb - copper for light, aurora for dark */}
      <motion.div
        className="absolute inset-[30%] rounded-full bg-gradient-to-br from-[#b4784a]/20 to-[#8b5a2b]/20 dark:from-violet-500/30 dark:via-cyan-400/20 dark:to-pink-500/30 blur-lg"
        animate={{ 
          opacity: [0.4, 0.8, 0.4], 
          scale: [0.8, 1.2, 0.8],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ============================================
// CARD VARIANT - Credit card with holographic scan
// Light: Vintage brass/copper card | Dark: Dark slate card
// ============================================
function CardSpinner({ size = 'md', className }) {
  const cardSize = {
    xs: 'h-4 w-7',
    sm: 'h-6 w-10',
    md: 'h-8 w-14',
    lg: 'h-12 w-20',
    xl: 'h-16 w-28',
    '2xl': 'h-20 w-36',
  }[size];

  return (
    <motion.div
      className={cn(
        'relative rounded-lg overflow-hidden',
        // Light: vintage cream/brass card (banking aesthetic)
        'bg-gradient-to-br from-[#f8f4ed] via-[#e8d4c4] to-[#d4c4b0]',
        // Dark: dark slate card
        'dark:from-slate-700 dark:via-slate-800 dark:to-slate-900',
        'border border-[#c49a6c]/50 dark:border-slate-600/50',
        'shadow-xl shadow-[#b4784a]/20 dark:shadow-black/30',
        cardSize,
        className
      )}
      animate={{ 
        rotateY: [0, 3, -3, 0],
        rotateX: [0, -2, 2, 0]
      }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformStyle: 'preserve-3d', perspective: '500px' }}
    >
      {/* Holographic foil layer - copper/brass for light, cool for dark */}
      <motion.div
        className="absolute inset-0 opacity-50 dark:opacity-40"
        style={{
          background: 'linear-gradient(135deg, transparent 0%, rgba(180,120,74,0.4) 25%, rgba(196,154,108,0.4) 50%, rgba(139,90,43,0.4) 75%, transparent 100%)',
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
      {/* Dark theme holographic */}
      <motion.div
        className="absolute inset-0 opacity-0 dark:opacity-40"
        style={{
          background: 'linear-gradient(135deg, transparent 0%, rgba(168,85,247,0.4) 25%, rgba(34,211,238,0.4) 50%, rgba(251,146,60,0.4) 75%, transparent 100%)',
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Card chip - aged brass finish */}
      <div className={cn(
        'absolute top-[18%] left-[10%] h-[28%] w-[18%] rounded-sm',
        'bg-gradient-to-br from-[#c49a6c] via-[#b4784a] to-[#8b5a2b]',
        'border border-[#8b5a2b]/40'
      )}>
        <div className="absolute inset-0.5 grid grid-cols-2 gap-px opacity-50">
          {[0,1,2,3].map(i => <div key={i} className="bg-[#6b4423]/30" />)}
        </div>
      </div>
      
      {/* Contactless icon */}
      <div className="absolute top-[18%] right-[10%]">
        <svg viewBox="0 0 24 24" className="h-[28%] w-auto text-[#b4784a]/60 dark:text-slate-500" style={{ height: '0.4rem' }}>
          <motion.path
            d="M12 18a6 6 0 0 0 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          />
          <motion.path
            d="M12 14a2 2 0 0 0 2-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
        </svg>
      </div>
      
      {/* Card number placeholders */}
      <div className="absolute bottom-[30%] left-[10%] right-[10%] flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <motion.div 
            key={i} 
            className="flex-1 h-1.5 rounded-full bg-[#b4784a]/30 dark:bg-slate-500/30"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      
      {/* Holographic scan line */}
      <motion.div
        className="absolute left-0 right-0 h-[4px] pointer-events-none"
        animate={{ top: ['5%', '95%', '5%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Light theme: copper foil scan */}
        <div 
          className="h-full dark:hidden"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(180,120,74,0.7), rgba(196,154,108,0.7), rgba(139,90,43,0.7), transparent)',
          }}
        />
        {/* Dark theme: cool scan */}
        <div 
          className="h-full hidden dark:block"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.6), rgba(34,211,238,0.6), rgba(251,146,60,0.6), transparent)',
          }}
        />
        <div 
          className="absolute inset-0 blur-sm dark:hidden"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(180,120,74,0.5), rgba(196,154,108,0.5), transparent)',
          }}
        />
        <div 
          className="absolute inset-0 blur-sm hidden dark:block"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.4), rgba(34,211,238,0.4), transparent)',
          }}
        />
      </motion.div>
      
      {/* Corner reflection */}
      <div 
        className="absolute top-0 right-0 w-8 h-8 opacity-40"
        style={{
          background: 'linear-gradient(135deg, white 0%, transparent 50%)',
        }}
      />
    </motion.div>
  );
}

// ============================================
// FLOW VARIANT - Flowing liquid stream
// Light: Copper/brass flow | Dark: Silver flow
// ============================================
function FlowSpinner({ size = 'md', className }) {
  const scale = sizeScale[size];
  
  return (
    <div 
      className={cn('relative flex items-center justify-center overflow-hidden', sizeClasses[size], className)}
      style={{ transform: `scale(${scale})` }}
    >
      <div className="relative w-12 h-6">
        {/* Flow container */}
        <div className={cn(
          'absolute inset-0 rounded-full border overflow-hidden',
          'border-[#c49a6c] bg-[#f8f4ed]/50',
          'dark:border-slate-600 dark:bg-slate-800/50'
        )}>
          {/* Flowing particles */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className={cn(
                'absolute h-2 rounded-full',
                'bg-gradient-to-r from-[#c49a6c] via-[#b4784a] to-[#c49a6c]',
                'dark:from-slate-400 dark:via-slate-300 dark:to-slate-400'
              )}
              style={{
                width: 8 + i * 2,
                top: '50%',
                marginTop: -4,
              }}
              animate={{
                left: ['-20%', '120%'],
                opacity: [0, 1, 1, 0],
                scaleY: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        
        {/* Brass caps */}
        <div className={cn(
          'absolute left-0 top-0 bottom-0 w-2 rounded-l-full',
          'bg-gradient-to-r from-[#b4784a] to-[#c49a6c]',
          'dark:from-slate-500 dark:to-slate-400'
        )} />
        <div className={cn(
          'absolute right-0 top-0 bottom-0 w-2 rounded-r-full',
          'bg-gradient-to-l from-[#b4784a] to-[#c49a6c]',
          'dark:from-slate-500 dark:to-slate-400'
        )} />
      </div>
    </div>
  );
}

// ============================================
// RING VARIANT - Simple elegant ring
// Light: Copper ring | Dark: Aurora ring
// ============================================
function RingSpinner({ size = 'md', className }) {
  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <motion.svg
        viewBox="0 0 50 50"
        className="w-full h-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      >
        <defs>
          <linearGradient id="ring-light" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b4784a" />
            <stop offset="50%" stopColor="#8b5a2b" />
            <stop offset="100%" stopColor="#b4784a" />
          </linearGradient>
          <linearGradient id="ring-dark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[#e8d4c4] dark:text-white/[0.06]"
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          className="stroke-[url(#ring-light)] dark:stroke-[url(#ring-dark)]"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="40 85.6"
        />
      </motion.svg>
    </div>
  );
}

// ============================================
// DOTS VARIANT - Bouncing dots
// Light: Copper dots | Dark: Aurora dots
// ============================================
function DotsSpinner({ size = 'md', className }) {
  const dotSize = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
    xl: 'w-3 h-3',
    '2xl': 'w-4 h-4',
  }[size];
  
  const gap = {
    xs: 'gap-0.5',
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2',
    xl: 'gap-2.5',
    '2xl': 'gap-3',
  }[size];

  return (
    <div className={cn('flex items-center justify-center', gap, className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(
            'rounded-full',
            'bg-gradient-to-br from-[#c49a6c] via-[#b4784a] to-[#8b5a2b]',
            'dark:from-violet-400 dark:via-cyan-400 dark:to-pink-400',
            'shadow-sm shadow-[#b4784a]/50 dark:shadow-violet-400/40',
            dotSize
          )}
          animate={{
            y: [0, -8, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        >
          <div className="absolute top-0 left-0 w-1/2 h-1/3 rounded-full bg-white/50" />
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// MAIN SPINNER COMPONENT
// ============================================
export function Spinner({ 
  variant = 'pulse', 
  size = 'md', 
  className,
  label,
}) {
  const SpinnerComponent = {
    mercury: MercurySpinner,
    prism: PrismSpinner,
    ripple: RippleSpinner,
    coin: CoinSpinner,
    orbital: OrbitalSpinner,
    pulse: PulseSpinner,
    aurora: AuroraSpinner,
    card: CardSpinner,
    flow: FlowSpinner,
    ring: RingSpinner,
    dots: DotsSpinner,
  }[variant] || PulseSpinner;

  if (label) {
    return (
      <div className="flex flex-col items-center gap-4">
        <SpinnerComponent size={size} className={className} />
        <motion.span
          className={cn(
            'text-xs font-medium tracking-wide',
            'text-[#8b5a2b] dark:text-violet-300/80'
          )}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {label}
        </motion.span>
      </div>
    );
  }

  return <SpinnerComponent size={size} className={className} />;
}

// ============================================
// INLINE SPINNER - For buttons and inline contexts
// ============================================
export function InlineSpinner({ size = 'sm', className }) {
  const dimensions = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }[size];

  return (
    <motion.svg
      viewBox="0 0 24 24"
      className={cn(dimensions, 'text-current', className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.2"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}

// ============================================
// LOADING STATE WRAPPER
// ============================================
export function LoadingState({ 
  isLoading, 
  children, 
  variant = 'pulse',
  size = 'lg',
  label = 'Loading...',
  className,
  spinnerClassName,
}) {
  if (!isLoading) return children;

  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <Spinner 
        variant={variant} 
        size={size} 
        label={label}
        className={spinnerClassName}
      />
    </div>
  );
}

export default Spinner;
