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
  CreditCard
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
 * 
 * Requirements: 3.1
 */

const API_BASE = '/api';

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
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card variant="elevated" className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              Please log in to access the admin dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card variant="elevated" className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access the admin dashboard.
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <motion.div 
        className="max-w-6xl mx-auto p-4 md:p-6 pb-8"
        variants={softStaggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Header */}
        <motion.div variants={softStaggerItem} transition={transition.opux} className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage users, keys, and view analytics</p>
            </div>
            <Button variant="outline" size="sm" onClick={checkAdminStatus}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={softStaggerItem} transition={transition.opux}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="keys" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span className="hidden sm:inline">Keys</span>
              </TabsTrigger>
              <TabsTrigger value="gateways" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span className="hidden sm:inline">Gateways</span>
              </TabsTrigger>
              <TabsTrigger value="speed" className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                <span className="hidden sm:inline">Speed</span>
              </TabsTrigger>
              <TabsTrigger value="limits" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Limits</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <UsersList />
            </TabsContent>

            <TabsContent value="keys">
              <div className="space-y-6">
                <KeyGenerator />
                <KeysList />
              </div>
            </TabsContent>

            <TabsContent value="gateways">
              <AdminGatewayManagement />
            </TabsContent>

            <TabsContent value="speed">
              <AdminSpeedConfig />
            </TabsContent>

            <TabsContent value="limits">
              <TierLimitsConfig />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </ScrollArea>
  );
}

export default AdminPage;
