import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  Loader2, 
  Users,
  UserCheck,
  Coins,
  Key,
  KeyRound,
  RefreshCw,
  Calendar,
  TrendingUp,
  Shield,
  Award,
  Crown,
  Gem,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { spring } from '@/lib/motion';

/**
 * AnalyticsDashboard Component
 * Admin analytics view with key metrics
 * 
 * Requirements: 3.4
 */

const API_BASE = '/api';

const TIER_CONFIG = {
  free: { icon: User, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  bronze: { icon: Shield, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  silver: { icon: Award, color: 'text-slate-400', bg: 'bg-slate-400/10' },
  gold: { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  diamond: { icon: Gem, color: 'text-sky-500', bg: 'bg-sky-500/10' },
};

/**
 * Stat Card Component
 */
function StatCard({ icon: Icon, label, value, subtext, color, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.soft}
    >
      <Card variant="elevated" className="h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className={cn("p-2 rounded-lg", color || "bg-primary/10")}>
              <Icon className={cn(
                "h-5 w-5",
                color?.includes('emerald') ? "text-emerald-600 dark:text-emerald-400" :
                color?.includes('blue') ? "text-blue-600 dark:text-blue-400" :
                color?.includes('amber') ? "text-amber-600 dark:text-amber-400" :
                color?.includes('violet') ? "text-violet-600 dark:text-violet-400" :
                color?.includes('cyan') ? "text-cyan-600 dark:text-cyan-400" :
                "text-primary"
              )} />
            </div>
            {trend && (
              <Badge variant={trend > 0 ? 'success' : 'secondary'} className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                {trend > 0 ? '+' : ''}{trend}%
              </Badge>
            )}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold">{value?.toLocaleString() ?? '-'}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            {subtext && (
              <p className="text-xs text-muted-foreground/70 mt-1">{subtext}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Tier Distribution Card
 */
function TierDistribution({ usersByTier }) {
  if (!usersByTier || Object.keys(usersByTier).length === 0) {
    return null;
  }

  const total = Object.values(usersByTier).reduce((sum, count) => sum + count, 0);
  const tiers = ['free', 'bronze', 'silver', 'gold', 'diamond'];

  return (
    <Card variant="elevated">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Users by Tier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tiers.map(tier => {
          const count = usersByTier[tier] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const config = TIER_CONFIG[tier];
          const TierIcon = config.icon;

          return (
            <div key={tier} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TierIcon className={cn("h-4 w-4", config.color)} />
                  <span className="capitalize">{tier}</span>
                </div>
                <span className="font-medium">{count.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", config.bg.replace('/10', ''))}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/**
 * Keys Stats Card
 */
function KeysStats({ keysGenerated, keysRedeemed }) {
  const redemptionRate = keysGenerated > 0 
    ? ((keysRedeemed / keysGenerated) * 100).toFixed(1) 
    : 0;

  return (
    <Card variant="elevated">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Redeem Keys
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Key className="h-4 w-4 text-violet-500" />
              <span className="text-xs text-muted-foreground">Generated</span>
            </div>
            <p className="text-xl font-bold">{keysGenerated?.toLocaleString() ?? 0}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Redeemed</span>
            </div>
            <p className="text-xl font-bold">{keysRedeemed?.toLocaleString() ?? 0}</p>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Redemption Rate</span>
            <span className="font-medium">{redemptionRate}%</span>
          </div>
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden mt-2">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(redemptionRate, 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const { error } = useToast();

  /**
   * Fetch analytics from API
   */
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`${API_BASE}/admin/analytics?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        setAnalytics(data.analytics || data);
      } else {
      }
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]); // Don't include fetchAnalytics to avoid infinite loop

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card variant="elevated">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchAnalytics}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !analytics ? (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No analytics data available</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Total Users"
              value={analytics.totalUsers}
              color="bg-blue-500/10"
            />
            <StatCard
              icon={UserCheck}
              label="Active Users"
              value={analytics.activeUsers}
              subtext="Last 30 days"
              color="bg-emerald-500/10"
            />
            <StatCard
              icon={Coins}
              label="Credits Consumed"
              value={analytics.totalCreditsConsumed}
              color="bg-amber-500/10"
            />
            <StatCard
              icon={Key}
              label="Keys Generated"
              value={analytics.totalKeysGenerated ?? analytics.keysGenerated}
              color="bg-violet-500/10"
            />
          </div>

          {/* Detailed Stats */}
          <div className="grid md:grid-cols-2 gap-6">
            <TierDistribution usersByTier={analytics.usersByTier} />
            <KeysStats 
              keysGenerated={analytics.totalKeysGenerated ?? analytics.keysGenerated ?? 0}
              keysRedeemed={analytics.totalKeysRedeemed ?? analytics.keysRedeemed ?? 0}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default AnalyticsDashboard;
