import { motion } from 'motion/react';
import {
  StarFilledIcon,
  CountdownTimerIcon,
  RocketIcon,
} from '@radix-ui/react-icons';
import { TelegramLoginButton } from '@/components/auth/TelegramLoginButton';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

/**
 * LoginPage Component
 * Two-panel card layout with GIF showcase and minimal Telegram SSO
 * Light mode: Clean white with orange accents
 * Dark mode: OPUX tiled background with glass card
 * 
 * Requirements: 1.1
 */
export function LoginPage() {
  const { success, error } = useToast();

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
    <div className="min-h-screen w-full flex items-center justify-center p-6 sm:p-8 lg:p-12
                    bg-[#f0f2f5] dark:bg-opux-grainy">
      
      {/* Dark mode vignette overlay */}
      <div className="fixed inset-0 pointer-events-none hidden dark:block bg-opux-vignette" />

      {/* Theme Toggle - Fixed Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Main Card Container */}
      <motion.div
        className="relative z-10 w-full max-w-4xl"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Background blur layer */}
        <div className="absolute inset-0 -z-10 scale-[1.03] rounded-[40px]
                        dark:bg-opux-grainy dark:blur-sm dark:opacity-50" />
                        
        {/* Card Wrapper */}
        <div className="relative rounded-[28px] overflow-hidden
                        bg-white dark:bg-[#0d1320]/80
                        backdrop-blur-xl
                        border border-gray-200/80 dark:border-white/[0.1]
                        shadow-[0_4px_6px_rgba(0,0,0,0.05),0_10px_30px_rgba(0,0,0,0.1),0_20px_50px_rgba(0,0,0,0.05)]
                        dark:shadow-none
                        transition-all duration-500 ease-out
                        hover:shadow-[0_10px_40px_rgba(0,0,0,0.12),0_30px_80px_rgba(0,0,0,0.08)]
                        dark:hover:shadow-[0_0_70px_rgba(17,17,17,0.8)]
                        dark:hover:border-white/[0.15]
                        group">
          
          {/* Circle light effect on hover */}
          <div className="absolute top-0 left-0 w-full h-full rounded-[28px] pointer-events-none
                          opacity-0 group-hover:opacity-40 transition-opacity duration-500
                          bg-[radial-gradient(circle_at_100px_50px,rgba(255,255,255,0.8),transparent_50%)]
                          dark:bg-[radial-gradient(circle_at_80px_40px,rgba(255,255,255,0.15),transparent_50%)]" />

          {/* Two Panel Layout */}
          <div className="flex flex-col lg:flex-row">
            
            {/* Left Panel - GIF/Gradient Showcase */}
            <motion.div
              className="relative flex-1 flex flex-col items-center justify-center p-6 lg:p-10
                         min-h-[320px] lg:min-h-[520px]
                         overflow-hidden
                         bg-slate-50 dark:bg-transparent"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {/* Dark mode: Subtle center glow */}
              <div className="absolute inset-0 hidden dark:flex items-center justify-center overflow-hidden">
                <div className="w-[350px] h-[350px] rounded-full
                                bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10
                                blur-3xl" />
              </div>

              {/* Content Container */}
              <div className="relative w-full max-w-[220px] lg:max-w-[260px]">
                <motion.div
                  className="relative aspect-square"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Light mode: CSS Animated Gradient Card */}
                  <motion.div 
                    className="dark:hidden relative w-full h-full rounded-2xl overflow-hidden
                               border-t-8 border-b-8 border-white
                               ring-1 ring-black/5"
                    animate={{ 
                      y: [0, -8, 0],
                      boxShadow: [
                        '0 15px 35px rgba(0,0,0,0.12), 0 5px 15px rgba(0,0,0,0.08)',
                        '0 25px 50px rgba(0,0,0,0.15), 0 10px 25px rgba(0,0,0,0.1)',
                        '0 15px 35px rgba(0,0,0,0.12), 0 5px 15px rgba(0,0,0,0.08)'
                      ]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 animate-gradient-flow"
                         style={{
                           background: 'linear-gradient(180deg, #ff6b3d 0%, #f97316 15%, #ec4899 35%, #a855f7 55%, #3b82f6 75%, #06b6d4 90%, #ff6b3d 100%)',
                           backgroundSize: '100% 800%',
                         }} />
                    
                    {/* Circle light effect */}
                    <div className="absolute inset-0 opacity-50
                                    bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.8),transparent_50%)]" />
                  </motion.div>
                  
                  {/* Dark mode: GIF with blend + mask for transparency */}
                  <div className="hidden dark:block relative w-full h-full"
                       style={{
                         maskImage: 'radial-gradient(circle, white 45%, transparent 72%)',
                         WebkitMaskImage: 'radial-gradient(circle, white 45%, transparent 72%)'
                       }}>
                    <img
                      src="/spinning-diamond.gif"
                      alt="Spinning Diamond"
                      loading="lazy"
                      className="w-full h-full object-contain mix-blend-plus-lighter"
                    />
                  </div>
                </motion.div>

                {/* Brand text below */}
                <motion.div
                  className="mt-5 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <h1 className="text-lg lg:text-xl font-bold text-gray-800 dark:text-white">
                    Stripula
                  </h1>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-white/60">
                    Fast & reliable card validation
                  </p>
                </motion.div>
              </div>
            </motion.div>

            {/* Divider */}
            <div className="hidden lg:block w-px
                            bg-gradient-to-b from-transparent via-gray-200 to-transparent
                            dark:via-white/10" />
            <div className="lg:hidden h-px mx-10
                            bg-gradient-to-r from-transparent via-gray-200 to-transparent
                            dark:via-white/10" />

            {/* Right Panel - Login */}
            <motion.div
              className="relative flex-1 flex items-center justify-center p-6 lg:p-10
                         min-h-[320px] lg:min-h-[520px]"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="w-full max-w-[280px] space-y-5">
                {/* Header */}
                <motion.div
                  className="text-center space-y-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Welcome
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-white/60">
                    Sign in with Telegram to continue
                  </p>
                </motion.div>

                {/* Telegram Login Button */}
                <motion.div
                  className="flex justify-center py-3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <TelegramLoginButton
                    buttonSize="large"
                    cornerRadius={12}
                    onSuccess={handleLoginSuccess}
                    onError={handleLoginError}
                  />
                </motion.div>

                {/* Divider */}
                <motion.div
                  className="flex items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                  <span className="text-[10px] font-medium text-gray-400 dark:text-white/40 uppercase tracking-wider">
                    New here?
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                </motion.div>

                {/* Benefits */}
                <motion.div
                  className="space-y-2.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <BenefitItem 
                    icon={StarFilledIcon} 
                    text="25 free credits on signup" 
                    iconColor="text-amber-500"
                    iconBg="bg-amber-100 dark:bg-amber-500/15"
                  />
                  <BenefitItem 
                    icon={CountdownTimerIcon} 
                    text="10 daily credits (free tier)" 
                    iconColor="text-sky-500"
                    iconBg="bg-sky-100 dark:bg-sky-500/15"
                  />
                  <BenefitItem 
                    icon={RocketIcon} 
                    text="Pay only for LIVE cards" 
                    iconColor="text-emerald-500"
                    iconBg="bg-emerald-100 dark:bg-emerald-500/15"
                  />
                </motion.div>

                {/* Footer */}
                <motion.p
                  className="text-center text-[11px] text-gray-400 dark:text-white/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  Dev by Howard
                </motion.p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Benefit item with Radix icon
 */
function BenefitItem({ icon: Icon, text, iconColor, iconBg }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        "flex items-center justify-center w-7 h-7 rounded-lg",
        iconBg
      )}>
        <Icon className={cn("w-3.5 h-3.5", iconColor)} />
      </div>
      <span className="text-[13px] text-gray-600 dark:text-white/70">{text}</span>
    </div>
  );
}

export default LoginPage;
