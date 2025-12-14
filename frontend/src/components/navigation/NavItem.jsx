import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * NavItem - Single navigation item
 * Premium Glass theme 2025
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
                // Active state
                isActive && "text-white bg-gradient-to-r from-indigo-500/15 to-purple-500/10 border border-indigo-500/20",
                isCollapsed && "justify-center px-0",
                className
            )}
            title={isCollapsed ? label : undefined}
            whileTap={{ scale: 0.98 }}
        >
            {Icon && (
                <span className={cn(
                    "flex items-center justify-center shrink-0",
                    isActive ? "text-indigo-400" : "text-white/40"
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
            
            {/* Active dot */}
            {isActive && !isCollapsed && (
                <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                />
            )}
        </motion.button>
    );
}
