import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * MobileNavItem - Mobile navigation expandable menu item
 * 
 * Renders a nav item that expands to show children on tap.
 * Used in the mobile Sheet navigation menu.
 * 
 * @param {Object} item - Nav item config { id, label, icon, children?, comingSoon? }
 * @param {string} activeRoute - Currently active route ID
 * @param {Function} onNavigate - Navigation callback
 * @param {boolean} isGroupActive - Whether this item/group is active
 */
export function MobileNavItem({ item, activeRoute, onNavigate, isGroupActive }) {
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
    <div className={cn("rounded-lg overflow-hidden", isDisabled && "opacity-50")}>
      {/* Parent Item */}
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
          isGroupActive 
            ? "bg-accent text-accent-foreground" 
            : "hover:bg-muted/50",
          hasChildren && expanded && "bg-muted/30",
          isDisabled && "cursor-not-allowed"
        )}
      >
        <div className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
          isGroupActive ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="flex-1 font-medium">{item.label}</span>
        {item.comingSoon && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 opacity-70">Soon</Badge>
        )}
        {hasChildren && !isDisabled && (
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.15 }}
            className="text-muted-foreground"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        )}
        {!hasChildren && isGroupActive && (
          <Check className="h-4 w-4 text-primary" />
        )}
      </button>

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && !isDisabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-muted/20"
          >
            <div className="py-1">
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                const isChildActive = activeRoute === child.id;
                const isChildDisabled = child.comingSoon;

                return (
                  <button
                    key={child.id}
                    onClick={() => !isChildDisabled && onNavigate(child.id)}
                    disabled={isChildDisabled}
                    className={cn(
                      "w-full flex items-center gap-3 pl-16 pr-4 py-2.5 text-left transition-colors",
                      isChildActive 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
                      isChildDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <ChildIcon className="h-4 w-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium text-sm",
                          isChildActive && "text-primary"
                        )}>
                          {child.label}
                        </span>
                        {child.comingSoon && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 opacity-70">Soon</Badge>
                        )}
                      </div>
                      {child.desc && (
                        <p className="text-xs text-muted-foreground truncate">{child.desc}</p>
                      )}
                    </div>
                    {isChildActive && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}





