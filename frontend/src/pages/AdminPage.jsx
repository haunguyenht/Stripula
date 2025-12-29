import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Key, 
  BarChart3, 
  Loader2,
  ShieldAlert,
  RefreshCw,
  Gauge,
  Server,
  CreditCard,
  Shield,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { KeyGenerator } from '@/components/admin/KeyGenerator';
import { KeysList } from '@/components/admin/KeysList';
import { UsersList } from '@/components/admin/UsersList';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { AdminSpeedConfig } from '@/components/admin/AdminSpeedConfig';
import { AdminGatewayManagement } from '@/components/admin/AdminGatewayManagement';
import { TierLimitsConfig } from '@/components/admin/TierLimitsConfig';
import { 
  transition, 
  softStaggerContainer, 
  softStaggerItem 
} from '@/lib/motion';

/**
 * AdminPage Component
 * Admin dashboard with tabs for Users, Keys, and Analytics
 * Redesigned with OrangeAI (light) / OPUX (dark) design system
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
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="h-16 w-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Checking permissions...</p>
        </motion.div>
      </div>
    );
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
            "bg-white dark:bg-[rgba(30,41,59,0.5)]",
            "border border-[rgb(237,234,233)] dark:border-white/10",
            "dark:backdrop-blur-sm shadow-lg dark:shadow-none"
          )}
        >
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[rgb(250,247,245)] dark:bg-white/5 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h2 className="text-2xl font-bold text-[rgb(37,27,24)] dark:text-white mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
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
            "bg-white dark:bg-[rgba(30,41,59,0.5)]",
            "border border-red-200 dark:border-red-500/20",
            "dark:backdrop-blur-sm shadow-lg dark:shadow-none"
          )}
        >
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-[rgb(37,27,24)] dark:text-white mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground mb-6">
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
        {/* Header Card */}
        <motion.div 
          variants={softStaggerItem} 
          transition={transition.opux}
          className={cn(
            "rounded-2xl overflow-hidden mb-6",
            "bg-white dark:bg-[rgba(30,41,59,0.5)]",
            "border border-[rgb(237,234,233)] dark:border-white/10",
            "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
          )}
        >
          {/* Gradient Header */}
          <div className="relative px-6 py-6 bg-gradient-to-br from-[rgb(255,64,23)]/5 via-[rgb(255,64,23)]/3 to-transparent dark:from-primary/10 dark:via-primary/5 dark:to-transparent border-b border-[rgb(237,234,233)] dark:border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[rgb(37,27,24)] dark:text-white">
                    Admin Dashboard
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Manage users, keys, gateways, and system settings
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline" 
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
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

          {/* Tabs Navigation */}
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={cn(
                "inline-flex h-12 items-center justify-start rounded-xl p-1 gap-1",
                "bg-[rgb(250,247,245)] dark:bg-white/5",
                "border border-[rgb(237,234,233)] dark:border-white/10",
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
                        "data-[state=active]:bg-white dark:data-[state=active]:bg-white/10",
                        "data-[state=active]:shadow-sm",
                        "data-[state=active]:text-[rgb(255,64,23)] dark:data-[state=active]:text-primary",
                        "whitespace-nowrap"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4",
                        isActive ? "text-[rgb(255,64,23)] dark:text-primary" : "text-muted-foreground"
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
