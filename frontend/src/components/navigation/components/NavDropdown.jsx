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
 * NavDropdown - Dual Theme Design System
 * 
 * LIGHT MODE: Vintage Banking
 * - Copper foil active states
 * - Warm hover effects
 * 
 * DARK MODE: PREMIUM Liquid Aurora
 * - Aurora gradient active states with enhanced glow
 * - Prismatic hover effects with multi-layer glow
 * - Crystalline dropdown panel
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
            "group rounded-lg md:rounded-xl transition-all duration-300",
            "font-medium text-xs md:text-sm relative overflow-hidden",
            // Mobile-first: icon-only until md breakpoint
            "gap-0 md:gap-1.5 h-7 md:h-8 px-2 md:px-3.5 min-w-[32px] md:min-w-0",
            // Light mode: Vintage Banking
            isActive 
              ? "bg-gradient-to-r from-[hsl(25,70%,48%)] to-[hsl(22,65%,40%)] text-[hsl(40,50%,96%)] shadow-sm" 
              : "bg-transparent hover:bg-[hsl(38,40%,92%)] text-[hsl(25,35%,25%)] hover:text-[hsl(25,75%,45%)]",
            // ═══════════════════════════════════════════════════════════
            // DARK MODE: PREMIUM Liquid Aurora with enhanced glow
            // ═══════════════════════════════════════════════════════════
            isActive
              // Active: Aurora gradient with neon glow - KEEP gradient on hover
              ? [
                  "dark:bg-gradient-to-r dark:from-violet-600 dark:to-cyan-500",
                  "dark:text-white dark:font-semibold",
                  "dark:border-0",
                  "dark:shadow-[0_0_20px_rgba(139,92,246,0.4),0_0_40px_-10px_rgba(34,211,238,0.3)]",
                  // Override light hover, keep aurora gradient
                  "dark:hover:from-violet-500 dark:hover:to-cyan-400",
                  "dark:hover:shadow-[0_0_28px_rgba(139,92,246,0.5),0_0_50px_-10px_rgba(34,211,238,0.4)]"
                ]
              // Inactive: Transparent with aurora hover
              : [
                  "dark:bg-transparent dark:text-white/70",
                  "dark:hover:bg-violet-500/15 dark:hover:text-white",
                  "dark:hover:shadow-[0_0_16px_-4px_rgba(139,92,246,0.3)]"
                ],
            isDisabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Icon className={cn(
            "h-4 w-4 shrink-0 transition-all duration-200",
            isActive 
              ? "text-[hsl(40,50%,96%)] dark:text-white dark:drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]" 
              : "text-[hsl(25,30%,50%)] group-hover:text-[hsl(25,75%,45%)] dark:text-white/60 dark:group-hover:text-white"
          )} />
          <span className="hidden md:inline">{item.label}</span>
          {item.comingSoon && (
            <Badge variant="outline" className="hidden md:inline-flex text-[9px] px-1 py-0 h-4 opacity-70 dark:border-white/20">Soon</Badge>
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
              "group rounded-lg md:rounded-xl transition-all duration-300",
              "font-medium text-xs md:text-sm relative overflow-hidden",
              // Mobile-first: icon + chevron only until md breakpoint
              "gap-0.5 md:gap-1.5 h-7 md:h-8 px-2 md:px-3.5 min-w-[40px] md:min-w-0",
              // Light mode: Vintage Banking
              isActive 
                ? "bg-gradient-to-r from-[hsl(25,70%,48%)] to-[hsl(22,65%,40%)] text-[hsl(40,50%,96%)] shadow-sm" 
                : "bg-transparent hover:bg-[hsl(38,40%,92%)] text-[hsl(25,35%,25%)] hover:text-[hsl(25,75%,45%)]",
              // Dark mode: PREMIUM Liquid Aurora with enhanced glow
              isActive
                ? [
                      "dark:bg-gradient-to-r dark:from-violet-600 dark:to-cyan-500",
                      "dark:text-white dark:font-semibold",
                      "dark:border-0",
                      "dark:shadow-[0_0_20px_rgba(139,92,246,0.4),0_0_40px_-10px_rgba(34,211,238,0.3)]",
                      // Override light hover, keep aurora gradient
                      "dark:hover:from-violet-500 dark:hover:to-cyan-400",
                      "dark:hover:shadow-[0_0_28px_rgba(139,92,246,0.5),0_0_50px_-10px_rgba(34,211,238,0.4)]"
                    ]
                  : [
                      "dark:bg-transparent dark:text-white/70",
                      "dark:hover:bg-violet-500/15 dark:hover:text-white",
                      "dark:hover:shadow-[0_0_16px_-4px_rgba(139,92,246,0.3)]"
                    ],
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
              >
              <Icon className={cn(
                "h-4 w-4 shrink-0 transition-all duration-200",
                isActive 
                  ? "text-[hsl(40,50%,96%)] dark:text-white dark:drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]" 
                  : "text-[hsl(25,30%,50%)] group-hover:text-[hsl(25,75%,45%)] dark:text-white/60 dark:group-hover:text-white"
              )} />
              <span className="hidden md:inline">{item.label}</span>
              {item.comingSoon && (
                <Badge variant="outline" className="hidden md:inline-flex text-[9px] px-1 py-0 h-4 opacity-70 dark:border-white/20">Soon</Badge>
              )}
              <ChevronDown className={cn(
                "h-3 w-3 shrink-0 transition-all duration-200",
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
            // Dark mode: PREMIUM Liquid Aurora panel
            "dark:bg-none dark:bg-[rgba(12,14,22,0.96)]",
            "dark:backdrop-blur-[80px] dark:backdrop-saturate-[220%]",
            "dark:border dark:border-[rgba(139,92,246,0.15)]",
            "dark:shadow-[0_0_0_1px_rgba(139,92,246,0.1),0_0_50px_rgba(139,92,246,0.12),0_0_35px_rgba(34,211,238,0.08),0_20px_64px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.1)]"
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
                    // Dark mode: PREMIUM Aurora hover
                    "dark:hover:bg-[rgba(139,92,246,0.15)]",
                    "dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
                    isChildActive && "dark:bg-[rgba(139,92,246,0.2)]"
                  )}
                >
                  {/* Icon container */}
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150",
                    // Light mode
                    isChildActive 
                      ? "bg-gradient-to-br from-[hsl(25,70%,48%)] to-[hsl(22,65%,40%)] text-[hsl(40,50%,96%)]" 
                      : "bg-[hsl(38,35%,90%)] text-[hsl(25,30%,50%)]",
                    // Dark mode: PREMIUM Aurora icon container (reset gradient first)
                    isChildActive
                      ? "dark:bg-none dark:bg-gradient-to-br dark:from-[hsl(250,90%,60%)] dark:to-[hsl(210,100%,60%)] dark:text-white dark:shadow-[0_0_12px_rgba(139,92,246,0.4)]"
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
                      <Check className="h-4 w-4 text-[hsl(25,75%,45%)] dark:text-[hsl(250,90%,75%)] dark:drop-shadow-[0_0_6px_rgba(139,92,246,0.6)]" />
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
