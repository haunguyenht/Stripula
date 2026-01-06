import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, RefreshCw, Zap, Loader2, Gift, Clock, 
  Gauge, Crown, Wallet, History, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLoader } from '@/components/ui/page-loader';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ProfileHeader, 
  ProfileStats, 
  TierInfoCard, 
  ReferralCard,
  HelpCard
} from '@/components/profile';
import { DailyClaimCard } from '@/components/credits/DailyClaimCard';
import { TransactionHistory } from '@/components/credits/TransactionHistory';
import { RedeemKeyInput } from '@/components/credits/RedeemKeyInput';
import { SpeedComparison } from '@/components/ui/SpeedComparison';

const API_BASE = '/api';

// Tab configuration - refined with better icons
const PROFILE_TABS = [
  { id: 'overview', label: 'Overview', icon: Gift },
  { id: 'history', label: 'History', icon: History },
  { id: 'speed', label: 'Speed', icon: Gauge },
  { id: 'tier', label: 'Tier', icon: Crown },
];

/**
 * ProfilePage Component
 * 
 * BOLD REDESIGN: Premium membership dashboard with editorial aesthetics.
 * - Light: Vintage Banking cream parchment with copper accents
 * - Dark: Liquid Aurora glass morphism with blur effects
 * - Asymmetric layouts with visual hierarchy
 */
