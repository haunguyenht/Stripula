import { useState, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, TreeDeciduous, HelpCircle, Wallet, Target, MapPin, SquareStack } from 'lucide-react';
import { TopTabBar } from '../navigation/TopTabBar';
import { AppBackground } from '../background/AppBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { GlobalErrorBoundary } from '@/components/ui/GlobalErrorBoundary';
import { TelegramContactButton } from '@/components/ui/TelegramContactButton';
import { DailyClaimModal } from '@/components/credits/DailyClaimModal';
import { PageLoader } from '@/components/ui/loading-overlay';
import { transition, variants } from '@/lib/motion';
import { useAuth } from '@/contexts/AuthContext';
import { useValidation, ValidationProvider } from '@/contexts/ValidationContext';
import { useTierExpirationWarning } from '@/hooks/useTierExpirationWarning';
import { useMaintenanceStatus } from '@/hooks/useMaintenanceStatus';

// Lazy-loaded route components for code splitting
const StripeOwn = lazy(() => import('../StripeOwn'));
const StripeAuthPanel = lazy(() => import('../stripe/panels/StripeAuthPanel').then(m => ({ default: m.StripeAuthPanel })));
const StripeChargePanel = lazy(() => import('../stripe/panels/StripeChargePanel').then(m => ({ default: m.StripeChargePanel })));
const ShopifyChargePanel = lazy(() => import('../shopify/panels/ShopifyChargePanel').then(m => ({ default: m.ShopifyChargePanel })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const AdminPage = lazy(() => import('@/pages/AdminPage').then(m => ({ default: m.AdminPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const MaintenancePage = lazy(() => import('@/pages/MaintenancePage').then(m => ({ default: m.MaintenancePage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

/**
 * AppLayout - Main application layout with shadcn/ui components
 * Protected by authentication - shows login page when not authenticated
 * Wrapped with GlobalErrorBoundary for top-level error handling
 * 
 * Requirements: 6.1, 6.2 - Global error handling with ErrorPage
 */
export function AppLayout() {
  return (
    <GlobalErrorBoundary>
      <ValidationProvider>
        <AppLayoutInner />
      </ValidationProvider>
    </GlobalErrorBoundary>
  );
}

function AppLayoutInner() {
  const { isAuthenticated, isLoading, user: authUser } = useAuth();
  const { isValidating, stopValidation } = useValidation();
  const tierExpirationInfo = useTierExpirationWarning();
  
  // Maintenance mode status (Requirements: 1.3, 1.4, 2.1)
  const { 
    isMaintenanceMode, 
    reason: maintenanceReason, 
    estimatedEndTime: maintenanceEndTime 
  } = useMaintenanceStatus();
  
  // Use saved route from localStorage, default to dashboard
  const [activeRoute, setActiveRoute] = useState(() => 
    localStorage.getItem('appActiveRoute') || 'dashboard'
  );
  
  // Confirmation dialog state for route switching during validation
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(null);

  // Transform auth user to nav user format
  const navUser = authUser ? {
    name: authUser.firstName || authUser.first_name || 'User',
    email: authUser.username ? `@${authUser.username}` : null,
    credits: authUser.creditBalance ?? authUser.credit_balance ?? 0,
    tier: authUser.tier || 'free',
    photoUrl: authUser.photoUrl || authUser.photo_url,
    isAdmin: authUser.isAdmin || authUser.is_admin || false,
  } : null;

  // Handle navigation with confirmation if validating
  const handleNavigate = useCallback((routeId) => {
    if (isValidating && routeId !== activeRoute) {
      // Show confirmation dialog
      setPendingRoute(routeId);
      setShowStopConfirm(true);
    } else {
      setActiveRoute(routeId);
      localStorage.setItem('appActiveRoute', routeId);
    }
  }, [isValidating, activeRoute]);

  // Confirm stop and navigate
  const handleConfirmStop = useCallback(() => {
    stopValidation();
    if (pendingRoute) {
      setActiveRoute(pendingRoute);
      localStorage.setItem('appActiveRoute', pendingRoute);
      setPendingRoute(null);
    }
  }, [pendingRoute, stopValidation]);

  // Cancel navigation
  const handleCancelStop = useCallback(() => {
    setPendingRoute(null);
  }, []);

  // Handle maintenance mode end - redirect to dashboard
  // Requirement 2.5: Automatically redirect users when maintenance ends
  const handleMaintenanceEnd = useCallback(() => {
    // Refresh the page to restore normal access
    window.location.reload();
  }, []);

  // Handle navigation to dashboard (for 404 page)
  // Requirement 3.1: Show NotFoundPage for invalid routes
  const handleNavigateHome = useCallback(() => {
    setActiveRoute('dashboard');
    localStorage.setItem('appActiveRoute', 'dashboard');
  }, []);

  // Valid routes list for 404 detection
  // Requirement 3.1: Display 404 error page for non-existent routes
  const validRoutes = [
    'dashboard',
    'stripe-auth',
    'stripe-charge',
    'stripe-skbased',
    'braintree-auth',
    'braintree-charge',
    'paypal-charge',
    'adyen-auth',
    'adyen-charge',
    'shopify-charge',
    'target-charge',
    'other-sk-key-check',
    'other-charge-avs',
    'other-square-charge',
    'profile',
    'admin',
    'help'
  ];

  const renderContent = () => {
    // Check if route is valid - show 404 for unknown routes
    // Requirement 3.1: WHEN a user accesses a route that does not exist, THE System SHALL display the 404 error page
    if (!validRoutes.includes(activeRoute)) {
      return (
        <NotFoundPage onNavigateHome={handleNavigateHome} />
      );
    }

    const content = (() => {
      switch (activeRoute) {
        case 'dashboard':
          return <DashboardPage />;
        case 'stripe-auth':
          return <StripeAuthPanel />;
        case 'stripe-charge':
          return <StripeChargePanel />;
        case 'stripe-skbased':
          return <StripeOwn />;
        case 'braintree-auth':
          return <PlaceholderPage title="Braintree Auth" description="Braintree authentication with 3 gateways" Icon={TreeDeciduous} />;
        case 'braintree-charge':
          return <PlaceholderPage title="Braintree Charge" description="Braintree payment check with 3 gateways" Icon={TreeDeciduous} />;
        case 'paypal-charge':
          return <PlaceholderPage title="PayPal Charge" description="PayPal payment check with 3 gateways" Icon={Wallet} />;
        case 'adyen-auth':
          return <PlaceholderPage title="Adyen Auth" description="Adyen authentication with 3 gateways" Icon={Wallet} />;
        case 'adyen-charge':
          return <PlaceholderPage title="Adyen Charge" description="Adyen payment check with 3 gateways" Icon={Zap} />;
        case 'shopify-charge':
          return <ShopifyChargePanel />;
        case 'target-charge':
          return <PlaceholderPage title="Target Charge" description="Target payment check with 3 gateways" Icon={Target} />;
        case 'other-sk-key-check':
          return <StripeOwn initialTab="keys" />;
        case 'other-charge-avs':
          return <PlaceholderPage title="Charge AVS" description="Address verification service validation" Icon={MapPin} />;
        case 'other-square-charge':
          return <PlaceholderPage title="Square Charge" description="Square payment validation" Icon={SquareStack} />;
        case 'profile':
          return <ProfilePage />;
        case 'admin':
          return <AdminPage />;
        case 'help':
          return <PlaceholderPage title="Help" description="Documentation and support" Icon={HelpCircle} />;
        default:
          // Fallback to dashboard (should not reach here due to validRoutes check)
          return <DashboardPage />;
      }
    })();
    
    return (
      <Suspense fallback={<PageLoader label="Loading..." sublabel="Please wait" variant="orbit" />}>
        {content}
      </Suspense>
    );
  };

  // Show loading spinner while checking auth
  if (isLoading) {
    return <PageLoader label="Initializing..." sublabel="Checking authentication" variant="orbit" />;
  }

  // Show login page when not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-transparent">
        <AppBackground />
        <main className="flex-1 flex flex-col overflow-hidden relative z-0">
          <Suspense fallback={<PageLoader label="Loading..." sublabel="Please wait" variant="orbit" />}>
            <LoginPage />
          </Suspense>
        </main>
      </div>
    );
  }

  // Check if user is admin for maintenance bypass
  const isAdmin = navUser?.isAdmin || false;

  // Show maintenance page when maintenance mode is active for non-admin users
  // Requirements: 1.3, 1.4, 2.1 - Admin users can bypass maintenance mode
  if (isMaintenanceMode && !isAdmin) {
    return (
      <Suspense fallback={<PageLoader label="Loading..." sublabel="Please wait" variant="orbit" />}>
        <MaintenancePage 
          reason={maintenanceReason}
          estimatedEndTime={maintenanceEndTime}
          onMaintenanceEnd={handleMaintenanceEnd}
        />
      </Suspense>
    );
  }

  // Authenticated - show main app
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-transparent">
      {/* Daily claim modal - auto shows when available */}
      <DailyClaimModal autoShow />
      
      {/* Confirmation dialog for stopping validation */}
      <ConfirmDialog
        open={showStopConfirm}
        onOpenChange={setShowStopConfirm}
        title="Stop validation?"
        description="Validation is still in progress. Are you sure you want to stop and navigate away? Any pending cards will not be processed."
        confirmLabel="Stop & Navigate"
        cancelLabel="Continue Validation"
        onConfirm={handleConfirmStop}
        onCancel={handleCancelStop}
      />
      
      {/* Decorative background with gradient and floating dots */}
      <AppBackground />
      
      <TopTabBar 
        activeRoute={activeRoute} 
        onNavigate={handleNavigate}
        user={navUser}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden relative z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRoute}
            className="h-full"
            {...variants.fadeIn}
            transition={transition.fast}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Floating Telegram contact button */}
      <TelegramContactButton />
    </div>
  );
}

function PlaceholderPage({ title, description, Icon, comingSoon = false }) {
  return (
    <div className="flex items-center justify-center h-full p-4">
      <Card variant="elevated" className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <motion.div 
            className="flex items-center justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          >
            <div className="w-20 h-20 rounded-xl bg-primary/8 flex items-center justify-center">
              <Icon className="w-10 h-10 text-primary" strokeWidth={1.5} />
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold mb-3">
            {title}
          </h1>
          <p className="text-muted-foreground">
            {description}
          </p>
          {comingSoon && (
            <motion.div 
              className="mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Badge variant="secondary">
                Coming Soon
              </Badge>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
