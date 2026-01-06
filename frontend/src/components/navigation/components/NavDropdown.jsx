import { ChevronDown, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * NavDropdown - Obsidian Aurora Design System
 * 
 * Desktop navigation dropdown featuring:
 * - Aurora gradient active states
 * - Prismatic hover effects with glow
 * - Crystalline dropdown panel
 * - Animated icon transitions
 */
export function NavDropdown({ item, activeRoute, onNavigate, isActive, index = 0 }) {
  const Icon = item.icon;
  const isDisabled = item.comingSoon;
  
  // Simple button for items without children
  if (!item.children) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => !isDisabled && onNavigate(item.id)}
          disabled={isDisabled}
          className={cn(
            "group gap-1.5 rounded-xl h-8 px-3.5 transition-all duration-300",
            "font-medium text-sm relative overflow-hidden",
            // Light mode: Vintage Banking
            isActive 
              ? "bg-gradient-to-r from-[hsl(25,70%,48%)] to-[hsl(22,65%,40%)] text-[hsl(40,50%,96%)] shadow-sm" 
              : "bg-transparent hover:bg-[hsl(38,40%,92%)] text-[hsl(25,35%,25%)] hover:text-[hsl(25,75%,45%)]",
            // ═══════════════════════════════════════════════════════════
            // DARK MODE: Clean with Purple accent
            // ═══════════════════════════════════════════════════════════
            isActive
              // Active: Purple background (reset gradient first)
              ? [
                  "dark:bg-none dark:bg-violet-500 dark:text-white dark:font-semibold",
                  "dark:border-0",
                  "dark:hover:bg-violet-400"
                ]
              // Inactive: Transparent with subtle hover
              : [
                  "dark:bg-transparent dark:text-white/70",
                  "dark:hover:bg-white/[0.08] dark:hover:text-white"
                ],
            isDisabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Icon className={cn(
            "h-4 w-4 transition-all duration-200",
            isActive 
              ? "text-[hsl(40,50%,96%)] dark:text-white" 
              : "text-[hsl(25,30%,50%)] group-hover:text-[hsl(25,75%,45%)] dark:text-white/60 dark:group-hover:text-white"
          )} />
          <span>{item.label}</span>
          {item.comingSoon && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 opacity-70 dark:border-white/20">Soon</Badge>
          )}
        </Button>
      </motion.div>
    );
  }

  // Dropdown for items with children
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isDisabled}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "group gap-1.5 rounded-xl h-8 px-3.5 transition-all duration-300",
              "font-medium text-sm relative overflow-hidden",
              // Light mode: Vintage Banking
              isActive 
                ? "bg-gradient-to-r from-[hsl(25,70%,48%)] to-[hsl(22,65%,40%)] text-[hsl(40,50%,96%)] shadow-sm" 
                : "bg-transparent hover:bg-[hsl(38,40%,92%)] text-[hsl(25,35%,25%)] hover:text-[hsl(25,75%,45%)]",
              // Dark mode: Clean with Purple accent
              isActive
                ? [
                      "dark:bg-none dark:bg-violet-500 dark:text-white dark:font-semibold",
                      "dark:border-0",
                      "dark:hover:bg-violet-400"
                    ]
                  : [
                      "dark:bg-transparent dark:text-white/70",
                      "dark:hover:bg-white/[0.08] dark:hover:text-white"
                    ],
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
              >
              <Icon className={cn(
                "h-4 w-4 transition-all duration-200",
                isActive 
                  ? "text-[hsl(40,50%,96%)] dark:text-white" 
                  : "text-[hsl(25,30%,50%)] group-hover:text-[hsl(25,75%,45%)] dark:text-white/60 dark:group-hover:text-white"
              )} />
              <span>{item.label}</span>
              {item.comingSoon && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 opacity-70 dark:border-white/20">Soon</Badge>
              )}
              <ChevronDown className={cn(
                "h-3 w-3 transition-all duration-200",
                "opacity-50 group-hover:opacity-100",
                isActive ? "dark:text-white/70" : "dark:text-white/40 dark:group-hover:text-white"
              )} />
              </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="center" 
          className={cn(
            "w-56 p-2",
            // Light mode: Vintage Banking
            "bg-gradient-to-b from-[hsl(40,50%,97%)] to-[hsl(38,45%,95%)]",
            "border-[hsl(30,35%,75%)]/50 rounded-xl",
            "shadow-[0_8px_32px_rgba(101,67,33,0.12)]",
            // Dark mode: Simple dark panel
            "dark:bg-zinc-900 dark:border-white/10 dark:rounded-xl",
            "dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]"
          )}
        >
          {item.children.map((child, childIndex) => {
            const ChildIcon = child.icon;
            const isChildActive = activeRoute === child.id;
            
            return (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: childIndex * 0.03 }}
              >
                <DropdownMenuItem
                  onClick={() => onNavigate(child.id)}
                  className={cn(
                    "gap-3 py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-150",
                    // Light mode: Vintage Banking
                    "hover:bg-[hsl(38,40%,92%)]",
                    isChildActive && "bg-[hsl(25,75%,45%)]/8",
                    // Dark mode: Simple hover
                    "dark:hover:bg-white/[0.06]",
                    isChildActive && "dark:bg-white/[0.08]"
                  )}
                >
                  {/* Icon container */}
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150",
                    // Light mode
                    isChildActive 
                      ? "bg-gradient-to-br from-[hsl(25,70%,48%)] to-[hsl(22,65%,40%)] text-[hsl(40,50%,96%)]" 
                      : "bg-[hsl(38,35%,90%)] text-[hsl(25,30%,50%)]",
                    // Dark mode (reset gradient first)
                    isChildActive
                      ? "dark:bg-none dark:bg-violet-500 dark:text-white"
                      : "dark:bg-white/[0.08] dark:text-white/70"
                  )}>
                    <ChildIcon className="h-4 w-4" />
                  </div>
                  
                  {/* Label and description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium text-sm",
                        isChildActive ? "text-[hsl(25,75%,45%)]" : "text-[hsl(25,35%,25%)]",
                        // Dark mode
                        isChildActive ? "dark:text-white" : "dark:text-white/80"
                      )}>
                        {child.label}
                      </span>
                      {child.comingSoon && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 dark:bg-white/10 dark:text-white/60">Soon</Badge>
                      )}
                    </div>
                    {child.desc && (
                      <p className="text-xs text-[hsl(25,20%,50%)] dark:text-white/40 truncate">{child.desc}</p>
                    )}
                  </div>
                  
                  {/* Active checkmark */}
                  {isChildActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <Check className="h-4 w-4 text-[hsl(25,75%,45%)] dark:text-violet-400" />
                    </motion.div>
                  )}
                </DropdownMenuItem>
              </motion.div>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
