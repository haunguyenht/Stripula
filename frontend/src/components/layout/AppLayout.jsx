import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopTabBar } from '../navigation/TopTabBar';
import StripeOwn from '../StripeOwn';

/**
 * AppLayout - Main application layout matching reference design
 * Full-page horizontal gradient + floating cards
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
                return <PlaceholderPage title="Stripe Auth" description="Key validation and authentication" icon="🔐" />;
            case 'stripe-charge-1':
                return <StripeOwn />;
            case 'stripe-charge-2':
                return <PlaceholderPage title="Stripe Charge v2" description="Alternative charge validation method" icon="⚡" />;
            case 'braintree-auth':
                return <PlaceholderPage title="Braintree Auth" description="Braintree authentication" icon="🌳" />;
            case 'help':
                return <PlaceholderPage title="Help" description="Documentation and support" icon="❓" />;
            default:
                return <StripeOwn />;
        }
    };

    return (
        <div 
            className="h-screen w-screen overflow-hidden flex flex-col"
            style={{ 
                background: 'linear-gradient(135deg, #FFF8E7 0%, #FFEDD5 30%, #FFE4E6 70%, #FCE7F3 100%)'
            }}
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
        </div>
    );
}

function PlaceholderPage({ title, description, icon }) {
    return (
        <motion.div 
            className="flex items-center justify-center h-full p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="text-center bg-white/80 border border-orange-200/50 shadow-lg rounded-2xl p-8 max-w-md">
                <motion.div 
                    className="text-6xl mb-6"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                >
                    {icon}
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                    {title}
                </h1>
                <p className="text-gray-500 text-sm md:text-base">
                    {description}
                </p>
                <motion.p 
                    className="text-orange-400 text-xs md:text-sm mt-6 font-mono"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    Coming soon...
                </motion.p>
            </div>
        </motion.div>
    );
}
