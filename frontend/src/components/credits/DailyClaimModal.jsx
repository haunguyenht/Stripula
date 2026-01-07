import { useState, useEffect, useCallback, memo } from 'react';
import { Gift, Clock, Check, Loader2, Coins, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useAuth } from '@/contexts/AuthContext';
import { getTierConfig } from '@/components/navigation/config/tier-config';

const API_BASE = '/api';

// Light mode: consistent copper/gold for vintage banking aesthetic
const lightAccent = { primary: '#b8860b', secondary: '#d4a017', glow: 'rgba(184,134,11,0.4)' };

// Dark mode: tier-based aurora colors
const darkTierAccents = {
  free: { primary: '#8b5cf6', secondary: '#a78bfa', glow: 'rgba(139,92,246,0.4)' },
  bronze: { primary: '#f59e0b', secondary: '#fbbf24', glow: 'rgba(245,158,11,0.4)' },
  silver: { primary: '#94a3b8', secondary: '#cbd5e1', glow: 'rgba(148,163,184,0.4)' },
  gold: { primary: '#facc15', secondary: '#fde047', glow: 'rgba(250,204,21,0.5)' },
  diamond: { primary: '#22d3ee', secondary: '#67e8f9', glow: 'rgba(34,211,238,0.5)' }
};

const getDarkAccent = (tier) => darkTierAccents[tier] || darkTierAccents.free;

