import { useState, useEffect } from 'react';
import { 
    CreditCard, 
    TreeDeciduous, 
    Settings, 
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    Zap,
    Shield,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavGroup } from './NavGroup';
import { NavItem } from './NavItem';
import { cn } from '../../lib/utils';
import { useBreakpoint } from '../../hooks/useMediaQuery';

/**
 * IconRail - Left sidebar navigation
 * Premium Glass theme 2025
 */
export function IconRail({ 
    activeRoute, 
    onNavigate,
    onSettingsOpen,
    className 
}) {
    const { isLargeDesktop } = useBreakpoint();
    const [isCollapsed, setIsCollapsed] = useState(!isLargeDesktop);

    useEffect(() => {
        setIsCollapsed(!isLargeDesktop);
    }, [isLargeDesktop]);

    const navigation = [
        {
            id: 'stripe',
            label: 'Stripe',
            icon: CreditCard,
            children: [
                { id: 'stripe-auth', label: 'Auth', icon: Shield },
                { id: 'stripe-charge-1', label: 'Charge v1', icon: Zap },
                { id: 'stripe-charge-2', label: 'Charge v2', icon: Sparkles },
            ]
        },
        {
            id: 'braintree',
            label: 'Braintree',
            icon: TreeDeciduous,
            children: [
                { id: 'braintree-auth', label: 'Auth', icon: Shield },
            ]
        },
    ];

    const isGroupActive = (group) => {
        return group.children.some(child => child.id === activeRoute);
    };

    return (
        <motion.aside 
            className={cn(
                "h-full flex flex-col z-30",
                "border-r border-white/[0.06]",
                "bg-[rgba(10,10,16,0.98)]",
                className
            )}
            initial={false}
            animate={{ width: isCollapsed ? 72 : 260 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
        >
            {/* Logo */}
            <div className={cn(
                "h-16 flex items-center gap-3 border-b border-white/[0.06]",
                isCollapsed ? "justify-center px-0" : "px-5"
            )}>
                <motion.div 
                    className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
                    style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                        boxShadow: '0 4px 20px -4px rgba(99, 102, 241, 0.5)'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <CreditCard size={18} className="text-white" />
                </motion.div>
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div 
                            className="flex flex-col overflow-hidden"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <span className="font-bold text-[15px] text-white">Validator</span>
                            <span 
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded self-start mt-0.5 text-purple-300 bg-purple-500/15 border border-purple-500/20"
                            >
                                PRO
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className={cn(
                "flex-1 py-4 flex flex-col gap-1 overflow-y-auto scrollbar-thin",
                isCollapsed ? "px-3" : "px-4"
            )}>
                {navigation.map((group) => (
                    <NavGroup
                        key={group.id}
                        icon={group.icon}
                        label={group.label}
                        isActive={isGroupActive(group)}
                        isCollapsed={isCollapsed}
                        defaultExpanded={isGroupActive(group)}
                    >
                        {group.children.map((child) => (
                            <NavItem
                                key={child.id}
                                icon={child.icon}
                                label={child.label}
                                isChild
                                isActive={activeRoute === child.id}
                                isCollapsed={isCollapsed}
                                onClick={() => onNavigate(child.id)}
                            />
                        ))}
                    </NavGroup>
                ))}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Bottom Items */}
            <div className={cn(
                "py-4 flex flex-col gap-1 border-t border-white/[0.06]",
                isCollapsed ? "px-3" : "px-4"
            )}>
                <NavItem
                    icon={Settings}
                    label="Settings"
                    isCollapsed={isCollapsed}
                    onClick={onSettingsOpen || (() => onNavigate('settings'))}
                    isActive={activeRoute === 'settings'}
                />
                <NavItem
                    icon={HelpCircle}
                    label="Help"
                    isCollapsed={isCollapsed}
                    onClick={() => onNavigate('help')}
                    isActive={activeRoute === 'help'}
                />
            </div>

            {/* Collapse Toggle */}
            <motion.button 
                className="h-12 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors cursor-pointer border-t border-white/[0.06] hover:bg-white/[0.02]"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand" : "Collapse"}
                whileTap={{ scale: 0.95 }}
            >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </motion.button>
        </motion.aside>
    );
}
