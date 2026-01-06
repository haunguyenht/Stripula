import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Wrench, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

/**
 * MaintenancePage - Brutalist/Glitch aesthetic maintenance page
 * Features scanlines, noise overlay, distorted typography, and dramatic visuals
 * Light: Vintage Banking copper/sepia on cream | Dark: Liquid Aurora amber
 */
export function MaintenancePage({ 
  reason = 'We are performing scheduled maintenance to improve your experience.',
  estimatedEndTime = null,
  onMaintenanceEnd = null 
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(new Date());
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [glitchActive, setGlitchActive] = useState(false);

  // Random glitch effect
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(glitchInterval);
  }, []);

  const calculateTimeRemaining = useCallback(() => {
    if (!estimatedEndTime) return null;
    const end = new Date(estimatedEndTime);
    const now = new Date();
    const diff = end - now;
    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, [estimatedEndTime]);

  const checkMaintenanceStatus = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/system/maintenance/status');
      const data = await response.json();
      if (!data.enabled && onMaintenanceEnd) {
        onMaintenanceEnd();
      }
    } catch (error) {
      console.error('Failed to check maintenance status:', error);
    } finally {
      setIsRefreshing(false);
      setLastChecked(new Date());
    }
  }, [onMaintenanceEnd]);

  useEffect(() => {
    const interval = setInterval(() => checkMaintenanceStatus(), 30000);
    return () => clearInterval(interval);
  }, [checkMaintenanceStatus]);

  useEffect(() => {
    if (!estimatedEndTime) return;
    const updateRemaining = () => setTimeRemaining(calculateTimeRemaining());
    updateRemaining();
    const interval = setInterval(updateRemaining, 60000);
    return () => clearInterval(interval);
  }, [estimatedEndTime, calculateTimeRemaining]);

  const formatEstimatedTime = () => {
    if (!estimatedEndTime) return null;
    const date = new Date(estimatedEndTime);
    return date.toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className={cn(
      "min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden",
      // Light: Vintage Banking cream parchment | Dark: deep aurora
      isDark ? "bg-[#0a0a0f]" : "bg-[hsl(40,45%,96%)]"
    )}>
      {/* Animated gradient background */}
      <div className={cn(
        "absolute inset-0",
        isDark 
          ? "bg-gradient-to-br from-amber-950/30 via-[#0a0a0f] to-orange-950/20"
          // Light: copper/sepia wash on cream
          : "bg-gradient-to-br from-[hsl(30,40%,90%)] via-[hsl(40,45%,96%)] to-[hsl(38,35%,93%)]"
      )} />

      {/* Scanlines overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 4px)',
          color: isDark ? '#fff' : '#000'
        }}
      />

      {/* Noise texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.4] z-10 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Geometric accents */}
      <motion.div 
        className={cn(
          "absolute top-0 left-0 w-64 h-64 -translate-x-1/2 -translate-y-1/2",
          // Light: copper accent | Dark: amber aurora
          isDark ? "bg-amber-500/5" : "bg-[hsl(25,50%,60%)]/10"
        )}
        style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className={cn(
          "absolute bottom-0 right-0 w-96 h-96 translate-x-1/3 translate-y-1/3 rounded-full blur-3xl",
          isDark ? "bg-orange-600/10" : "bg-[hsl(30,45%,55%)]/15"
        )}
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity }}
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
        transition={{ duration: 0.8 }}
      >
        {/* Glitchy Icon - Vintage wax seal / copper coin styling */}
        <motion.div 
          className="relative mb-8 inline-block"
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, delay: 0.2 }}
        >
          <div className={cn(
            "w-28 h-28 rounded-3xl flex items-center justify-center relative",
            "border-2",
            isDark 
              ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.15)]"
              // Light: Vintage Banking copper wax seal with embossed effect
              : cn(
                  "bg-gradient-to-b from-[hsl(44,48%,97%)] to-[hsl(42,40%,93%)]",
                  "border-[hsl(25,45%,72%)]",
                  "shadow-[0_0_40px_hsl(25,50%,45%,0.15),inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_hsl(25,35%,70%,0.3)]"
                )
          )}>
            <motion.div
              animate={glitchActive ? { x: [-2, 2, -2, 0], y: [1, -1, 1, 0] } : {}}
              transition={{ duration: 0.1 }}
            >
              <Wrench className={cn(
                "w-14 h-14",
                isDark ? "text-amber-400" : "text-[hsl(25,75%,45%)]"
              )} strokeWidth={1.5} />
            </motion.div>
            
            {/* Decorative rings */}
            <motion.div 
              className={cn(
                "absolute inset-0 rounded-3xl border-2",
                isDark ? "border-amber-500/20" : "border-[hsl(25,50%,65%)]/30"
              )}
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Title with glitch effect */}
        <motion.div
          className="relative mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 
            className={cn(
              "text-5xl md:text-7xl font-black tracking-tighter uppercase",
              // Light: sepia ink with letterpress | Dark: white
              isDark ? "text-white" : "text-[hsl(25,35%,18%)]",
              !isDark && "[text-shadow:0_1px_0_rgba(255,255,255,0.7),0_-1px_0_rgba(101,67,33,0.1)]"
            )}
            style={{ fontFamily: "'Space Mono', 'Courier New', monospace" }}
          >
            <span className={cn(
              "relative inline-block",
              glitchActive && "animate-pulse"
            )}>
              UNDER
              {glitchActive && (
                <>
                  <span className="absolute inset-0 text-[hsl(355,45%,50%)]/70 dark:text-red-500/70 -translate-x-[2px]" aria-hidden>UNDER</span>
                  <span className="absolute inset-0 text-[hsl(25,60%,50%)]/70 dark:text-cyan-500/70 translate-x-[2px]" aria-hidden>UNDER</span>
                </>
              )}
            </span>
            <br />
            <span className={cn(
              "relative inline-block",
              // Light: copper accent | Dark: amber aurora
              isDark ? "text-amber-400" : "text-[hsl(25,75%,45%)]"
            )}>
              MAINTENANCE
              {glitchActive && (
                <>
                  <span className="absolute inset-0 text-[hsl(355,45%,50%)]/50 dark:text-red-500/50 -translate-x-[3px] translate-y-[1px]" aria-hidden>MAINTENANCE</span>
                  <span className="absolute inset-0 text-[hsl(25,60%,50%)]/50 dark:text-cyan-500/50 translate-x-[3px] -translate-y-[1px]" aria-hidden>MAINTENANCE</span>
                </>
              )}
            </span>
          </h1>
        </motion.div>

        {/* Status indicator bar */}
        <motion.div 
          className={cn(
            "h-1 w-48 mx-auto mb-8 rounded-full overflow-hidden",
            isDark ? "bg-white/10" : "bg-[hsl(30,25%,85%)]"
          )}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <motion.div 
            className={cn(
              "h-full rounded-full",
              // Light: copper | Dark: amber aurora
              isDark ? "bg-amber-500" : "bg-[hsl(25,75%,45%)]"
            )}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "50%" }}
          />
        </motion.div>

        {/* Reason */}
        <motion.p 
          className={cn(
            "text-lg md:text-xl max-w-md mx-auto mb-8 font-light",
            // Light: muted sepia | Dark: muted white
            isDark ? "text-white/60" : "text-[hsl(25,20%,45%)]"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {reason}
        </motion.p>

        {/* Estimated End Time Card - Vintage certificate styling */}
        {estimatedEndTime && (
          <motion.div 
            className={cn(
              "inline-block rounded-2xl p-6 mb-8 border",
              isDark 
                ? "bg-white/5 border-white/10 backdrop-blur-sm"
                // Light: Vintage Banking certificate with double-line border
                : cn(
                    "bg-gradient-to-b from-[hsl(44,48%,99%)] to-[hsl(42,40%,96%)]",
                    "border-[hsl(30,30%,78%)]",
                    "shadow-[0_8px_24px_hsl(25,35%,30%,0.1),0_0_0_1px_hsl(30,25%,85%),0_0_0_3px_hsl(42,45%,97%),0_0_0_4px_hsl(30,20%,80%)]"
                  )
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <Clock className={cn(
                "w-5 h-5",
                isDark ? "text-amber-400" : "text-[hsl(25,75%,45%)]"
              )} />
              <span className={cn(
                "text-sm font-semibold uppercase tracking-widest",
                isDark ? "text-amber-400" : "text-[hsl(25,60%,40%)]"
              )}>
                Estimated Return
              </span>
            </div>
            <p className={cn(
              "text-2xl font-bold tracking-tight",
              isDark ? "text-white" : "text-[hsl(25,35%,18%)]",
              !isDark && "[text-shadow:0_1px_0_rgba(255,255,255,0.6)] dark:[text-shadow:none]"
            )} style={{ fontFamily: "'Space Mono', monospace" }}>
              {formatEstimatedTime()}
            </p>
            {timeRemaining && (
              <p className={cn(
                "text-sm mt-2",
                isDark ? "text-white/40" : "text-[hsl(25,20%,50%)]"
              )}>
                ~{timeRemaining} remaining
              </p>
            )}
          </motion.div>
        )}

        {/* Refresh Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={checkMaintenanceStatus}
            disabled={isRefreshing}
            className={cn(
              "gap-3 px-8 py-6 text-base font-semibold uppercase tracking-wider border-2 rounded-xl",
              "transition-all duration-300",
              // Light: copper border | Dark: amber aurora
              isDark 
                ? "border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:border-amber-400"
                : "border-[hsl(25,55%,60%)] text-[hsl(25,60%,40%)] hover:bg-[hsl(38,35%,93%)]"
            )}
          >
            <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
            {isRefreshing ? 'Checking...' : 'Check Status'}
          </Button>
        </motion.div>

        {/* Auto-refresh indicator */}
        <motion.p 
          className={cn(
            "text-xs mt-6 font-mono",
            isDark ? "text-white/25" : "text-[hsl(25,15%,55%)]"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          Auto-check: 30s • Last: {lastChecked.toLocaleTimeString()}
        </motion.p>

        {/* Brand Footer */}
        <motion.div 
          className={cn(
            "mt-12 pt-8 border-t",
            isDark ? "border-white/5" : "border-[hsl(30,25%,88%)]"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          <p 
            className={cn(
              "text-2xl font-black tracking-tighter",
              // Light: faint copper | Dark: faint amber
              isDark ? "text-amber-500/30" : "text-[hsl(25,50%,75%)]"
            )}
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            STRIPULA
          </p>
          <p className={cn(
            "text-xs mt-1 uppercase tracking-[0.3em]",
            isDark ? "text-white/20" : "text-[hsl(25,15%,55%)]"
          )}>
            Back shortly
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default MaintenancePage;
