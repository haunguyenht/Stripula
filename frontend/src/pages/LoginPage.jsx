import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Sparkles, Clock, Zap, CreditCard, Shield, Award } from 'lucide-react';
import { TelegramLoginButton } from '@/components/auth/TelegramLoginButton';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useToast } from '@/hooks/useToast';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

/**
 * LoginPage - Luxury Fintech Terminal Aesthetic
 * 
 * Dark: Premium black card with gold accents, embossed textures, holographic shimmer
 * Light: Cream Paper with Copper Foil - Vintage Banking Elegance
 * 
 * Typography: Cormorant Garamond (serif luxury) + DM Sans (clean modern)
 */
export function LoginPage() {
  const { success, error } = useToast();
  const { theme } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleLoginSuccess = (result) => {
    // Always redirect to dashboard on successful login
    localStorage.setItem('appActiveRoute', 'dashboard');
    
    if (result.isNewUser) {
      success('Welcome! You received 25 starter credits.');
    } else {
      success('Welcome back!');
    }
  };

  const handleLoginError = (errorMsg) => {
    error(errorMsg || 'Login failed. Please try again.');
  };

  return (
    <div className={cn(
      "min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden",
      "selection:bg-amber-500/30"
    )}>
      {/* === BACKGROUNDS === */}
      {isDark ? <DarkBackground /> : <LightBackground />}
      
      {/* Theme Toggle - Floating pill */}
      <motion.div 
        className={cn(
          "fixed top-6 right-6 z-50",
        )}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <ThemeToggle />
      </motion.div>

      {/* === MAIN CARD === */}
      <motion.div
        className="relative z-20 w-full max-w-[440px]"
        initial={{ opacity: 0, y: 40, rotateX: 10 }}
        animate={isLoaded ? { opacity: 1, y: 0, rotateX: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ perspective: '1200px' }}
      >
        {isDark ? (
          <DarkCard onSuccess={handleLoginSuccess} onError={handleLoginError} />
        ) : (
          <LightCard onSuccess={handleLoginSuccess} onError={handleLoginError} />
        )}
      </motion.div>

      {/* Footer */}
      <motion.footer 
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3",
          isDark ? "text-amber-500/30" : "text-[hsl(25,35%,40%)]/40"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <div className="w-12 h-px bg-current" />
        <span className="text-[10px] tracking-[0.35em] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
          Est. 2024
        </span>
        <div className="w-12 h-px bg-current" />
      </motion.footer>
    </div>
  );
}

/**
 * Dark Mode: Obsidian Aurora Crystalline Card
 * 
 * Features liquid glass morphism, animated aurora gradients,
 * prismatic borders, and floating particle effects
 */
