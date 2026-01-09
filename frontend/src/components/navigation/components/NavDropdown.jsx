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
 * NavDropdown - Cyberpunk Design System
 * 
 * LIGHT MODE: Vintage Banking
 * - Copper foil active states
 * - Warm parchment hover effects
 * 
 * DARK MODE: Cyberpunk Neon
 * - Electric cyan/pink glow for active states
 * - Visible neon borders
 * - Tech-inspired glowing effects
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
            "gap-0 md:gap-1.5 h-7 md:h-8 px-2 md:px-3.5 min-w-[32px] md:min-w-0",
            // ═══════════════════════════════════════════════════════════
            // ACTIVE STATE - Text glow only, no border box
            // ═══════════════════════════════════════════════════════════
            isActive && [
              // Light mode: Copper gradient pill
              "bg-gradient-to-b from-[hsl(25,65%,50%)] to-[hsl(22,60%,42%)]",
              "text-white font-semibold",
              "shadow-[0_2px_8px_rgba(180,100,50,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]",
              "[text-shadow:0_1px_1px_rgba(0,0,0,0.15)]",
              // Dark mode: Just bright glowing text, no background/border
              "dark:bg-none dark:from-transparent dark:to-transparent",
              "dark:bg-transparent",
              "dark:border-0",
              "dark:text-[rgba(0,240,255,1)] dark:font-bold",
              "dark:shadow-none",
              "dark:[text-shadow:0_0_15px_rgba(0,240,255,1),0_0_30px_rgba(0,240,255,0.6),0_0_45px_rgba(0,240,255,0.3)]"
            ],
            // ═══════════════════════════════════════════════════════════
            // INACTIVE STATE
            // ═══════════════════════════════════════════════════════════
            !isActive && [
              // Light mode
              "bg-transparent text-[hsl(25,30%,35%)]",
              "hover:bg-[hsl(40,35%,94%)] hover:text-[hsl(25,55%,38%)]",
              "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
              // Dark mode: Dimmer text, glow on hover
              "dark:bg-transparent dark:text-[rgba(150,200,220,0.7)]",
              "dark:hover:text-[rgba(0,240,255,0.9)]",
              "dark:hover:[text-shadow:0_0_10px_rgba(0,240,255,0.5)]",
              "dark:[text-shadow:none]"
            ],
            isDisabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Icon className={cn(
            "h-4 w-4 shrink-0 transition-all duration-200",
            isActive 
              ? "text-white dark:text-[rgba(0,240,255,1)] dark:drop-shadow-[0_0_8px_rgba(0,240,255,1)]" 
              : "text-[hsl(25,25%,50%)] group-hover:text-[hsl(25,55%,40%)] dark:text-[rgba(150,200,220,0.7)] dark:group-hover:text-[rgba(0,240,255,0.9)]"
          )} />
          <span className="hidden md:inline">{item.label}</span>
          {item.comingSoon && (
            <Badge variant="outline" className="hidden md:inline-flex text-[9px] px-1 py-0 h-4 opacity-70 dark:border-[rgba(0,240,255,0.3)] dark:text-[rgba(0,240,255,0.6)]">Soon</Badge>
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
              "gap-0.5 md:gap-1.5 h-7 md:h-8 px-2 md:px-3.5 min-w-[40px] md:min-w-0",
              // ═══════════════════════════════════════════════════════════
              // ACTIVE STATE - Text glow only, no border box
              // ═══════════════════════════════════════════════════════════
              isActive && [
                // Light mode: Copper gradient pill
                "bg-gradient-to-b from-[hsl(25,65%,50%)] to-[hsl(22,60%,42%)]",
                "text-white font-semibold",
                "shadow-[0_2px_8px_rgba(180,100,50,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]",
                "[text-shadow:0_1px_1px_rgba(0,0,0,0.15)]",
                // Dark mode: Just bright glowing text, no background/border
                "dark:bg-none dark:from-transparent dark:to-transparent",
                "dark:bg-transparent",
                "dark:border-0",
                "dark:text-[rgba(0,240,255,1)] dark:font-bold",
                "dark:shadow-none",
                "dark:[text-shadow:0_0_15px_rgba(0,240,255,1),0_0_30px_rgba(0,240,255,0.6),0_0_45px_rgba(0,240,255,0.3)]"
              ],
              // ═══════════════════════════════════════════════════════════
              // INACTIVE STATE
              // ═══════════════════════════════════════════════════════════
              !isActive && [
                // Light mode
                "bg-transparent text-[hsl(25,30%,35%)]",
                "hover:bg-[hsl(40,35%,94%)] hover:text-[hsl(25,55%,38%)]",
                "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
                // Dark mode: Dimmer text, glow on hover
                "dark:bg-transparent dark:text-[rgba(150,200,220,0.7)]",
                "dark:hover:text-[rgba(0,240,255,0.9)]",
                "dark:hover:[text-shadow:0_0_10px_rgba(0,240,255,0.5)]",
                "dark:[text-shadow:none]"
              ],
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon className={cn(
              "h-4 w-4 shrink-0 transition-all duration-200",
              isActive 
                ? "text-white dark:text-[rgba(0,240,255,1)] dark:drop-shadow-[0_0_8px_rgba(0,240,255,1)]" 
                : "text-[hsl(25,25%,50%)] group-hover:text-[hsl(25,55%,40%)] dark:text-[rgba(150,200,220,0.7)] dark:group-hover:text-[rgba(0,240,255,0.9)]"
            )} />
            <span className="hidden md:inline">{item.label}</span>
            {item.comingSoon && (
              <Badge variant="outline" className="hidden md:inline-flex text-[9px] px-1 py-0 h-4 opacity-70 dark:border-[rgba(0,240,255,0.3)]">Soon</Badge>
            )}
            <ChevronDown className={cn(
              "h-3 w-3 shrink-0 transition-all duration-200",
              "opacity-60 group-hover:opacity-100",
              isActive ? "dark:text-[rgba(180,255,255,0.8)]" : "dark:text-[rgba(150,200,255,0.5)] dark:group-hover:text-[rgba(180,255,255,0.8)]"
            )} />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="center" 
          className={cn(
            "w-56 p-2 relative overflow-hidden",
            // ═══════════════════════════════════════════════════════════
            // LIGHT MODE: Vintage Banking Panel
            // ═══════════════════════════════════════════════════════════
            "bg-gradient-to-b from-white to-[hsl(40,35%,97%)]",
            "border border-[hsl(30,28%,82%)] rounded-xl",
            "shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1),0_4px_12px_-2px_rgba(0,0,0,0.05)]",
            // ═══════════════════════════════════════════════════════════
            // DARK MODE: Cyberpunk Neon Panel
            // ═══════════════════════════════════════════════════════════
            "dark:bg-none dark:bg-[rgba(6,10,20,0.97)]",
            "dark:backdrop-blur-2xl dark:backdrop-saturate-150",
            "dark:border dark:border-[rgba(0,240,255,0.25)]",
            // Neon glow shadow
            "dark:shadow-[0_0_2px_rgba(0,240,255,0.5),0_0_40px_-10px_rgba(0,240,255,0.3),0_0_30px_-8px_rgba(255,0,128,0.15),0_20px_50px_-8px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(0,240,255,0.1)]",
            "dark:rounded-xl"
          )}
        >
          {/* Neon top edge */}
          <div className="absolute top-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent dark:from-[rgba(0,240,255,0.4)] dark:via-[rgba(255,0,128,0.3)] dark:to-[rgba(0,240,255,0.4)]" />
          
          {/* Tech corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 hidden dark:block">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-[rgba(0,240,255,0.6)] to-transparent" />
            <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-[rgba(0,240,255,0.6)] to-transparent" />
          </div>
          <div className="absolute bottom-0 right-0 w-4 h-4 hidden dark:block">
            <div className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-[rgba(255,0,128,0.5)] to-transparent" />
            <div className="absolute bottom-0 right-0 w-px h-full bg-gradient-to-t from-[rgba(255,0,128,0.5)] to-transparent" />
          </div>
          
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
                    "gap-3 py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-200 relative",
                    // Light mode
                    "hover:bg-[hsl(40,40%,95%)]",
                    isChildActive && "bg-[hsl(25,45%,95%)]",
                    // Dark mode: Cyberpunk hover
                    "dark:hover:bg-[rgba(0,240,255,0.08)]",
                    isChildActive && [
                      "dark:bg-[rgba(0,240,255,0.12)]",
                      "dark:shadow-[inset_0_0_0_1px_rgba(0,240,255,0.3),0_0_12px_-4px_rgba(0,240,255,0.4)]"
                    ]
                  )}
                >
                  {/* Icon container */}
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                    // Light mode
                    isChildActive 
                      ? "bg-gradient-to-br from-[hsl(25,60%,50%)] to-[hsl(22,55%,42%)] text-white" 
                      : "bg-[hsl(40,30%,93%)] text-[hsl(25,25%,50%)]",
                    // Dark mode: Neon icon container
                    isChildActive
                      ? [
                          "dark:bg-none dark:bg-[rgba(0,240,255,0.2)]",
                          "dark:text-[rgba(180,255,255,1)]",
                          "dark:shadow-[0_0_12px_-2px_rgba(0,240,255,0.5),inset_0_1px_0_rgba(0,240,255,0.2)]"
                        ]
                      : "dark:bg-[rgba(0,240,255,0.06)] dark:text-[rgba(150,200,255,0.7)]"
                  )}>
                    <ChildIcon className="h-4 w-4" />
                  </div>
                  
                  {/* Label and description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium text-sm",
                        isChildActive 
                          ? "text-[hsl(25,50%,35%)]" 
                          : "text-[hsl(25,25%,30%)]",
                        // Dark mode
                        isChildActive 
                          ? "dark:text-[rgba(180,255,255,1)] dark:[text-shadow:0_0_8px_rgba(0,240,255,0.5)]" 
                          : "dark:text-[rgba(180,220,255,0.85)]"
                      )}>
                        {child.label}
                      </span>
                      {child.comingSoon && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 dark:bg-[rgba(0,240,255,0.1)] dark:text-[rgba(0,240,255,0.6)] dark:border-0">Soon</Badge>
                      )}
                    </div>
                    {child.desc && (
                      <p className="text-xs text-[hsl(25,15%,55%)] dark:text-[rgba(150,200,255,0.5)] truncate">{child.desc}</p>
                    )}
                  </div>
                  
                  {/* Active checkmark */}
                  {isChildActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <Check className="h-4 w-4 text-[hsl(25,50%,42%)] dark:text-[rgba(0,240,255,1)] dark:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
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
