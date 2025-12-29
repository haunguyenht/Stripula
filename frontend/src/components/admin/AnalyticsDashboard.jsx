import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  Loader2, 
  Users, 
  Activity,
  Coins,
  Key,
  TrendingUp,
  Calendar,
  RefreshCw,
  Shield,
  Award,
  Crown,
  Gem,
  User,
  Percent,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { spring } from '@/lib/motion';

/**
 * AnalyticsDashboard Component
 * Admin analytics with key metrics and visualizations
 * Redesigned with hero stat cards and animated progress bars
 * 
 * Requirements: 3.1
 */

const API_BASE = '/api';

const TIER_CONFIG = {
  free: { icon: User, color: 'slate', gradient: 'from-slate-500 to-slate-600' },
  bronze: { icon: Shield, color: 'amber', gradient: 'from-amber-500 to-amber-600' },
  silver: { icon: Award, color: 'slate', gradient: 'from-slate-400 to-slate-500' },
  gold: { icon: Crown, color: 'yellow', gradient: 'from-yellow-500 to-amber-500' },
  diamond: { icon: Gem, color: 'cyan', gradient: 'from-cyan-400 to-blue-500' },
};

/**
 * Hero Stat Card Component
 */
function HeroStatCard({ icon: Icon, label, value, subValue, color, delay = 0 }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    purple: 'from-purple-500 to-purple-600',
    primary: 'from-[rgb(255,64,23)] to-[rgb(220,50,20)]'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ...spring.soft }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        "bg-gradient-to-br",
        colorClasses[color] || colorClasses.blue
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/20" />
        <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/10" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon className="h-6 w-6 text-white" />
          </div>
          {subValue && (
            <Badge className="bg-white/20 text-white border-0 text-xs">
              {subValue}
            </Badge>
          )}
        </div>

        <p className="text-white/80 text-sm font-medium mb-1">{label}</p>
        <p className="text-3xl font-bold text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Tier Distribution Card
 */
