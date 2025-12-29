import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo } from 'react';
import {
  StarFilledIcon,
  CountdownTimerIcon,
  RocketIcon,
} from '@radix-ui/react-icons';
import { TelegramLoginButton } from '@/components/auth/TelegramLoginButton';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { CursorSpotlight, GradientMesh, FloatingParticles } from '@/components/effects';
import { useTiltEffect } from '@/hooks/useTiltEffect';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/motion';

/**
 * LoginPage Component - Cinematic Redesign
 * 
 * Immersive two-panel card layout with:
 * - Light mode: Animated gradient mesh with morphing orbs
 * - Dark mode: Aurora waves with floating particles
 * - 3D card tilt effect following cursor
 * - Staggered entrance animations
 * - Character-by-character text reveal
 * 
 * Requirements: 1.1
 */
export function LoginPage() {
  const { success, error } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);
  const reducedMotion = prefersReducedMotion();

  // 3D tilt effect for the card
  const { ref: cardRef, style: tiltStyle, glareStyle, handlers: tiltHandlers } = useTiltEffect({
    maxTilt: 8,
    scale: 1.01,
    perspective: 1200,
    glare: true,
    glareOpacity: 0.1,
  });

  useEffect(() => {
    // Trigger entrance animations after mount
    const timer = setTimeout(() => setIsLoaded(true), 100);
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 40, 
      scale: 0.95,
      filter: 'blur(10px)',
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const panelVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const rightPanelVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 sm:p-8 lg:p-12 relative overflow-hidden">
      {/* Background Effects */}
      <GradientMesh />
      <FloatingParticles count={35} showAurora={true} />
      <CursorSpotlight 
        color="rgba(255, 100, 50, 0.12)"
        darkColor="rgba(100, 150, 255, 0.1)"
        size={700}
        opacity={0.25}
        breathe={true}
      />
      
      {/* Dark mode tile background */}
      <div className="fixed inset-0 -z-20 hidden dark:block bg-opux-tile" />
      
      {/* Dark mode vignette overlay */}
      <div className="fixed inset-0 pointer-events-none hidden dark:block bg-opux-vignette z-10" />

      {/* Theme Toggle - Fixed Top Right */}
      <motion.div 
        className="fixed top-4 right-4 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <ThemeToggle />
      </motion.div>

      {/* Main Card Container */}
      <motion.div
        className="relative z-20 w-full max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
      >
        {/* Card with 3D tilt effect */}
        <motion.div
          ref={cardRef}
          variants={cardVariants}
          className={cn(
            "relative rounded-[28px] overflow-hidden",
            // Light mode styling
            "bg-white/90 backdrop-blur-xl",
            "border border-gray-200/80",
            "shadow-[0_8px_40px_rgba(0,0,0,0.08),0_20px_60px_rgba(0,0,0,0.06)]",
            // Dark mode styling
            "dark:bg-[#0d1320]/85 dark:backdrop-blur-2xl",
            "dark:border-white/[0.12]",
            "dark:shadow-[0_0_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]",
            // Hover effects
            "transition-shadow duration-500",
            "hover:shadow-[0_12px_50px_rgba(0,0,0,0.12),0_30px_80px_rgba(0,0,0,0.08)]",
            "dark:hover:shadow-[0_0_100px_rgba(0,0,0,0.6),0_0_40px_rgba(100,150,255,0.1)]",
            "dark:hover:border-white/[0.18]"
          )}
          style={tiltStyle}
          {...tiltHandlers}
        >
          {/* Glare effect overlay */}
          <div style={glareStyle} className="z-10" />
          
          {/* Animated border glow on hover (dark mode) */}
          <div className="absolute inset-0 rounded-[28px] opacity-0 dark:group-hover:opacity-100 transition-opacity duration-500 pointer-events-none
                          bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />

          {/* Two Panel Layout */}
          <div className="flex flex-col lg:flex-row relative z-10">
            
            {/* Left Panel - Visual Showcase */}
            <motion.div
              className="relative flex-1 flex flex-col items-center justify-center p-8 lg:p-12
                         min-h-[320px] lg:min-h-[540px]
                         overflow-hidden
                         bg-gradient-to-br from-gray-50/50 to-gray-100/30 dark:bg-transparent"
              variants={panelVariants}
            >
              {/* Dark mode: Enhanced glow effect */}
              <div className="absolute inset-0 hidden dark:flex items-center justify-center overflow-hidden">
                <motion.div 
                  className="w-[400px] h-[400px] rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(100, 150, 255, 0.15) 0%, rgba(150, 100, 200, 0.08) 40%, transparent 70%)',
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.7, 0.5],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>

              {/* Content Container */}
              <div className="relative w-full max-w-[240px] lg:max-w-[280px]">
                {/* Visual Element */}
                <motion.div
                  className="relative aspect-square"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Light mode: Animated Gradient Card */}
                  <motion.div 
                    className="dark:hidden relative w-full h-full rounded-3xl overflow-hidden
                               border-t-[10px] border-b-[10px] border-white
                               ring-1 ring-black/5"
                    animate={reducedMotion ? {} : { 
                      y: [0, -10, 0],
                      boxShadow: [
                        '0 20px 40px rgba(0,0,0,0.1), 0 8px 20px rgba(0,0,0,0.08)',
                        '0 30px 60px rgba(0,0,0,0.15), 0 15px 30px rgba(0,0,0,0.1)',
                        '0 20px 40px rgba(0,0,0,0.1), 0 8px 20px rgba(0,0,0,0.08)'
                      ]
                    }}
                    transition={{ 
                      duration: 5,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    {/* Animated gradient background */}
                    <div 
                      className={cn(
                        "absolute inset-0",
                        !reducedMotion && "animate-gradient-flow"
                      )}
                      style={{
                        background: 'linear-gradient(180deg, #ff6b3d 0%, #f97316 12%, #ec4899 30%, #a855f7 50%, #3b82f6 70%, #06b6d4 85%, #10b981 100%)',
                        backgroundSize: '100% 600%',
                      }} 
                    />
                    
                    {/* Shine overlay */}
                    <div className="absolute inset-0 opacity-60
                                    bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.8),transparent_50%)]" />
                    
                    {/* Subtle pattern overlay */}
                    <div 
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: 'var(--noise-pattern-subtle)',
                        backgroundSize: '128px 128px',
                        mixBlendMode: 'overlay',
                      }}
                    />
                  </motion.div>
                  
                  {/* Dark mode: GIF with enhanced effects */}
                  <motion.div 
                    className="hidden dark:block relative w-full h-full"
                    style={{
                      maskImage: 'radial-gradient(circle, white 40%, transparent 70%)',
                      WebkitMaskImage: 'radial-gradient(circle, white 40%, transparent 70%)'
                    }}
                    animate={reducedMotion ? {} : {
                      scale: [1, 1.02, 1],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <img
                      src="/spinning-diamond.gif"
                      alt="Spinning Diamond"
                      loading="lazy"
                      className="w-full h-full object-contain mix-blend-plus-lighter"
                    />
                    
                    {/* Particle trail effect around diamond */}
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1.5 h-1.5 rounded-full bg-blue-400/60"
                          style={{
                            left: '50%',
                            top: '50%',
                          }}
                          animate={reducedMotion ? {} : {
                            x: [0, Math.cos((i / 6) * Math.PI * 2) * 60, 0],
                            y: [0, Math.sin((i / 6) * Math.PI * 2) * 60, 0],
                            opacity: [0.2, 0.8, 0.2],
                            scale: [0.5, 1.2, 0.5],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                </motion.div>

                {/* Brand text with character animation */}
                <motion.div
                  className="mt-6 text-center"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
                    <AnimatedText text="Stripula" delay={0.7} />
                  </h1>
                  <motion.p 
                    className="mt-1.5 text-sm text-gray-500 dark:text-white/60"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.4 }}
                  >
                    Fast & reliable card validation
                  </motion.p>
                </motion.div>
              </div>
            </motion.div>

            {/* Divider with animation */}
            <motion.div 
              className="hidden lg:block w-px relative"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'center' }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-200 to-transparent dark:via-white/10" />
            </motion.div>
            <motion.div 
              className="lg:hidden h-px mx-10 relative"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'center' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-white/10" />
            </motion.div>

            {/* Right Panel - Login */}
            <motion.div
              className="relative flex-1 flex items-center justify-center p-8 lg:p-12
                         min-h-[340px] lg:min-h-[540px]"
              variants={rightPanelVariants}
            >
              <div className="w-full max-w-[300px] space-y-6">
                {/* Header with animated text */}
                <motion.div
                  className="text-center space-y-2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                    <AnimatedText text="Welcome" delay={0.5} />
                  </h2>
                  <motion.p 
                    className="text-sm text-gray-500 dark:text-white/60"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.4 }}
                  >
                    Sign in with Telegram to continue
                  </motion.p>
                </motion.div>

                {/* Telegram Login Button with glow effect */}
                <motion.div
                  className="flex justify-center py-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className={cn(
                    "relative rounded-xl",
                    !reducedMotion && "animate-telegram-pulse"
                  )}>
                    <TelegramLoginButton
                      buttonSize="large"
                      cornerRadius={12}
                      onSuccess={handleLoginSuccess}
                      onError={handleLoginError}
                    />
                  </div>
                </motion.div>

                {/* Divider with expand animation */}
                <motion.div
                  className="flex items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  <motion.div 
                    className="flex-1 h-px bg-gray-200 dark:bg-white/10"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    style={{ transformOrigin: 'right' }}
                  />
                  <span className="text-[10px] font-medium text-gray-400 dark:text-white/40 uppercase tracking-wider">
                    New here?
                  </span>
                  <motion.div 
                    className="flex-1 h-px bg-gray-200 dark:bg-white/10"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    style={{ transformOrigin: 'left' }}
                  />
                </motion.div>

                {/* Benefits with staggered animation */}
                <motion.div
                  className="space-y-3"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: {
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.9,
                      },
                    },
                  }}
                >
                  <BenefitItem 
                    icon={StarFilledIcon} 
                    text="25 free credits on signup" 
                    iconColor="text-amber-500"
                    iconBg="bg-amber-100 dark:bg-amber-500/15"
                    delay={0}
                  />
                  <BenefitItem 
                    icon={CountdownTimerIcon} 
                    text="10 daily credits (free tier)" 
                    iconColor="text-sky-500"
                    iconBg="bg-sky-100 dark:bg-sky-500/15"
                    delay={0.1}
                  />
                  <BenefitItem 
                    icon={RocketIcon} 
                    text="Pay only for LIVE cards" 
                    iconColor="text-emerald-500"
                    iconBg="bg-emerald-100 dark:bg-emerald-500/15"
                    delay={0.2}
                  />
                </motion.div>

                {/* Footer */}
                <motion.p
                  className="text-center text-[11px] text-gray-400 dark:text-white/40 pt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3, duration: 0.4 }}
                >
                  Dev by Howard
                </motion.p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * AnimatedText - Character-by-character text reveal animation
 */