export function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [referralData, setReferralData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) { 
      setIsLoading(false); 
      return; 
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [profileRes, referralRes] = await Promise.all([
        fetch(`${API_BASE}/user/profile`, { credentials: 'include' }),
        fetch(`${API_BASE}/user/referral`, { credentials: 'include' })
      ]);
      
      if (profileRes.ok) {
        const data = await profileRes.json();
        if (data.status === 'OK') setProfileData(data);
      }
      
      if (referralRes.ok) {
        const data = await referralRes.json();
        if (data.status === 'OK') setReferralData(data.referral);
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // Loading state
  if (authLoading || isLoading) {
    return <PageLoader variant="profile" />;
  }

  // Not authenticated state
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "max-w-sm w-full p-8 rounded-3xl text-center",
            // Light: Vintage Banking cream parchment
            "bg-[hsl(40,45%,97%)] border border-[hsl(30,25%,82%)]",
            "shadow-[0_20px_50px_-15px_hsl(25,35%,30%,0.2)]",
            // Dark mode (reset light bg)
            "dark:bg-none dark:bg-zinc-900/90 dark:backdrop-blur-xl",
            "dark:border-white/[0.1]",
            "dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]"
          )}
        >
          <motion.div 
            className={cn(
              "w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center",
              // Light: aged paper gradient (dark:bg-none resets light gradient)
              "bg-gradient-to-br from-[hsl(38,35%,92%)] to-[hsl(35,30%,88%)]",
              "dark:bg-none dark:bg-gradient-to-br dark:from-white/[0.06] dark:to-white/[0.02]",
              "border border-[hsl(30,25%,82%)] dark:border-white/[0.1]"
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <User className="w-10 h-10 text-[hsl(25,25%,55%)] dark:text-white/40" />
          </motion.div>
          <h2 className="text-2xl font-bold font-serif mb-2 text-[hsl(25,35%,18%)] dark:text-white">
            Sign In Required
          </h2>
          <p className="text-sm text-[hsl(25,20%,45%)] dark:text-white/50">
            Log in with Telegram to view your profile
          </p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "max-w-sm w-full p-6 rounded-2xl text-center",
            // Light: Vintage Banking with burgundy accent
            "bg-[hsl(40,45%,97%)] border border-[hsl(355,30%,80%)]",
            "shadow-[0_8px_30px_-8px_hsl(25,35%,30%,0.12)]",
            // Dark mode (reset light bg)
            "dark:bg-none dark:bg-zinc-900/90 dark:backdrop-blur-xl",
            "dark:border-white/[0.1]",
            "dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
          )}
        >
          <p className="text-[hsl(355,45%,42%)] dark:text-rose-400 mb-4 font-medium">{error}</p>
          <Button onClick={fetchData} size="sm" variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </motion.div>
      </div>
    );
  }

  // Extract data
  const profile = profileData?.profile;
  const tier = profileData?.tier;
  const credits = profileData?.credits;
  const balance = credits?.balance ?? 0;

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header Section */}
      <motion.div 
        className="flex-shrink-0 px-4 pt-4 pb-2 max-w-xl mx-auto w-full"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ProfileHeader profile={profile} tier={tier} />
      </motion.div>

      {/* Tab Navigation - Premium Segmented Control with vintage styling */}
      <motion.div 
        className="flex-shrink-0 px-4 py-4 max-w-xl mx-auto w-full"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className={cn(
          "p-1.5 rounded-2xl",
          // Light: Vintage Banking aged paper with inset shadow
          "bg-gradient-to-b from-[hsl(40,38%,94%)] to-[hsl(38,35%,91%)]",
          "shadow-[inset_0_1px_3px_hsl(25,30%,35%,0.06),0_1px_0_rgba(255,255,255,0.6)]",
          "border border-[hsl(30,25%,82%)]",
          // Dark mode (bg-none resets light gradient)
          "dark:bg-none dark:bg-white/[0.03] dark:border-white/[0.06] dark:shadow-none",
          "dark:backdrop-blur-xl"
        )}>
          <div className="grid grid-cols-4 gap-1">
            {PROFILE_TABS.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl",
                    "transition-colors duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(25,60%,50%)]/50 dark:focus-visible:ring-amber-500/50",
                    isActive 
                      ? "text-[hsl(25,35%,18%)] dark:text-white" 
                      : "text-[hsl(25,20%,50%)] dark:text-white/40 hover:text-[hsl(25,30%,35%)] dark:hover:text-white/60"
                  )}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.04 }}
                >
                  {/* Active indicator background - vintage embossed effect */}
                  {isActive && (
                    <motion.div
                      layoutId="activeProfileTab"
                      className={cn(
                        "absolute inset-0 rounded-xl",
                        // Light: cream parchment active with embossed effect
                        "bg-gradient-to-b from-[hsl(44,45%,99%)] to-[hsl(42,40%,96%)]",
                        "shadow-[0_1px_3px_hsl(25,30%,35%,0.08),inset_0_1px_0_rgba(255,255,255,0.7)]",
                        "border border-[hsl(30,25%,82%)]",
                        // Dark mode (bg-none resets light gradient)
                        "dark:bg-none dark:bg-white/[0.06] dark:shadow-black/20 dark:border-white/[0.1]"
                      )}
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  
                  <Icon className={cn(
                    "relative z-10 w-5 h-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  <span className="relative z-10 text-[10px] font-bold uppercase tracking-wide">
                    {tab.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Scrollable Tab Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="max-w-xl mx-auto px-4 pb-8">
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 25 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4 pt-1"
              >
                <DailyClaimCard onClaim={fetchData} />
                <RedeemKeyInput onSuccess={fetchData} />
                <ReferralCard referral={referralData} />
              </motion.div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: -25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 25 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4 pt-1"
              >
                <TransactionHistory maxHeight="calc(100vh - 280px)" />
              </motion.div>
            )}

            {/* Speed Tab */}
            {activeTab === 'speed' && (
              <motion.div
                key="speed"
                initial={{ opacity: 0, x: -25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 25 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="pt-1"
              >
                {/* Speed Comparison Card - Vintage certificate styling */}
                <div className={cn(
                  "relative overflow-hidden rounded-2xl",
                  // Light: Vintage Banking cream parchment with certificate double-line border
                  "bg-gradient-to-b from-[hsl(42,50%,98%)] via-[hsl(40,45%,97%)] to-[hsl(38,40%,95%)]",
                  "border border-[hsl(30,25%,82%)]",
                  "shadow-[0_8px_30px_-8px_hsl(25,35%,30%,0.12),0_0_0_1px_hsl(30,25%,85%),0_0_0_3px_hsl(42,45%,97%),0_0_0_4px_hsl(30,20%,80%)]",
                  // Dark mode (bg-none resets light gradient)
                  "dark:bg-none dark:bg-white/[0.02] dark:backdrop-blur-2xl dark:backdrop-saturate-150",
                  "dark:border-white/[0.06]",
                  "dark:shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_0.5px_0_rgba(255,255,255,0.06)]"
                )}>
                  {/* Top highlight (dark only) */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 dark:opacity-100" />
                  
                  {/* Paper grain (light) / Tile pattern (dark) */}
                  <div 
                    className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03] pointer-events-none bg-[image:var(--paper-grain)] dark:bg-none"
                    style={{ 
                      backgroundSize: '200px 200px',
                      backgroundRepeat: 'repeat'
                    }}
                  />
                  <div 
                    className="absolute inset-0 opacity-0 dark:opacity-[0.03] pointer-events-none"
                    style={{ 
                      backgroundImage: 'url(/bg-tile.webp)',
                      backgroundSize: '200px 200px',
                      backgroundRepeat: 'repeat'
                    }}
                  />
                  
                  {/* Gradient accent - copper for light, aurora for dark */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[hsl(25,75%,45%)] via-[hsl(30,65%,50%)] to-[hsl(38,60%,55%)] dark:from-amber-500 dark:via-orange-500 dark:to-rose-500" />
                  
                  <div className="relative p-5">
                    <div className="flex items-center gap-3 mb-5">
                      <div className={cn(
                        "flex items-center justify-center w-11 h-11 rounded-xl",
                        // Light: copper coin accent with embossed effect
                        "bg-gradient-to-b from-[hsl(28,48%,90%)] to-[hsl(25,45%,85%)]",
                        "shadow-[0_2px_6px_hsl(25,30%,35%,0.1),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(101,67,33,0.1)]",
                        "border border-[hsl(25,40%,75%)]",
                        // Dark mode (bg-none resets light gradient)
                        "dark:bg-none dark:bg-gradient-to-b dark:from-amber-500/15 dark:to-orange-500/10",
                        "dark:border-amber-400/20 dark:shadow-none"
                      )}>
                        <Gauge className="w-5 h-5 text-[hsl(25,75%,45%)] dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className={cn(
                          "text-base font-bold font-serif text-[hsl(25,35%,18%)] dark:text-white",
                          "[text-shadow:0_1px_0_rgba(255,255,255,0.6)] dark:[text-shadow:none]"
                        )}>
                          Processing Speed
                        </h3>
                        <p className="text-xs text-[hsl(25,20%,45%)] dark:text-white/50">
                          Compare speeds by tier
                        </p>
                      </div>
                    </div>
                    
                    <Tabs defaultValue="auth" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-11 mb-4 rounded-xl bg-[hsl(38,35%,93%)] dark:bg-white/[0.04]">
                        <TabsTrigger 
                          value="auth" 
                          className={cn(
                            "text-sm font-semibold rounded-lg",
                            "data-[state=active]:bg-[hsl(42,40%,98%)] dark:data-[state=active]:bg-white/[0.08]",
                            "data-[state=active]:shadow-sm"
                          )}
                        >
                          Auth
                        </TabsTrigger>
                        <TabsTrigger 
                          value="charge" 
                          className={cn(
                            "text-sm font-semibold rounded-lg",
                            "data-[state=active]:bg-[hsl(42,40%,98%)] dark:data-[state=active]:bg-white/[0.08]",
                            "data-[state=active]:shadow-sm"
                          )}
                        >
                          Charge
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="auth" className="mt-0">
                        <SpeedComparison gatewayId="auth" hideHeader />
                      </TabsContent>
                      <TabsContent value="charge" className="mt-0">
                        <SpeedComparison gatewayId="charge" hideHeader />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tier Tab */}
            {activeTab === 'tier' && (
              <motion.div
                key="tier"
                initial={{ opacity: 0, x: -25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 25 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4 pt-1"
              >
                <ProfileStats profile={profile} />
                <TierInfoCard tier={tier} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Help Card - Sticky at bottom of all tabs */}
          <motion.div
            className="pt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <HelpCard />
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default ProfilePage;
