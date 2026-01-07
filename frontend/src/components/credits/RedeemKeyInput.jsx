import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Loader2, Check, Sparkles, Unlock, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRedeemKey } from '@/hooks/useRedeemKey';
import { useToast } from '@/hooks/useToast';

/**
 * Floating holographic particle
 */
function HoloParticle({ delay, x }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-cyan-400 opacity-0 dark:opacity-100"
      style={{ left: `${x}%` }}
      initial={{ opacity: 0, y: 0 }}
      animate={{
        opacity: [0, 0.8, 0],
        y: [-10, -40],
        scale: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: 1.5,
      }}
    />
  );
}

/**
 * Scanning line animation for key input
 */
function ScanLine({ isActive }) {
  if (!isActive) return null;
  
  return (
    <motion.div
      className="absolute inset-y-0 w-0.5 bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-0 dark:opacity-100"
      initial={{ left: 0 }}
      animate={{ left: '100%' }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

/**
 * RedeemKeyInput Component
 * 
 * Premium key redemption with Obsidian Aurora aesthetic:
 * - Crystalline glass container with prismatic aurora edges
 * - Holographic key icon with rotating glow
 * - Scanning line animation during input
 * - Success state with particle burst
 */
export function RedeemKeyInput({ onSuccess, className }) {
  const [code, setCode] = useState('');
  const { redeemKey, isLoading, reset } = useRedeemKey();
  const { success, error } = useToast();
  const [recentSuccess, setRecentSuccess] = useState(false);

  /**
   * Format key code with dashes as user types
   * Format: XXXX-XXXX-XXXX-XXXX
   */
  const formatKeyCode = useCallback((value) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const groups = [];
    for (let i = 0; i < cleaned.length && i < 16; i += 4) {
      groups.push(cleaned.slice(i, i + 4));
    }
    return groups.join('-');
  }, []);

  const handleChange = useCallback((e) => {
    const formatted = formatKeyCode(e.target.value);
    setCode(formatted);
    reset();
    setRecentSuccess(false);
  }, [formatKeyCode, reset]);

  const handleRedeem = useCallback(async () => {
    if (!code || code.length < 19) {
      error('Please enter a complete key code');
      return;
    }

    const result = await redeemKey(code);

    if (result.success) {
      setRecentSuccess(true);
      if (result.type === 'credits') {
        success(`+${result.creditsAdded} credits added! New balance: ${result.newBalance}`);
      } else {
        success(`Upgraded to ${result.newTier} tier!`);
      }
      setCode('');
      if (onSuccess) onSuccess(result);
      setTimeout(() => setRecentSuccess(false), 3000);
    } else {
      error(result.message || 'Failed to redeem key');
    }
  }, [code, redeemKey, success, error, onSuccess]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !isLoading && code.length === 19) {
      handleRedeem();
    }
  }, [handleRedeem, isLoading, code.length]);

  const isCodeComplete = code.length === 19;
  const isTyping = code.length > 0 && code.length < 19;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "transition-all duration-300 ease-out",
        
        // ===== LIGHT MODE (Vintage Banking Voucher) =====
        // Light mode: Vintage Banking Voucher
        "bg-gradient-to-b from-[hsl(40,50%,97%)] via-[hsl(38,45%,95%)] to-[hsl(35,40%,93%)]",
        "border-2 border-[hsl(30,35%,75%)]",
        "shadow-[inset_0_0_0_3px_hsl(38,45%,96%),inset_0_0_0_4px_hsl(30,30%,80%),0_8px_32px_rgba(101,67,33,0.12)]",
        
        // ===== DARK MODE (Obsidian Aurora Crystal) ===== (bg-none resets light gradient)
        "dark:bg-none dark:bg-gradient-to-br dark:from-[rgba(12,14,22,0.95)] dark:via-[rgba(16,20,30,0.9)] dark:to-[rgba(12,14,22,0.95)]",
        "dark:backdrop-blur-[60px] dark:backdrop-saturate-[1.8]",
        // Prismatic emerald/cyan border for key redemption
        "dark:border dark:border-transparent",
        "dark:[background-image:linear-gradient(135deg,rgba(12,14,22,0.95),rgba(16,20,30,0.9)),linear-gradient(135deg,rgba(52,211,153,0.4),rgba(34,211,238,0.35),rgba(52,211,153,0.4))]",
        "dark:[background-origin:border-box] dark:[background-clip:padding-box,border-box]",
        // Ambient glow
        "dark:shadow-[0_0_40px_-10px_rgba(52,211,153,0.25),0_0_60px_-15px_rgba(34,211,238,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]",
        
        // Success glow
        recentSuccess && "dark:shadow-[0_0_60px_-10px_rgba(52,211,153,0.6),0_0_80px_-15px_rgba(34,211,238,0.4)]",
        className
      )}
    >
      {/* Paper texture for light mode */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none dark:opacity-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Aurora shimmer overlay - dark mode only */}
      <motion.div 
        className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, transparent 40%, rgba(52,211,153,0.05) 50%, transparent 60%)',
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(25,60%,60%)]/30 to-transparent dark:via-emerald-400/30" />
      
      {/* Accent line - copper foil gradient for light, emerald aurora for dark */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 z-10",
        // Light: copper foil accent (bg-none resets light gradient)
        "bg-gradient-to-r from-[hsl(25,70%,50%)] via-[hsl(35,75%,55%)] to-[hsl(30,65%,45%)]",
        "shadow-[0_2px_8px_rgba(101,67,33,0.2)]",
        "dark:bg-none dark:bg-gradient-to-r dark:from-emerald-400 dark:via-cyan-400 dark:to-teal-400",
        "dark:shadow-[0_0_15px_-3px_rgba(52,211,153,0.6)]"
      )} />
      
      {/* Floating particles - dark mode only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <HoloParticle delay={0} x={20} />
        <HoloParticle delay={0.7} x={50} />
        <HoloParticle delay={1.4} x={80} />
      </div>
      
      {/* Corner ornaments (light mode only) */}
      <div className="absolute top-3 left-3 w-5 h-5 border-l-2 border-t-2 border-[hsl(25,60%,55%)]/40 rounded-tl-sm dark:hidden" />
      <div className="absolute top-3 right-3 w-5 h-5 border-r-2 border-t-2 border-[hsl(25,60%,55%)]/40 rounded-tr-sm dark:hidden" />
      
      <div className="relative p-3 sm:p-5 z-10">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          {/* Icon with holographic rotating glow */}
          <motion.div 
            className={cn(
              "relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl shrink-0",
              // Light: copper/bronze gradient wax seal
              "bg-gradient-to-br from-[hsl(30,60%,88%)] via-[hsl(25,50%,82%)] to-[hsl(35,55%,78%)]",
              "border border-[hsl(30,40%,70%)]/60",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_6px_rgba(101,67,33,0.15)]",
              // Dark: Holographic emerald crystal (bg-none resets light gradient)
              "dark:bg-none dark:bg-gradient-to-br dark:from-[rgba(20,24,35,0.9)] dark:to-[rgba(15,18,28,0.95)]",
              "dark:border dark:border-transparent",
              "dark:[background-image:linear-gradient(135deg,rgba(20,24,35,0.9),rgba(15,18,28,0.95)),linear-gradient(135deg,rgba(52,211,153,0.5),rgba(34,211,238,0.4),rgba(52,211,153,0.5))]",
              "dark:[background-origin:border-box] dark:[background-clip:padding-box,border-box]",
              "dark:shadow-[0_0_20px_-5px_rgba(52,211,153,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]"
            )}
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {/* Rotating aurora glow - dark mode */}
            <motion.div
              className="absolute inset-0 rounded-xl opacity-0 dark:opacity-100 blur-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(52,211,153,0.4), transparent, rgba(34,211,238,0.4))'
              }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
            <Key className={cn(
              "w-4 h-4 sm:w-5 sm:h-5 relative z-10",
              "text-[hsl(25,55%,40%)]",
              "dark:text-emerald-300 dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]"
            )} />
          </motion.div>
          
          <div className="min-w-0">
            <h3 className={cn(
              "text-sm sm:text-base font-semibold flex items-center gap-1.5 sm:gap-2",
              "text-[hsl(25,40%,25%)] [text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
              "dark:text-white dark:[text-shadow:none]"
            )}>
              Redeem Key
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 dark:text-emerald-400 dark:drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
            </h3>
            <p className={cn(
              "text-xs sm:text-sm",
              "text-[hsl(25,20%,50%)]",
              "dark:text-white/50"
            )}>
              Enter your activation code
            </p>
          </div>
        </div>

        {/* Input and Button */}
        <div className="flex gap-2 sm:gap-3">
          <div className="flex-1 relative">
            {/* Scanning line animation */}
            <ScanLine isActive={isTyping} />
            
            <Input
              type="text"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={code}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              maxLength={19}
              className={cn(
                "h-10 sm:h-12 font-mono text-sm sm:text-base tracking-[0.1em] sm:tracking-[0.15em] uppercase text-center",
                // Light mode
                "bg-gradient-to-b from-[hsl(38,35%,96%)] to-[hsl(35,30%,93%)]",
                "border-[hsl(30,30%,75%)]",
                "text-[hsl(25,40%,30%)]",
                "shadow-[inset_0_2px_4px_rgba(101,67,33,0.08)]",
                "focus:border-[hsl(25,65%,50%)] focus:ring-[hsl(25,65%,50%)]/20",
                "placeholder:tracking-normal placeholder:normal-case placeholder:text-[hsl(30,20%,65%)]",
                // Dark mode: Holographic input (bg-none resets light gradient)
                "dark:bg-none dark:bg-gradient-to-b dark:from-[rgba(15,18,28,0.6)] dark:to-[rgba(10,12,20,0.8)]",
                "dark:border-white/[0.08] dark:text-white",
                "dark:shadow-[inset_0_0_20px_-10px_rgba(52,211,153,0.1)]",
                "dark:focus:border-emerald-400/40 dark:focus:ring-emerald-400/20",
                "dark:focus:shadow-[inset_0_0_20px_-5px_rgba(52,211,153,0.2),0_0_15px_-5px_rgba(52,211,153,0.3)]",
                "dark:placeholder:text-white/30",
                // Complete state
                isCodeComplete && [
                  "border-[hsl(35,70%,50%)]/60",
                  "shadow-[inset_0_2px_4px_rgba(101,67,33,0.06),0_0_0_2px_rgba(202,138,4,0.15)]",
                  "dark:border-emerald-400/40 dark:bg-emerald-500/[0.08]",
                  "dark:shadow-[inset_0_0_20px_-5px_rgba(52,211,153,0.25),0_0_20px_-5px_rgba(52,211,153,0.4)]"
                ]
              )}
            />
            
            {/* Completion indicator */}
            <AnimatePresence>
              {isCodeComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    "bg-gradient-to-br from-emerald-400 to-teal-500", // Same in light/dark, no reset needed
                    "shadow-[0_0_12px_-2px_rgba(52,211,153,0.6)]"
                  )}>
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Redeem button */}
          <Button
            onClick={handleRedeem}
            disabled={isLoading || !isCodeComplete}
            className={cn(
              "h-10 sm:h-12 px-3 sm:px-6 font-semibold rounded-lg sm:rounded-xl shrink-0",
              "text-white",
              // Light mode: copper coin button
              "bg-gradient-to-b from-[hsl(25,65%,50%)] via-[hsl(30,70%,48%)] to-[hsl(25,60%,42%)]",
              "border border-[hsl(25,50%,35%)]/30",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_12px_rgba(166,100,50,0.3)]",
              "hover:from-[hsl(25,70%,55%)] hover:via-[hsl(30,75%,52%)] hover:to-[hsl(25,65%,45%)]",
              // Dark mode: Holographic emerald button
              "dark:bg-gradient-to-r dark:from-emerald-500 dark:via-teal-500 dark:to-cyan-500",
              "dark:border-transparent",
              "dark:shadow-[0_0_25px_-5px_rgba(52,211,153,0.5),0_0_15px_-3px_rgba(34,211,238,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]",
              "dark:hover:shadow-[0_0_35px_-5px_rgba(52,211,153,0.7),0_0_25px_-3px_rgba(34,211,238,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]",
              // Disabled
              "disabled:opacity-50 disabled:shadow-none"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : recentSuccess ? (
              <motion.span
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Success!</span>
              </motion.span>
            ) : (
              <span className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Redeem</span>
              </span>
            )}
          </Button>
        </div>

        {/* Help text */}
        <div className={cn(
          "flex items-center justify-center gap-1.5 sm:gap-2 mt-2 sm:mt-3",
          "text-[10px] sm:text-xs",
          "text-[hsl(25,20%,50%)]",
          "dark:text-white/40"
        )}>
          <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
          <span className="text-center">Keys are 16 characters in XXXX-XXXX-XXXX-XXXX format</span>
        </div>
      </div>
    </motion.div>
  );
}

export default RedeemKeyInput;
