import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  User, Users, Copy, Check, RefreshCw, Loader2, Calendar,
  Shield, Award, Crown, Gem, Sparkles, ExternalLink, Coins,
  Star, MessageCircle, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { DailyClaimButton } from '@/components/credits/DailyClaimButton';
import { DailyClaimCard } from '@/components/credits/DailyClaimCard';
import { TransactionHistory } from '@/components/credits/TransactionHistory';
import { RedeemKeyInput } from '@/components/credits/RedeemKeyInput';
import { SpeedComparison } from '@/components/ui/SpeedComparison';
import { transition, softStaggerContainer, softStaggerItem } from '@/lib/motion';

const API_BASE = '/api';

const tierConfigs = {
  free: { 
    icon: Sparkles, label: 'Starter', color: 'text-violet-500', badgeVariant: 'secondary',
    bgGradient: 'from-violet-500/20 via-purple-500/10 to-fuchsia-500/20',
    ringColor: 'ring-violet-500/50',
    glowColor: 'shadow-violet-500/30',
    iconAnimation: { rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] },
    iconTransition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  },
  bronze: { 
    icon: Shield, label: 'Bronze', color: 'text-amber-500', badgeVariant: 'warning',
    bgGradient: 'from-amber-500/20 via-orange-500/10 to-yellow-500/20',
    ringColor: 'ring-amber-500/50',
    glowColor: 'shadow-amber-500/30',
    iconAnimation: { scale: [1, 1.15, 1], opacity: [1, 0.8, 1] },
    iconTransition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
  },
  silver: { 
    icon: Award, label: 'Silver', color: 'text-slate-400', badgeVariant: 'outline',
    bgGradient: 'from-slate-400/20 via-gray-400/10 to-zinc-400/20',
    ringColor: 'ring-slate-400/50',
    glowColor: 'shadow-slate-400/30',
    iconAnimation: { rotateY: [0, 180, 360] },
    iconTransition: { duration: 3, repeat: Infinity, ease: "linear" }
  },
  gold: { 
    icon: Crown, label: 'Gold', color: 'text-yellow-500', badgeVariant: 'warning',
    bgGradient: 'from-yellow-500/20 via-amber-400/10 to-orange-400/20',
    ringColor: 'ring-yellow-500/50',
    glowColor: 'shadow-yellow-500/40',
    iconAnimation: { y: [0, -2, 0], scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] },
    iconTransition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  },
  diamond: { 
    icon: Gem, label: 'Diamond', color: 'text-cyan-500', badgeVariant: 'live',
    bgGradient: 'from-cyan-500/20 via-sky-400/10 to-blue-500/20',
    ringColor: 'ring-cyan-500/50',
    glowColor: 'shadow-cyan-500/50',
    iconAnimation: { rotate: [0, 360], scale: [1, 1.2, 1] },
    iconTransition: { duration: 4, repeat: Infinity, ease: "linear" }
  },
};

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [referralData, setReferralData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) { setIsLoading(false); return; }
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

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {

    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card variant="elevated" className="max-w-sm w-full">
          <CardContent className="py-8 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
            <p className="text-sm text-muted-foreground">Log in to view your profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const profile = profileData?.profile;
  const tier = profileData?.tier;
  const credits = profileData?.credits;
  const tierConfig = tierConfigs[tier?.name] || tierConfigs.free;
  const TierIcon = tierConfig.icon;

  const balance = credits?.balance ?? 0;

  return (
    <ScrollArea className="h-full">
      <motion.div 
        className="max-w-lg mx-auto p-4 pb-8 space-y-3"
        variants={softStaggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Compact Profile Header */}
        <motion.div variants={softStaggerItem} transition={transition.opux}>
        <Card variant="elevated" className="overflow-hidden relative">
          {/* Tier gradient background */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-60",
            tierConfig.bgGradient
          )} />
          <CardContent className="p-3 relative">
            <div className="flex items-center gap-3">
              {/* Avatar with tier ring & animation */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="relative"
              >
                {/* Animated glow ring */}
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-full",
                    "ring-2",
                    tierConfig.ringColor
                  )}
                  animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <div className={cn(
                  "p-0.5 rounded-full bg-gradient-to-br relative",
                  tierConfig.bgGradient
                )}>
                  {profile?.photoUrl ? (
                    <img 
                      src={profile.photoUrl} 
                      alt="" 
                      className={cn(
                        "w-10 h-10 rounded-full object-cover border-2 border-background",
                        "shadow-lg",
                        tierConfig.glowColor
                      )} 
                    />
                  ) : (
                    <div className={cn(
                      "w-10 h-10 rounded-full bg-background flex items-center justify-center",
                      "shadow-lg",
                      tierConfig.glowColor
                    )}>
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {/* Tier icon badge with animation */}
                <motion.div 
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 p-1.5 rounded-full shadow-lg",
                    "bg-background/80 dark:bg-background/90 backdrop-blur-sm",
                    tierConfig.glowColor
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.25 }}
                >
                  <motion.div
                    animate={tierConfig.iconAnimation}
                    transition={tierConfig.iconTransition}
                  >
                    <TierIcon className={cn("w-3 h-3", tierConfig.color)} />
                  </motion.div>
                </motion.div>
              </motion.div>
              
              {/* Name & Badge with animation */}
              <motion.div 
                className="flex-1 min-w-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate">{profile?.firstName} {profile?.lastName}</span>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
                  >
                    <Badge variant={tierConfig.badgeVariant} className="text-[9px] px-1 py-0 h-4">
                      <motion.span
                        className="inline-flex items-center"
                        animate={tierConfig.iconAnimation}
                        transition={tierConfig.iconTransition}
                      >
                        <TierIcon className="w-2.5 h-2.5 mr-0.5" />
                      </motion.span>
                      {tierConfig.label}
                    </Badge>
                  </motion.div>
                </div>
                {profile?.username && <p className="text-[11px] text-muted-foreground">@{profile.username}</p>}
              </motion.div>
              
              {/* Credits with animation */}
              <motion.div 
                className="text-right"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
              >
                <div className="flex items-center justify-end gap-1">
                  <Coins className="w-3 h-3 text-amber-500" />
                  <motion.span 
                    className="text-lg font-bold text-amber-500"
                    key={balance}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    {balance.toLocaleString()}
                  </motion.span>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Unified Info Card */}
        <motion.div variants={softStaggerItem} transition={transition.opux}>
        <Card variant="elevated">
          <CardContent className="p-4">
            {/* Tier & Membership Info */}
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl",
                "bg-gradient-to-br from-cyan-500/20 to-cyan-600/10",
                "dark:from-cyan-400/20 dark:to-cyan-500/10",
                "border border-cyan-500/20 dark:border-cyan-400/20"
              )}>
                <TierIcon className={cn("w-5 h-5", tierConfig.color)} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">{tierConfig.label}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-muted-foreground/30">
                    Member
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>Joined {formatDate(profile?.createdAt)}</span>
                </div>
              </div>
              {tier?.name !== 'diamond' && (
                <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1">
                  <Star className="w-3 h-3" /> Upgrade
                </Button>
              )}
            </div>

            <Separator className="my-3" />

            {/* Referral Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5 text-violet-500" />
                <span className="font-medium">Referral Code</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  onClick={() => handleCopy(referralData?.code || '')}
                  className={cn(
                    "flex-1 flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all",
                    "bg-muted/50 hover:bg-muted border border-transparent hover:border-border"
                  )}
                >
                  <code className="text-xs font-mono font-medium tracking-wide">{referralData?.code || '...'}</code>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {referralData?.referralCount || 0} <span className="text-emerald-500">+{referralData?.creditsEarned || 0}</span>
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => handleCopy(`${window.location.origin}?ref=${referralData?.code}`)}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
          <Card variant="elevated">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">Processing Speed by Tier</span>
              </div>
              <Tabs defaultValue="auth" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-9 mb-3">
                  <TabsTrigger value="auth" className="text-xs">Auth</TabsTrigger>
                  <TabsTrigger value="charge" className="text-xs">Charge</TabsTrigger>
                </TabsList>
                <TabsContent value="auth" className="mt-0">
                  <SpeedComparison gatewayId="auth" className="border-0 shadow-none" hideHeader />
                </TabsContent>
                <TabsContent value="charge" className="mt-0">
                  <SpeedComparison gatewayId="charge" className="border-0 shadow-none" hideHeader />
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
            <Card variant="elevated" className="hover:border-blue-500/50 transition-colors cursor-pointer">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl",
                    "bg-gradient-to-br from-blue-500/20 to-blue-600/10",
                    "dark:from-blue-400/20 dark:to-blue-500/10",
                    "border border-blue-500/20 dark:border-blue-400/20"
                  )}>
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium">Need Help?</span>
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
