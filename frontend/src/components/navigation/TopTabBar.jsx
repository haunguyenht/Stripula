import { useState, useRef, useEffect, forwardRef } from 'react';
import { ChevronDown, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// Config
import { 
  navItems, 
  defaultUser, 
  isGroupActive, 
  findActiveNavItem 
} from './config';

// Hooks
import { useResponsiveNav } from './hooks';

// Components
import {
  NavPillButton,
  NavPillNav,
  NavDropdown,
  MobileNavItem,
  UserPill,
  ActionsPill,
} from './components';

/**
 * TopTabBar - Modern navigation with modular components
 * 
 * Orchestrates the three main sections:
 * - Left: UserPill (avatar + tier)
 * - Center: Navigation (desktop dropdown or mobile sheet)
 * - Right: ActionsPill (credits + theme + profile)
 */
export function TopTabBar({ 
  activeRoute, 
  onNavigate,
  className,
  user = defaultUser,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navContainerRef = useRef(null);
  const navContentRef = useRef(null);
  
  const { shouldUseMobileNav } = useResponsiveNav(navContainerRef, navContentRef);

  const activeNavInfo = findActiveNavItem(activeRoute);
  const ActiveIcon = activeNavInfo.child?.icon || activeNavInfo.parent?.icon || CreditCard;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeRoute]);

  const handleNavigate = (routeId) => {
    onNavigate(routeId);
    setMobileMenuOpen(false);
  };
  
  return (
    <header className={cn(
      "relative z-40 flex items-center justify-between gap-3",
      // Light mode: OrangeAI exact styling - bg-neutral-surface1 px-5 py-2 rounded-md shadow-button-light
      "mx-4 mt-3 px-5 py-2 rounded-md",
      "bg-white",
      "shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)]",
      // Dark mode: transparent (no container styling)
      "dark:mx-0 dark:mt-0 dark:px-4 dark:py-2.5 dark:rounded-none dark:bg-transparent dark:shadow-none",
      className
    )}>
      {/* Left: User Profile */}
      <UserPill user={user} />

      {/* Center: Navigation */}
      <div ref={navContainerRef} className="flex-1 min-w-0 flex justify-center">
        {shouldUseMobileNav ? (
          <MobileNavigation
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
            activeRoute={activeRoute}
            activeNavInfo={activeNavInfo}
            ActiveIcon={ActiveIcon}
            onNavigate={handleNavigate}
          />
        ) : (
          <DesktopNavigation
            ref={navContentRef}
            activeRoute={activeRoute}
            onNavigate={handleNavigate}
          />
        )}
      </div>

      {/* Right: Actions */}
      <ActionsPill user={user} />
    </header>
  );
}

/**
 * DesktopNavigation - Desktop dropdown navigation
 */
const DesktopNavigation = forwardRef(({ activeRoute, onNavigate }, ref) => (
  <NavPillNav ref={ref}>
    {navItems.map((item) => (
      <NavDropdown
        key={item.id}
        item={item}
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        isActive={isGroupActive(item, activeRoute)}
      />
    ))}
  </NavPillNav>
));
DesktopNavigation.displayName = 'DesktopNavigation';

/**
 * MobileNavigation - Mobile sheet navigation
 */
function MobileNavigation({ 
  mobileMenuOpen, 
  setMobileMenuOpen, 
  activeRoute, 
  activeNavInfo, 
  ActiveIcon, 
  onNavigate 
}) {
  return (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
        <NavPillButton delay={0.05}>
                <ActiveIcon className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">
                  {activeNavInfo.child?.label || activeNavInfo.parent?.label}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </NavPillButton>
            </SheetTrigger>
            <SheetContent side="top" className="h-screen overflow-y-auto">
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="text-lg">Navigation</SheetTitle>
              </SheetHeader>
              <nav className="py-4 space-y-1">
                {navItems.map((item) => (
                  <MobileNavItem
                    key={item.id}
                    item={item}
                    activeRoute={activeRoute}
              onNavigate={onNavigate}
              isGroupActive={isGroupActive(item, activeRoute)}
                  />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
  );
}

