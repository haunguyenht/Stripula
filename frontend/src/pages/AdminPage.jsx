import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Key, 
  BarChart3, 
  ShieldAlert,
  RefreshCw,
  Gauge,
  Server,
  CreditCard,
  Shield,
  Settings2,
  Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageLoader } from '@/components/ui/page-loader';
import { useAuth } from '@/contexts/AuthContext';
import { KeyGenerator } from '@/components/admin/KeyGenerator';
import { KeysList } from '@/components/admin/KeysList';
import { UsersList } from '@/components/admin/UsersList';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { AdminSpeedConfig } from '@/components/admin/AdminSpeedConfig';
import { AdminGatewayManagement } from '@/components/admin/AdminGatewayManagement';
import { TierLimitsConfig } from '@/components/admin/TierLimitsConfig';
import { MaintenanceControls } from '@/components/admin/MaintenanceControls';
import { 
  transition, 
  softStaggerContainer, 
  softStaggerItem 
} from '@/lib/motion';

/**
 * AdminPage Component
 * Admin dashboard with tabs for Users, Keys, and Analytics
 * Redesigned with Vintage Banking (light) / Liquid Aurora (dark) design system
 * 
 * Requirements: 3.1
 */

const API_BASE = '/api';

// Tab configuration - centralized for easy modification
const ADMIN_TABS = [
  { id: 'users', label: 'Users', icon: Users, description: 'Manage user accounts' },
  { id: 'keys', label: 'Keys', icon: Key, description: 'Redeem key management' },
  { id: 'gateways', label: 'Gateways', icon: Server, description: 'Gateway status & config' },
  { id: 'speed', label: 'Speed', icon: Gauge, description: 'Speed limits per tier' },
  { id: 'limits', label: 'Limits', icon: CreditCard, description: 'Card input limits' },
  { id: 'system', label: 'System', icon: Wrench, description: 'Maintenance & system settings' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Usage statistics' },
];

export function AdminPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  // Check if user is admin
  const checkAdminStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setIsCheckingAdmin(false);
      return;
    }

    try {
      // Try to access admin endpoint to verify admin status
      const response = await fetch(`${API_BASE}/admin/users?limit=1`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setIsAdmin(true);
      } else if (response.status === 403) {
        setIsAdmin(false);
      }
    } catch (err) {
      setIsAdmin(false);
    } finally {
      setIsCheckingAdmin(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  // Loading state
  if (authLoading || isCheckingAdmin) {
    return <PageLoader variant="admin" />;
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "max-w-md w-full rounded-2xl overflow-hidden",
            // Light: Vintage Banking cream parchment
            "bg-[hsl(40,45%,97%)] dark:bg-[rgba(30,41,59,0.5)]",
            "border border-[hsl(30,25%,82%)] dark:border-white/10",
            "dark:backdrop-blur-sm shadow-lg dark:shadow-none"
          )}
        >
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[hsl(38,35%,93%)] dark:bg-white/5 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="h-10 w-10 text-[hsl(25,20%,50%)] dark:text-muted-foreground/50" />
            </div>
            <h2 className="text-2xl font-bold font-serif text-[hsl(25,35%,18%)] dark:text-white mb-2">Access Denied</h2>
            <p className="text-[hsl(25,20%,45%)] dark:text-muted-foreground">
              Please log in to access the admin dashboard.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "max-w-md w-full rounded-2xl overflow-hidden",
            // Light: Vintage Banking with burgundy accent
            "bg-[hsl(40,45%,97%)] dark:bg-[rgba(30,41,59,0.5)]",
            "border border-[hsl(355,30%,78%)] dark:border-red-500/20",
            "dark:backdrop-blur-sm shadow-lg dark:shadow-none"
          )}
        >
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[hsl(355,35%,92%)] dark:bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="h-10 w-10 text-[hsl(355,45%,45%)] dark:text-red-500" />
            </div>
            <h2 className="text-2xl font-bold font-serif text-[hsl(25,35%,18%)] dark:text-white mb-2">Admin Access Required</h2>
            <p className="text-[hsl(25,20%,45%)] dark:text-muted-foreground mb-6">
              You don't have permission to access the admin dashboard.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="rounded-xl"
            >
              Go Back
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Get current tab info
  const currentTab = ADMIN_TABS.find(t => t.id === activeTab);

  return (
    <ScrollArea className="h-full">
      <motion.div 
        className="max-w-7xl mx-auto p-4 md:p-6 pb-8"
        variants={softStaggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Header Card - Vintage ledger/registry styling */}
        <motion.div 
          variants={softStaggerItem} 
          transition={transition.opux}
          className={cn(
            "rounded-2xl overflow-hidden mb-6",
            // Light: Vintage Banking cream parchment with certificate double-line border
            "bg-gradient-to-b from-[hsl(42,50%,98%)] via-[hsl(40,45%,97%)] to-[hsl(38,40%,95%)]",
            "border border-[hsl(30,25%,82%)]",
            "shadow-[0_4px_16px_hsl(25,30%,25%,0.06),0_0_0_1px_hsl(30,25%,85%),0_0_0_3px_hsl(42,45%,97%),0_0_0_4px_hsl(30,20%,80%)]",
            // Dark mode (bg-none resets light gradient)
            "dark:bg-none dark:bg-[rgba(30,41,59,0.5)] dark:border-white/10",
            "dark:backdrop-blur-sm dark:shadow-none"
          )}
        >
          {/* Gradient Header with guilloche pattern */}
          <div className="relative px-6 py-6 bg-gradient-to-br from-[hsl(25,50%,88%)]/50 via-[hsl(30,40%,92%)]/30 to-transparent dark:from-primary/10 dark:via-primary/5 dark:to-transparent border-b border-[hsl(30,25%,85%)] dark:border-white/10">
            {/* Subtle guilloche pattern overlay for light mode */}
            <div 
              className="absolute inset-0 opacity-[0.015] dark:opacity-0 pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 3px),
                                 repeating-linear-gradient(90deg, transparent, transparent 2px, currentColor 2px, currentColor 3px)`,
                backgroundSize: '10px 10px'
              }}
            />
            
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-14 w-14 rounded-xl flex items-center justify-center",
                  // Light: copper coin effect (dark:bg-none resets light gradient)
                  "bg-gradient-to-b from-[hsl(28,45%,90%)] to-[hsl(25,40%,85%)]",
                  "shadow-[0_2px_6px_hsl(25,30%,35%,0.12),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(101,67,33,0.1)]",
                  "dark:bg-none dark:bg-primary/20 dark:shadow-none"
                )}>
                  <Shield className="h-7 w-7 text-[hsl(25,75%,45%)] dark:text-primary" />
                </div>
                <div>
                  <h1 className={cn(
                    "text-2xl md:text-3xl font-bold font-serif text-[hsl(25,35%,18%)] dark:text-white",
                    // Light: letterpress embossed heading
                    "[text-shadow:0_1px_0_rgba(255,255,255,0.7),0_-1px_0_rgba(101,67,33,0.1)] dark:[text-shadow:none]"
                  )}>
                    Admin Dashboard
                  </h1>
                  <p className={cn(
                    "text-sm text-[hsl(25,20%,45%)] dark:text-muted-foreground mt-0.5",
                    "[text-shadow:0_1px_0_rgba(255,255,255,0.5)] dark:[text-shadow:none]"
                  )}>
                    Manage users, keys, gateways, and system settings
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline" 
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(145,35%,92%)] text-[hsl(145,45%,35%)] dark:bg-emerald-500/10 dark:text-emerald-400 border-[hsl(145,30%,75%)] dark:border-emerald-500/20"
                >
                  <span className="h-2 w-2 rounded-full bg-[hsl(145,45%,40%)] dark:bg-emerald-500 animate-pulse" />
                  Admin
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkAdminStatus}
                  className="h-9 px-4 rounded-xl"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs Navigation - Vintage ledger tabs */}
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={cn(
                "inline-flex h-12 items-center justify-start rounded-xl p-1 gap-1",
                // Light: Vintage Banking aged paper with inset shadow
                "bg-gradient-to-b from-[hsl(40,38%,94%)] to-[hsl(38,35%,91%)]",
                "shadow-[inset_0_1px_3px_hsl(25,30%,35%,0.08),0_1px_0_rgba(255,255,255,0.6)]",
                "border border-[hsl(30,25%,82%)]",
                // Dark mode (bg-none resets light gradient)
                "dark:bg-none dark:bg-white/5 dark:border-white/10 dark:shadow-none",
                "w-full overflow-x-auto"
              )}>
                {ADMIN_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <TabsTrigger 
                      key={tab.id}
                      value={tab.id} 
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
                        "transition-all duration-200",
                        // Light: cream active state with copper text and embossed effect
                        "data-[state=active]:bg-gradient-to-b data-[state=active]:from-[hsl(44,45%,99%)] data-[state=active]:to-[hsl(42,40%,96%)]",
                        "data-[state=active]:shadow-[0_1px_3px_hsl(25,30%,35%,0.1),inset_0_1px_0_rgba(255,255,255,0.7)]",
                        "data-[state=active]:text-[hsl(25,75%,45%)]",
                        "data-[state=active]:[text-shadow:0_1px_0_rgba(255,255,255,0.6)]",
                        // Dark mode (bg-none resets light gradient)
                        "dark:data-[state=active]:bg-none dark:data-[state=active]:bg-white/10 dark:data-[state=active]:shadow-sm",
                        "dark:data-[state=active]:text-primary dark:data-[state=active]:[text-shadow:none]",
                        "whitespace-nowrap"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4",
                        isActive ? "text-[hsl(25,75%,45%)] dark:text-primary" : "text-[hsl(25,20%,50%)] dark:text-muted-foreground"
                      )} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Tab Content */}
              <div className="mt-6">
                <TabsContent value="users" className="m-0">
                  <UsersList />
                </TabsContent>

                <TabsContent value="keys" className="m-0">
                  <div className="space-y-6">
                    <KeyGenerator />
                    <KeysList />
                  </div>
                </TabsContent>

                <TabsContent value="gateways" className="m-0">
                  <AdminGatewayManagement />
                </TabsContent>

                <TabsContent value="speed" className="m-0">
                  <AdminSpeedConfig />
                </TabsContent>

                <TabsContent value="limits" className="m-0">
                  <TierLimitsConfig />
                </TabsContent>

                <TabsContent value="system" className="m-0">
                  <MaintenanceControls />
                </TabsContent>

                <TabsContent value="analytics" className="m-0">
                  <AnalyticsDashboard />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </motion.div>
      </motion.div>
    </ScrollArea>
  );
}

export default AdminPage;