function AnimatedText({ text, delay = 0, className }) {
  const reducedMotion = prefersReducedMotion();
  
  const characters = useMemo(() => text.split(''), [text]);

  if (reducedMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={cn("inline-block", className)}>
      {characters.map((char, index) => (
        <motion.span
          key={index}
          className="inline-block"
          initial={{ opacity: 0, y: 20, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            delay: delay + index * 0.05,
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ transformOrigin: 'bottom' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * BenefitItem - Animated benefit item with hover effects
 */
function BenefitItem({ icon: Icon, text, iconColor, iconBg, delay = 0 }) {
  const reducedMotion = prefersReducedMotion();
  
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.div 
      className="flex items-center gap-3 group cursor-default"
      variants={itemVariants}
    >
      <motion.div 
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-xl transition-transform duration-200",
          iconBg,
          !reducedMotion && "group-hover:scale-110"
        )}
        whileHover={reducedMotion ? {} : { scale: 1.1, rotate: 5 }}
        whileTap={reducedMotion ? {} : { scale: 0.95 }}
      >
        <Icon className={cn("w-4 h-4", iconColor)} />
      </motion.div>
      <span className="text-[13px] text-gray-600 dark:text-white/70 group-hover:text-gray-800 dark:group-hover:text-white/90 transition-colors duration-200">
        {text}
      </span>
    </motion.div>
  );
}

export default LoginPage;
