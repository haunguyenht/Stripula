import { useState, useRef, useEffect, forwardRef } from 'react';
import { ChevronDown, CreditCard, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
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
  UserPillCyberpunk,
  ActionsPill,
} from './components';

/**
 * TopTabBar - Floating Transparent Navigation
 * 
 * Seamless navigation that blends with the page background.
 * Only the center tab pills are visible as floating glass elements.
 * Left/right sections are minimal and transparent.
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
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative z-40 flex items-center justify-between",
        // Mobile-first spacing - very compact on small screens
        "gap-1 xs:gap-2 md:gap-4",
        "mx-1 xs:mx-2 md:mx-4",
        "mt-1.5 xs:mt-2 md:mt-3",
        "px-1 xs:px-2 md:px-3",
        "py-1 xs:py-1.5 md:py-2",
        // ═══════════════════════════════════════════════════════════
        // FULLY TRANSPARENT - No visible navbar background
        // ═══════════════════════════════════════════════════════════
        "bg-transparent",
        // Light mode: subtle separator at bottom only
        "border-b border-transparent",
        // Dark mode: completely invisible, blends with page
        "dark:bg-transparent dark:border-transparent",
        className
      )}
    >
      {/* Left: Credits Display - Floating Pill */}
      <ActionsPill user={user} onNavigate={handleNavigate} />

      {/* Center: Navigation Tabs - The Only Visible Element */}
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

      {/* Right: User Profile - Cyberpunk Variant */}
      <UserPillCyberpunk user={user} onNavigate={handleNavigate} />
    </motion.header>
  );
}

/**
 * DesktopNavigation - Floating glass navigation pills
 */
const DesktopNavigation = forwardRef(({ activeRoute, onNavigate }, ref) => (
  <NavPillNav ref={ref}>
    {navItems.map((item, index) => (
      <NavDropdown
        key={item.id}
        item={item}
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        isActive={isGroupActive(item, activeRoute)}
        index={index}
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
          <ActiveIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary dark:text-cyan-400" />
          <span className="truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none text-xs sm:text-sm">
            {activeNavInfo.child?.label || activeNavInfo.parent?.label}
          </span>
          <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground dark:text-white/40" />
        </NavPillButton>
      </SheetTrigger>
      <SheetContent 
        side="top" 
        className={cn(
          "h-screen overflow-y-auto",
          // Dark mode: Deep obsidian sheet
          "dark:bg-gradient-to-b dark:from-[rgba(8,10,18,0.99)] dark:via-[rgba(12,14,24,0.98)] dark:to-[rgba(8,10,18,0.99)]",
          "dark:border-b dark:border-[rgba(139,92,246,0.2)]",
          "dark:shadow-[0_20px_60px_-10px_rgba(139,92,246,0.2)]"
        )}
      >
        <SheetHeader className="pb-3 sm:pb-4 border-b dark:border-[rgba(139,92,246,0.15)]">
          <SheetTitle className="text-base sm:text-lg flex items-center gap-2 dark:text-white">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400" />
            Navigation
          </SheetTitle>
        </SheetHeader>
        <nav className="py-3 sm:py-4 space-y-1">
          {navItems.map((item, index) => (
            <MobileNavItem
              key={item.id}
              item={item}
              activeRoute={activeRoute}
              onNavigate={onNavigate}
              isGroupActive={isGroupActive(item, activeRoute)}
              index={index}
            />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
