import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * MobileNavItem - Cyberpunk Mobile Navigation
 * 
 * LIGHT MODE: Vintage Banking
 * - Warm copper accents for active states
 * - Subtle frosted cream containers
 * 
 * DARK MODE: Cyberpunk Neon
 * - Electric cyan/pink neon active states
 * - Visible glowing borders and indicators
 * - Tech-inspired scan line effects
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
        "rounded-xl overflow-hidden relative",
        isDisabled && "opacity-50",
        // Light mode: Subtle glass container
        "bg-white/40",
        // Dark mode: Tech glass container with neon border
        "dark:bg-[rgba(8,12,20,0.6)]",
        "dark:border dark:border-[rgba(0,240,255,0.12)]"
      )}
    >
      {/* Parent Item */}
      <motion.button
        onClick={handleClick}
        disabled={isDisabled}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3.5 text-left transition-all duration-300 relative",
          // Light mode
          isGroupActive 
            ? "bg-[hsl(40,40%,95%)]" 
            : "hover:bg-[hsl(40,30%,97%)]",
          hasChildren && expanded && "bg-[hsl(40,35%,96%)]",
          isDisabled && "cursor-not-allowed",
          // ═══════════════════════════════════════════════════════════
          // DARK MODE: Cyberpunk Neon Active State
          // ═══════════════════════════════════════════════════════════
          isGroupActive 
            ? [
                "dark:bg-gradient-to-r dark:from-[rgba(0,240,255,0.15)] dark:via-[rgba(0,200,240,0.08)] dark:to-[rgba(255,0,128,0.06)]",
                "dark:shadow-[inset_0_0_30px_-12px_rgba(0,240,255,0.25)]"
              ]
            : "dark:hover:bg-[rgba(0,240,255,0.06)]",
          hasChildren && expanded && "dark:bg-[rgba(0,240,255,0.08)]"
        )}
      >
        {/* Active indicator line - left edge */}
        {isGroupActive && (
          <motion.div 
            className={cn(
              "absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full",
              "bg-[hsl(25,60%,50%)]",
              // Dark: Neon cyan gradient line with strong glow
              "dark:bg-gradient-to-b dark:from-[rgba(0,240,255,1)] dark:via-[rgba(0,200,240,0.9)] dark:to-[rgba(255,0,128,0.8)]",
              "dark:shadow-[0_0_12px_rgba(0,240,255,0.8),0_0_4px_rgba(0,240,255,1)]"
            )}
            layoutId="mobileActiveIndicator"
          />
        )}
        
        {/* Icon */}
        <div className={cn(
          "flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl shrink-0 transition-all duration-300",
          // Light mode
          isGroupActive 
            ? "bg-gradient-to-br from-[hsl(25,60%,52%)] to-[hsl(30,55%,45%)] text-white" 
            : "bg-[hsl(40,25%,92%)] text-[hsl(25,25%,50%)]",
          // Dark mode: Cyberpunk neon icon container
          isGroupActive
            ? [
                "dark:bg-none dark:bg-gradient-to-br dark:from-[rgba(0,240,255,0.3)] dark:to-[rgba(255,0,128,0.2)]",
                "dark:text-[rgba(180,255,255,1)]",
                "dark:shadow-[0_0_20px_-4px_rgba(0,240,255,0.7),inset_0_1px_0_rgba(0,240,255,0.3)]"
              ]
            : [
                "dark:bg-[rgba(0,240,255,0.08)] dark:text-[rgba(150,220,255,0.7)]"
              ]
        )}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        
        {/* Label */}
        <span className={cn(
          "flex-1 font-medium text-sm sm:text-base tracking-wide",
          "text-[hsl(25,25%,30%)]",
          isGroupActive 
            ? "dark:text-[rgba(180,255,255,1)] dark:[text-shadow:0_0_8px_rgba(0,240,255,0.5)]"
            : "dark:text-[rgba(180,220,255,0.85)]"
        )}>
          {item.label}
        </span>
        
        {item.comingSoon && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 opacity-70",
              "dark:border-[rgba(0,240,255,0.3)] dark:text-[rgba(0,240,255,0.6)]"
            )}
          >
            Soon
          </Badge>
        )}
        
        {/* Expand arrow */}
        {hasChildren && !isDisabled && (
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-[hsl(25,20%,60%)] dark:text-[rgba(0,240,255,0.5)]"
          >
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.div>
        )}
        
        {/* Active check for single items */}
        {!hasChildren && isGroupActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "text-[hsl(25,55%,45%)]",
              "dark:text-[rgba(0,240,255,1)] dark:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]"
            )}
          >
            <Check className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.div>
        )}
      </motion.button>

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && !isDisabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "overflow-hidden",
              // Light mode
              "bg-[hsl(40,30%,98%)]",
              // Dark mode: Tech panel
              "dark:bg-[rgba(0,240,255,0.03)]"
            )}
          >
            {/* Neon separator line */}
            <div className="h-px mx-4 bg-[hsl(30,20%,88%)] dark:bg-gradient-to-r dark:from-transparent dark:via-[rgba(0,240,255,0.3)] dark:to-transparent" />
            
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
                      "w-full flex items-center gap-2.5 sm:gap-3 pl-10 sm:pl-14 pr-3 sm:pr-4 py-2.5 sm:py-3 text-left transition-all duration-200 rounded-lg sm:rounded-xl relative",
                      // Light mode
                      isChildActive 
                        ? "bg-[hsl(25,50%,96%)]" 
                        : "hover:bg-[hsl(40,30%,96%)]",
                      isChildDisabled && "opacity-50 cursor-not-allowed",
                      // Dark mode: Cyberpunk child item
                      isChildActive 
                        ? [
                            "dark:bg-[rgba(0,240,255,0.12)]",
                            "dark:shadow-[inset_0_0_20px_-10px_rgba(0,240,255,0.3),inset_0_0_0_1px_rgba(0,240,255,0.2)]"
                          ]
                        : "dark:hover:bg-[rgba(0,240,255,0.06)]"
                    )}
                  >
                    {/* Child active indicator */}
                    {isChildActive && (
                      <div className={cn(
                        "absolute left-8 sm:left-12 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                        "bg-[hsl(25,55%,50%)]",
                        "dark:bg-[rgba(0,240,255,1)] dark:shadow-[0_0_10px_rgba(0,240,255,0.8),0_0_4px_rgba(0,240,255,1)]"
                      )} />
                    )}
                    
                    {/* Child icon */}
                    <div className={cn(
                      "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md sm:rounded-lg shrink-0 transition-all",
                      isChildActive 
                        ? "bg-[hsl(25,50%,94%)] text-[hsl(25,55%,45%)] dark:bg-[rgba(0,240,255,0.2)] dark:text-[rgba(180,255,255,1)]"
                        : "bg-[hsl(40,20%,94%)] text-[hsl(25,20%,55%)] dark:bg-[rgba(0,240,255,0.06)] dark:text-[rgba(150,200,255,0.6)]"
                    )}>
                      <ChildIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className={cn(
                          "font-medium text-xs sm:text-sm tracking-wide",
                          isChildActive 
                            ? "text-[hsl(25,45%,35%)] dark:text-[rgba(180,255,255,1)] dark:[text-shadow:0_0_6px_rgba(0,240,255,0.5)]" 
                            : "text-[hsl(25,20%,45%)] dark:text-[rgba(180,220,255,0.75)]"
                        )}>
                          {child.label}
                        </span>
                        {child.comingSoon && (
                          <Badge 
                            variant="outline" 
                            className="text-[8px] sm:text-[9px] px-1 py-0 opacity-70 dark:border-[rgba(0,240,255,0.2)]"
                          >
                            Soon
                          </Badge>
                        )}
                      </div>
                      {child.desc && (
                        <p className="text-[10px] sm:text-xs text-[hsl(25,15%,55%)] dark:text-[rgba(150,200,255,0.5)] truncate mt-0.5">
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
                        <Check className={cn(
                          "h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0",
                          "text-[hsl(25,55%,45%)]",
                          "dark:text-[rgba(0,240,255,1)] dark:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                        )} />
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