function TreasureChest({ isOpen, tier }) {
  const darkAccent = getDarkAccent(tier);
  return (
    <motion.div className="relative">
      {/* Glow ring - copper for light, tier aurora for dark */}
      <motion.div
        className="absolute -inset-4 rounded-full opacity-60 dark:hidden"
        style={{ background: `radial-gradient(circle, ${lightAccent.glow} 0%, transparent 70%)` }}
        animate={isOpen ? { scale: [1, 1.3, 1], opacity: [0.6, 0.9, 0.6] } : { scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -inset-4 rounded-full opacity-60 hidden dark:block"
        style={{ background: `radial-gradient(circle, ${darkAccent.glow} 0%, transparent 70%)` }}
        animate={isOpen ? { scale: [1, 1.3, 1], opacity: [0.6, 0.9, 0.6] } : { scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={cn(
          "relative w-20 h-20 rounded-2xl flex items-center justify-center",
          // Light: gold treasure chest (bg-none resets light gradient)
          "bg-gradient-to-br from-[hsl(42,70%,75%)] via-[hsl(38,65%,65%)] to-[hsl(32,60%,50%)]",
          "border-2 border-[hsl(35,60%,55%)]",
          "shadow-[inset_0_4px_8px_rgba(255,255,255,0.4),inset_0_-4px_8px_rgba(0,0,0,0.15),0_8px_24px_rgba(101,67,33,0.3)]",
          "dark:bg-none dark:bg-gradient-to-br dark:from-[rgba(139,92,246,0.3)] dark:via-[rgba(34,211,238,0.2)] dark:to-[rgba(236,72,153,0.2)]",
          "dark:border-[rgba(139,92,246,0.4)]",
          "dark:shadow-[0_0_40px_rgba(139,92,246,0.3),inset_0_2px_0_rgba(255,255,255,0.15)]"
        )}
        animate={isOpen ? { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] } : { scale: [1, 1.02, 1] }}
        transition={{ duration: isOpen ? 0.6 : 2, repeat: isOpen ? 0 : Infinity, ease: 'easeInOut' }}
      >
        <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-white/30 via-transparent to-transparent dark:from-white/10" />
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Check className="w-10 h-10 text-white drop-shadow-lg" />
            </motion.div>
          ) : (
            <motion.div key="gift" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <Gift className="w-10 h-10 text-white drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}


function CelebrationParticles({ active, tier }) {
  const darkAccent = getDarkAccent(tier);
  if (!active) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Coins - copper for light, tier for dark */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`coin-${i}`}
          className="absolute"
          style={{ left: `${10 + i * 10}%`, bottom: '30%' }}
          initial={{ y: 0, opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            y: [-20, -120 - Math.random() * 60],
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0.5],
            rotate: [0, 360 + Math.random() * 360]
          }}
          transition={{ duration: 2 + Math.random() * 0.5, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <Coins className="w-5 h-5 text-[hsl(35,70%,45%)] dark:text-current" style={{ '--tw-text-opacity': 1, color: undefined }} />
          <Coins className="w-5 h-5 absolute inset-0 hidden dark:block" style={{ color: darkAccent.primary }} />
        </motion.div>
      ))}
      {/* Stars - copper for light, tier for dark */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-2 h-2 rounded-full"
          style={{ 
            left: `${5 + i * 8}%`, 
            bottom: '40%', 
            background: i % 2 === 0 ? lightAccent.primary : lightAccent.secondary 
          }}
          initial={{ y: 0, opacity: 0, scale: 0 }}
          animate={{
            y: [-10, -80 - Math.random() * 40],
            x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 60],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{ duration: 1.5 + Math.random() * 0.5, delay: 0.2 + i * 0.05, ease: 'easeOut' }}
        />
      ))}
      {/* Dark mode stars overlay */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`star-dark-${i}`}
          className="absolute w-2 h-2 rounded-full hidden dark:block"
          style={{ 
            left: `${5 + i * 8}%`, 
            bottom: '40%', 
            background: i % 2 === 0 ? darkAccent.primary : darkAccent.secondary 
          }}
          initial={{ y: 0, opacity: 0, scale: 0 }}
          animate={{
            y: [-10, -80 - Math.random() * 40],
            x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 60],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{ duration: 1.5 + Math.random() * 0.5, delay: 0.2 + i * 0.05, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function RewardDisplay({ amount, tier, isSuccess }) {
  const darkAccent = getDarkAccent(tier);
  const tierConfig = getTierConfig(tier);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="text-center space-y-3"
    >
      <div className="flex items-center justify-center gap-2">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <Coins className="w-8 h-8 text-[hsl(35,70%,45%)] dark:hidden" />
          <Coins className="w-8 h-8 hidden dark:block" style={{ color: darkAccent.primary }} />
        </motion.div>
        <motion.span
          className="text-5xl font-black tracking-tight text-[hsl(35,70%,40%)] dark:hidden"
          style={{ textShadow: `0 4px 12px ${lightAccent.glow}` }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
        >
          +{amount}
        </motion.span>
        <motion.span
          className="text-5xl font-black tracking-tight hidden dark:inline"
          style={{ color: darkAccent.primary, textShadow: `0 4px 12px ${darkAccent.glow}` }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
        >
          +{amount}
        </motion.span>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-sm font-medium text-[hsl(25,25%,45%)] dark:text-white/60"
      >
        {isSuccess ? 'Credits added to your balance!' : 'Credits waiting for you'}
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center"
      >
        <div className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
          tierConfig.bgColor, tierConfig.color, tierConfig.borderColor
        )}>
          <tierConfig.icon className="w-3.5 h-3.5" />
          {tierConfig.label} Bonus
        </div>
      </motion.div>
    </motion.div>
  );
}


function ClaimButton({ onClick, isClaiming, amount, tier }) {
  const darkAccent = getDarkAccent(tier);
  return (
    <Button
      onClick={onClick}
      disabled={isClaiming}
      className={cn(
        "w-full h-14 text-base font-bold rounded-xl text-white relative overflow-hidden",
        "transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
        // Light: Copper foil button (bg-none resets light gradient)
        "bg-gradient-to-br from-[hsl(35,70%,45%)] via-[hsl(38,65%,50%)] to-[hsl(30,60%,40%)]",
        "shadow-[0_8px_32px_rgba(184,134,11,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]",
        "hover:shadow-[0_12px_40px_rgba(184,134,11,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]",
        // Dark: Override with tier color (bg-none resets light gradient)
        "dark:bg-none dark:shadow-[0_8px_32px_var(--shadow-color),inset_0_1px_0_rgba(255,255,255,0.25)]",
        "dark:hover:shadow-[0_12px_40px_var(--shadow-color),inset_0_1px_0_rgba(255,255,255,0.35)]"
      )}
      style={{
        '--shadow-color': darkAccent.glow
      }}
    >
      {/* Dark mode background */}
      <div 
        className="absolute inset-0 hidden dark:block rounded-xl"
        style={{ background: `linear-gradient(135deg, ${darkAccent.primary} 0%, ${darkAccent.secondary} 100%)` }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
      />
      <span className="relative flex items-center justify-center gap-2">
        {isClaiming ? (
          <><Loader2 className="w-5 h-5 animate-spin" />Opening...</>
        ) : (
          <><Star className="w-5 h-5" />Claim {amount} Credits</>
        )}
      </span>
    </Button>
  );
}

function AlreadyClaimedState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-4 space-y-4"
    >
      <div className={cn(
        // Light: clock container (bg-none resets light gradient)
        "w-16 h-16 mx-auto rounded-2xl flex items-center justify-center",
        "bg-gradient-to-br from-[hsl(38,40%,94%)] to-[hsl(35,35%,88%)]",
        "border border-[hsl(30,30%,78%)]",
        "shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),0_4px_12px_rgba(101,67,33,0.1)]",
        "dark:bg-none dark:bg-gradient-to-br dark:from-[rgba(255,255,255,0.05)] dark:to-[rgba(255,255,255,0.02)]",
        "dark:border-white/10"
      )}>
        <Clock className="w-7 h-7 text-[hsl(25,30%,50%)] dark:text-white/40" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-[hsl(25,30%,35%)] dark:text-white/70">
          Already Claimed Today
        </p>
        <p className="text-sm text-[hsl(25,25%,50%)] dark:text-white/50">
          Come back tomorrow for more rewards
        </p>
      </div>
    </motion.div>
  );
}

function SuccessState({ amount, tier }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4">
      <CelebrationParticles active={true} tier={tier} />
      <RewardDisplay amount={amount} tier={tier} isSuccess={true} />
    </motion.div>
  );
}


