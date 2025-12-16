import { useState, useRef, useEffect } from 'react';
import { Shield, Award, Crown, Gem, ChevronDown, Settings, HelpCircle, LogOut, User, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

// Tier config - uses centralized .tier-badge-* classes from index.css
const tierConfig = {
    bronze: {
        label: 'Bronze',
        icon: Shield,
        badgeClass: 'tier-badge-bronze',
        iconColor: '#CD7F32',
    },
    silver: {
        label: 'Silver',
        icon: Award,
        badgeClass: 'tier-badge-silver',
        iconColor: '#C0C0C0',
    },
    gold: {
        label: 'Gold',
        icon: Crown,
        badgeClass: 'tier-badge-gold',
        iconColor: '#FFD700',
    },
    diamond: {
        label: 'Diamond',
        icon: Gem,
        badgeClass: 'tier-badge-diamond',
        iconColor: '#B9F2FF',
    },
};

/**
 * UserProfileBadge - Simplified: Avatar + Credits only (no name/tier in main view)
 */
export function UserProfileBadge({ 
    user,
    onMenuClick,
    onSettingsClick,
    onHelpClick,
    onLogoutClick,
    className,
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const tier = tierConfig[user?.tier] || tierConfig.bronze;
    const TierIcon = tier.icon;


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
        onMenuClick?.();
    };

    const handleMenuItemClick = (action) => {
        setIsDropdownOpen(false);
        action?.();
    };

    const menuItems = [
        { id: 'settings', label: 'Settings', icon: Settings, action: onSettingsClick },
        { id: 'help', label: 'Help', icon: HelpCircle, action: onHelpClick },
        { id: 'logout', label: 'Logout', icon: LogOut, action: onLogoutClick, destructive: true },
    ];

    return (
        <div ref={dropdownRef} className={cn("relative shrink-0", className)}>
            {/* Simplified Profile Button: Avatar only on mobile, Avatar + Credits on larger screens */}
            <motion.button
                onClick={handleDropdownToggle}
                className="nav-pill flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-1 sm:py-1.5 cursor-pointer"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
                {/* Avatar - uses centralized avatar-bg class */}
                <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg sm:rounded-apple avatar-bg shadow-sm shrink-0">
                    <User size={12} className="sm:w-[14px] sm:h-[14px] text-white" />
                </div>

                {/* Credits Display - hidden on mobile (<640px) */}
                <div className="hidden sm:flex items-center gap-1">
                    <Coins size={10} className="sm:w-3 sm:h-3 credits-icon" />
                    <span className="text-[10px] sm:text-xs font-apple-semibold text-gray-700 dark:text-gray-200">
                        {(user?.credits ?? 0).toLocaleString()}
                    </span>
                </div>

                {/* Dropdown Arrow - hidden on mobile */}
                <ChevronDown 
                    size={10} 
                    className={cn(
                        "hidden sm:block sm:w-3 sm:h-3 text-gray-400 dark:text-gray-500 transition-transform duration-200 shrink-0",
                        isDropdownOpen && "rotate-180"
                    )}
                />
            </motion.button>

            {/* Dropdown Menu - Shows full user info */}
            <AnimatePresence>
                {isDropdownOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="dropdown-menu absolute right-0 top-full mt-2 w-52 py-1.5 z-50"
                    >
                        {/* User Info Header in Dropdown */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center rounded-xl avatar-bg shadow-sm">
                                    <User size={18} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user?.name || 'User'}</p>
                                    {user?.email && (
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[130px]">{user.email}</p>
                                    )}
                                </div>
                            </div>
                            {/* Tier Badge in Dropdown - uses centralized tier-badge classes */}
                            <div className={cn(
                                "tier-badge mt-3",
                                tier.badgeClass
                            )}>
                                <TierIcon className="tier-badge-icon" style={{ color: tier.iconColor }} />
                                <span className="tier-badge-label">{tier.label}</span>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1.5">
                            {menuItems.map((item) => (
                                <motion.button
                                    key={item.id}
                                    onClick={() => handleMenuItemClick(item.action)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-2.5",
                                        "text-left text-sm font-apple-medium transition-all duration-150",
                                        item.destructive
                                            ? "menu-item-destructive"
                                            : "text-gray-700 dark:text-gray-200 menu-item-default"
                                    )}
                                    whileTap={{ scale: 0.98, opacity: 0.9 }}
                                >
                                    <item.icon 
                                        size={16} 
                                        className={item.destructive ? "menu-item-destructive-icon" : "text-gray-400 dark:text-gray-500"}
                                    />
                                    <span className="font-apple-medium">{item.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


export function TierBadge({ tier = 'bronze', size = 'default', className }) {
    const config = tierConfig[tier] || tierConfig.bronze;
    const TierIcon = config.icon;

    const sizes = {
        sm: "px-1.5 py-0.5 text-[8px] gap-0.5",
        default: "px-2 py-1 text-[10px] gap-1",
        lg: "px-2.5 py-1.5 text-xs gap-1.5",
    };

    const iconSizes = { sm: 8, default: 12, lg: 14 };

    return (
        <div className={cn(
            "tier-badge",
            config.badgeClass,
            sizes[size],
            className
        )}>
            <TierIcon size={iconSizes[size]} style={{ color: config.iconColor }} />
            <span>{config.label}</span>
        </div>
    );
}

export function CreditsBadge({ credits = 0, size = 'default', className }) {
    const sizes = {
        sm: "px-1.5 py-0.5 text-[10px] gap-0.5",
        default: "px-2 py-1 text-xs gap-1",
        lg: "px-3 py-1.5 text-sm gap-1.5",
    };

    const iconSizes = { sm: 10, default: 12, lg: 14 };

    return (
        <div className={cn(
            "inline-flex items-center rounded-lg",
            "bg-black/5 dark:bg-white/10 font-bold text-gray-700 dark:text-gray-200",
            sizes[size],
            className
        )}>
            <Coins size={iconSizes[size]} className="credits-icon" />
            <span>{credits.toLocaleString()}</span>
        </div>
    );
}

export { tierConfig };
