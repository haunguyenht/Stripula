import { useState, useRef, useEffect } from 'react';
import { 
    CreditCard, 
    TreeDeciduous, 
    HelpCircle, 
    Zap,
    ChevronDown,
    Shield,
    Sparkles,
    Crown,
    Award,
    Gem,
    Check,
    Wallet,
    ShoppingBag,
    Target,
    Crosshair,
    Hash,
    KeyRound,
    ShoppingCart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { UserProfileBadge } from '../ui/UserProfileBadge';
import { ThemeToggle } from '../ui/ThemeToggle';

// Default user data
const defaultUser = {
    name: 'User',
    email: 'user@example.com',
    credits: 100,
    tier: 'gold',
};

// Tier config with dark mode support
const tierConfig = {
    bronze: { icon: Shield, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/20', border: 'border-amber-500/20 dark:border-amber-500/30' },
    silver: { icon: Award, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-500/10 dark:bg-gray-500/20', border: 'border-gray-500/20 dark:border-gray-500/30' },
    gold: { icon: Crown, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', border: 'border-yellow-500/20 dark:border-yellow-500/30' },
    diamond: { icon: Gem, color: 'text-cyan-500 dark:text-cyan-400', bg: 'bg-cyan-500/10 dark:bg-cyan-500/20', border: 'border-cyan-500/20 dark:border-cyan-500/30' },
};

/**
 * TopTabBar - Modern Apple-style navigation
 */
export function TopTabBar({ 
    activeRoute, 
    onNavigate,
    className,
    user = defaultUser,
    onSettingsClick,
    onHelpClick,
    onLogoutClick,
}) {
    const [openDropdown, setOpenDropdown] = useState(null);
    const dropdownRef = useRef(null);

    const tier = tierConfig[user?.tier] || tierConfig.bronze;
    const TierIcon = tier.icon;

    const navItems = [
        { 
            id: 'stripe', 
            label: 'Stripe', 
            icon: CreditCard,
            color: 'violet',
            children: [
                { id: 'stripe-auth', label: 'Auth', icon: Shield, desc: 'Key validation', color: 'blue' },
                { id: 'stripe-charge-1', label: 'SK Based Charge', icon: Zap, desc: 'Standard check', color: 'amber' },
                { id: 'stripe-charge-2', label: 'Charge v2', icon: Sparkles, desc: 'Advanced check', color: 'purple' },
            ]
        },
        { 
            id: 'braintree', 
            label: 'Braintree', 
            icon: TreeDeciduous,
            color: 'emerald',
            children: [
                { id: 'braintree-auth', label: 'Auth', icon: Shield, desc: 'Authentication', color: 'teal' },
            ]
        },
        { 
            id: 'adyen', 
            label: 'Adyen', 
            icon: Wallet,
            color: 'orange',
            comingSoon: true,
            children: [
                { id: 'adyen-auth', label: 'Auth', icon: Shield, desc: 'Authentication', color: 'emerald', comingSoon: true },
                { id: 'adyen-charge', label: 'Charge', icon: Zap, desc: 'Payment check', color: 'teal', comingSoon: true },
            ]
        },
        { 
            id: 'shopify', 
            label: 'Shopify', 
            icon: ShoppingBag,
            color: 'green',
            comingSoon: true,
            children: [
                { id: 'shopify-auth', label: 'Auth', icon: Shield, desc: 'Authentication', color: 'green', comingSoon: true },
                { id: 'shopify-charge', label: 'Charge', icon: Zap, desc: 'Payment check', color: 'emerald', comingSoon: true },
            ]
        },
        { 
            id: 'target', 
            label: 'Target', 
            icon: Target,
            color: 'rose',
            comingSoon: true,
            children: [
                { id: 'target-charge', label: 'Charge', icon: Zap, desc: 'Payment check', color: 'rose', comingSoon: true },
            ]
        },
        { 
            id: 'co-hitter', 
            label: 'CO Hitter', 
            icon: Crosshair,
            color: 'pink',
            comingSoon: true,
            children: [
                { id: 'co-inbuilt-ccn', label: 'Inbuilt CCN', icon: Hash, desc: 'Card number gen', color: 'pink', comingSoon: true },
                { id: 'co-inbuilt-ccv', label: 'Inbuilt CCV', icon: KeyRound, desc: 'CVV generator', color: 'purple', comingSoon: true },
                { id: 'co-checkout', label: 'Checkout', icon: ShoppingCart, desc: 'Checkout flow', color: 'violet', comingSoon: true },
            ]
        },
        { 
            id: 'help', 
            label: 'Help', 
            icon: HelpCircle,
            color: 'orange',
        },
    ];

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
        if (item.children) {
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
                "flex items-center justify-between px-4 py-3 md:px-6",
                "bg-transparent",
                className
            )}
        >
            {/* Left: User Name + Tier Badge */}
            <motion.div 
                className="nav-user-container"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
            >
                <span className="nav-user-name">
                    {user?.name || 'User'}
                </span>
                <div className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-lg",
                    tier.bg, tier.border, "border"
                )}>
                    <TierIcon size={12} className={tier.color} />
                    <span className={cn("text-[10px] font-bold uppercase tracking-wide", tier.color)}>
                        {user?.tier || 'Bronze'}
                    </span>
                </div>
            </motion.div>

            {/* Center: Navigation */}
            <motion.nav 
                ref={dropdownRef} 
                className="nav-container"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                {navItems.map((item) => {
                    const isActive = isGroupActive(item);
                    const isOpen = openDropdown === item.id;
                    
                    return (
                        <div key={item.id} className="relative">
                            <NavButton
                                icon={item.icon}
                                label={item.label}
                                color={item.color}
                                active={isActive}
                                hasDropdown={!!item.children}
                                isOpen={isOpen}
                                comingSoon={item.comingSoon}
                                onClick={() => handleClick(item)}
                            />
                            
                            <AnimatePresence>
                                {item.children && isOpen && (
                                    <DropdownMenu
                                        items={item.children}
                                        activeRoute={activeRoute}
                                        onSelect={handleChildClick}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </motion.nav>

            {/* Right: Theme Toggle + User Profile */}
            <div className="flex items-center gap-3">
                <ThemeToggle />
                <UserProfileBadge
                    user={user}
                    onSettingsClick={onSettingsClick}
                    onHelpClick={onHelpClick}
                    onLogoutClick={onLogoutClick}
                />
            </div>
        </header>
    );
}

function NavButton({ icon: Icon, label, color = 'blue', active, hasDropdown, isOpen, comingSoon, onClick }) {
    const colorConfig = iconColors[color] || iconColors.blue;
    
    return (
        <motion.button
            onClick={onClick}
            className={cn(
                "nav-btn",
                active && "nav-btn-active",
                comingSoon && "nav-btn-coming-soon"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Always show colorful icon background */}
            <div className={cn(
                "nav-icon-container",
                active ? colorConfig.activeBg : colorConfig.bg
            )}>
                <Icon 
                    size={15} 
                    className={active ? colorConfig.activeIcon : colorConfig.icon} 
                />
            </div>
            <span className={cn("nav-btn-label hidden md:inline")}>{label}</span>
            {comingSoon && (
                <span className="nav-badge-soon">Soon</span>
            )}
            {hasDropdown && (
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown size={12} className="nav-chevron" />
                </motion.div>
            )}
        </motion.button>
    );
}

function DropdownMenu({ items, activeRoute, onSelect }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="nav-dropdown"
        >
            {items.map((item, index) => (
                <DropdownItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    desc={item.desc}
                    color={item.color}
                    active={activeRoute === item.id}
                    onClick={() => onSelect(item.id)}
                    index={index}
                    comingSoon={item.comingSoon}
                />
            ))}
        </motion.div>
    );
}

// Color configurations for icons - all nav items get colorful icons
const iconColors = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-500/20', icon: 'text-blue-600 dark:text-blue-400', activeBg: 'bg-blue-500', activeIcon: 'text-white' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-500/20', icon: 'text-amber-600 dark:text-amber-400', activeBg: 'bg-amber-500', activeIcon: 'text-white' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-500/20', icon: 'text-purple-600 dark:text-purple-400', activeBg: 'bg-purple-500', activeIcon: 'text-white' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', icon: 'text-emerald-600 dark:text-emerald-400', activeBg: 'bg-emerald-500', activeIcon: 'text-white' },
    teal: { bg: 'bg-teal-100 dark:bg-teal-500/20', icon: 'text-teal-600 dark:text-teal-400', activeBg: 'bg-teal-500', activeIcon: 'text-white' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-500/20', icon: 'text-orange-600 dark:text-orange-400', activeBg: 'bg-orange-500', activeIcon: 'text-white' },
    violet: { bg: 'bg-violet-100 dark:bg-violet-500/20', icon: 'text-violet-600 dark:text-violet-400', activeBg: 'bg-violet-500', activeIcon: 'text-white' },
    rose: { bg: 'bg-rose-100 dark:bg-rose-500/20', icon: 'text-rose-600 dark:text-rose-400', activeBg: 'bg-rose-500', activeIcon: 'text-white' },
    pink: { bg: 'bg-pink-100 dark:bg-pink-500/20', icon: 'text-pink-600 dark:text-pink-400', activeBg: 'bg-pink-500', activeIcon: 'text-white' },
    green: { bg: 'bg-green-100 dark:bg-green-500/20', icon: 'text-green-600 dark:text-green-400', activeBg: 'bg-green-500', activeIcon: 'text-white' },
};

function DropdownItem({ icon: Icon, label, desc, active, onClick, index, color = 'blue', comingSoon }) {
    const colorConfig = iconColors[color] || iconColors.blue;
    
    return (
        <motion.button
            onClick={onClick}
            className={cn(
                "nav-dropdown-item",
                active && "nav-dropdown-item-active",
                comingSoon && "opacity-60"
            )}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Colorful Icon */}
            <motion.div 
                className={cn(
                    "nav-dropdown-icon",
                    active ? colorConfig.activeBg : colorConfig.bg
                )}
                whileHover={{ scale: 1.05 }}
            >
                <Icon 
                    size={20} 
                    className={active ? colorConfig.activeIcon : colorConfig.icon} 
                />
            </motion.div>
            
            {/* Text */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className={cn(
                        "nav-dropdown-item-label",
                        active && "nav-dropdown-item-active"
                    )}>
                        {label}
                    </p>
                    {comingSoon && (
                        <span className="nav-badge-soon">Soon</span>
                    )}
                </div>
                {desc && (
                    <p className="nav-dropdown-item-desc">{desc}</p>
                )}
            </div>
            
            {/* Check mark for active */}
            <AnimatePresence>
                {active && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="flex items-center justify-center w-6 h-6 rounded-full bg-luma-coral"
                    >
                        <Check size={14} className="text-white" strokeWidth={3} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
}
