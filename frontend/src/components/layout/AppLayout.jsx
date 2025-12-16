import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, TreeDeciduous, HelpCircle, Wallet, ShoppingBag, Target, Hash, KeyRound, ShoppingCart } from 'lucide-react';
import { TopTabBar } from '../navigation/TopTabBar';
import { ToastContainer } from '../ui/ToastContainer';
import StripeOwn from '../StripeOwn';

/**
 * AppLayout - Main application layout with warm Luma theme
 * Warm gradient background (cream → peach → soft pink) + floating cards
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
            // Stripe routes
            case 'stripe-auth':
                return <PlaceholderPage title="Stripe Auth" description="Key validation and authentication" Icon={Shield} />;
            case 'stripe-charge-1':
                return <StripeOwn />;
            case 'stripe-charge-2':
                return <PlaceholderPage title="Stripe Charge v2" description="Alternative charge validation method" Icon={Zap} />;
            
            // Braintree routes
            case 'braintree-auth':
                return <PlaceholderPage title="Braintree Auth" description="Braintree authentication" Icon={TreeDeciduous} />;
            
            // PayPal routes
            case 'paypal-charge':
                return <PlaceholderPage title="PayPal Charge" description="PayPal payment check" Icon={Wallet} />;
            
            // Adyen routes (coming soon)
            case 'adyen-auth':
                return <PlaceholderPage title="Adyen Auth" description="Adyen authentication" Icon={Wallet} comingSoon />;
            case 'adyen-charge':
                return <PlaceholderPage title="Adyen Charge" description="Adyen payment check" Icon={Zap} comingSoon />;
            
            // Shopify routes (coming soon)
            case 'shopify-auth':
                return <PlaceholderPage title="Shopify Auth" description="Shopify authentication" Icon={ShoppingBag} comingSoon />;
            case 'shopify-charge':
                return <PlaceholderPage title="Shopify Charge" description="Shopify payment check" Icon={Zap} comingSoon />;
            
            // Target routes (coming soon)
            case 'target-charge':
                return <PlaceholderPage title="Target Charge" description="Target payment check" Icon={Target} comingSoon />;
            
            // CO Hitter routes (coming soon)
            case 'co-inbuilt-ccn':
                return <PlaceholderPage title="Inbuilt CCN" description="Card number generator" Icon={Hash} comingSoon />;
            case 'co-inbuilt-ccv':
                return <PlaceholderPage title="Inbuilt CCV" description="CVV generator" Icon={KeyRound} comingSoon />;
            case 'co-checkout':
                return <PlaceholderPage title="CO Checkout" description="Checkout flow" Icon={ShoppingCart} comingSoon />;
            
            // Help
            case 'help':
                return <PlaceholderPage title="Help" description="Documentation and support" Icon={HelpCircle} />;
            
            default:
                return <StripeOwn />;
        }
    };

    return (
        <div 
            className="h-screen w-screen overflow-hidden flex flex-col luma-warm-gradient"
        >
            {/* Compact Header */}
            <TopTabBar 
                activeRoute={activeRoute} 
                onNavigate={handleNavigate}
            />
            
            {/* Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeRoute}
                        className="h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </main>
            
            {/* Toast Notifications */}
            <ToastContainer position="bottom-right" />
        </div>
    );
}

function PlaceholderPage({ title, description, Icon, comingSoon = false }) {
    return (
        <motion.div 
            className="flex items-center justify-center h-full p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="text-center floating-panel p-8 max-w-md">
                <motion.div 
                    className="flex items-center justify-center mb-6"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                >
                    <div className="w-20 h-20 rounded-2xl bg-luma-coral-10 flex items-center justify-center">
                        <Icon className="w-10 h-10 text-luma-coral" strokeWidth={1.5} />
                    </div>
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-bold text-luma mb-3">
                    {title}
                </h1>
                <p className="text-luma-secondary text-sm md:text-base">
                    {description}
                </p>
                {comingSoon && (
                    <motion.div 
                        className="mt-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full badge-coming-soon text-xs font-bold uppercase">
                            Coming Soon
                        </span>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
