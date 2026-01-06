import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * MobileNavItem - Obsidian Aurora Design System
 * 
 * Mobile navigation expandable item featuring:
 * - Aurora gradient backgrounds for active states
 * - Crystalline glass containers
 * - Animated expand/collapse with aurora effects
 * - Prismatic hover states
 */
export function MobileNavItem({ item, activeRoute, onNavigate, isGroupActive, index = 0 }) {
  const [expanded, setExpanded] = useState(isGroupActive);
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;
  const isDisabled = item.comingSoon;

  const handleClick = () => {
    if (isDisabled) return;
    if (hasChildren) {
      setExpanded(!expanded);
    } else {
      onNavigate(item.id);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "rounded-xl overflow-hidden",
        isDisabled && "opacity-50",
        // Dark mode: Glass container
        "dark:bg-white/[0.02]"
      )}
    >
      {/* Parent Item */}
      <motion.button
        onClick={handleClick}
        disabled={isDisabled}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3.5 text-left transition-all duration-300",
          // Light mode
          isGroupActive 
            ? "bg-accent text-accent-foreground" 
            : "hover:bg-muted/50",
          hasChildren && expanded && "bg-muted/30",
          isDisabled && "cursor-not-allowed",
          // ═══════════════════════════════════════════════════════════
          // DARK MODE: Obsidian Aurora Mobile Item
          // ═══════════════════════════════════════════════════════════
          isGroupActive 
            ? [
                "dark:bg-gradient-to-r dark:from-cyan-500/[0.12] dark:via-violet-500/[0.08] dark:to-pink-500/[0.06]",
                "dark:shadow-[inset_0_0_30px_-15px_rgba(139,92,246,0.3)]"
              ]
            : "dark:hover:bg-white/[0.04]",
          hasChildren && expanded && "dark:bg-white/[0.03]"
        )}
      >
        {/* Icon with aurora styling */}
        <div className={cn(
          "flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl shrink-0 transition-all duration-300",
          // Light mode
          isGroupActive ? "bg-primary text-primary-foreground" : "bg-muted",
          // Dark mode: Aurora icon container
          isGroupActive
            ? [
                "dark:bg-gradient-to-br dark:from-cyan-500 dark:via-violet-500 dark:to-pink-500",
                "dark:text-white",
                "dark:shadow-[0_0_20px_-4px_rgba(139,92,246,0.6)]"
              ]
            : [
                "dark:bg-white/[0.08] dark:text-white/70",
                "dark:group-hover:bg-white/[0.12]"
              ]
        )}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        
        {/* Label */}
        <span className={cn(
          "flex-1 font-medium text-sm sm:text-base",
          isGroupActive 
            ? "dark:text-transparent dark:bg-gradient-to-r dark:from-cyan-400 dark:to-violet-400 dark:bg-clip-text"
            : "dark:text-white/90"
        )}>
          {item.label}
        </span>
        
        {item.comingSoon && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 opacity-70",
              "dark:border-white/20 dark:text-white/50"
            )}
          >
            Soon
          </Badge>
        )}
        
        {/* Expand arrow with animation */}
        {hasChildren && !isDisabled && (
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-muted-foreground dark:text-white/40"
          >
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.div>
        )}
        
        {/* Active check for single items */}
        {!hasChildren && isGroupActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="dark:text-cyan-400 dark:drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]"
          >
            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </motion.div>
        )}
      </motion.button>

      {/* Children with aurora reveal */}
      <AnimatePresence>
        {expanded && hasChildren && !isDisabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "overflow-hidden",
              // Dark mode: Aurora gradient background
              "dark:bg-gradient-to-b dark:from-white/[0.02] dark:to-transparent"
            )}
          >
            <div className="py-1.5 sm:py-2 px-1.5 sm:px-2">
              {item.children.map((child, childIndex) => {
                const ChildIcon = child.icon;
                const isChildActive = activeRoute === child.id;
                const isChildDisabled = child.comingSoon;

                return (
                  <motion.button
                    key={child.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: childIndex * 0.04 }}
                    onClick={() => !isChildDisabled && onNavigate(child.id)}
                    disabled={isChildDisabled}
                    className={cn(
                      "w-full flex items-center gap-2.5 sm:gap-3 pl-10 sm:pl-14 pr-3 sm:pr-4 py-2.5 sm:py-3 text-left transition-all duration-200 rounded-lg sm:rounded-xl",
                      // Light mode
                      isChildActive 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
                      isChildDisabled && "opacity-50 cursor-not-allowed",
                      // Dark mode: Aurora child item
                      isChildActive 
                        ? [
                            "dark:bg-gradient-to-r dark:from-cyan-500/[0.1] dark:to-violet-500/[0.06]",
                            "dark:shadow-[inset_0_0_16px_-8px_rgba(34,211,238,0.3)]"
                          ]
                        : "dark:hover:bg-white/[0.04] dark:text-white/70 dark:hover:text-white"
                    )}
                  >
                    {/* Child icon */}
                    <div className={cn(
                      "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md sm:rounded-lg shrink-0 transition-all",
                      isChildActive 
                        ? "dark:bg-gradient-to-br dark:from-cyan-500/30 dark:to-violet-500/30 dark:text-cyan-400"
                        : "dark:bg-white/[0.06] dark:text-white/60"
                    )}>
                      <ChildIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className={cn(
                          "font-medium text-xs sm:text-sm",
                          isChildActive && "dark:text-transparent dark:bg-gradient-to-r dark:from-cyan-400 dark:to-violet-400 dark:bg-clip-text"
                        )}>
                          {child.label}
                        </span>
                        {child.comingSoon && (
                          <Badge 
                            variant="outline" 
                            className="text-[8px] sm:text-[9px] px-1 py-0 opacity-70 dark:border-white/20"
                          >
                            Soon
                          </Badge>
                        )}
                      </div>
                      {child.desc && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-white/40 truncate mt-0.5">
                          {child.desc}
                        </p>
                      )}
                    </div>
                    
                    {isChildActive && (
                      <motion.div
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      >
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 dark:text-cyan-400 dark:drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
