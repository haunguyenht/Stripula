import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Drawer - Liquid glass slide-out drawer component
 * Features: overlay, slide animation, close on outside click + ESC, lock background scroll, safe-area padding
 */
export function Drawer({
    isOpen,
    onClose,
    children,
    title,
    headerContent, // Optional: custom content for header (e.g., tabs)
    position = 'right', // 'left' | 'right' | 'bottom'
    className,
    overlayClassName,
}) {
    const drawerRef = useRef(null);

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close on ESC key
    useEffect(() => {
        if (!isOpen) return;
        
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Close on outside click
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const positionClasses = {
        right: 'right-0 top-0 bottom-0',
        left: 'left-0 top-0 bottom-0',
        bottom: 'left-0 right-0 bottom-0',
    };

    const slideVariants = {
        right: {
            initial: { x: '100%' },
            animate: { x: 0 },
            exit: { x: '100%' },
        },
        left: {
            initial: { x: '-100%' },
            animate: { x: 0 },
            exit: { x: '-100%' },
        },
        bottom: {
            initial: { y: '100%' },
            animate: { y: 0 },
            exit: { y: '100%' },
        },
    };

    const slideVariant = slideVariants[position];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay with blur */}
                    <motion.div
                        className={cn(
                            "fixed inset-0 z-[150]",
                            "bg-black/30 dark:bg-black/50 backdrop-blur-sm",
                            overlayClassName
                        )}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleOverlayClick}
                    />

                    {/* Drawer - Liquid glass design */}
                    <motion.div
                        ref={drawerRef}
                        className={cn(
                            "fixed z-[151]",
                            "drawer-liquid",
                            "flex flex-col",
                            position === 'right' || position === 'left' ? "w-[85%] max-w-[360px]" : "",
                            position === 'right' && "rounded-l-3xl",
                            position === 'left' && "rounded-r-3xl",
                            position === 'bottom' && "rounded-t-3xl",
                            positionClasses[position],
                            className
                        )}
                        initial={slideVariant.initial}
                        animate={slideVariant.animate}
                        exit={slideVariant.exit}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        style={{
                            paddingTop: 'var(--safe-top)',
                            paddingBottom: 'var(--safe-bottom)',
                            ...(position === 'bottom' && {
                                height: '85%',
                                maxHeight: 'min(600px, calc(var(--app-dvh) * 0.85))'
                            })
                        }}
                    >
                        {/* Header with centered content and close button */}
                        <div className="drawer-header-centered">
                            <div className="drawer-handle" />
                            {headerContent && (
                                <div className="drawer-header-content">
                                    {headerContent}
                                </div>
                            )}
                            {title && !headerContent && (
                                <h2 className="drawer-title">{title}</h2>
                            )}
                            <motion.button
                                className="drawer-close-btn-floating"
                                onClick={onClose}
                                aria-label="Close drawer"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <X size={18} />
                            </motion.button>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="drawer-content custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

