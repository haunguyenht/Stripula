import { useState, useRef, useEffect } from 'react';
import { 
    CreditCard, 
    TreeDeciduous, 
    HelpCircle, 
    Zap,
    ChevronDown,
    Shield,
    Sparkles,
    Coins,
    User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

// Mock user data (will be replaced with Telegram SSO)
const mockUser = {
    name: 'John Doe',
    plan: 'gold', // bronze, silver, gold, diamond
    credits: 1250,
    isOnline: true,
};

const planConfig = {
    bronze: { label: 'Bronze', color: 'text-amber-700 bg-amber-100 border-amber-200' },
    silver: { label: 'Silver', color: 'text-gray-600 bg-gray-100 border-gray-300' },
    gold: { label: 'Gold', color: 'text-yellow-700 bg-yellow-100 border-yellow-300' },
    diamond: { label: 'Diamond', color: 'text-cyan-700 bg-cyan-100 border-cyan-300' },
};

/**
 * TopTabBar - Sticky top navigation bar with icon tabs and dropdowns
 * Warm theme 2025
 */
export function TopTabBar({ 
    activeRoute, 
    onNavigate,
    className,
    user = mockUser,
}) {
    const [openDropdown, setOpenDropdown] = useState(null);
    const dropdownRef = useRef(null);
    const plan = planConfig[user.plan] || planConfig.bronze;

    const navItems = [
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
        { 
            id: 'help', 
            label: 'Help', 
            icon: HelpCircle,
        },
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClick = (item) => {
        if (item.action) {
            item.action();
            setOpenDropdown(null);
        } else if (item.children) {
            setOpenDropdown(openDropdown === item.id ? null : item.id);
        } else {
            onNavigate(item.id);
            setOpenDropdown(null);
        }
    };

    const handleChildClick = (childId) => {
        onNavigate(childId);
        setOpenDropdown(null);
    };

    const isGroupActive = (item) => {
        if (item.children) {
            return item.children.some(child => child.id === activeRoute);
        }
        return activeRoute === item.id;
    };

    return (
        <header 
            className={cn(
                "sticky top-0 z-40 w-full",
                "flex items-center justify-between px-2 py-2 md:px-4 md:py-3",
                className
            )}
        >
            {/* Left: User Avatar */}
            <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-400 shadow-md">
                    <User size={16} className="text-white" />
                </div>
                <div className="hidden md:block">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800">{user.name}</span>
                        <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded border",
                            plan.color
                        )}>
                            {plan.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            user.isOnline ? "bg-emerald-500" : "bg-gray-400"
                        )} />
                        <span>{user.isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                </div>
            </div>

            {/* Center: Tab Navigation - Icon only on mobile */}
            <nav ref={dropdownRef} className="flex items-center p-0.5 md:p-1 rounded-lg md:rounded-xl bg-white/90 backdrop-blur-sm shadow-lg border border-gray-100/80">
                {navItems.map((item) => {
                    const isActive = isGroupActive(item);
                    const isOpen = openDropdown === item.id;
                    
                    return (
                        <div key={item.id} className="relative">
                            <TabButton
                                icon={item.icon}
                                label={item.label}
                                active={isActive}
                                hasDropdown={!!item.children}
                                isOpen={isOpen}
                                onClick={() => handleClick(item)}
                            />
                            
                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {item.children && isOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        transition={{ duration: 0.12 }}
                                        className="absolute top-full left-0 mt-1 w-32 py-1 rounded-lg bg-white shadow-xl border border-gray-200 z-[100]"
                                    >
                                        {item.children.map((child) => (
                                            <DropdownItem
                                                key={child.id}
                                                icon={child.icon}
                                                label={child.label}
                                                active={activeRoute === child.id}
                                                onClick={() => handleChildClick(child.id)}
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </nav>

            {/* Right: Credits - Compact on mobile */}
            <div className="flex items-center shrink-0">
                <div className="flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow border border-gray-100/80">
                    <Coins size={12} className="text-yellow-500 md:w-[14px] md:h-[14px]" />
                    <span className="text-[10px] md:text-xs font-bold text-gray-700">{user.credits.toLocaleString()}</span>
                </div>
            </div>
        </header>
    );
}

/**
 * TabButton - Nav button (responsive)
 */
function TabButton({ icon: Icon, label, active, hasDropdown, isOpen, onClick }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-1 px-2 py-1.5 md:gap-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-xs font-semibold transition-all",
                active
                    ? "text-white bg-gradient-to-r from-orange-500 to-orange-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
        >
            <Icon size={12} className={cn("md:w-[14px] md:h-[14px]", active ? "text-white" : "text-gray-400")} />
            <span className="hidden md:inline">{label}</span>
            {hasDropdown && (
                <ChevronDown 
                    size={8} 
                    className={cn(
                        "md:w-[10px] md:h-[10px] transition-transform duration-200",
                        active ? "text-white/80" : "text-gray-400",
                        isOpen && "rotate-180"
                    )}
                />
            )}
        </button>
    );
}

/**
 * DropdownItem - Individual dropdown menu item
 */
function DropdownItem({ icon: Icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-all duration-150",
                active
                    ? "text-orange-600 bg-orange-50"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            )}
        >
            <Icon 
                size={12} 
                className={active ? "text-orange-500" : "text-gray-400"}
            />
            <span className={active ? "font-semibold" : "font-medium"}>{label}</span>
        </button>
    );
}
