import { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RefreshCw, AlertCircle, CreditCard, Target, Users, Zap, 
  Activity, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GatewayOverview, 
  LeaderboardCard, 
  OnlineUsersCard
} from '@/components/dashboard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { useGatewayStatus } from '@/hooks/useGatewayStatus';
import { useAuth } from '@/contexts/AuthContext';
import { getTierConfig } from '@/components/navigation/config/tier-config';

/**
 * Compact stat item for hero section
 */
function HeroStat({ icon: Icon, label, value, subValue, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 group"
    >
      <div className={cn(
        "flex items-center justify-center w-11 h-11 rounded-xl relative",
        "bg-gradient-to-br shadow-md",
        // Light: treasury seal / copper coin embossed effect with enhanced depth
        "shadow-[0_0_0_1px_hsl(25,50%,52%,0.2),0_3px_10px_hsl(25,35%,35%,0.18),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.12)]",
        "dark:shadow-md",
        // Hover: subtle lift with copper shimmer
        "transition-all duration-300 group-hover:shadow-[0_0_0_1px_hsl(25,55%,50%,0.3),0_5px_14px_hsl(25,40%,30%,0.22),inset_0_1px_0_rgba(255,255,255,0.4)]",
        "group-hover:translate-y-[-1px] dark:group-hover:translate-y-0",
        gradient
      )}>
        <Icon className="w-5 h-5 text-white drop-shadow-sm" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className={cn(
          "text-[9px] font-bold text-muted-foreground uppercase tracking-[0.12em]",
          // Light: subtle embossed label with intaglio effect
          "[text-shadow:0_1px_0_rgba(255,255,255,0.6)] dark:[text-shadow:none]"
        )}>
          {label}
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className={cn(
            "text-xl font-bold tabular-nums tracking-tight text-foreground",
            // Light: deep letterpress effect for values
            "[text-shadow:0_1px_0_rgba(255,255,255,0.7),0_-1px_0_rgba(101,67,33,0.1)] dark:[text-shadow:none]"
          )}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {subValue && (
            <span className={cn(
              "text-[10px] font-semibold text-muted-foreground",
              "[text-shadow:0_1px_0_rgba(255,255,255,0.4)] dark:[text-shadow:none]"
            )}>
              {subValue}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Live connection status
 */
function LiveBadge({ isConnected, onReconnect }) {
  return (
    <div className="flex items-center gap-2">
      <motion.div 
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold",
          "border backdrop-blur-sm",
          isConnected 
            // Light: Vintage Banking antique green with wax seal effect | Dark: emerald aurora
            ? cn(
                "bg-gradient-to-b from-[hsl(145,38%,94%)] to-[hsl(145,35%,90%)]",
                "border-[hsl(145,30%,75%)] text-[hsl(145,45%,35%)]",
                "shadow-[0_1px_2px_hsl(145,30%,40%,0.1),inset_0_1px_0_rgba(255,255,255,0.5)]",
                "[text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
                "dark:bg-none dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400 dark:shadow-none dark:[text-shadow:none]"
              )
            // Light: burgundy ink with wax seal effect | Dark: red aurora
            : cn(
                "bg-gradient-to-b from-[hsl(355,38%,95%)] to-[hsl(355,35%,92%)]",
                "border-[hsl(355,30%,78%)] text-[hsl(355,45%,42%)]",
                "shadow-[0_1px_2px_hsl(355,30%,40%,0.1),inset_0_1px_0_rgba(255,255,255,0.5)]",
                "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
                "dark:bg-none dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400 dark:shadow-none dark:[text-shadow:none]"
              )
        )}
        animate={isConnected ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="relative flex h-2 w-2">
          {isConnected && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-[hsl(145,45%,40%)] dark:bg-emerald-500 opacity-60 animate-ping" />
          )}
          <span className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            isConnected ? "bg-[hsl(145,45%,40%)] dark:bg-emerald-500" : "bg-[hsl(355,45%,45%)] dark:bg-red-500 animate-pulse"
          )} />
        </span>
        {isConnected ? 'LIVE' : 'OFFLINE'}
      </motion.div>
      
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Button variant="outline" size="sm" onClick={onReconnect} className="h-8 px-3 text-xs gap-1.5">
              <RefreshCw className="w-3 h-3" />
              Retry
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Compact hero with user info and all key stats
 */
function HeroSection({ user, personalStats, globalStats, isConnected, onReconnect, isLoading }) {
  const firstName = user?.firstName || user?.first_name || user?.username || 'User';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const tier = user?.tier || 'free';
  const tierConfig = getTierConfig(tier);
  const TierIcon = tierConfig.icon;

  const hitRate = personalStats?.totalCards > 0 
    ? ((personalStats?.totalHits / personalStats?.totalCards) * 100).toFixed(1) + '%'
    : '0%';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, rotateX: -5 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: '1000px' }}
      className={cn(
        "relative rounded-3xl overflow-hidden p-6",
        // Light mode - Vintage Banking cream parchment with ornate certificate border
        "bg-gradient-to-b from-[hsl(42,52%,98%)] via-[hsl(40,48%,97%)] to-[hsl(38,42%,94%)]",
        "backdrop-blur-sm",
        "border border-[hsl(30,28%,80%)]",
        // Enhanced certificate-style triple border with treasury depth
        "shadow-[0_12px_40px_hsl(25,40%,25%,0.1),0_0_0_1px_hsl(30,30%,82%),0_0_0_3px_hsl(42,48%,97%),0_0_0_4px_hsl(30,25%,78%),0_0_0_6px_hsl(42,45%,96%),0_0_0_7px_hsl(30,20%,82%)]",
        // Dark mode - Premium Liquid Aurora frosted glass with prismatic edge
        "dark:bg-none dark:bg-[rgba(12,14,20,0.88)]",
        "dark:backdrop-blur-[60px] dark:backdrop-saturate-[200%]",
        "dark:border-[rgba(139,92,246,0.18)]",
        "dark:shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8),0_0_100px_-30px_rgba(139,92,246,0.15),0_0_80px_-30px_rgba(34,211,238,0.1),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.3)]"
      )}
    >
      {/* Paper texture for light, noise for dark */}
      <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.15] pointer-events-none bg-[image:var(--paper-grain)] dark:bg-[image:var(--noise-pattern-subtle)] bg-repeat" />
      
      {/* Guilloche/rosette pattern overlay for light mode - enhanced security pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 4px, hsl(25,40%,60%) 4px, hsl(25,40%,60%) 5px),
            repeating-linear-gradient(90deg, transparent, transparent 4px, hsl(25,40%,60%) 4px, hsl(25,40%,60%) 5px),
            repeating-conic-gradient(from 0deg at 100% 0%, transparent 0deg 45deg, hsl(25,35%,65%,0.3) 45deg 90deg)
          `,
          backgroundSize: '16px 16px, 16px 16px, 60px 60px'
        }}
      />
      
      {/* Corner ornamental brackets - light mode only */}
      <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[hsl(25,55%,55%)] rounded-tl-sm opacity-60 dark:opacity-0 pointer-events-none" />
      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[hsl(25,55%,55%)] rounded-tr-sm opacity-60 dark:opacity-0 pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[hsl(25,55%,55%)] rounded-bl-sm opacity-60 dark:opacity-0 pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[hsl(25,55%,55%)] rounded-br-sm opacity-60 dark:opacity-0 pointer-events-none" />
      
      {/* Top accent - copper foil band for light, prismatic aurora for dark */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[hsl(22,70%,42%)] via-[hsl(28,75%,52%)] to-[hsl(35,65%,48%)] dark:from-[#8b5cf6] dark:via-[#22d3ee] dark:to-[#ec4899]" />
      
      {/* Specular highlight edge - dark mode only */}
      <div className="hidden dark:block absolute top-2 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent pointer-events-none" />
      
      {/* Decorative orb - warm copper glow for light, aurora for dark */}
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-[hsl(25,55%,58%)]/12 via-[hsl(32,50%,55%)]/8 to-[hsl(38,45%,50%)]/5 dark:from-[rgba(139,92,246,0.22)] dark:via-[rgba(34,211,238,0.15)] dark:to-transparent blur-3xl pointer-events-none" />
      
      {/* Secondary aurora orb - dark mode only */}
      <div className="hidden dark:block absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-gradient-to-tr from-[rgba(236,72,153,0.15)] via-[rgba(139,92,246,0.1)] to-transparent blur-3xl pointer-events-none" />
      
      {/* Subtle watermark circle - light mode only */}
      <div className="absolute top-1/2 right-8 -translate-y-1/2 w-32 h-32 rounded-full bg-radial-gradient opacity-[0.03] dark:opacity-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, transparent 30%, hsl(30,35%,75%) 50%, transparent 70%)'
        }}
      />
      
      <div className="relative">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div>
              <p className={cn(
                "text-xs font-medium text-muted-foreground",
                "[text-shadow:0_1px_0_rgba(255,255,255,0.5)] dark:[text-shadow:none]"
              )}>{greeting}</p>
              <h1 className={cn(
                "text-2xl font-bold tracking-tight text-foreground",
                // Light: letterpress embossed heading
                "[text-shadow:0_1px_0_rgba(255,255,255,0.7),0_-1px_0_rgba(101,67,33,0.1)] dark:[text-shadow:none]"
              )}>{firstName}</h1>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "gap-1 px-2 py-0.5 text-[10px] font-bold capitalize",
                tierConfig.borderColor, tierConfig.bgColor, tierConfig.color
              )}
            >
              <TierIcon className="w-3 h-3" />
              {tier}
            </Badge>
          </div>
          <LiveBadge isConnected={isConnected} onReconnect={onReconnect} />
        </div>

        {/* Stats row - compact grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
          <HeroStat
            icon={CreditCard}
            label="Your Cards"
            value={isLoading ? '—' : (personalStats?.totalCards || 0)}
            gradient="from-[hsl(200,50%,40%)] to-[hsl(220,45%,45%)] dark:from-blue-500 dark:to-indigo-600"
            delay={0.1}
          />
          <HeroStat
            icon={Target}
            label="Your Hits"
            value={isLoading ? '—' : (personalStats?.totalHits || 0)}
            subValue={hitRate}
            gradient="from-[hsl(145,45%,38%)] to-[hsl(150,40%,35%)] dark:from-emerald-500 dark:to-green-600"
            delay={0.15}
          />
          <HeroStat
            icon={BarChart3}
            label="Today"
            value={isLoading ? '—' : (personalStats?.hitsToday || 0)}
            subValue="hits"
            gradient="from-[hsl(355,45%,48%)] to-[hsl(350,40%,42%)] dark:from-pink-500 dark:to-rose-600"
            delay={0.2}
          />
          <HeroStat
            icon={Users}
            label="Online"
            value={isLoading ? '—' : (globalStats?.onlineCount || 0)}
            subValue={`/ ${globalStats?.totalMembers || 0}`}
            gradient="from-[hsl(25,55%,48%)] to-[hsl(30,50%,42%)] dark:from-violet-500 dark:to-purple-600"
            delay={0.25}
          />
          <HeroStat
            icon={Zap}
            label="Platform"
            value={isLoading ? '—' : (globalStats?.totalHits || 0)}
            subValue="hits"
            gradient="from-[hsl(38,65%,48%)] to-[hsl(25,70%,45%)] dark:from-amber-500 dark:to-orange-600"
            delay={0.3}
          />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Error banner
 */
function ErrorBanner({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden mb-4"
    >
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        // Light: Vintage Banking burgundy with certificate border | Dark: red aurora (bg-none resets light gradient)
        "bg-gradient-to-b from-[hsl(355,35%,96%)] to-[hsl(355,35%,93%)]",
        "border border-[hsl(355,30%,80%)] backdrop-blur-sm",
        "shadow-[0_1px_3px_hsl(355,30%,40%,0.08),inset_0_1px_0_rgba(255,255,255,0.6)]",
        "dark:bg-none dark:bg-red-500/10 dark:border-red-500/20 dark:shadow-none"
      )}>
        <AlertCircle className="w-4 h-4 text-[hsl(355,45%,45%)] dark:text-red-500 flex-shrink-0" />
        <p className={cn(
          "text-sm font-medium text-[hsl(355,45%,42%)] dark:text-red-400 flex-1 truncate",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.4)] dark:[text-shadow:none]"
        )}>
          {message || "Connection error"}
        </p>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="h-7 px-2 text-xs">
            Retry
          </Button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * DashboardPage - Clean, concise dashboard
 */