function TierDistribution({ usersByTier, totalUsers }) {
  if (!usersByTier || Object.keys(usersByTier).length === 0) return null;

  const tiers = ['free', 'bronze', 'silver', 'gold', 'diamond'];
  const maxCount = Math.max(...Object.values(usersByTier), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, ...spring.soft }}
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10",
        "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
      )}
    >
      <div className="px-6 py-5 border-b border-[rgb(237,234,233)] dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-[rgb(37,27,24)] dark:text-white">User Tiers</h3>
            <p className="text-xs text-muted-foreground">Distribution across tiers</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {tiers.map((tier, index) => {
          const count = usersByTier[tier] || 0;
          const percentage = totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(1) : 0;
          const config = TIER_CONFIG[tier];
          const Icon = config.icon;

          return (
            <motion.div
              key={tier}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1, ...spring.soft }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-7 w-7 rounded-lg flex items-center justify-center",
                    `bg-${config.color}-500/10`
                  )}>
                    <Icon className={cn("h-4 w-4", `text-${config.color}-500`)} />
                  </div>
                  <span className="text-sm font-medium capitalize text-[rgb(37,27,24)] dark:text-white">
                    {tier}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[rgb(37,27,24)] dark:text-white">
                    {count.toLocaleString()}
                  </span>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {percentage}%
                  </Badge>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-[rgb(250,247,245)] dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / maxCount) * 100}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r",
                    config.gradient
                  )}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, ...spring.soft }}
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10",
        "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
      )}
    >
      <div className="px-6 py-5 border-b border-[rgb(237,234,233)] dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Key className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-[rgb(37,27,24)] dark:text-white">Key Statistics</h3>
            <p className="text-xs text-muted-foreground">Generation and redemption</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Circular Progress */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-[rgb(250,247,245)] dark:text-white/5"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 352' }}
                animate={{ strokeDasharray: `${(redemptionRate / 100) * 352} 352` }}
                transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[rgb(37,27,24)] dark:text-white">
                {redemptionRate}%
              </span>
              <span className="text-xs text-muted-foreground">Redemption</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className={cn(
            "p-4 rounded-xl",
            "bg-[rgb(250,247,245)] dark:bg-white/5",
            "border border-[rgb(237,234,233)] dark:border-white/10"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Generated</span>
            </div>
            <p className="text-xl font-bold text-[rgb(37,27,24)] dark:text-white">
              {keysGenerated?.toLocaleString() || 0}
            </p>
          </div>

          <div className={cn(
            "p-4 rounded-xl",
            "bg-[rgb(250,247,245)] dark:bg-white/5",
            "border border-[rgb(237,234,233)] dark:border-white/10"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Redeemed</span>
            </div>
            <p className="text-xl font-bold text-[rgb(37,27,24)] dark:text-white">
              {keysRedeemed?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  /**
   * Fetch analytics from API
   */
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams({
        startDate,
        endDate
      });

      const response = await fetch(`${API_BASE}/admin/analytics?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        setAnalytics(data.analytics || data);
      }
    } catch (err) {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Date Range Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-2xl overflow-hidden",
          "bg-white dark:bg-[rgba(30,41,59,0.5)]",
          "border border-[rgb(237,234,233)] dark:border-white/10",
          "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
        )}
      >
        <div className="px-6 py-5 border-b border-[rgb(237,234,233)] dark:border-white/10 bg-gradient-to-br from-[rgb(250,247,245)] to-transparent dark:from-white/[0.02] dark:to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(37,27,24)] dark:text-white">
                  Analytics
                </h2>
                <p className="text-xs text-muted-foreground">Usage statistics and insights</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchAnalytics} 
              disabled={isLoading}
              className="rounded-xl"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40 rounded-xl"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      ) : !analytics ? (
        <div className="text-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-[rgb(250,247,245)] dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium text-[rgb(37,27,24)] dark:text-white mb-1">No data available</h3>
          <p className="text-sm text-muted-foreground">Try adjusting the date range</p>
        </div>
      ) : (
        <>
          {/* Hero Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <HeroStatCard
              icon={Users}
              label="Total Users"
              value={analytics.totalUsers || 0}
              color="blue"
              delay={0}
            />
            <HeroStatCard
              icon={Activity}
              label="Active Users"
              value={analytics.activeUsers || 0}
              subValue={analytics.totalUsers > 0 
                ? `${((analytics.activeUsers / analytics.totalUsers) * 100).toFixed(0)}%` 
                : '0%'}
              color="emerald"
              delay={0.1}
            />
            <HeroStatCard
              icon={Coins}
              label="Credits Consumed"
              value={analytics.creditsConsumed || 0}
              color="amber"
              delay={0.2}
            />
            <HeroStatCard
              icon={Key}
              label="Keys Generated"
              value={analytics.totalKeysGenerated || 0}
              color="purple"
              delay={0.3}
            />
          </div>

          {/* Detailed Stats */}
          <div className="grid md:grid-cols-2 gap-6">
            <TierDistribution 
              usersByTier={analytics.usersByTier} 
              totalUsers={analytics.totalUsers || 0}
            />
            <KeysStats 
              keysGenerated={analytics.totalKeysGenerated || 0} 
              keysRedeemed={analytics.totalKeysRedeemed || 0} 
            />
          </div>

          {/* Additional Metrics */}
          {(analytics.validationsToday !== undefined || analytics.averageCreditsPerUser !== undefined) && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {analytics.validationsToday !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, ...spring.soft }}
                  className={cn(
                    "p-6 rounded-2xl",
                    "bg-white dark:bg-[rgba(30,41,59,0.5)]",
                    "border border-[rgb(237,234,233)] dark:border-white/10",
                    "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">Validations Today</span>
                  </div>
                  <p className="text-2xl font-bold text-[rgb(37,27,24)] dark:text-white">
                    {analytics.validationsToday?.toLocaleString() || 0}
                  </p>
                </motion.div>
              )}

              {analytics.averageCreditsPerUser !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, ...spring.soft }}
                  className={cn(
                    "p-6 rounded-2xl",
                    "bg-white dark:bg-[rgba(30,41,59,0.5)]",
                    "border border-[rgb(237,234,233)] dark:border-white/10",
                    "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">Avg Credits/User</span>
                  </div>
                  <p className="text-2xl font-bold text-[rgb(37,27,24)] dark:text-white">
                    {(analytics.averageCreditsPerUser || 0).toFixed(1)}
                  </p>
                </motion.div>
              )}

              {analytics.newUsersThisWeek !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, ...spring.soft }}
                  className={cn(
                    "p-6 rounded-2xl",
                    "bg-white dark:bg-[rgba(30,41,59,0.5)]",
                    "border border-[rgb(237,234,233)] dark:border-white/10",
                    "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">New This Week</span>
                  </div>
                  <p className="text-2xl font-bold text-[rgb(37,27,24)] dark:text-white">
                    {analytics.newUsersThisWeek?.toLocaleString() || 0}
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AnalyticsDashboard;
