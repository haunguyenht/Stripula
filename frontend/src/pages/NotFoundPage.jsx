import { motion } from 'motion/react';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

/**
 * NotFoundPage - 404 Error Page with surreal floating/lost aesthetic
 * Features: floating elements, ethereal colors, disorienting animations
 * Light: Vintage Banking sepia/copper tones | Dark: Liquid Aurora indigo
 */
export function NotFoundPage({ onNavigateHome = null }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
      isDark ? "bg-[#08090f]" : "bg-[hsl(40,45%,96%)]"
    )}>
      {/* Ethereal gradient background with parallax */}
      <motion.div 
        className={cn(
          "absolute inset-0",
          isDark 
            ? "bg-gradient-to-br from-indigo-950/50 via-[#08090f] to-blue-950/40"
            // Light: warm sepia/copper wash
            : "bg-gradient-to-br from-[hsl(30,35%,92%)] via-[hsl(40,45%,96%)] to-[hsl(38,40%,94%)]"
        )}
        style={{
          transform: `translate(${(mousePos.x - 0.5) * 20}px, ${(mousePos.y - 0.5) * 20}px)`
        }}
      />

      {/* Floating orbs */}
      <motion.div 
        className={cn(
          "absolute w-96 h-96 rounded-full blur-[120px]",
          // Light: copper glow | Dark: indigo aurora
          isDark ? "bg-indigo-600/20" : "bg-[hsl(25,50%,60%)]/20"
        )}
        animate={{ 
          x: [0, 50, 0], 
          y: [0, -30, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 10, repeat: Infinity }}
        style={{ top: '10%', left: '10%' }}
      />
      <motion.div 
        className={cn(
          "absolute w-72 h-72 rounded-full blur-[100px]",
          isDark ? "bg-blue-500/15" : "bg-[hsl(38,45%,55%)]/20"
        )}
        animate={{ 
          x: [0, -40, 0], 
          y: [0, 40, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        style={{ bottom: '15%', right: '15%' }}
      />
      <motion.div 
        className={cn(
          "absolute w-48 h-48 rounded-full blur-[80px]",
          isDark ? "bg-purple-500/10" : "bg-[hsl(30,40%,65%)]/15"
        )}
        animate={{ 
          x: [0, 30, 0], 
          y: [0, 50, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, delay: 2 }}
        style={{ top: '40%', right: '25%' }}
      />

      {/* Subtle grid pattern */}
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none",
          isDark ? "opacity-[0.02]" : "opacity-[0.03]"
        )}
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Noise texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30 z-10 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
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
        transition={{ duration: 0.8 }}
      >
        {/* Floating 404 */}
        <motion.div 
          className="relative mb-2"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 12, delay: 0.1 }}
        >
          <motion.h1 
            className={cn(
              "text-[10rem] md:text-[14rem] font-black leading-none tracking-tighter select-none",
              // Light: faint sepia | Dark: faint white
              isDark ? "text-white/[0.04]" : "text-[hsl(25,35%,18%)]/[0.04]"
            )}
            style={{ fontFamily: "'Space Mono', 'Courier New', monospace" }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            404
          </motion.h1>
          
          {/* Layered glowing 404 */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <span 
              className={cn(
                "text-[10rem] md:text-[14rem] font-black tracking-tighter",
                // Light: copper gradient | Dark: indigo aurora
                isDark 
                  ? "text-transparent bg-gradient-to-b from-indigo-400 via-blue-400 to-indigo-500 bg-clip-text"
                  : "text-transparent bg-gradient-to-b from-[hsl(25,75%,45%)] via-[hsl(30,65%,50%)] to-[hsl(25,70%,42%)] bg-clip-text"
              )}
              style={{ fontFamily: "'Space Mono', 'Courier New', monospace" }}
            >
              404
            </span>
          </motion.div>
        </motion.div>

        {/* Floating icon - Copper Treasury Seal styling */}
        <motion.div 
          className="flex items-center justify-center -mt-16 mb-10 relative z-10"
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 15, delay: 0.3 }}
        >
          <motion.div 
            className={cn(
              "w-28 h-28 rounded-full flex items-center justify-center border-2 backdrop-blur-sm relative",
              isDark 
                ? "bg-indigo-500/10 border-indigo-400/30 shadow-[0_0_60px_rgba(99,102,241,0.2)]"
                // Light: Copper treasury seal with ornate embossing
                : cn(
                    "bg-gradient-to-b from-[hsl(42,52%,98%)] via-[hsl(40,48%,96%)] to-[hsl(38,42%,92%)]",
                    "border-[hsl(25,55%,55%)]",
                    // Treasury seal: triple ring + copper depth
                    "shadow-[0_0_0_3px_hsl(42,50%,97%),0_0_0_5px_hsl(25,45%,62%),0_0_0_7px_hsl(42,48%,96%),0_0_0_8px_hsl(25,40%,68%),0_16px_50px_hsl(25,55%,40%,0.15),inset_0_3px_6px_rgba(255,255,255,0.5),inset_0_-3px_6px_hsl(25,35%,75%,0.25)]"
                  )
            )}
            animate={{ y: [0, -8, 0], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            {/* Decorative inner ring - light mode only */}
            <div className="absolute inset-4 rounded-full border border-dashed border-[hsl(25,45%,70%)] opacity-40 dark:opacity-0" />
            {/* Inner ornamental circle */}
            <div className="absolute inset-6 rounded-full border-2 border-[hsl(25,50%,60%)] opacity-30 dark:opacity-0" />
            <FileQuestion className={cn(
              "w-12 h-12 relative z-10",
              isDark ? "text-indigo-400" : "text-[hsl(25,70%,42%)]",
              !isDark && "drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]"
            )} strokeWidth={1.5} />
          </motion.div>
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
          Lost in Space
        </motion.h2>

        {/* Decorative line */}
        <motion.div 
          className={cn(
            "w-24 h-1 mx-auto mb-6 rounded-full",
            // Light: copper gradient | Dark: indigo aurora
            isDark 
              ? "bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
              : "bg-gradient-to-r from-transparent via-[hsl(25,70%,50%)] to-transparent"
          )}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        />

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
          The page you're looking for doesn't exist or has drifted away.
        </motion.p>

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
              // Light: copper primary | Dark: indigo aurora
              isDark 
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.3)]"
                : "bg-[hsl(25,75%,45%)] hover:bg-[hsl(25,75%,40%)] text-white shadow-lg"
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
              // Light: sepia border | Dark: indigo border
              isDark 
                ? "border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-400"
                : "border-[hsl(30,30%,75%)] text-[hsl(25,50%,40%)] hover:bg-[hsl(38,35%,93%)]"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
        </motion.div>

        {/* Floating particles decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "absolute w-2 h-2 rounded-full",
                // Light: copper particles | Dark: indigo aurora
                isDark ? "bg-indigo-400/30" : "bg-[hsl(25,60%,55%)]/30"
              )}
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`
              }}
              animate={{ 
                y: [0, -30, 0],
                opacity: [0.3, 0.7, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 3 + i * 0.5, 
                repeat: Infinity,
                delay: i * 0.3
              }}
            />
          ))}
        </div>

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
              // Light: faint copper | Dark: faint indigo
              isDark ? "text-indigo-500/20" : "text-[hsl(25,50%,75%)]"
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

export default NotFoundPage;
