import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';
import { AppBackground } from '@/components/background/AppBackground';
import { Shield, Zap, CreditCard, Lock, Wifi } from 'lucide-react';

/**
 * Loading Overlay Components - Premium Full-Screen Loaders
 * 
 * LIGHT MODE: Vintage Banking Vault
 * - Aged parchment with treasury certificate borders
 * - Copper coin mechanisms and brass accents
 * - Embossed typography with wax seal effects
 * 
 * DARK MODE: Liquid Aurora Terminal
 * - Deep cosmic glass with aurora gradients
 * - Holographic scanning effects
 * - Neon status indicators with particle systems
 */

// ============================================
// LOADING OVERLAY - For content areas
// ============================================
export function LoadingOverlay({
  isLoading,
  variant = 'coin',
  size = 'xl',
  label = 'Processing...',
  sublabel,
  progress,
  fullScreen = false,
  className,
  children,
}) {
  return (
    <div className={cn('relative', fullScreen && 'h-screen w-screen', className)}>
      {children}
      
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={cn(
              'absolute inset-0 z-50 flex flex-col items-center justify-center',
              // Light: Vintage parchment overlay (bg-none resets light gradient)
              'bg-gradient-to-b from-[hsl(40,48%,97%)]/95 via-[hsl(38,45%,96%)]/93 to-[hsl(36,42%,95%)]/95',
              // Dark: Liquid aurora glass (bg-none resets light gradient)
              'dark:bg-none dark:bg-gradient-to-b dark:from-[hsl(220,18%,7%)]/95 dark:via-[hsl(220,18%,7%)]/93 dark:to-[hsl(220,18%,7%)]/95',
              'backdrop-blur-xl dark:backdrop-blur-[60px] dark:backdrop-saturate-[180%]',
            )}
          >
            {/* Treasury certificate frame - light mode */}
            <div className="absolute inset-4 md:inset-8 pointer-events-none">
              <div className={cn(
                'absolute inset-0 rounded-2xl',
                'border-2 border-[hsl(25,50%,60%)]',
                'shadow-[0_0_0_3px_hsl(42,48%,97%),0_0_0_5px_hsl(30,35%,75%),0_0_0_7px_hsl(42,45%,96%),0_0_0_8px_hsl(30,30%,80%)]',
                'dark:border-white/[0.06] dark:shadow-[inset_0_0_0_1px_rgba(139,92,246,0.1)]'
              )} />
              {/* Corner ornaments */}
              <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-[hsl(25,55%,52%)] rounded-tl-sm opacity-50 dark:opacity-0" />
              <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-[hsl(25,55%,52%)] rounded-tr-sm opacity-50 dark:opacity-0" />
              <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-[hsl(25,55%,52%)] rounded-bl-sm opacity-50 dark:opacity-0" />
              <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-[hsl(25,55%,52%)] rounded-br-sm opacity-50 dark:opacity-0" />
            </div>

            {/* Ambient orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute w-96 h-96 -top-48 -left-48 rounded-full bg-gradient-to-br from-[hsl(28,60%,70%)]/25 to-[hsl(32,55%,75%)]/15 dark:from-violet-500/20 dark:to-pink-500/10 blur-3xl"
                animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute w-96 h-96 -bottom-48 -right-48 rounded-full bg-gradient-to-br from-[hsl(25,55%,55%)]/15 to-[hsl(28,50%,60%)]/10 dark:from-cyan-500/15 dark:to-violet-500/10 blur-3xl"
                animate={{ x: [0, -40, 0], y: [0, -25, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              />
            </div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative z-10 text-center"
            >
              <div className="flex justify-center mb-6">
                <Spinner variant={variant} size={size} />
              </div>
              
              <motion.p
                className={cn(
                  "text-base font-semibold",
                  "text-[hsl(25,35%,35%)] dark:text-white/80"
                )}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {label}
              </motion.p>
              
              {sublabel && (
                <motion.p 
                  className="text-sm text-[hsl(25,25%,50%)] dark:text-white/50 mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 0.3 }}
                >
                  {sublabel}
                </motion.p>
              )}

              {/* Progress bar */}
              {progress !== undefined && (
                <motion.div
                  className="mt-6 w-48 mx-auto h-1.5 rounded-full bg-[hsl(35,30%,88%)] dark:bg-white/10 overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[hsl(28,60%,50%)] to-[hsl(35,55%,55%)] dark:from-violet-500 dark:to-cyan-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// PAGE LOADER - Full screen app initialization
// ============================================
export function PageLoader({ 
  label = 'Loading...', 
  sublabel,
  variant = 'orbit',
}) {
  const isInitializing = label.toLowerCase().includes('initializ');
  
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[hsl(38,45%,96%)] dark:bg-transparent">
      <AppBackground />

      <div className="flex-1 flex items-center justify-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          {/* Main loader visual */}
          {isInitializing ? (
            <InitializingVisual />
          ) : (
            <LoadingVisual variant={variant} />
          )}
          
          {/* Labels */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-8"
          >
            <motion.p
              className={cn(
                "text-base font-semibold tracking-wide",
                "text-[hsl(25,35%,32%)]",
                "[text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
                "dark:text-white/90 dark:[text-shadow:none]"
              )}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {label}
            </motion.p>
            
            {sublabel && (
              <motion.p 
                className="text-sm text-[hsl(25,25%,50%)] dark:text-white/50 mt-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 0.5 }}
              >
                {sublabel}
              </motion.p>
            )}
          </motion.div>

          {/* Progress bar */}
          <motion.div
            className="mt-6 w-48 h-1 rounded-full bg-[hsl(35,30%,88%)] dark:bg-white/10 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[hsl(28,60%,50%)] to-[hsl(35,55%,55%)] dark:from-violet-500 dark:to-cyan-500"
              animate={{ x: ['-100%', '300%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: '33%' }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Footer status */}
      <motion.div 
        className="absolute bottom-6 left-0 right-0 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full",
          "bg-[hsl(38,40%,94%)] border border-[hsl(30,30%,82%)]",
          "dark:bg-white/[0.04] dark:border-white/10"
        )}>
          <motion.div 
            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ boxShadow: '0 0 6px rgba(34,197,94,0.6)' }}
          />
          <span className="text-xs font-medium text-[hsl(25,25%,45%)] dark:text-white/60">
            Secure Connection
          </span>
          <Lock className="w-3 h-3 text-[hsl(25,30%,50%)] dark:text-white/40" />
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// INITIALIZING VISUAL - App startup animation
// ============================================
function InitializingVisual() {
  return (
    <div className="relative">
      {/* Outer pulsing ring */}
      <motion.div
        className="absolute -inset-8 rounded-full pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, hsl(28,50%,55%,0.3) 0%, transparent 70%)'
        }}
      />
      <motion.div
        className="absolute -inset-8 rounded-full pointer-events-none hidden dark:block"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(34,211,238,0.1) 50%, transparent 70%)'
        }}
      />
      
      {/* Main container - Vault dial style */}
      <motion.div
        className={cn(
          "relative w-28 h-28 rounded-3xl flex items-center justify-center overflow-hidden",
          // Light: Brass vault plate (bg-none resets light gradient)
          "bg-gradient-to-br from-[hsl(38,45%,94%)] via-[hsl(35,40%,90%)] to-[hsl(32,35%,86%)]",
          "border-2 border-[hsl(28,50%,60%)]",
          "shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-3px_6px_rgba(101,67,33,0.15),0_8px_32px_rgba(101,67,33,0.2)]",
          // Dark: Aurora glass terminal (bg-none resets light gradient)
          "dark:bg-none dark:bg-[rgba(15,20,30,0.9)]",
          "dark:border dark:border-[rgba(139,92,246,0.25)]",
          "dark:shadow-[0_0_50px_rgba(139,92,246,0.15),inset_0_1px_0_rgba(255,255,255,0.08)]"
        )}
        animate={{ rotateY: [0, 3, -3, 0], rotateX: [0, -2, 2, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d', perspective: '500px' }}
      >
        {/* Paper texture - light */}
        <div 
          className="absolute inset-0 opacity-[0.04] dark:hidden"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Grid pattern - dark */}
        <div 
          className="absolute inset-0 hidden dark:block opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)`,
            backgroundSize: '12px 12px'
          }}
        />
        
        {/* Scanning beam - dark mode */}
        <motion.div
          className="absolute inset-0 hidden dark:block pointer-events-none overflow-hidden"
        >
          <motion.div
            className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent"
            style={{ boxShadow: '0 0 15px rgba(34,211,238,0.6)' }}
            animate={{ top: ['-5%', '105%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
        
        {/* Rotating dial ring */}
        <motion.div
          className="absolute inset-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="init-ring-light" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(28,60%,55%)" stopOpacity="0.8" />
                <stop offset="50%" stopColor="hsl(35,55%,60%)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(28,60%,55%)" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="init-ring-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
                <stop offset="33%" stopColor="#22d3ee" stopOpacity="0.7" />
                <stop offset="66%" stopColor="#ec4899" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              className="stroke-[url(#init-ring-light)] dark:stroke-[url(#init-ring-dark)]"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="40 30 20 30"
            />
          </svg>
        </motion.div>
        
        {/* Center icon */}
        <motion.div
          className={cn(
            "relative z-10 w-12 h-12 rounded-xl flex items-center justify-center",
            // Light: Copper seal
            "bg-gradient-to-br from-[hsl(28,60%,52%)] to-[hsl(25,55%,42%)]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_12px_rgba(166,100,50,0.4)]",
            // Dark: Glowing terminal
            "dark:bg-gradient-to-br dark:from-violet-500/20 dark:to-cyan-500/10",
            "dark:border dark:border-violet-400/40",
            "dark:shadow-[0_0_25px_rgba(139,92,246,0.3)]"
          )}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <CreditCard className="w-6 h-6 text-white/90 dark:text-violet-300" />
        </motion.div>
        
        {/* Corner decorations - light mode */}
        {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
          <div
            key={i}
            className={cn(
              "absolute w-2 h-2 rounded-sm dark:hidden",
              "bg-gradient-to-br from-[hsl(30,45%,65%)] to-[hsl(28,40%,55%)]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
              pos
            )}
          />
        ))}
        
        {/* Status dots - dark mode */}
        <div className="absolute top-2 right-2 hidden dark:flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ 
                backgroundColor: i === 0 ? '#22d3ee' : i === 1 ? '#8b5cf6' : '#ec4899',
                boxShadow: `0 0 6px ${i === 0 ? '#22d3ee' : i === 1 ? '#8b5cf6' : '#ec4899'}`
              }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
      
      {/* Floating accent icons */}
      <motion.div
        className="absolute -top-3 -right-3"
        animate={{ y: [0, -4, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          "bg-gradient-to-br from-[hsl(28,60%,55%)] to-[hsl(25,55%,45%)]",
          "border border-[hsl(28,50%,50%)]",
          "shadow-[0_3px_10px_rgba(166,100,50,0.4)]",
          "dark:bg-gradient-to-br dark:from-cyan-500/20 dark:to-violet-500/10",
          "dark:border-cyan-400/40",
          "dark:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
        )}>
          <Zap className="w-4 h-4 text-white dark:text-cyan-400" />
        </div>
      </motion.div>
      
      <motion.div
        className="absolute -bottom-2 -left-3"
        animate={{ y: [0, 3, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center",
          "bg-gradient-to-br from-[hsl(145,45%,45%)] to-[hsl(150,40%,38%)]",
          "border border-[hsl(145,40%,40%)]",
          "shadow-[0_3px_10px_rgba(50,140,80,0.4)]",
          "dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-cyan-500/10",
          "dark:border-emerald-400/40",
          "dark:shadow-[0_0_15px_rgba(34,197,94,0.4)]"
        )}>
          <Shield className="w-3.5 h-3.5 text-white dark:text-emerald-400" />
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// LOADING VISUAL - General page loading
// ============================================
function LoadingVisual({ variant }) {
  return (
    <div className="relative">
      {/* Subtle glow */}
      <motion.div
        className="absolute -inset-6 rounded-full pointer-events-none"
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, hsl(28,50%,55%,0.25) 0%, transparent 70%)'
        }}
      />
      <motion.div
        className="absolute -inset-6 rounded-full pointer-events-none hidden dark:block"
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)'
        }}
      />
      
      {/* Main container */}
      <motion.div
        className={cn(
          "relative w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden",
          // Light: Aged parchment card
          "bg-gradient-to-br from-[hsl(40,45%,96%)] via-[hsl(38,40%,93%)] to-[hsl(35,35%,90%)]",
          "border-2 border-[hsl(30,40%,72%)]",
          "shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(101,67,33,0.1),0_6px_24px_rgba(101,67,33,0.15)]",
          // Dark: Aurora glass
          "dark:bg-none dark:bg-[rgba(15,20,30,0.85)]",
          "dark:border dark:border-white/10",
          "dark:shadow-[0_0_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.06)]"
        )}
        animate={{ rotateY: [0, 4, -4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d', perspective: '400px' }}
      >
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent -skew-x-12"
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
          />
        </motion.div>
        
        {/* Spinner */}
        <Spinner variant={variant} size="xl" />
      </motion.div>
    </div>
  );
}

// ============================================
// PANEL LOADER - For content panels
// ============================================
export function PanelLoader({
  label = 'Loading...',
  variant = 'pulse',
  size = 'lg',
  className,
}) {
  return (
    <motion.div 
      className={cn(
        'flex items-center justify-center py-20',
        'rounded-2xl overflow-hidden relative',
        // Light: Aged parchment
        'bg-gradient-to-br from-[hsl(40,45%,96%)] to-[hsl(38,40%,94%)]',
        'border border-[hsl(30,30%,82%)]',
        // Dark: Aurora glass
        'dark:bg-none dark:bg-[rgba(15,20,30,0.5)]',
        'dark:border-white/[0.06]',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[hsl(28,50%,60%)]/20 to-[hsl(35,45%,65%)]/10 dark:from-violet-500/15 dark:to-cyan-500/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center relative z-10"
      >
        <div className="flex justify-center mb-6">
          <Spinner variant={variant} size={size} />
        </div>
        <motion.p
          className="text-sm font-medium text-[hsl(25,30%,45%)] dark:text-white/60"
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {label}
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

export default LoadingOverlay;
