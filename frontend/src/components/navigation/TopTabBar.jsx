import { useState, useRef, useEffect, useCallback } from 'react';
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
    X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { UserProfileBadge } from '../ui/UserProfileBadge';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useBreakpoint } from '../../hooks/useMediaQuery';

// Default user data
const defaultUser = {
    name: 'User',
    email: 'user@example.com',
    credits: 100,
    tier: 'gold',
};

// Tier config - uses centralized .tier-badge-* classes from index.css
const tierConfig = {
    bronze: { icon: Shield, badgeClass: 'tier-badge-bronze' },
    silver: { icon: Award, badgeClass: 'tier-badge-silver' },
    gold: { icon: Crown, badgeClass: 'tier-badge-gold' },
    diamond: { icon: Gem, badgeClass: 'tier-badge-diamond' },
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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navContainerRef = useRef(null);
    const navContentRef = useRef(null);
    const { isMobile: isMobileBreakpoint } = useBreakpoint();
    
    // Dynamic overflow detection with hysteresis to prevent feedback loops
    // We measure the desktop nav content width ONCE and store it as the required width
    const [requiredNavWidth, setRequiredNavWidth] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [shouldUseMobileNav, setShouldUseMobileNav] = useState(isMobileBreakpoint);
    const hasInitializedRef = useRef(false);
    
    // Measure the desktop nav content width once on mount
    useEffect(() => {
        if (hasInitializedRef.current || !navContentRef.current || shouldUseMobileNav) return;
        
        // Wait for the desktop nav to render and measure its width
        const timer = setTimeout(() => {
            if (navContentRef.current) {
                const contentWidth = navContentRef.current.scrollWidth;
                // Add buffer for comfortable spacing
                setRequiredNavWidth(contentWidth + 60);
                hasInitializedRef.current = true;
            }
        }, 100);
        
        return () => clearTimeout(timer);
    }, [shouldUseMobileNav]);
    
    // Track container width with debounce
    useEffect(() => {
        if (!navContainerRef.current) return;
        
        let rafId;
        let timeoutId;
        
        const measureWidth = () => {
            if (navContainerRef.current) {
                setContainerWidth(navContainerRef.current.offsetWidth);
            }
        };
        
        const debouncedMeasure = () => {
            cancelAnimationFrame(rafId);
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                rafId = requestAnimationFrame(measureWidth);
            }, 150); // 150ms debounce
        };
        
        // Initial measurement
        measureWidth();
        
        window.addEventListener('resize', debouncedMeasure);
        
        return () => {
            window.removeEventListener('resize', debouncedMeasure);
            cancelAnimationFrame(rafId);
            clearTimeout(timeoutId);
        };
    }, []);
    
    // Determine layout mode with hysteresis
    // Switch to mobile when container is smaller than required
    // Switch back to desktop only when container is significantly larger (adds 50px buffer)
    useEffect(() => {
        if (isMobileBreakpoint) {
            setShouldUseMobileNav(true);
            return;
        }
        
        // If we haven't measured the required width yet, stay in current mode
        if (requiredNavWidth === 0 || containerWidth === 0) return;
        
        const switchToMobileThreshold = requiredNavWidth;
        const switchToDesktopThreshold = requiredNavWidth + 50; // Hysteresis buffer
        
        setShouldUseMobileNav(prev => {
            if (prev) {
                // Currently mobile - only switch to desktop if significantly larger
                return containerWidth < switchToDesktopThreshold;
            } else {
                // Currently desktop - switch to mobile if too small
                return containerWidth < switchToMobileThreshold;
            }
        });
    }, [isMobileBreakpoint, containerWidth, requiredNavWidth]);

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
            id: 'paypal', 
            label: 'PayPal', 
            icon: Wallet,
            color: 'amber',
            children: [
                { id: 'paypal-charge', label: 'Charge', icon: Zap, desc: 'Payment check', color: 'amber' },
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

    // Find active nav item for mobile trigger
    const findActiveNavItem = () => {
        // First check if a child route is active
        for (const item of navItems) {
            if (item.children) {
                const activeChild = item.children.find(child => child.id === activeRoute);
                if (activeChild) {
                    return { parent: item, child: activeChild };
                }
            } else if (item.id === activeRoute) {
                return { parent: item, child: null };
            }
        }
        // Default to first item if nothing matches
        return { parent: navItems[0], child: null };
    };

    const activeNavInfo = findActiveNavItem();
    const ActiveIcon = activeNavInfo.child?.icon || activeNavInfo.parent?.icon || CreditCard;
    const activeParentLabel = activeNavInfo.parent?.label || 'Stripe';
    const activeChildLabel = activeNavInfo.child?.label || null;
    const activeColor = activeNavInfo.child?.color || activeNavInfo.parent?.color || 'violet';

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [activeRoute]);

    return (
        <header 
            className={cn("topbar", className)}
        >
            {/* Left: User Name + Tier Badge - hide name on mobile, icon-only tier on mobile */}
            <div className="nav-user-container">
                <span className="nav-user-name hidden md:inline truncate max-w-[80px] lg:max-w-none">
                    {user?.name || 'User'}
                </span>
                <div className={cn("tier-badge", tier.badgeClass)} title={user?.tier || 'Bronze'}>
                    <TierIcon className="tier-badge-icon" />
                    <span className="tier-badge-label hidden sm:inline">{user?.tier || 'Bronze'}</span>
                </div>
            </div>

            {/* Center: Navigation - Desktop or Mobile (dynamic based on content fit) */}
            <div ref={navContainerRef} className="flex-1 min-w-0 flex justify-center">
                {shouldUseMobileNav ? (
                    <>
                        <button
                            className="nav-mobile-trigger"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <div className={cn("nav-mobile-trigger-icon", iconColors[activeColor]?.bg || iconColors.blue.bg)}>
                                <ActiveIcon size={14} className={cn(iconColors[activeColor]?.icon || iconColors.blue.icon)} />
                            </div>
                            <div className="nav-mobile-trigger-labels">
                                {activeChildLabel ? (
                                    <>
                                        <span className="nav-mobile-trigger-parent">{activeParentLabel}</span>
                                        <span className="nav-mobile-trigger-child">{activeChildLabel}</span>
                                    </>
                                ) : (
                                    <span className="nav-mobile-trigger-label">{activeParentLabel}</span>
                                )}
                            </div>
                            <ChevronDown size={12} className="shrink-0 ml-1" />
                        </button>

                        <AnimatePresence>
                            {mobileMenuOpen && (
                                <MobileNavMenu
                                    navItems={navItems}
                                    activeRoute={activeRoute}
                                    onNavigate={(routeId) => {
                                        onNavigate(routeId);
                                        setMobileMenuOpen(false);
                                    }}
                                    onClose={() => setMobileMenuOpen(false)}
                                    isGroupActive={isGroupActive}
                                />
                            )}
                        </AnimatePresence>
                    </>
                ) : (
                    <nav 
                        ref={(el) => { dropdownRef.current = el; navContentRef.current = el; }}
                        className="nav-container"
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
                    </nav>
                )}
            </div>

            {/* Right: Theme Toggle + User Profile */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
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
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            {/* Colorful icon */}
            <div className={cn(
                "nav-icon-container",
                active ? colorConfig.activeBg : colorConfig.bg
            )}>
                <Icon 
                    size={12} 
                    className={active ? colorConfig.activeIcon : colorConfig.icon} 
                />
            </div>
            <span className={cn("nav-btn-label hidden md:inline text-[10px]")}>{label}</span>
            {comingSoon && (
                <span className="nav-badge-soon">Soon</span>
            )}
            {hasDropdown && (
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.15 }}
                >
                    <ChevronDown size={8} className="nav-chevron" />
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

// Color configurations for icons - uses centralized CSS classes (.nav-icon-*) from index.css
const iconColors = {
    blue: { bg: 'nav-icon-blue', icon: 'nav-icon-blue-icon', activeBg: 'nav-icon-blue-active', activeIcon: 'nav-icon-blue-active-icon' },
    amber: { bg: 'nav-icon-amber', icon: 'nav-icon-amber-icon', activeBg: 'nav-icon-amber-active', activeIcon: 'nav-icon-amber-active-icon' },
    purple: { bg: 'nav-icon-purple', icon: 'nav-icon-purple-icon', activeBg: 'nav-icon-purple-active', activeIcon: 'nav-icon-purple-active-icon' },
    emerald: { bg: 'nav-icon-emerald', icon: 'nav-icon-emerald-icon', activeBg: 'nav-icon-emerald-active', activeIcon: 'nav-icon-emerald-active-icon' },
    teal: { bg: 'nav-icon-teal', icon: 'nav-icon-teal-icon', activeBg: 'nav-icon-teal-active', activeIcon: 'nav-icon-teal-active-icon' },
    orange: { bg: 'nav-icon-orange', icon: 'nav-icon-orange-icon', activeBg: 'nav-icon-orange-active', activeIcon: 'nav-icon-orange-active-icon' },
    violet: { bg: 'nav-icon-violet', icon: 'nav-icon-violet-icon', activeBg: 'nav-icon-violet-active', activeIcon: 'nav-icon-violet-active-icon' },
    rose: { bg: 'nav-icon-rose', icon: 'nav-icon-rose-icon', activeBg: 'nav-icon-rose-active', activeIcon: 'nav-icon-rose-active-icon' },
    pink: { bg: 'nav-icon-pink', icon: 'nav-icon-pink-icon', activeBg: 'nav-icon-pink-active', activeIcon: 'nav-icon-pink-active-icon' },
    green: { bg: 'nav-icon-green', icon: 'nav-icon-green-icon', activeBg: 'nav-icon-green-active', activeIcon: 'nav-icon-green-active-icon' },
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

/**
 * MobileNavMenu - Full-screen mobile navigation menu
 * Allows expanding parent items to see children without navigating away
 */
function MobileNavMenu({ navItems, activeRoute, onNavigate, onClose, isGroupActive }) {
    // Track which parent is expanded - start with active group expanded
    const getInitialExpandedId = () => {
        for (const item of navItems) {
            if (item.children) {
                const hasActiveChild = item.children.some(child => child.id === activeRoute);
                if (hasActiveChild) return item.id;
            }
        }
        return null;
    };
    
    const [expandedParentId, setExpandedParentId] = useState(getInitialExpandedId);

    useEffect(() => {
        // Lock body scroll when menu is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleItemClick = (item) => {
        if (item.children && item.children.length > 0) {
            // Toggle expansion without navigating
            setExpandedParentId(prev => prev === item.id ? null : item.id);
        } else {
            // No children - navigate directly
            onNavigate(item.id);
        }
    };

    return (
        <motion.div
            className="nav-mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            {/* Minimal close button - floating top right */}
            <motion.button
                className="nav-mobile-menu-close-floating"
                onClick={onClose}
                aria-label="Close menu"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <X size={20} />
            </motion.button>

            <div className="nav-mobile-menu-content">
                {navItems.map((item) => {
                    const isActive = isGroupActive(item);
                    const isExpanded = expandedParentId === item.id;
                    const hasChildren = item.children && item.children.length > 0;
                    const colorConfig = iconColors[item.color] || iconColors.blue;
                    const ItemIcon = item.icon;

                    return (
                        <div key={item.id}>
                            <button
                                className={cn(
                                    "nav-mobile-menu-item",
                                    isActive && "nav-mobile-menu-item-active"
                                )}
                                onClick={() => handleItemClick(item)}
                            >
                                <div className={cn(
                                    "nav-dropdown-icon",
                                    isActive ? colorConfig.activeBg : colorConfig.bg
                                )}>
                                    <ItemIcon 
                                        size={20} 
                                        className={isActive ? colorConfig.activeIcon : colorConfig.icon} 
                                    />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{item.label}</span>
                                        {item.comingSoon && (
                                            <span className="nav-badge-soon">Soon</span>
                                        )}
                                    </div>
                                </div>
                                {/* Chevron for expandable items */}
                                {hasChildren && (
                                    <motion.div
                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="shrink-0"
                                    >
                                        <ChevronDown size={16} className="text-luma-secondary" />
                                    </motion.div>
                                )}
                                {/* Check mark for active items without children */}
                                {!hasChildren && isActive && (
                                    <Check size={16} className="text-luma-coral shrink-0" />
                                )}
                            </button>

                            {/* Show children when expanded */}
                            <AnimatePresence>
                                {isExpanded && hasChildren && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="ml-12 space-y-1 mt-1 pb-1">
                                            {item.children.map((child) => {
                                                const childColorConfig = iconColors[child.color] || iconColors.blue;
                                                const ChildIcon = child.icon;
                                                const childActive = activeRoute === child.id;

                                                return (
                                                    <button
                                                        key={child.id}
                                                        className={cn(
                                                            "nav-mobile-menu-item text-sm",
                                                            childActive && "nav-mobile-menu-item-active"
                                                        )}
                                                        onClick={() => onNavigate(child.id)}
                                                    >
                                                        <div className={cn(
                                                            "nav-dropdown-icon w-8 h-8",
                                                            childActive ? childColorConfig.activeBg : childColorConfig.bg
                                                        )}>
                                                            <ChildIcon 
                                                                size={16} 
                                                                className={childActive ? childColorConfig.activeIcon : childColorConfig.icon} 
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0 text-left">
                                                            <div className="font-medium">{child.label}</div>
                                                            {child.desc && (
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                    {child.desc}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {childActive && (
                                                            <Check size={14} className="text-luma-coral shrink-0" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