function DashboardPageComponent() {
  const { user } = useAuth();
  
  const { 
    personalStats,
    globalStats,
    isConnected: statsConnected,
    error: statsError,
    isLoading: statsLoading,
    reconnect: reconnectStats,
  } = useDashboardStats();
  
  const { 
    leaderboard, 
    isLoading: leaderboardLoading,
    error: leaderboardError,
    refresh: refreshLeaderboard
  } = useLeaderboard({ limit: 5 });
  
  const { 
    users: onlineUsers,
    page,
    totalPages,
    total: onlineTotal,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    isLoading: onlineLoading,
    error: onlineError,
    refresh: refreshOnline
  } = useOnlineUsers({ limit: 6 });
  
  const { 
    gateways, 
    isConnected: gatewayConnected,
    error: gatewayError,
    refresh: refreshGateways
  } = useGatewayStatus();

  const isConnected = statsConnected && gatewayConnected;
  const hasError = statsError || leaderboardError || onlineError || gatewayError;
  
  const handleReconnect = () => {
    reconnectStats();
    refreshLeaderboard();
    refreshOnline();
    refreshGateways();
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-5">
        
        {/* Error Banner */}
        <AnimatePresence>
          {hasError && !isConnected && (
            <ErrorBanner 
              message={statsError || leaderboardError || onlineError || gatewayError}
              onRetry={handleReconnect}
            />
          )}
        </AnimatePresence>

        {/* Hero Section - All stats in one card */}
        <HeroSection 
          user={user}
          personalStats={personalStats}
          globalStats={globalStats}
          isConnected={isConnected}
          onReconnect={handleReconnect}
          isLoading={statsLoading}
        />

        {/* Main Grid - 3 cards only */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Gateway Status - Primary focus */}
          <motion.div 
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <GatewayOverview 
              gateways={gateways} 
              isLoading={!gatewayConnected && gateways.length === 0}
            />
          </motion.div>

          {/* Right Column - Leaderboard & Online Users stacked */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <LeaderboardCard 
                leaderboard={leaderboard}
                currentUserId={user?.id}
                isLoading={leaderboardLoading}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <OnlineUsersCard 
                users={onlineUsers}
                page={page}
                totalPages={totalPages}
                total={onlineTotal}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                onNextPage={nextPage}
                onPrevPage={prevPage}
                isLoading={onlineLoading}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const DashboardPage = memo(DashboardPageComponent);
export default DashboardPage;
