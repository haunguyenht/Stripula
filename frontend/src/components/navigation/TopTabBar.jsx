import { useState, useRef, useEffect, forwardRef } from 'react';
import { ChevronDown, CreditCard, Zap } from 'lucide-react';
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
  UserPill,
  ActionsPill,
} from './components';

/**
 * TopTabBar - Cyberpunk Navigation System
 * 
 * LIGHT MODE: Vintage Banking
 * - Transparent background with cream frosted elements
 * - Warm copper accents
 * 
 * DARK MODE: Cyberpunk Neon
 * - Deep dark backgrounds with neon edge glow
 * - Electric cyan (#00f0ff) and hot pink (#ff0080) accents
 * - Tech corner accents and scan line effects
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
        // Mobile-first spacing
        "gap-1 xs:gap-2 md:gap-4",
        "mx-1 xs:mx-2 md:mx-4",
        "mt-1.5 xs:mt-2 md:mt-3",
        "px-1 xs:px-2 md:px-3",
        "py-1 xs:py-1.5 md:py-2",
        // ═══════════════════════════════════════════════════════════
        // TRANSPARENT - Blends with page background
        // ═══════════════════════════════════════════════════════════
        "bg-transparent",
        "border-b border-transparent",
        "dark:bg-transparent dark:border-transparent",
        className
      )}
    >
      {/* Left: Credits Display */}
      <ActionsPill user={user} onNavigate={handleNavigate} />

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

      {/* Right: User Profile */}
      <UserPill user={user} onNavigate={handleNavigate} />
    </motion.header>
  );
}

/**
 * DesktopNavigation - Cyberpunk glass navigation
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
 * MobileNavigation - Cyberpunk sheet navigation
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
          <ActiveIcon className={cn(
            "h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors",
            "text-[hsl(25,50%,45%)]",
            "dark:text-[rgba(0,240,255,1)] dark:drop-shadow-[0_0_6px_rgba(0,240,255,0.8)]"
          )} />
          <span className={cn(
            "truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none text-xs sm:text-sm tracking-wide",
            "dark:text-[rgba(0,240,255,1)] dark:[text-shadow:0_0_8px_rgba(0,240,255,0.5)]"
          )}>
            {activeNavInfo.child?.label || activeNavInfo.parent?.label}
          </span>
          <ChevronDown className={cn(
            "h-3 w-3 sm:h-3.5 sm:w-3.5 transition-colors",
            "text-[hsl(25,20%,55%)]",
            "dark:text-[rgba(0,240,255,0.7)]"
          )} />
        </NavPillButton>
      </SheetTrigger>
      <SheetContent 
        side="top" 
        className={cn(
          "h-screen overflow-y-auto",
          // ═══════════════════════════════════════════════════════════
          // LIGHT MODE: Vintage Banking Sheet
          // ═══════════════════════════════════════════════════════════
          "bg-gradient-to-b from-white to-[hsl(40,30%,98%)]",
          "border-b border-[hsl(30,20%,88%)]",
          // ═══════════════════════════════════════════════════════════
          // DARK MODE: Cyberpunk Neon Sheet
          // ═══════════════════════════════════════════════════════════
          "dark:bg-none dark:bg-[rgba(4,8,16,0.98)]",
          "dark:border-b dark:border-[rgba(0,240,255,0.2)]",
          "dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5),0_0_50px_-15px_rgba(0,240,255,0.2),0_0_30px_-10px_rgba(255,0,128,0.1)]"
        )}
      >
        {/* Header */}
        <SheetHeader className={cn(
          "pb-3 sm:pb-4 relative",
          "border-b border-[hsl(30,20%,90%)]",
          "dark:border-[rgba(0,240,255,0.15)]"
        )}>
          {/* Neon accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(30,40%,75%)]/30 to-transparent dark:from-[rgba(0,240,255,0.5)] dark:via-[rgba(255,0,128,0.3)] dark:to-[rgba(0,240,255,0.5)]" />
          
          <SheetTitle className={cn(
            "text-base sm:text-lg flex items-center gap-2",
            "text-[hsl(25,30%,25%)]",
            "dark:text-[rgba(180,255,255,0.95)]"
          )}>
            <Zap className={cn(
              "h-3.5 w-3.5 sm:h-4 sm:w-4",
              "text-[hsl(25,55%,50%)]",
              "dark:text-[rgba(0,240,255,1)] dark:drop-shadow-[0_0_6px_rgba(0,240,255,0.8)]"
            )} />
            <span className="tracking-wide dark:[text-shadow:0_0_10px_rgba(0,240,255,0.4)]">Navigation</span>
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
        
        {/* Footer neon accent */}
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[hsl(30,30%,80%)]/20 to-transparent dark:from-[rgba(255,0,128,0.3)] dark:via-[rgba(0,240,255,0.4)] dark:to-[rgba(255,0,128,0.3)]" />
      </SheetContent>
    </Sheet>
  );
}
