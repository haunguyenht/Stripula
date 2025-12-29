import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, TreeDeciduous, HelpCircle, Wallet, ShoppingBag, Target, Layers, Key, MapPin, SquareStack } from 'lucide-react';
import { TopTabBar } from '../navigation/TopTabBar';
import StripeOwn from '../StripeOwn';
import { StripeAuthPanel } from '../stripe/panels/StripeAuthPanel';
import { StripeChargePanel } from '../stripe/panels/StripeChargePanel';
import { ShopifyChargePanel } from '../shopify/panels/ShopifyChargePanel';
import { ProfilePage } from '@/pages/ProfilePage';
import { LoginPage } from '@/pages/LoginPage';
import { AdminPage } from '@/pages/AdminPage';
import { AppBackground } from '../background/AppBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { TelegramContactButton } from '@/components/ui/TelegramContactButton';
import { DailyClaimModal } from '@/components/credits/DailyClaimModal';
import { PageLoader } from '@/components/ui/loading-overlay';
import { transition, variants } from '@/lib/motion';
import { useAuth } from '@/contexts/AuthContext';
import { useValidation, ValidationProvider } from '@/contexts/ValidationContext';

/**
 * AppLayout - Main application layout with shadcn/ui components
 * Protected by authentication - shows login page when not authenticated
 */
export function AppLayout() {
  return (
    <ValidationProvider>
      <AppLayoutInner />
    </ValidationProvider>
  );
}

function AppLayoutInner() {
  const { isAuthenticated, isLoading, user: authUser } = useAuth();
  const { isValidating, stopValidation } = useValidation();
  const [activeRoute, setActiveRoute] = useState(() => 
    localStorage.getItem('appActiveRoute') || 'profile'
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

  const renderContent = () => {
    switch (activeRoute) {
      case 'stripe-auth':
        return (
          <ErrorBoundary fallbackMessage="Error loading Stripe Auth panel. Your input has been preserved.">
            <StripeAuthPanel />
          </ErrorBoundary>
        );
      case 'stripe-charge':
        return (
          <ErrorBoundary fallbackMessage="Error loading Stripe Charge panel. Your input has been preserved.">
            <StripeChargePanel />
          </ErrorBoundary>
        );
      case 'stripe-skbased':
        return (
          <ErrorBoundary fallbackMessage="Error loading SK-Based panel. Your input has been preserved.">
            <StripeOwn />
          </ErrorBoundary>
        );
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
        return (
          <ErrorBoundary fallbackMessage="Error loading Shopify Charge panel. Your input has been preserved.">
            <ShopifyChargePanel />
          </ErrorBoundary>
        );
      case 'target-charge':
        return <PlaceholderPage title="Target Charge" description="Target payment check with 3 gateways" Icon={Target} />;
      case 'other-sk-key-check':
        return (
          <ErrorBoundary fallbackMessage="Error loading SK Key Check panel. Your input has been preserved.">
            <StripeOwn initialTab="keys" />
          </ErrorBoundary>
        );
      case 'other-charge-avs':
        return <PlaceholderPage title="Charge AVS" description="Address verification service validation" Icon={MapPin} />;
      case 'other-square-charge':
        return <PlaceholderPage title="Square Charge" description="Square payment validation" Icon={SquareStack} />;
      case 'profile':
        return (
          <ErrorBoundary fallbackMessage="Error loading Profile page.">
            <ProfilePage />
          </ErrorBoundary>
        );
      case 'admin':
        return (
          <ErrorBoundary fallbackMessage="Error loading Admin page.">
            <AdminPage />
          </ErrorBoundary>
        );
      case 'help':
        return <PlaceholderPage title="Help" description="Documentation and support" Icon={HelpCircle} />;
      default:
        return (
          <ErrorBoundary fallbackMessage="Error loading SK-Based panel. Your input has been preserved.">
            <StripeOwn />
          </ErrorBoundary>
        );
    }
  };

  // Show loading spinner while checking auth
  if (isLoading) {
    return <PageLoader label="Initializing..." sublabel="Checking authentication" variant="orbit" />;
  }

  // Show login page when not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-[rgb(248,247,247)] dark:bg-transparent">
        <AppBackground />
        <main className="flex-1 flex flex-col overflow-hidden relative z-0">
          <LoginPage />
        </main>
      </div>
    );
  }

  // Authenticated - show main app
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[rgb(248,247,247)] dark:bg-transparent">
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
        <ErrorBoundary>
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
        </ErrorBoundary>
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
