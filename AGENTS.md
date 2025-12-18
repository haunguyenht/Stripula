# AGENTS.md

## Overview
Stripe card validation tool: React + Vite frontend, Node.js + Express backend.
Fully migrated to **shadcn/ui** with Tailwind CSS and **motion** for animations.

**Design System**: Dual-theme with OrangeAI (light) and OPUX glass (dark) aesthetics.

## Architecture

### Backend
- **Pattern**: DI container in `server.js`
- **Flow**: Controllers → Services → Validators (Strategy) → Domain → Infrastructure
- **Key**: `ValidationFacade` orchestrates validation, `ValidatorFactory` creates validators

### Frontend
- **UI Framework**: shadcn/ui (New York preset) with Radix UI primitives
- **Styling**: Tailwind CSS with shadcn CSS variables + CVA (class-variance-authority)
- **Animations**: `motion` package (from motion.dev) + View Transitions API
- **Layout**: `TwoPanelLayout` - config panel left, results right; Sheet drawer on mobile
- **Responsive**: `useBreakpoint()` hook, mobile < 768px
- **File Extensions**: `.jsx` for components, extensionless imports
- **Path Alias**: `@/` maps to `src/`

## Design System

### Light Mode (OrangeAI)
- Background: Pure white `#ffffff`
- Primary: Vibrant orange `rgb(255, 64, 23)`
- Cards: White with warm borders `rgb(237, 234, 233)`
- Shadows: Soft `0 10px 30px rgba(0,0,0,0.1)`
- Border radius: 20px for cards, 10-12px for buttons

### Dark Mode (OPUX Glass)
- Background: Teal-dark with tile pattern `hsl(201 44% 14%)`
- Primary: Terracotta accent `hsl(3 26% 55%)`
- Cards: Glass morphism with blur and noise texture
- Shadows: Deep with inner glow
- Decorative: Grainy texture + wireframe landscape layers

## UI Components (shadcn/ui)
- **Core**: Button, Input, Textarea, Label, Badge, Card, Separator
- **Navigation**: Tabs, DropdownMenu, Sheet (mobile drawer), TopTabBar
- **Forms**: Select, Slider, Switch
- **Feedback**: Tooltip, ScrollArea, sonner (toasts)
- **Layout**: TwoPanelLayout, AppLayout, AppBackground
- **Custom**: ThemeToggle (animated), ResultCard, StatPill, VirtualList

## CSS Variables (shadcn themes)
```css
/* Core */
--background, --foreground
--card, --card-foreground
--primary, --primary-foreground
--secondary, --secondary-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--destructive, --destructive-foreground
--border, --input, --ring

/* Status */
--success, --warning

/* Layout */
--app-dvh (viewport height)
--radius (border radius)

/* Theme Toggle Animation */
--theme-toggle-x, --theme-toggle-y, --theme-toggle-radius
```

## Key Files

### Components
- `src/components/ui/` - shadcn components (button, card, badge, etc.)
- `src/components/ui/theme-toggle.jsx` - Animated theme toggle with circular reveal
- `src/components/ui/result-card.jsx` - Card validation result display
- `src/components/layout/` - AppLayout, TwoPanelLayout, panels/
- `src/components/navigation/` - TopTabBar, NavPill, ActionsPill, NavDropdown
- `src/components/background/AppBackground.jsx` - OPUX layered background
- `src/components/stripe/` - Stripe-specific panels

### Hooks
- `src/hooks/useMediaQuery.js` - useBreakpoint, useContentOverflow
- `src/hooks/useLocalStorage.js` - Persistent state
- `src/hooks/useToast.js` - Toast notifications wrapper
- `src/hooks/useTheme.js` - Theme context consumer
- `src/hooks/useKeyFilters.js` - Key validation filters
- `src/hooks/useCardFilters.js` - Card validation filters

### Contexts
- `src/contexts/ThemeContext.jsx` - Light/dark mode provider

### Lib
- `src/lib/utils.js` - cn() utility (clsx + tailwind-merge)
- `src/lib/motion.js` - Animation variants, transitions, springs
- `src/lib/styles/card-variants.js` - CVA card styling
- `src/lib/tokens/shadows.js` - Shadow token definitions
- `src/lib/utils/card-helpers.js` - Card utility functions

### Navigation Config
- `src/components/navigation/config/nav-items.js` - Menu structure
- `src/components/navigation/config/tier-config.js` - User tier styling

## Agent Rules

### DO
- Use shadcn/ui components from `@/components/ui/`
- Use Tailwind CSS classes (shadcn tokens)
- Use `cn()` from `@/lib/utils` for class merging
- Use CVA for component variants (see `lib/styles/card-variants.js`)
- Use `useBreakpoint()` for responsive logic
- Use `--app-dvh` for viewport height
- Use `Sheet` component for mobile drawers
- Use `motion` from `motion/react` for animations
- Use `sonner` for toast notifications
- Use extensionless imports (e.g., `import { Button } from '@/components/ui/button'`)
- Follow DI pattern in backend
- Use View Transitions API for page-level transitions

### DO NOT
- Create custom CSS classes - use Tailwind utilities
- Use `100vh` - use `--app-dvh` or `h-screen`
- Create new color values - use shadcn CSS variables
- Use `framer-motion` - use `motion` package instead
- Bypass service layer in controllers
- Use `.js` extension in imports - use extensionless
- Add inline styles - use Tailwind classes

## Component Patterns

### Status Badges
```jsx
<Badge variant="live">LIVE</Badge>
<Badge variant="dead">DEAD</Badge>
<Badge variant="outline">Default</Badge>
```

### Responsive Layout
```jsx
const { isMobile } = useBreakpoint();
// Use Sheet for mobile, inline panel for desktop
```

### Animations
```jsx
import { motion } from 'motion/react';
import { variants, transition, spring } from '@/lib/motion';

<motion.div {...variants.fadeIn} transition={transition.fast}>
```

### Toast Notifications
```jsx
import { useToast } from '@/hooks/useToast';
const { success, error, info, warning } = useToast();
success('Operation completed');
```

### Theme Toggle with Circular Reveal
```jsx
// Uses View Transitions API for smooth page transition
document.startViewTransition(() => {
  toggleTheme();
});
```

### Card Variants (CVA)
```jsx
import { cardVariants } from '@/lib/styles/card-variants';

<Card className={cardVariants({ variant: 'glass', status: 'live', interactive: true })}>
```

### Glass Effects (Dark Mode)
```jsx
// Use OPUX glass classes
<div className="opux-glass">        {/* Standard glass */}
<div className="opux-glass-elevated"> {/* Elevated glass */}
<div className="opux-glass-subtle">   {/* Subtle glass */}
```

### Background Layers
```jsx
// AppBackground handles all layers automatically
<AppBackground />
// Layers: tile → grainy → landscape → vignette
```
