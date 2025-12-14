import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconRail } from '../navigation/IconRail';
import { BottomNav } from '../navigation/BottomNav';
import StripeOwn from '../StripeOwn';
import { useBreakpoint } from '../../hooks/useMediaQuery';

/**
 * AppLayout - Main application layout with responsive navigation
 * - Desktop (lg+): IconRail sidebar only
 * - Mobile/Tablet (< lg): Bottom navigation only
 * Glassmorphic theme 2025-2026
 */
export function AppLayout() {
    const { isDesktop } = useBreakpoint();
    
    const [activeRoute, setActiveRoute] = useState(() => 
        localStorage.getItem('appActiveRoute') || 'stripe-charge-1'
    );
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
            case 'settings':
                return <PlaceholderPage title="Settings" description="Application settings" icon="⚙️" />;
            case 'help':
                return <PlaceholderPage title="Help" description="Documentation and support" icon="❓" />;
            default:
                return <StripeOwn />;
        }
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
            {/* Desktop: Icon Rail */}
            {isDesktop && (
                <IconRail 
                    activeRoute={activeRoute} 
                    onNavigate={handleNavigate}
                    onSettingsOpen={() => setIsSettingsOpen(true)}
                />
            )}
            
            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeRoute}
                        className="h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Mobile/Tablet: Bottom Navigation */}
            {!isDesktop && (
                <BottomNav
                    activeRoute={activeRoute}
                    onNavigate={handleNavigate}
                    onSettingsOpen={() => setIsSettingsOpen(true)}
                />
            )}
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
            <div className="text-center glass-lg rounded-2xl p-8 max-w-md">
                <motion.div 
                    className="text-6xl mb-6"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                >
                    {icon}
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                    {title}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                    {description}
                </p>
                <motion.p 
                    className="text-primary/50 text-xs md:text-sm mt-6 font-mono"
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
