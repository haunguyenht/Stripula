import { motion } from 'motion/react';
import { ShieldX, Home, ArrowLeft, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

/**
 * ForbiddenPage - 403 Error Page with vault/security aesthetic
 * Features: heavy locked door feel, security patterns, restricted access vibe
 * Light: Vintage Banking burgundy ink on cream | Dark: Liquid Aurora rose
 */
export function ForbiddenPage({ onNavigateHome = null }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase(p => (p + 1) % 3);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleGoHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      handleGoHome();
    }
  };

  return (
    <div className={cn(
      "min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden",
      // Light: Vintage Banking cream parchment | Dark: deep aurora
      isDark ? "bg-[#0a0606]" : "bg-[hsl(40,45%,96%)]"
    )}>
      {/* Heavy gradient with danger tones */}
      <div className={cn(
        "absolute inset-0",
        isDark 
          ? "bg-gradient-to-br from-rose-950/40 via-[#0a0606] to-red-950/30"
          // Light: burgundy ink wash on cream
          : "bg-gradient-to-br from-[hsl(355,35%,92%)] via-[hsl(40,45%,96%)] to-[hsl(30,40%,94%)]"
      )} />

      {/* Security grid pattern */}
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none",
          isDark ? "opacity-[0.015]" : "opacity-[0.02]"
        )}
        style={{
          backgroundImage: `
            linear-gradient(45deg, currentColor 1px, transparent 1px),
            linear-gradient(-45deg, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Radial security rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "absolute rounded-full border",
              // Light: burgundy rings | Dark: rose aurora
              isDark ? "border-rose-500/5" : "border-[hsl(355,40%,75%)]/15"
            )}
            style={{
              width: `${200 + i * 150}px`,
              height: `${200 + i * 150}px`
            }}
            animate={{ 
              scale: [1, 1.02, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              delay: i * 0.4
            }}
          />
        ))}
      </div>

      {/* Noise texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 z-10 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Scanlines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02] z-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, currentColor 3px, currentColor 4px)',
          color: isDark ? '#fff' : '#000'
        }}
      />

      {/* Theme Toggle */}
      <motion.div 
        className="fixed top-6 right-6 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <ThemeToggle />
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="relative z-20 w-full max-w-2xl text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Giant 403 background */}
        <motion.div 
          className="relative mb-0"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 12, delay: 0.1 }}
        >
          <h1 
            className={cn(
              "text-[10rem] md:text-[14rem] font-black leading-none tracking-tighter select-none",
              // Light: faint sepia | Dark: faint white
              isDark ? "text-white/[0.03]" : "text-[hsl(25,35%,18%)]/[0.04]"
            )}
            style={{ fontFamily: "'Space Mono', 'Courier New', monospace" }}
          >
            403
          </h1>
          
          {/* Overlaid gradient 403 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className={cn(
                "text-[10rem] md:text-[14rem] font-black tracking-tighter",
                // Light: burgundy gradient | Dark: rose aurora
                isDark 
                  ? "text-transparent bg-gradient-to-b from-rose-500 via-red-500 to-rose-600 bg-clip-text"
                  : "text-transparent bg-gradient-to-b from-[hsl(355,45%,42%)] via-[hsl(355,50%,48%)] to-[hsl(355,40%,38%)] bg-clip-text"
              )}
              style={{ fontFamily: "'Space Mono', 'Courier New', monospace" }}
            >
              403
            </span>
          </div>
        </motion.div>

        {/* Shield icon with lock - Vintage vault/wax seal styling */}
        <motion.div 
          className="flex items-center justify-center -mt-20 mb-10 relative z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, delay: 0.3 }}
        >
          <div className="relative">
            {/* Outer ring pulsing */}
            <motion.div 
              className={cn(
                "absolute -inset-4 rounded-3xl",
                // Light: burgundy glow | Dark: rose aurora
                isDark ? "bg-rose-500/10" : "bg-[hsl(355,35%,85%)]/50"
              )}
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.2, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Shield container - vintage vault door styling */}
            <div 
              className={cn(
                "w-24 h-24 rounded-2xl flex items-center justify-center border-2 relative",
                isDark 
                  ? "bg-rose-500/10 border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.2)]"
                  // Light: Vintage Banking vault door with embossed effect
                  : cn(
                      "bg-gradient-to-b from-[hsl(44,48%,98%)] to-[hsl(42,40%,95%)]",
                      "border-[hsl(355,35%,75%)]",
                      "shadow-[0_15px_50px_hsl(355,40%,50%,0.12),inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_hsl(355,30%,75%,0.3)]"
                    )
              )}
            >
              <ShieldX className={cn(
                "w-12 h-12",
                isDark ? "text-rose-400" : "text-[hsl(355,45%,42%)]"
              )} strokeWidth={1.5} />
              
              {/* Small lock badge */}
              <motion.div 
                className={cn(
                  "absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center",
                  isDark 
                    ? "bg-rose-600 border-2 border-[#0a0606]"
                    // Light: burgundy lock
                    : "bg-[hsl(355,45%,42%)] border-2 border-[hsl(42,40%,98%)]"
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <Lock className="w-4 h-4 text-white" strokeWidth={2.5} />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Title - Letterpress embossed */}
        <motion.h2 
          className={cn(
            "text-3xl md:text-5xl font-black uppercase tracking-tight mb-4",
            // Light: sepia ink with letterpress | Dark: white
            isDark ? "text-white" : "text-[hsl(25,35%,18%)]",
            !isDark && "[text-shadow:0_1px_0_rgba(255,255,255,0.7),0_-1px_0_rgba(101,67,33,0.1)]"
          )}
          style={{ fontFamily: "'Space Mono', monospace" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Access Denied
        </motion.h2>

        {/* Status indicator dots */}
        <motion.div 
          className="flex items-center justify-center gap-2 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full",
                pulsePhase === i
                  // Light: burgundy active | Dark: rose aurora
                  ? (isDark ? "bg-rose-400" : "bg-[hsl(355,45%,45%)]")
                  : (isDark ? "bg-white/20" : "bg-[hsl(30,20%,75%)]")
              )}
              animate={pulsePhase === i ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            />
          ))}
        </motion.div>

        {/* Description */}
        <motion.p 
          className={cn(
            "text-lg md:text-xl max-w-md mx-auto mb-10",
            // Light: muted sepia | Dark: muted white
            isDark ? "text-white/50" : "text-[hsl(25,20%,45%)]"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          You don't have permission to access this area.
        </motion.p>

        {/* Warning stripe decoration */}
        <motion.div 
          className="flex justify-center mb-10"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
        >
          <div 
            className="w-48 h-3 rounded-full overflow-hidden"
            style={{
              // Light: burgundy/cream stripes | Dark: rose/black stripes
              background: isDark 
                ? 'repeating-linear-gradient(45deg, #f43f5e, #f43f5e 8px, #0a0606 8px, #0a0606 16px)'
                : 'repeating-linear-gradient(45deg, hsl(355, 45%, 42%), hsl(355, 45%, 42%) 8px, hsl(40, 45%, 96%) 8px, hsl(40, 45%, 96%) 16px)',
              opacity: isDark ? 0.3 : 0.35
            }}
          />
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            size="lg"
            onClick={handleGoHome}
            className={cn(
              "gap-3 px-8 py-6 text-base font-bold uppercase tracking-wider rounded-xl",
              "transition-all duration-300",
              // Light: burgundy primary | Dark: rose aurora
              isDark 
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.25)]"
                : "bg-[hsl(355,45%,42%)] hover:bg-[hsl(355,45%,38%)] text-white shadow-lg"
            )}
          >
            <Home className="w-5 h-5" />
            Dashboard
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleGoBack}
            className={cn(
              "gap-3 px-8 py-6 text-base font-semibold uppercase tracking-wider border-2 rounded-xl",
              "transition-all duration-300",
              // Light: sepia border | Dark: rose border
              isDark 
                ? "border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:border-rose-400"
                : "border-[hsl(30,25%,75%)] text-[hsl(355,40%,40%)] hover:bg-[hsl(38,35%,93%)]"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
        </motion.div>

        {/* Brand Footer */}
        <motion.div 
          className={cn(
            "mt-16 pt-8 border-t",
            isDark ? "border-white/5" : "border-[hsl(30,25%,88%)]"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <p 
            className={cn(
              "text-2xl font-black tracking-tighter",
              // Light: faint burgundy | Dark: faint rose
              isDark ? "text-rose-500/20" : "text-[hsl(355,40%,75%)]"
            )}
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            STRIPULA
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default ForbiddenPage;
