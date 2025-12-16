import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * NavItem - Single navigation item
 * Premium Glass theme 2025
 * Uses centralized CSS classes (nav-item-*) from index.css
 */
export function NavItem({ 
    icon: Icon, 
    label, 
    isActive = false, 
    isChild = false,
    isCollapsed = false,
    onClick,
    className 
}) {
    return (
        <motion.button
            onClick={onClick}
            className={cn(
                "relative flex items-center w-full rounded-xl gap-3",
                "transition-all duration-200 cursor-pointer",
                isChild ? "h-10 px-3 text-[13px]" : "h-11 px-3 text-[13px] font-medium",
                // Default state
                !isActive && "text-white/50 hover:text-white/80 hover:bg-white/[0.04]",
                // Active state - uses centralized nav-item-active class
                isActive && "nav-item-active",
                isCollapsed && "justify-center px-0",
                className
            )}
            title={isCollapsed ? label : undefined}
            whileTap={{ scale: 0.98 }}
        >
            {Icon && (
                <span className={cn(
                    "flex items-center justify-center shrink-0",
                    isActive ? "nav-item-active-icon" : "text-white/40"
                )}>
                    <Icon size={isChild ? 16 : 18} strokeWidth={isActive ? 2 : 1.5} />
                </span>
            )}
            
            {!isCollapsed && (
                <span className={cn(
                    "text-left truncate flex-1",
                    isActive && "font-semibold"
                )}>
                    {label}
                </span>
            )}
            
            {/* Active dot - uses centralized nav-item-active-dot class */}
            {isActive && !isCollapsed && (
                <motion.div
                    className="w-1.5 h-1.5 rounded-full nav-item-active-dot shrink-0"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                />
            )}
        </motion.button>
    );
}
