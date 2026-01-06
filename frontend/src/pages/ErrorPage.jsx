import { motion } from 'motion/react';
import { AlertTriangle, Home, RefreshCw, Copy, Check } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

/**
 * ErrorPage - 500 Error Page with dramatic brutalist/glitch aesthetic
 * Features: distorted 500, pulsing danger effects, copy-able error ID
 * Light: Vintage Banking burgundy ink on cream | Dark: Liquid Aurora glitch
 */
export function ErrorPage({ 
  errorId = null,
  onRetry = null,
  onNavigateHome = null 
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);

  // Random glitch effect - more frequent for error page
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 100);
    }, 2000 + Math.random() * 1500);
    return () => clearInterval(glitchInterval);
  }, []);

  const handleGoHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleCopyErrorId = useCallback(async () => {
    if (!errorId) return;
    try {
      await navigator.clipboard.writeText(errorId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = errorId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [errorId]);

  return (
    <div className={cn(
      "min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden",
      // Light: Vintage Banking cream parchment | Dark: deep aurora
      isDark ? "bg-[#0a0808]" : "bg-[hsl(40,45%,96%)]"
    )}>
      {/* Animated danger gradient */}
      <motion.div 
        className={cn(
          "absolute inset-0",
          isDark 
            ? "bg-gradient-to-br from-red-950/40 via-[#0a0808] to-orange-950/30"
            // Light: burgundy ink wash on cream
            : "bg-gradient-to-br from-[hsl(355,35%,92%)] via-[hsl(40,45%,96%)] to-[hsl(30,40%,94%)]"
        )}
        animate={{ 
          background: isDark 
            ? [
              "radial-gradient(ellipse at 30% 30%, rgba(220, 38, 38, 0.15), transparent 50%)",
              "radial-gradient(ellipse at 70% 70%, rgba(220, 38, 38, 0.15), transparent 50%)",
              "radial-gradient(ellipse at 30% 30%, rgba(220, 38, 38, 0.15), transparent 50%)"
            ]
            // Light: subtle burgundy pulse
            : [
              "radial-gradient(ellipse at 30% 30%, hsl(355, 40%, 85%, 0.3), transparent 50%)",
              "radial-gradient(ellipse at 70% 70%, hsl(355, 40%, 85%, 0.3), transparent 50%)",
              "radial-gradient(ellipse at 30% 30%, hsl(355, 40%, 85%, 0.3), transparent 50%)"
            ]
        }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      {/* Scanlines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02] z-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 4px)',
          color: isDark ? '#fff' : '#000'
        }}
      />

      {/* Heavy noise texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.5] z-10 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Dramatic cross pattern */}
      <div className={cn(
        "absolute inset-0 pointer-events-none z-5",
        isDark ? "opacity-[0.03]" : "opacity-[0.02]"
      )}>
        <div className="absolute top-1/2 left-0 right-0 h-px bg-current" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-current" />
      </div>

      {/* Pulsing danger orb */}
      <motion.div 
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px]",
          // Light: burgundy glow | Dark: red aurora
          isDark ? "bg-red-600/10" : "bg-[hsl(355,45%,55%)]/10"
        )}
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity }}
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
        {/* Giant 500 with glitch - vintage engraved effect */}
        <motion.div 
          className="relative mb-4"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 10, delay: 0.1 }}
        >
          <h1 
            className={cn(
              "text-[12rem] md:text-[16rem] font-black leading-none tracking-tighter select-none",
              // Light: faint sepia with letterpress shadow | Dark: faint white
              isDark ? "text-white/[0.07]" : "text-[hsl(25,35%,18%)]/[0.06]",
              !isDark && "[text-shadow:0_2px_0_rgba(255,255,255,0.3),0_-1px_0_rgba(101,67,33,0.05)]"
            )}
            style={{ fontFamily: "'Space Mono', 'Courier New', monospace" }}
          >
            500
          </h1>
          
          {/* Overlaid glitchy 500 */}
          <motion.span 
            className={cn(
              "absolute inset-0 flex items-center justify-center text-[12rem] md:text-[16rem] font-black tracking-tighter",
              // Light: burgundy ink | Dark: red aurora
              isDark ? "text-red-500/80" : "text-[hsl(355,45%,42%)]/80"
            )}
            style={{ fontFamily: "'Space Mono', 'Courier New', monospace" }}
            animate={glitchActive ? { x: [-4, 4, -4, 0], skewX: [-2, 2, -2, 0] } : {}}
            transition={{ duration: 0.1 }}
          >
            500
            {glitchActive && (
              <>
                <span className="absolute text-cyan-500/60 dark:text-cyan-500/60 -translate-x-2 translate-y-1" aria-hidden>500</span>
                <span className="absolute text-[hsl(355,50%,50%)]/60 dark:text-red-500/60 translate-x-2 -translate-y-1" aria-hidden>500</span>
              </>
            )}
          </motion.span>
        </motion.div>

        {/* Icon overlapping the number - Treasury Seal styling */}
        <motion.div 
          className="flex items-center justify-center -mt-24 mb-8 relative z-10"
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, delay: 0.3 }}
        >
          <motion.div 
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center border-2 relative",
              isDark 
                ? "bg-red-500/20 border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.3)]"
                // Light: Treasury seal with official stamp appearance
                : cn(
                    "bg-gradient-to-b from-[hsl(355,28%,96%)] via-[hsl(355,32%,93%)] to-[hsl(355,35%,88%)]",
                    "border-[hsl(355,35%,65%)]",
                    // Treasury seal shadow: double ring + depth
                    "shadow-[0_0_0_3px_hsl(42,45%,97%),0_0_0_5px_hsl(355,30%,72%),0_12px_40px_hsl(355,45%,45%,0.2),inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-3px_6px_hsl(355,35%,75%,0.3)]"
                  )
            )}
            animate={{ rotate: [0, -3, 3, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            {/* Decorative inner ring - light mode only */}
            <div className="absolute inset-3 rounded-full border border-dashed border-[hsl(355,35%,72%)] opacity-50 dark:opacity-0" />
            <AlertTriangle className={cn(
              "w-10 h-10 relative z-10",
              isDark ? "text-red-400" : "text-[hsl(355,50%,38%)]",
              !isDark && "drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]"
            )} strokeWidth={1.5} />
          </motion.div>
        </motion.div>

        {/* Title - Letterpress embossed */}
        <motion.h2 
          className={cn(
            "text-3xl md:text-4xl font-black uppercase tracking-tight mb-4",
            // Light: sepia ink with letterpress | Dark: white
            isDark ? "text-white" : "text-[hsl(25,35%,18%)]",
            !isDark && "[text-shadow:0_1px_0_rgba(255,255,255,0.6),0_-1px_0_rgba(101,67,33,0.1)]"
          )}
          style={{ fontFamily: "'Space Mono', monospace" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <span className="relative">
            System Error
            {glitchActive && (
              <span className="absolute inset-0 text-[hsl(355,45%,42%)]/50 dark:text-red-500/50 translate-x-[2px]" aria-hidden>
                System Error
              </span>
            )}
          </span>
        </motion.h2>

        {/* Description */}
        <motion.p 
          className={cn(
            "text-lg max-w-md mx-auto mb-8",
            // Light: muted sepia | Dark: muted white
            isDark ? "text-white/50" : "text-[hsl(25,20%,45%)]"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Something went wrong. Please try again or contact support.
        </motion.p>

        {/* Error ID Block - Vintage certificate styling */}
        {errorId && (
          <motion.div 
            className={cn(
              "inline-block rounded-xl p-5 mb-8 border-2 border-dashed",
              isDark 
                ? "bg-white/5 border-red-500/30"
                // Light: Vintage Banking burgundy accent with double-line border effect
                : cn(
                    "bg-gradient-to-b from-[hsl(355,32%,97%)] to-[hsl(355,35%,94%)]",
                    "border-[hsl(355,30%,78%)]",
                    "shadow-[inset_0_1px_2px_hsl(355,30%,40%,0.05),0_0_0_3px_hsl(42,45%,97%),0_0_0_4px_hsl(355,25%,82%)]"
                  )
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <p className={cn(
              "text-xs uppercase tracking-[0.2em] mb-3 font-semibold",
              isDark ? "text-red-400/70" : "text-[hsl(355,45%,42%)]/70"
            )}>
              Error Reference
            </p>
            <div className="flex items-center justify-center gap-3">
              <code 
                className={cn(
                  "text-lg font-bold px-4 py-2 rounded-lg",
                  isDark 
                    ? "bg-white/10 text-white font-mono"
                    // Light: cream paper with sepia text
                    : "bg-[hsl(42,40%,98%)] text-[hsl(25,35%,18%)] font-mono shadow-sm border border-[hsl(30,25%,85%)]"
                )}
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {errorId}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-lg",
                  isDark ? "hover:bg-white/10" : "hover:bg-[hsl(355,35%,92%)]"
                )}
                onClick={handleCopyErrorId}
              >
                {copied ? (
                  <Check className="w-5 h-5 text-[hsl(145,45%,40%)] dark:text-green-500" />
                ) : (
                  <Copy className={cn(
                    "w-5 h-5",
                    isDark ? "text-white/50" : "text-[hsl(25,20%,50%)]"
                  )} />
                )}
              </Button>
            </div>
            <p className={cn(
              "text-xs mt-3",
              isDark ? "text-white/30" : "text-[hsl(25,20%,50%)]"
            )}>
              Include this ID when contacting support
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            size="lg"
            onClick={handleRetry}
            className={cn(
              "gap-3 px-8 py-6 text-base font-bold uppercase tracking-wider rounded-xl",
              // Light: burgundy ink | Dark: red aurora
              isDark 
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-[hsl(355,45%,42%)] hover:bg-[hsl(355,45%,38%)] text-white"
            )}
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleGoHome}
            className={cn(
              "gap-3 px-8 py-6 text-base font-semibold uppercase tracking-wider border-2 rounded-xl",
              // Light: sepia border | Dark: white border
              isDark 
                ? "border-white/20 text-white/80 hover:bg-white/5"
                : "border-[hsl(30,25%,75%)] text-[hsl(25,35%,25%)] hover:bg-[hsl(38,35%,93%)]"
            )}
          >
            <Home className="w-5 h-5" />
            Dashboard
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
              // Light: faint burgundy | Dark: faint red
              isDark ? "text-red-500/20" : "text-[hsl(355,40%,75%)]"
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

export default ErrorPage;
