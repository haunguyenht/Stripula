import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Zap, TreeDeciduous, HelpCircle, Wallet, ShoppingBag, Target, Hash, KeyRound, ShoppingCart } from 'lucide-react';
import { TopTabBar } from '../navigation/TopTabBar';
import StripeOwn from '../StripeOwn';
import { AppBackground } from '../background/AppBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { transition, variants } from '@/lib/motion';

/**
 * AppLayout - Main application layout with shadcn/ui components
 */
export function AppLayout() {
  const [activeRoute, setActiveRoute] = useState(() => 
    localStorage.getItem('appActiveRoute') || 'stripe-charge-1'
  );

  const handleNavigate = (routeId) => {
    setActiveRoute(routeId);
    localStorage.setItem('appActiveRoute', routeId);
  };

  const renderContent = () => {
    switch (activeRoute) {
      case 'stripe-auth':
        return <PlaceholderPage title="Stripe Auth" description="Key validation and authentication" Icon={Shield} />;
      case 'stripe-charge-1':
        return <StripeOwn />;
      case 'stripe-charge-2':
        return <PlaceholderPage title="Stripe Charge v2" description="Alternative charge validation method" Icon={Zap} />;
      case 'braintree-auth':
        return <PlaceholderPage title="Braintree Auth" description="Braintree authentication" Icon={TreeDeciduous} />;
      case 'paypal-charge':
        return <PlaceholderPage title="PayPal Charge" description="PayPal payment check" Icon={Wallet} />;
      case 'adyen-auth':
        return <PlaceholderPage title="Adyen Auth" description="Adyen authentication" Icon={Wallet} comingSoon />;
      case 'adyen-charge':
        return <PlaceholderPage title="Adyen Charge" description="Adyen payment check" Icon={Zap} comingSoon />;
      case 'shopify-auth':
        return <PlaceholderPage title="Shopify Auth" description="Shopify authentication" Icon={ShoppingBag} comingSoon />;
      case 'shopify-charge':
        return <PlaceholderPage title="Shopify Charge" description="Shopify payment check" Icon={Zap} comingSoon />;
      case 'target-charge':
        return <PlaceholderPage title="Target Charge" description="Target payment check" Icon={Target} comingSoon />;
      case 'co-inbuilt-ccn':
        return <PlaceholderPage title="Inbuilt CCN" description="Card number generator" Icon={Hash} comingSoon />;
      case 'co-inbuilt-ccv':
        return <PlaceholderPage title="Inbuilt CCV" description="CVV generator" Icon={KeyRound} comingSoon />;
      case 'co-checkout':
        return <PlaceholderPage title="CO Checkout" description="Checkout flow" Icon={ShoppingCart} comingSoon />;
      case 'help':
        return <PlaceholderPage title="Help" description="Documentation and support" Icon={HelpCircle} />;
      default:
        return <StripeOwn />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[rgb(248,247,247)] dark:bg-transparent">
      {/* Decorative background with gradient and floating dots */}
      <AppBackground />
      
      <TopTabBar 
        activeRoute={activeRoute} 
        onNavigate={handleNavigate}
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