function DailyClaimModalComponent({ open, onOpenChange, onClaim, autoShow = false }) {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [claimStatus, setClaimStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const tier = user?.tier || 'free';
  const tierConfig = getTierConfig(tier);
  const darkAccent = getDarkAccent(tier);
  const claimAmount = claimStatus?.claimAmount || tierConfig.dailyClaim || 10;

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const fetchClaimStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/credits/claim-status`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          setClaimStatus(data);
          if (autoShow && data.canClaim && !dismissed && open === undefined) {
            setInternalOpen(true);
          }
        }
      }
    } catch {
      // Silent
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, autoShow, dismissed, open]);

  const handleClaim = async () => {
    if (!isAuthenticated || isClaiming) return;
    setIsClaiming(true);
    try {
      const response = await fetch(`${API_BASE}/credits/claim-daily`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && data.status === 'OK') {
        setClaimSuccess(true);
        setClaimStatus({ canClaim: false, claimAmount: data.amount });
        if (refreshUser) await refreshUser();
        if (onClaim) onClaim(data.amount);
        setTimeout(() => { setIsOpen(false); setClaimSuccess(false); }, 3000);
      }
    } catch {
      // Silent
    } finally {
      setIsClaiming(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setIsOpen(false);
  };

  useEffect(() => { fetchClaimStatus(); }, [fetchClaimStatus]);

  useEffect(() => {
    const lastDismiss = localStorage.getItem('dailyClaimDismissed');
    if (lastDismiss) {
      const dismissTime = parseInt(lastDismiss, 10);
      if (Date.now() - dismissTime > 6 * 60 * 60 * 1000) {
        setDismissed(false);
        localStorage.removeItem('dailyClaimDismissed');
      } else {
        setDismissed(true);
      }
    }
  }, []);

  useEffect(() => {
    if (dismissed) localStorage.setItem('dailyClaimDismissed', Date.now().toString());
  }, [dismissed]);

  if (!isAuthenticated || !user) return null;

  const canClaim = claimStatus?.canClaim;


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent 
        className="sm:max-w-[400px] p-0 overflow-hidden border-0 !bg-transparent !shadow-none"
        hideCloseButton
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>Daily Bonus Reward</DialogTitle>
        </VisuallyHidden>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={cn(
            // Modal container (bg-none resets light gradient)
            "relative rounded-3xl overflow-hidden",
            "bg-gradient-to-b from-[hsl(42,60%,97%)] via-[hsl(40,55%,94%)] to-[hsl(38,50%,90%)]",
            "border-2 border-[hsl(35,50%,70%)]",
            "shadow-[inset_0_0_0_1px_hsl(42,55%,96%),0_32px_80px_rgba(101,67,33,0.25),0_16px_40px_rgba(101,67,33,0.15)]",
            "dark:bg-none dark:bg-gradient-to-b dark:from-[rgba(20,25,45,0.98)] dark:via-[rgba(15,20,40,0.95)] dark:to-[rgba(10,15,30,0.98)]",
            "dark:border dark:border-[rgba(139,92,246,0.25)]",
            "dark:shadow-[0_0_100px_-20px_rgba(139,92,246,0.4),0_0_60px_-15px_rgba(34,211,238,0.3),0_40px_100px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]"
          )}
        >
          {/* Corner frames - light mode */}
          <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-[hsl(35,55%,60%)] rounded-tl-lg dark:hidden" />
          <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-[hsl(35,55%,60%)] rounded-tr-lg dark:hidden" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-[hsl(35,55%,60%)] rounded-bl-lg dark:hidden" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-[hsl(35,55%,60%)] rounded-br-lg dark:hidden" />
          
          {/* Aurora - dark mode */}
          <div className="hidden dark:block absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-br from-violet-500/30 via-transparent to-transparent blur-3xl"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-tl from-cyan-500/20 via-transparent to-transparent blur-3xl"
              animate={{ rotate: [360, 0] }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          
          {/* Top accent - copper for light, tier aurora for dark */}
          <div 
            className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-[hsl(35,70%,50%)] to-transparent dark:hidden"
          />
          <div 
            className="absolute top-0 inset-x-0 h-1.5 hidden dark:block"
            style={{ background: `linear-gradient(90deg, transparent, ${darkAccent.primary}, ${darkAccent.secondary}, ${darkAccent.primary}, transparent)` }}
          />
          
          {/* Specular - dark mode */}
          <div className="hidden dark:block absolute top-2 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className={cn(
              "absolute top-4 right-4 z-20 p-2 rounded-full transition-all",
              "bg-[hsl(38,40%,92%)] hover:bg-[hsl(38,40%,88%)] text-[hsl(25,30%,40%)]",
              "dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/50 dark:hover:text-white/70"
            )}
          >
            <X className="w-4 h-4" />
          </button>

          
          {/* Content */}
          <div className="relative z-10 p-8 pt-10">
            <div className="flex flex-col items-center mb-6">
              <TreasureChest isOpen={claimSuccess} tier={tier} />
              
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  "mt-5 text-xl font-bold tracking-tight",
                  "text-[hsl(25,40%,20%)] [text-shadow:0_1px_0_rgba(255,255,255,0.6)]",
                  "dark:text-white dark:[text-shadow:none]"
                )}
              >
                {claimSuccess ? 'Reward Claimed!' : 'Daily Treasure'}
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-sm mt-1 text-[hsl(25,25%,50%)] dark:text-white/50"
              >
                {claimSuccess ? 'Added to your balance' : 'Your daily reward awaits'}
              </motion.p>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                  <Loader2 className="w-10 h-10 text-[hsl(35,70%,45%)] dark:hidden" />
                  <Loader2 className="w-10 h-10 hidden dark:block" style={{ color: darkAccent.primary }} />
                </motion.div>
              </div>
            ) : claimSuccess ? (
              <SuccessState amount={claimAmount} tier={tier} />
            ) : canClaim ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <RewardDisplay amount={claimAmount} tier={tier} isSuccess={false} />
                <ClaimButton onClick={handleClaim} isClaiming={isClaiming} amount={claimAmount} tier={tier} />
                <button
                  onClick={handleDismiss}
                  className="w-full text-sm py-2 font-medium transition-colors text-[hsl(25,20%,55%)] hover:text-[hsl(25,25%,40%)] dark:text-white/40 dark:hover:text-white/60"
                >
                  Remind me later
                </button>
              </motion.div>
            ) : (
              <AlreadyClaimedState />
            )}
          </div>
          
          {/* Bottom line */}
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[hsl(35,50%,70%)] to-transparent dark:via-[rgba(139,92,246,0.2)]" />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export const DailyClaimModal = memo(DailyClaimModalComponent);
export { useDailyClaimModal } from '@/hooks/useDailyClaimModal';
export default DailyClaimModal;
