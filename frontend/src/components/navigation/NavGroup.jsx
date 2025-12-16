import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * NavGroup - Parent navigation item with collapsible children
 * Premium Glass theme 2025
 */
export function NavGroup({ 
    icon: Icon, 
    label, 
    children,
    isActive = false,
    isCollapsed = false,
    defaultExpanded = false,
    className 
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded || isActive);

    const handleToggle = () => {
        if (!isCollapsed) {
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <div className={cn("flex flex-col", className)}>
            <motion.button
                onClick={handleToggle}
                className={cn(
                    "flex items-center w-full h-11 px-3 rounded-xl gap-3",
                    "transition-all duration-200 cursor-pointer text-[13px] font-medium",
                    !isActive && "text-white/60 hover:text-white/80 hover:bg-white/[0.04]",
                    isActive && "text-white",
                    isCollapsed && "justify-center px-0"
                )}
                title={isCollapsed ? label : undefined}
                whileTap={{ scale: 0.98 }}
            >
            <span className={cn(
                    "flex items-center justify-center shrink-0",
                    isActive ? "nav-item-active-icon" : "text-white/40"
                )}>
                    <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                </span>
                
                {!isCollapsed && (
                    <>
                        <span className={cn(
                            "text-left flex-1",
                            isActive && "font-semibold"
                        )}>
                            {label}
                        </span>
                        <motion.span 
                            className="text-white/30 shrink-0"
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <ChevronRight size={14} />
                        </motion.span>
                    </>
                )}
            </motion.button>

            <AnimatePresence>
                {!isCollapsed && isExpanded && (
                    <motion.div 
                        className="flex flex-col mt-1 ml-4 pl-4 gap-1 relative"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        {/* Border line */}
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-white/[0.08] rounded-full" />
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
