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
 * Dark Mode: Premium Black Card with Gold Embossing
 */
function DarkCard({ onSuccess, onError }) {
  return (
    <div className="relative group">
      {/* Ambient glow */}
      <div className="absolute -inset-8 bg-gradient-to-b from-amber-500/10 via-transparent to-amber-500/5 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Card shadow layers */}
      <div className="absolute inset-0 rounded-3xl bg-black/40 translate-y-4 blur-xl" />
      <div className="absolute inset-0 rounded-3xl bg-amber-900/10 translate-y-2 blur-md" />
      
      {/* Main card */}
      <div className={cn(
        "relative rounded-3xl overflow-hidden",
        "bg-gradient-to-br from-zinc-900 via-neutral-900 to-zinc-950",
        "border border-amber-500/10",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
      )}>
        {/* Holographic shimmer stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" 
          style={{ 
            animation: 'shimmer 3s ease-in-out infinite',
          }}
        />

        {/* Noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: 'var(--noise-pattern)' }}
        />

        {/* Embossed pattern - subtle diagonal lines */}
        <div 
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 11px)',
          }}
        />

        <div className="relative p-8 pt-10">
          {/* Top decorative line */}
          <motion.div 
            className="flex items-center gap-4 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
            <CreditCard className="w-5 h-5 text-amber-500/50" strokeWidth={1} />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
          </motion.div>

          {/* Brand */}
          <motion.div 
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <h1 
              className="text-4xl font-serif tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Stripula
            </h1>
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-amber-500/30" />
              <p className="text-[10px] tracking-[0.25em] uppercase text-amber-500/40 font-mono">
                Premium Validation
              </p>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-amber-500/30" />
            </div>
          </motion.div>

          {/* Login area */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className={cn(
              "relative p-5 rounded-2xl",
              "bg-black/40 backdrop-blur-sm",
              "border border-amber-500/10",
              "shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
            )}>
              {/* Corner accents */}
              <div className="absolute top-2 left-2 w-3 h-3 border-l border-t border-amber-500/20 rounded-tl" />
              <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-amber-500/20 rounded-tr" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-amber-500/20 rounded-bl" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-amber-500/20 rounded-br" />

              <p className="text-[9px] text-amber-500/50 tracking-[0.2em] uppercase text-center mb-4 font-mono">
                Secure Access
              </p>
              <div className="flex justify-center">
                <TelegramLoginButton
                  buttonSize="large"
                  cornerRadius={12}
                  onSuccess={onSuccess}
                  onError={onError}
                />
              </div>
            </div>
          </motion.div>

          {/* Benefits row */}
          <motion.div
            className="grid grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <FeaturePill icon={Sparkles} value="25" label="Free" />
            <FeaturePill icon={Clock} value="10" label="Daily" />
            <FeaturePill icon={Zap} value="0" label="Dead Fee" />
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="px-8 py-4 bg-black/30 border-t border-amber-500/5">
          <div className="flex items-center justify-between text-[9px] text-amber-500/30 font-mono tracking-wider">
            <span>MEMBER ACCESS</span>
            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-amber-500/30" />
              ))}
            </div>
            <span>ENCRYPTED</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturePill({ icon: Icon, value, label }) {
  return (
    <div className={cn(
      "relative text-center py-3 px-2 rounded-xl",
      "bg-gradient-to-b from-amber-500/5 to-transparent",
      "border border-amber-500/10",
      "group/pill hover:border-amber-500/20 transition-colors duration-300"
    )}>
      <Icon className="w-4 h-4 mx-auto mb-1.5 text-amber-500/50 group-hover/pill:text-amber-500/70 transition-colors" />
      <div className="text-lg font-light text-amber-100/90" style={{ fontFamily: 'Playfair Display, serif' }}>
        {value}
      </div>
      <div className="text-[8px] uppercase tracking-widest text-amber-500/40 font-mono">{label}</div>
    </div>
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
 * Dark Background - Deep black with subtle golden dust
 */
function DarkBackground() {
  return (
    <>
      {/* Base gradient */}
      <div 
        className="fixed inset-0 -z-20"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #1a1814 0%, #0d0c0a 40%, #000 100%)',
        }}
      />
      
      {/* Golden dust particles - CSS only */}
      <div 
        className="fixed inset-0 -z-15 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 20% 30%, rgba(251,191,36,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 80% 20%, rgba(251,191,36,0.2) 0%, transparent 100%),
            radial-gradient(1px 1px at 40% 70%, rgba(251,191,36,0.25) 0%, transparent 100%),
            radial-gradient(1px 1px at 70% 60%, rgba(251,191,36,0.15) 0%, transparent 100%),
            radial-gradient(1px 1px at 10% 80%, rgba(251,191,36,0.2) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 90%, rgba(251,191,36,0.25) 0%, transparent 100%)
          `,
        }}
      />

      {/* Subtle vignette */}
      <div 
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
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
