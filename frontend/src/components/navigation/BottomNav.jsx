import { CreditCard, TreeDeciduous, Settings, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * BottomNav - Mobile bottom navigation bar
 * Only visible on screens smaller than lg (< 1024px)
 * Apple Liquid Glass theme 2026
 */
export function BottomNav({ 
    activeRoute, 
    onNavigate,
    onSettingsOpen,
    className 
}) {
    const navItems = [
        { 
            id: 'stripe', 
            label: 'Stripe', 
            icon: CreditCard,
            routes: ['stripe-auth', 'stripe-charge-1', 'stripe-charge-2']
        },
        { 
            id: 'braintree', 
            label: 'Braintree', 
            icon: TreeDeciduous,
            routes: ['braintree-auth']
        },
        { 
            id: 'settings', 
            label: 'Settings', 
            icon: Settings,
            action: onSettingsOpen
        },
        { 
            id: 'more', 
            label: 'More', 
            icon: MoreHorizontal,
            routes: ['help']
        },
    ];

    const isActive = (item) => {
        if (item.routes) {
            return item.routes.includes(activeRoute);
        }
        return activeRoute === item.id;
    };

    const handleClick = (item) => {
        if (item.action) {
            item.action();
        } else if (item.routes) {
            onNavigate(item.routes[0]);
        } else {
            onNavigate(item.id);
        }
    };

    return (
        <nav 
            className={cn(
                "fixed bottom-0 left-0 right-0 h-20",
                "flex items-center justify-around z-40 pb-4 px-2",
                "border-t border-white/[0.06]",
                className
            )}
            style={{
                background: 'linear-gradient(180deg, rgba(15, 18, 28, 0.98) 0%, rgba(10, 13, 20, 0.98) 100%)',
                backdropFilter: 'blur(40px)',
            }}
        >
            {navItems.map((item) => {
                const active = isActive(item);
                return (
                    <motion.button
                        key={item.id}
                        onClick={() => handleClick(item)}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full",
                            "transition-all duration-300 rounded-xl mx-1",
                            !active && "text-white/40 hover:text-white/70 hover:bg-white/[0.04]",
                            active && "text-[#3b82f6]"
                        )}
                        style={active ? {
                            background: 'linear-gradient(180deg, rgba(59,130,246,0.15) 0%, rgba(168,85,247,0.10) 100%)',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                        } : {}}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <item.icon size={22} style={active ? { filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' } : {}} />
                        <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                    </motion.button>
                );
            })}
        </nav>
    );
}