function DarkCard({ onSuccess, onError }) {
  return (
    <div className="relative group">
      {/* Animated aurora ambient glow */}
      <motion.div 
        className="absolute -inset-12 rounded-[60px] blur-3xl opacity-60"
        style={{
          background: 'conic-gradient(from 0deg, rgba(34,211,238,0.15), rgba(139,92,246,0.2), rgba(236,72,153,0.15), rgba(34,211,238,0.15))',
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Secondary pulse glow */}
      <motion.div 
        className="absolute -inset-8 rounded-[50px] blur-2xl"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.2) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Card shadow layers */}
      <div className="absolute inset-0 rounded-3xl bg-black/60 translate-y-6 blur-2xl" />
      <div className="absolute inset-0 rounded-3xl bg-violet-900/20 translate-y-3 blur-xl" />
      
      {/* Main card with prismatic border */}
      <div className={cn(
        "relative rounded-3xl overflow-hidden",
        "bg-[rgba(6,8,16,0.92)]",
        "backdrop-blur-[80px] backdrop-saturate-[200%]",
        // Prismatic aurora border
        "border-2 border-transparent",
        "[background-image:linear-gradient(to_bottom,rgba(6,8,16,0.92),rgba(10,12,22,0.92)),linear-gradient(135deg,rgba(34,211,238,0.5),rgba(139,92,246,0.4),rgba(236,72,153,0.4),rgba(34,211,238,0.5))]",
        "[background-origin:border-box] [background-clip:padding-box,border-box]",
        // Multi-layered aurora shadow
        "shadow-[0_30px_80px_-15px_rgba(0,0,0,0.9),0_0_100px_-25px_rgba(139,92,246,0.4),0_0_60px_-20px_rgba(34,211,238,0.3),0_0_40px_-12px_rgba(236,72,153,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]"
      )}>
        {/* Animated aurora top stripe */}
        <motion.div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.8) 25%, rgba(139,92,246,0.8) 50%, rgba(236,72,153,0.8) 75%, transparent 100%)',
          }}
          animate={{ 
            backgroundPosition: ['0% 0%', '200% 0%'],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        {/* Floating shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none"
          animate={{ translateX: ['-100%', '200%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
        />

        {/* Noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: 'var(--noise-pattern)' }}
        />

        {/* Aurora glow spots */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-violet-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-24 h-24 bg-pink-500/8 blur-2xl rounded-full pointer-events-none" />

        <div className="relative p-8 pt-10">
          {/* Top decorative aurora line */}
          <motion.div 
            className="flex items-center gap-4 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
            <motion.div
              animate={{ rotate: [0, 180, 360], scale: [1, 1.1, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <CreditCard className="w-5 h-5 text-cyan-400/70 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" strokeWidth={1.5} />
            </motion.div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
          </motion.div>

          {/* Brand with aurora text effect */}
          <motion.div 
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <motion.h1 
              className="text-5xl font-bold tracking-tight text-transparent bg-clip-text"
              style={{ 
                fontFamily: 'Playfair Display, serif',
                backgroundImage: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 35%, #ec4899 65%, #22d3ee 100%)',
                backgroundSize: '200% 200%',
              }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            >
              Stripula
            </motion.h1>
            <div className="flex items-center justify-center gap-3 mt-4">
              <motion.div 
                className="w-16 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.5))' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <p className="text-[10px] tracking-[0.3em] uppercase text-violet-300/60 font-mono">
                Premium Validation
              </p>
              <motion.div 
                className="w-16 h-px"
                style={{ background: 'linear-gradient(90deg, rgba(236,72,153,0.5), transparent)' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              />
            </div>
          </motion.div>

          {/* Login area - crystalline glass container */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className={cn(
              "relative p-6 rounded-2xl",
              "bg-white/[0.03] backdrop-blur-xl",
              // Prismatic inner border
              "border border-transparent",
              "[background-image:linear-gradient(to_bottom,rgba(255,255,255,0.03),rgba(255,255,255,0.01)),linear-gradient(135deg,rgba(34,211,238,0.3),rgba(139,92,246,0.25),rgba(236,72,153,0.25),rgba(34,211,238,0.3))]",
              "[background-origin:border-box] [background-clip:padding-box,border-box]",
              "shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_0_30px_-8px_rgba(139,92,246,0.3)]"
            )}>
              {/* Animated corner aurora accents */}
              <motion.div 
                className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-cyan-400/40 rounded-tl-lg"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div 
                className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-violet-400/40 rounded-tr-lg"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
              <motion.div 
                className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-violet-400/40 rounded-bl-lg"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              />
              <motion.div 
                className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-pink-400/40 rounded-br-lg"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
              />

              <p className="text-[9px] text-cyan-300/60 tracking-[0.25em] uppercase text-center mb-4 font-mono flex items-center justify-center gap-2">
                <Shield className="w-3 h-3" />
                Secure Access
              </p>
              <div className="flex justify-center">
                <TelegramLoginButton
                  buttonSize="large"
                  cornerRadius={14}
                  onSuccess={onSuccess}
                  onError={onError}
                />
              </div>
            </div>
          </motion.div>

          {/* Benefits row with aurora pills */}
          <motion.div
            className="grid grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <AuroraFeaturePill icon={Sparkles} value="25" label="Free" color="cyan" delay={0} />
            <AuroraFeaturePill icon={Clock} value="10" label="Daily" color="violet" delay={0.1} />
            <AuroraFeaturePill icon={Zap} value="0" label="Dead Fee" color="pink" delay={0.2} />
          </motion.div>
        </div>

        {/* Bottom bar with aurora gradient */}
        <div className="relative px-8 py-4 bg-black/40 border-t border-white/[0.06]">
          {/* Subtle aurora line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
          
          <div className="flex items-center justify-between text-[9px] font-mono tracking-wider">
            <span className="text-cyan-400/40">MEMBER ACCESS</span>
            <div className="flex gap-1.5">
              {[...Array(4)].map((_, i) => (
                <motion.div 
                  key={i} 
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: i === 0 ? 'rgba(34,211,238,0.5)' : 
                               i === 1 ? 'rgba(139,92,246,0.5)' : 
                               i === 2 ? 'rgba(236,72,153,0.5)' : 'rgba(34,211,238,0.5)'
                  }}
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>
            <span className="text-violet-400/40">ENCRYPTED</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * AuroraFeaturePill - Crystalline benefit pills with aurora glow
 */
function AuroraFeaturePill({ icon: Icon, value, label, color = 'cyan', delay = 0 }) {
  const colors = {
    cyan: {
      border: 'rgba(34,211,238,0.25)',
      glow: 'rgba(34,211,238,0.15)',
      icon: 'text-cyan-400',
      shadow: '0_0_20px_-4px_rgba(34,211,238,0.4)'
    },
    violet: {
      border: 'rgba(139,92,246,0.25)',
      glow: 'rgba(139,92,246,0.15)',
      icon: 'text-violet-400',
      shadow: '0_0_20px_-4px_rgba(139,92,246,0.4)'
    },
    pink: {
      border: 'rgba(236,72,153,0.25)',
      glow: 'rgba(236,72,153,0.15)',
      icon: 'text-pink-400',
      shadow: '0_0_20px_-4px_rgba(236,72,153,0.4)'
    }
  };
  
  const c = colors[color];
  
  return (
    <motion.div 
      className={cn(
        "relative text-center py-4 px-3 rounded-xl",
        "bg-white/[0.02] backdrop-blur-sm",
        "border border-white/[0.08]",
        "group/pill hover:bg-white/[0.05] transition-all duration-300"
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 + delay }}
      whileHover={{ 
        scale: 1.03,
        borderColor: c.border,
        boxShadow: c.shadow
      }}
    >
      {/* Glow on hover */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover/pill:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, ${c.glow}, transparent 70%)` }}
      />
      
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: delay }}
      >
        <Icon className={cn("w-4 h-4 mx-auto mb-2", c.icon, "drop-shadow-[0_0_6px_currentColor]")} />
      </motion.div>
      <div className="text-xl font-light text-white/90" style={{ fontFamily: 'Playfair Display, serif' }}>
        {value}
      </div>
      <div className="text-[8px] uppercase tracking-widest text-white/40 font-mono mt-1">{label}</div>
    </motion.div>
  );
}

/**
 * Light Mode: Cream Paper with Copper Foil - Vintage Banking Elegance
 * 
 * Design inspired by:
 * - 1920s bank certificates and stock bonds
 * - Art deco architectural details
 * - Copper foil hot stamping on luxury stationery
 * - Vintage typewriter and ledger aesthetics
 */
function LightCard({ onSuccess, onError }) {
  return (
    <div className="relative group">
      {/* Layered paper shadow - mimics stacked documents */}
      <div className="absolute inset-x-2 bottom-0 h-full rounded-2xl bg-[hsl(35,30%,88%)] translate-y-2 -z-10" />
      <div className="absolute inset-x-1 bottom-0 h-full rounded-2xl bg-[hsl(38,35%,90%)] translate-y-1 -z-10" />
      
      {/* Main card shadow */}
      <div className="absolute inset-0 rounded-2xl bg-[hsl(25,40%,35%)]/10 translate-y-4 blur-xl -z-20" />
      
      {/* Main card */}
      <div className={cn(
        "relative rounded-2xl overflow-hidden",
        "bg-gradient-to-b from-[hsl(40,50%,97%)] via-[hsl(38,45%,95%)] to-[hsl(35,40%,93%)]",
        "border border-[hsl(30,35%,75%)]/50",
        "shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_8px_32px_rgba(101,67,33,0.12)]"
      )}>
        {/* === TOP COPPER FOIL BAND === */}
        <div className="relative h-3 overflow-hidden">
          {/* Base copper gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(25,60%,35%)] via-[hsl(30,70%,50%)] to-[hsl(25,60%,35%)]" />
          {/* Foil shine effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            style={{ 
              animation: 'shimmer 4s ease-in-out infinite',
              backgroundSize: '200% 100%'
            }}
          />
          {/* Embossed line pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.3) 8px, rgba(0,0,0,0.3) 9px)',
            }}
          />
        </div>

        {/* === PAPER TEXTURE LAYERS === */}
        {/* Subtle grain texture */}
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none mix-blend-multiply"
          style={{ backgroundImage: 'var(--paper-grain)' }}
        />
        
        {/* Guilloche security pattern (like bank notes) */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ backgroundImage: 'var(--guilloche-pattern)' }}
        />
        
        {/* Watermark circles */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'var(--watermark-pattern)', backgroundSize: '200px 200px' }}
        />

        {/* Aged paper edge effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[hsl(30,30%,85%)]/20" />

        <div className="relative px-10 pt-8 pb-10">
          {/* === DECORATIVE HEADER CARTOUCHE === */}
          <motion.div 
            className="flex items-center justify-center gap-4 mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {/* Left ornamental line */}
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(25,50%,55%)]/40 to-[hsl(25,50%,55%)]/60" />
              <div className="w-1.5 h-1.5 rotate-45 border border-[hsl(25,50%,55%)]/40" />
            </div>
            
            {/* Central seal/medallion */}
            <div className="relative">
              {/* Outer ring */}
              <div className="w-14 h-14 rounded-full border-2 border-[hsl(25,50%,55%)]/30 flex items-center justify-center">
                {/* Inner ring with pattern */}
                <div className="w-11 h-11 rounded-full border border-[hsl(25,50%,55%)]/20 flex items-center justify-center bg-gradient-to-br from-[hsl(40,45%,95%)] to-[hsl(35,40%,92%)]">
                  <Shield className="w-5 h-5 text-[hsl(25,60%,45%)]" strokeWidth={1.5} />
                </div>
              </div>
              {/* Decorative dots around seal */}
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-[hsl(25,50%,55%)]/25"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 45}deg) translateY(-32px) translateX(-50%)`
                  }}
                />
              ))}
            </div>
            
            {/* Right ornamental line */}
            <div className="flex-1 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rotate-45 border border-[hsl(25,50%,55%)]/40" />
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[hsl(25,50%,55%)]/40 to-[hsl(25,50%,55%)]/60" />
            </div>
          </motion.div>

          {/* === BRAND TYPOGRAPHY === */}
          <motion.div 
            className="text-center mb-10"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {/* Main title with copper foil effect */}
            <h1 
              className="text-5xl font-semibold tracking-wide text-transparent bg-clip-text"
              style={{ 
                fontFamily: 'var(--font-heading)',
                backgroundImage: 'linear-gradient(180deg, hsl(25,55%,40%) 0%, hsl(30,70%,50%) 50%, hsl(25,55%,38%) 100%)',
                textShadow: '0 1px 0 rgba(255,255,255,0.3)'
              }}
            >
              Stripula
            </h1>
            
            {/* Subtitle with vintage typography */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="w-8 h-px bg-[hsl(25,40%,60%)]/30" />
              <p 
                className="text-[11px] tracking-[0.25em] uppercase text-[hsl(25,30%,45%)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Card Validation Bureau
              </p>
              <div className="w-8 h-px bg-[hsl(25,40%,60%)]/30" />
            </div>
          </motion.div>

          {/* === LOGIN SECTION === */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {/* Decorative frame around login */}
            <div className={cn(
              "relative p-6 rounded-xl",
              "bg-gradient-to-b from-[hsl(42,50%,98%)] to-[hsl(40,45%,96%)]",
              "border border-[hsl(30,40%,78%)]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_2px_rgba(101,67,33,0.05)]"
            )}>
              {/* Art deco corner decorations */}
              <div className="absolute top-0 left-0 w-6 h-6">
                <div className="absolute top-1.5 left-1.5 w-3 h-px bg-[hsl(25,50%,55%)]/40" />
                <div className="absolute top-1.5 left-1.5 w-px h-3 bg-[hsl(25,50%,55%)]/40" />
              </div>
              <div className="absolute top-0 right-0 w-6 h-6">
                <div className="absolute top-1.5 right-1.5 w-3 h-px bg-[hsl(25,50%,55%)]/40" />
                <div className="absolute top-1.5 right-1.5 w-px h-3 bg-[hsl(25,50%,55%)]/40" />
              </div>
              <div className="absolute bottom-0 left-0 w-6 h-6">
                <div className="absolute bottom-1.5 left-1.5 w-3 h-px bg-[hsl(25,50%,55%)]/40" />
                <div className="absolute bottom-1.5 left-1.5 w-px h-3 bg-[hsl(25,50%,55%)]/40" />
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6">
                <div className="absolute bottom-1.5 right-1.5 w-3 h-px bg-[hsl(25,50%,55%)]/40" />
                <div className="absolute bottom-1.5 right-1.5 w-px h-3 bg-[hsl(25,50%,55%)]/40" />
              </div>

              {/* Stamp-style label */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="relative px-4 py-1.5 bg-[hsl(38,45%,95%)] border border-[hsl(30,40%,78%)] rounded-full shadow-sm">
                  <span 
                    className="text-[9px] uppercase tracking-[0.2em] text-[hsl(25,50%,45%)] font-medium"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    Secure Access
                  </span>
                </div>
              </div>

              <div className="flex justify-center pt-3">
                <TelegramLoginButton
                  buttonSize="large"
                  cornerRadius={10}
                  onSuccess={onSuccess}
                  onError={onError}
                />
              </div>
            </div>
          </motion.div>

          {/* === BENEFITS SECTION === */}
          <motion.div
            className="grid grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <VintageBadge icon={Sparkles} value="25" label="Credits Free" />
            <VintageBadge icon={Clock} value="10" label="Daily Claim" />
            <VintageBadge icon={Award} value="∞" label="Free Declines" />
          </motion.div>
        </div>

        {/* === BOTTOM CERTIFICATE RIBBON === */}
        <div className="relative px-8 py-4 bg-gradient-to-b from-[hsl(35,35%,90%)] to-[hsl(32,30%,88%)] border-t border-[hsl(30,30%,80%)]">
          {/* Decorative pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, hsl(25,40%,50%) 4px, hsl(25,40%,50%) 5px)',
            }}
          />
          
          <div className="relative flex items-center justify-center gap-3">
            <div className="w-2 h-2 rotate-45 border border-[hsl(25,40%,55%)]/30 bg-[hsl(38,45%,93%)]" />
            <p 
              className="text-[10px] text-[hsl(25,30%,45%)] tracking-[0.2em] uppercase"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Only Pay for Live Cards
            </p>
            <div className="w-2 h-2 rotate-45 border border-[hsl(25,40%,55%)]/30 bg-[hsl(38,45%,93%)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * VintageBadge - Art deco styled benefit badges
 */
function VintageBadge({ icon: Icon, value, label }) {
  return (
    <div className="text-center group">
      {/* Icon container with vintage frame */}
      <div className={cn(
        "relative inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3",
        "bg-gradient-to-b from-[hsl(40,50%,97%)] to-[hsl(38,45%,94%)]",
        "border border-[hsl(30,35%,78%)]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_4px_rgba(101,67,33,0.08)]",
        "group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(166,100,50,0.15)]",
        "transition-shadow duration-300"
      )}>
        {/* Inner decorative border */}
        <div className="absolute inset-1 rounded-md border border-[hsl(25,40%,70%)]/20" />
        <Icon className="w-5 h-5 text-[hsl(25,60%,45%)] relative z-10" strokeWidth={1.5} />
      </div>
      
      {/* Value with vintage typography */}
      <div 
        className="text-2xl font-semibold text-[hsl(25,40%,30%)]"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {value}
      </div>
      
      {/* Label */}
      <div 
        className="text-[9px] text-[hsl(25,20%,50%)] uppercase tracking-[0.15em] mt-1"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </div>
    </div>
  );
}

/**
 * Dark Background - Obsidian Aurora with animated nebula effects
 */
function DarkBackground() {
  return (
    <>
      {/* Base cosmic gradient */}
      <div 
        className="fixed inset-0 -z-20"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #0a0c14 0%, #060810 40%, #020204 100%)',
        }}
      />
      
      {/* Animated aurora nebula layers */}
      <motion.div 
        className="fixed inset-0 -z-18 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 20% 20%, rgba(34,211,238,0.15) 0%, transparent 50%)',
        }}
        animate={{ 
          opacity: [0.2, 0.35, 0.2],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="fixed inset-0 -z-18 opacity-25"
        style={{
          background: 'radial-gradient(ellipse at 80% 30%, rgba(139,92,246,0.15) 0%, transparent 50%)',
        }}
        animate={{ 
          opacity: [0.15, 0.3, 0.15],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div 
        className="fixed inset-0 -z-18 opacity-20"
        style={{
          background: 'radial-gradient(ellipse at 60% 80%, rgba(236,72,153,0.12) 0%, transparent 50%)',
        }}
        animate={{ 
          opacity: [0.1, 0.25, 0.1],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />
      
      {/* Aurora star particles */}
      <div 
        className="fixed inset-0 -z-15 opacity-50"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 15% 25%, rgba(34,211,238,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 85% 15%, rgba(139,92,246,0.35) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 45% 65%, rgba(236,72,153,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 75% 55%, rgba(34,211,238,0.35) 0%, transparent 100%),
            radial-gradient(1px 1px at 25% 75%, rgba(139,92,246,0.3) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 55% 35%, rgba(236,72,153,0.25) 0%, transparent 100%),
            radial-gradient(1px 1px at 95% 85%, rgba(34,211,238,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 5% 45%, rgba(139,92,246,0.35) 0%, transparent 100%)
          `,
        }}
      />

      {/* Subtle hex grid pattern */}
      <div 
        className="fixed inset-0 -z-14 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%238b5cf6' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Deep vignette */}
      <div 
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.6) 100%)',
        }}
      />
    </>
  );
}

/**
 * Light Background - Vintage Cream Paper with warm undertones
 */
function LightBackground() {
  return (
    <>
      {/* Base cream gradient - aged paper effect */}
      <div 
        className="fixed inset-0 -z-20"
        style={{
          background: 'linear-gradient(180deg, hsl(40,50%,96%) 0%, hsl(38,45%,94%) 50%, hsl(35,40%,91%) 100%)',
        }}
      />
      
      {/* Warm radial gradients - like sun-bleached areas */}
      <div 
        className="fixed inset-0 -z-15"
        style={{
          background: 'radial-gradient(ellipse at 20% 10%, hsla(35,70%,80%,0.15) 0%, transparent 50%)',
        }}
      />
      <div 
        className="fixed inset-0 -z-15"
        style={{
          background: 'radial-gradient(ellipse at 80% 90%, hsla(25,60%,75%,0.12) 0%, transparent 50%)',
        }}
      />

      {/* Paper grain texture */}
      <div 
        className="fixed inset-0 -z-10 opacity-60"
        style={{ backgroundImage: 'var(--paper-grain)' }}
      />
      
      {/* Subtle guilloche pattern overlay */}
      <div 
        className="fixed inset-0 -z-10 opacity-15"
        style={{ backgroundImage: 'var(--guilloche-pattern)' }}
      />

      {/* Vignette - darker edges like aged paper */}
      <div 
        className="fixed inset-0 -z-5 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, hsla(30,30%,60%,0.08) 100%)',
        }}
      />
    </>
  );
}

export default LoginPage;
