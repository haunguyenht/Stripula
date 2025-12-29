import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { User, RefreshCw, Loader2, Zap, MessageCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ProfileHeader, 
  ProfileStats, 
  TierInfoCard, 
  ReferralCard 
} from '@/components/profile';
import { DailyClaimCard } from '@/components/credits/DailyClaimCard';
import { TransactionHistory } from '@/components/credits/TransactionHistory';
import { RedeemKeyInput } from '@/components/credits/RedeemKeyInput';
import { SpeedComparison } from '@/components/ui/SpeedComparison';
import { transition, softStaggerContainer, softStaggerItem } from '@/lib/motion';

const API_BASE = '/api';

/**
 * ProfilePage Component
 * 
 * Redesigned user profile page following OrangeAI (light) and OPUX glass (dark) design system.
 * All data is fetched from API - no hard-coded values.
 * 
 * Uses modular components from @/components/profile for maintainability.
 */
export function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [referralData, setReferralData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch profile and referral data from API
   */
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
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not authenticated state
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card variant="elevated" className="max-w-sm w-full">
          <CardContent className="py-8 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-bold mb-2 text-foreground">Sign In Required</h2>
            <p className="text-sm text-muted-foreground">Log in to view your profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card variant="elevated" className="max-w-sm w-full">
          <CardContent className="py-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchData} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data from API response
  const profile = profileData?.profile;
  const tier = profileData?.tier;
  const credits = profileData?.credits;
  const dailyUsage = profileData?.dailyUsage;
  const balance = credits?.balance ?? 0;

  return (
    <ScrollArea className="h-full">
      <motion.div 
        className="max-w-lg mx-auto p-4 pb-8 space-y-4"
        variants={softStaggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Profile Header - Avatar, Name, Tier, Credits */}
        <motion.div variants={softStaggerItem} transition={transition.opux}>
          <ProfileHeader 
            profile={profile} 
            tier={tier} 
            balance={balance} 
          />
        </motion.div>

        {/* Quick Stats Row */}
        <motion.div variants={softStaggerItem} transition={transition.opux}>
          <ProfileStats 
            profile={profile} 
            dailyUsage={dailyUsage} 
          />
        </motion.div>

        {/* Tier Info Card */}
        <motion.div variants={softStaggerItem} transition={transition.opux}>
          <TierInfoCard tier={tier} />
        </motion.div>

        {/* Referral Card */}
        <motion.div variants={softStaggerItem} transition={transition.opux}>
          <ReferralCard referral={referralData} />
        </motion.div>

        {/* Daily Claim Card */}
        <motion.div variants={softStaggerItem} transition={transition.opux}>
          <DailyClaimCard onClaim={fetchData} />
        </motion.div>

        {/* Redeem Key */}
        <motion.div variants={softStaggerItem} transition={transition.opux}>
          <RedeemKeyInput onSuccess={fetchData} />
        </motion.div>

        {/* Transaction History */}
        <motion.div variants={softStaggerItem} transition={transition.opux}>
          <TransactionHistory maxHeight="300px" />
        </motion.div>

        {/* Speed Comparison Section */}
        <motion.div variants={softStaggerItem} transition={transition.opux}>
          <Card 
            variant="elevated"
            className={cn(
              // Light mode
              "bg-white border-gray-100",
              // Dark mode
              "dark:bg-white/[0.02] dark:border-white/[0.06]"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg border",
                  "bg-gradient-to-br from-amber-500/10 to-amber-600/5",
                  "dark:from-amber-400/15 dark:to-amber-500/10",
                  "border-amber-500/20 dark:border-amber-400/20"
                )}>
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  Processing Speed by Tier
                </span>
              </div>
              <Tabs defaultValue="auth" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-9 mb-3">
                  <TabsTrigger value="auth" className="text-xs">Auth</TabsTrigger>
                  <TabsTrigger value="charge" className="text-xs">Charge</TabsTrigger>
                </TabsList>
                <TabsContent value="auth" className="mt-0">
                  <SpeedComparison 
                    gatewayId="auth" 
                    className="border-0 shadow-none bg-transparent" 
                    hideHeader 
                  />
                </TabsContent>
                <TabsContent value="charge" className="mt-0">
                  <SpeedComparison 
                    gatewayId="charge" 
                    className="border-0 shadow-none bg-transparent" 
                    hideHeader 
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Help & Support Section */}
        <motion.div variants={softStaggerItem} transition={transition.opux}>
          <a 
            href="https://t.me/kennjkute" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <Card 
              variant="elevated" 
              className={cn(
                "cursor-pointer transition-all duration-200",
                // Light mode
                "bg-white border-gray-100 hover:border-blue-500/30 hover:shadow-md",
                // Dark mode
                "dark:bg-white/[0.02] dark:border-white/[0.06]",
                "dark:hover:border-blue-500/30 dark:hover:bg-white/[0.04]"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl border",
                    "bg-gradient-to-br from-blue-500/10 to-blue-600/5",
                    "dark:from-blue-400/15 dark:to-blue-500/10",
                    "border-blue-500/20 dark:border-blue-400/20"
                  )}>
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-foreground">Need Help?</span>
                    <p className="text-xs text-muted-foreground">Contact @kennjkute on Telegram</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </a>
        </motion.div>
      </motion.div>
    </ScrollArea>
  );
}

export default ProfilePage;
