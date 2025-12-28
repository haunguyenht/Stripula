import { ChevronDown, Check } from 'lucide-react';
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
 * NavDropdown - Desktop navigation dropdown menu item
 * 
 * Renders a single nav item with optional dropdown children.
 * If no children, renders as a simple button.
 * 
 * @param {Object} item - Nav item config { id, label, icon, children?, comingSoon? }
 * @param {string} activeRoute - Currently active route ID
 * @param {Function} onNavigate - Navigation callback
 * @param {boolean} isActive - Whether this item/group is active
 */
export function NavDropdown({ item, activeRoute, onNavigate, isActive }) {
  const Icon = item.icon;
  const isDisabled = item.comingSoon;
  
  // Simple button for items without children
  if (!item.children) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => !isDisabled && onNavigate(item.id)}
        disabled={isDisabled}
        className={cn(
          "group gap-1.5 rounded-lg h-8 px-3 transition-all duration-300",
          // Light mode: OrangeAI style
          "font-medium text-sm",
          isActive 
            ? "bg-gradient-to-r from-[rgb(255,64,23)] to-[rgb(230,50,15)] text-white shadow-sm hover:shadow-md hover:from-[rgb(240,55,18)] hover:to-[rgb(210,45,12)]" 
            : "bg-transparent hover:bg-[rgb(248,247,247)] text-[rgb(37,27,24)] hover:text-[rgb(255,64,23)]",
          // Dark mode: OPUX styling
          isActive
            ? "dark:from-primary dark:to-primary/90 dark:text-primary-foreground dark:shadow-sm"
            : "dark:text-white/90 dark:hover:text-white dark:hover:bg-white/10",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Icon className={cn(
          "h-4 w-4 transition-colors",
          isActive 
            ? "text-white dark:text-primary-foreground" 
            : "text-[rgb(145,134,131)] group-hover:text-[rgb(255,64,23)] dark:text-white/60 dark:group-hover:text-white"
        )} />
        <span>{item.label}</span>
        {item.comingSoon && (
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 opacity-70">Soon</Badge>
        )}
      </Button>
    );
  }

  // Dropdown for items with children
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isDisabled}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "group gap-1.5 rounded-lg h-8 px-3 transition-all duration-300",
            // Light mode: OrangeAI style
            "font-medium text-sm",
            isActive 
              ? "bg-gradient-to-r from-[rgb(255,64,23)] to-[rgb(230,50,15)] text-white shadow-sm hover:shadow-md hover:from-[rgb(240,55,18)] hover:to-[rgb(210,45,12)]" 
              : "bg-transparent hover:bg-[rgb(248,247,247)] text-[rgb(37,27,24)] hover:text-[rgb(255,64,23)]",
            // Dark mode: OPUX styling
            isActive
              ? "dark:from-primary dark:to-primary/90 dark:text-primary-foreground dark:shadow-sm"
              : "dark:text-white/90 dark:hover:text-white dark:hover:bg-white/10",
            isDisabled && "opacity-50 cursor-not-allowed"
          )}
        >
        <Icon className={cn(
          "h-4 w-4 transition-colors",
          isActive 
            ? "text-white dark:text-primary-foreground" 
            : "text-[rgb(145,134,131)] group-hover:text-[rgb(255,64,23)] dark:text-white/60 dark:group-hover:text-white"
        )} />
          <span>{item.label}</span>
          {item.comingSoon && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 opacity-70">Soon</Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="center" 
        className={cn(
          "w-52",
          // Light mode: OrangeAI dropdown styling
          "bg-white border-[rgb(237,234,233)] rounded-xl",
          "shadow-[0_10px_30px_rgba(0,0,0,0.1)]",
          // Dark mode: OPUX glass dropdown
          "dark:bg-[hsl(216,28%,15%)] dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        )}
      >
        {item.children.map((child) => {
          const ChildIcon = child.icon;
          const isChildActive = activeRoute === child.id;
          
          return (
            <DropdownMenuItem
              key={child.id}
              onClick={() => onNavigate(child.id)}
              className={cn(
                "gap-3 py-2.5 px-3 rounded-lg cursor-pointer transition-all",
                // Light mode styling
                "hover:bg-[rgb(248,247,247)]",
                isChildActive && "bg-[rgb(255,64,23)]/5",
                // Dark mode styling
                "dark:hover:bg-white/10",
                isChildActive && "dark:bg-primary/20"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                isChildActive 
                  ? "bg-gradient-to-br from-[rgb(255,64,23)] to-[rgb(220,50,15)] text-white" 
                  : "bg-[rgb(248,247,247)] text-[rgb(145,134,131)]",
                // Dark mode icon container
                isChildActive
                  ? "dark:from-primary dark:to-primary/80"
                  : "dark:bg-white/10 dark:text-white/60"
              )}>
                <ChildIcon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium text-sm",
                    isChildActive ? "text-[rgb(255,64,23)]" : "text-[rgb(37,27,24)]",
                    // Dark mode text
                    isChildActive ? "dark:text-primary" : "dark:text-white/90"
                  )}>
                    {child.label}
                  </span>
                  {child.comingSoon && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">Soon</Badge>
                  )}
                </div>
                {child.desc && (
                  <p className="text-xs text-[rgb(145,134,131)] dark:text-white/50">{child.desc}</p>
                )}
              </div>
              {isChildActive && (
                <Check className="h-4 w-4 text-[rgb(255,64,23)] dark:text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}





