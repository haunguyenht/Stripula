# WARP.md

## Overview
Stripe card validation tool: React + Vite frontend (port 4000), Node.js + Express backend (port 5001).
UI built with **shadcn/ui** + Tailwind CSS, animations via **motion** package.

**Design System**: Dual-theme - OrangeAI (light mode) + OPUX glass (dark mode).

## Commands
```bash
# Dev
cd backend && npm run dev
cd frontend && npm run dev

# Build
cd frontend && npm run build

# Test & Lint
cd frontend && npm run test
cd frontend && npm run lint

# Add shadcn component
cd frontend && npx shadcn@latest add [component-name]
```

## Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **UI Library**: shadcn/ui (New York preset)
- **Styling**: Tailwind CSS with shadcn CSS variables + CVA
- **Animations**: motion (from motion.dev) + View Transitions API
- **Toasts**: sonner
- **State**: React hooks + localStorage persistence
- **File Extensions**: `.jsx` for components

### Backend
- **Runtime**: Node.js + Express
- **Pattern**: Dependency injection container
- **HTTP Client**: axios + axios-cookiejar-support + tough-cookie (session handling)
- **Auth Validation**: WooCommerce registration flow (no SK key needed, only PK)

## Architecture

### Backend
- **Pattern**: Dependency injection via container in `server.js`
- **Structure**: Controllers → Services → Validators (Strategy pattern) → Domain → Infrastructure
- **Key files**: `ValidationFacade` (orchestration), `ValidatorFactory` (creates validators)

### Frontend
- **Layout**: `TwoPanelLayout` - config left, results right; Sheet drawer on mobile
- **Styling**: Tailwind CSS with shadcn tokens, CVA for variants, `cn()` for class merging
- **Theme**: CSS variables (shadcn), dual-theme support (OrangeAI light / OPUX dark)
- **Responsive**: `useBreakpoint()` hook, mobile breakpoint < 768px
- **Background**: Layered system with tile, grainy texture, landscape (dark mode)

## Key Directories
```
frontend/src/
├── components/
│   ├── ui/               # shadcn components (Button, Card, Badge, etc.)
│   │   ├── theme-toggle.jsx   # Animated toggle with circular reveal
│   │   ├── result-card.jsx    # Validation result cards
│   │   └── ...
│   ├── layout/           # AppLayout, TwoPanelLayout
│   │   └── panels/       # PanelCard, ResultsPanelSections
│   ├── navigation/       # TopTabBar + sub-components
│   │   ├── components/   # NavPill, ActionsPill, NavDropdown, UserPill
│   │   ├── config/       # nav-items.js, tier-config.js
│   │   └── hooks/        # useResponsiveNav
│   ├── background/       # AppBackground (OPUX layers)
│   └── stripe/           # Stripe panels (Keys, Cards validation)
├── hooks/                # useBreakpoint, useLocalStorage, useToast, etc.
├── contexts/             # ThemeContext (light/dark mode)
├── lib/
│   ├── utils.js          # cn() utility
│   ├── motion.js         # Animation helpers
│   ├── styles/           # card-variants.js (CVA)
│   ├── tokens/           # shadows.js
│   └── utils/            # card-helpers.js
└── index.css             # Tailwind + shadcn CSS variables + OPUX glass system
```

## shadcn/ui Components Used
- Button, Input, Textarea, Label
- Card, CardHeader, CardContent, CardFooter
- Badge (with custom variants: live, dead, success)
- Tabs, TabsList, TabsTrigger
- Select, SelectTrigger, SelectContent, SelectItem
- DropdownMenu, DropdownMenuItem
- Sheet, SheetContent, SheetHeader (mobile drawer)
- ScrollArea, Separator, Tooltip
- Slider, Switch

## Custom Components
- **ThemeToggle** - Icon morphing animation + circular reveal page transition
- **ResultCard** - Card validation result with status indicators
- **StatPill** - Statistics display pill
- **VirtualList** - Virtualized list for performance
- **NavPill** - Glass navigation pill (OPUX style)
- **ActionsPill** - Credits, theme toggle, profile section
- **AppBackground** - Layered background (tile → grainy → landscape → vignette)

## Design Tokens

### Light Mode (OrangeAI)
- Background: `#ffffff`
- Primary: `rgb(255, 64, 23)` (vibrant orange)
- Border: `rgb(237, 234, 233)`
- Card shadow: `0 10px 30px rgba(0,0,0,0.1)`

### Dark Mode (OPUX)
- Background: `hsl(201 44% 14%)` with tile pattern
- Primary: `hsl(3 26% 55%)` (terracotta)
- Glass: Blur + noise texture overlay
- Card shadow: `0 8px 32px #0000005e` with inner glow

## Agent Rules

### DO
- Use shadcn/ui components from `@/components/ui/`
- Use Tailwind CSS classes
- Use `cn()` from `@/lib/utils` for merging classes
- Use CVA for component variants (`@/lib/styles/card-variants`)
- Use `useBreakpoint()` hook for responsive logic
- Use `--app-dvh` CSS variable for viewport height
- Use `Sheet` for mobile slide-in panels
- Use `motion` from `motion/react` for animations
- Use `sonner` for toast notifications
- Use extensionless imports
- Follow DI pattern - inject dependencies via constructor
- Add new validators via `ValidatorFactory`
- Use View Transitions API for page-level theme transitions

### DO NOT
- Create custom CSS classes - use Tailwind utilities
- Use `100vh` - use `--app-dvh`
- Create new color values - use shadcn CSS variables
- Use `framer-motion` - use `motion` package
- Bypass the service layer in controllers
- Use `.js` extension in imports

## Auth Validation Architecture

### Flow (No SK Key Required - Only PK)
```
┌─────────────────────────────────────────────────────────────────────────┐
│                           AuthValidator                                  │
│                                                                         │
│  For each card:                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 1. WooCommerceClient.registerAndGetNonces()                      │  │
│  │    ├── GET /my-account/ → extract register nonce                 │  │
│  │    ├── POST /my-account/ → submit registration                   │  │
│  │    │   (first_name, last_name, email@outlook.com, password)      │  │
│  │    ├── GET /my-account/add-payment-method/ → extract nonces      │  │
│  │    │   (setupIntentNonce, ajaxNonce)                             │  │
│  │    └── Return: { session, nonces, fingerprint }                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              ↓                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 2. StripePaymentMethodClient.createPaymentMethod()               │  │
│  │    ├── POST api.stripe.com/v1/payment_methods                    │  │
│  │    │   (card[number], card[exp_month], card[exp_year], card[cvc])│  │
│  │    └── Return: { pmId: "pm_xxx" }                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              ↓                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 3. WooCommerceClient.submitSetupIntent()                         │  │
│  │    ├── POST /wp-admin/admin-ajax.php                             │  │
│  │    │   action=wc_stripe_create_and_confirm_setup_intent          │  │
│  │    │   wc-stripe-payment-method=pm_xxx                           │  │
│  │    │   _ajax_nonce=xxx                                           │  │
│  │    └── Return: { success, data: { status, error } }              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              ↓                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 4. AuthResult.fromWooCommerceResponse()                          │  │
│  │    ├── success + status=succeeded → APPROVED                     │  │
│  │    ├── error.message → DECLINED (with decline code)              │  │
│  │    └── Parse decline patterns (insufficient_funds, etc.)         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Layer Structure
```
backend/src/
├── validators/
│   └── AuthValidator.js        # Orchestrates the 4-step flow above
├── infrastructure/auth/
│   ├── WooCommerceClient.js    # Registration, nonce extraction, SetupIntent
│   └── StripePaymentMethodClient.js  # Creates PM via Stripe API
├── domain/
│   └── AuthResult.js           # Result entity with status parsing
├── services/
│   └── StripeAuthService.js    # Batch processing with EventEmitter
└── utils/
    └── constants.js            # AUTH_SITES configuration
```

### Cookie/Session Handling
```javascript
// Uses axios-cookiejar-support for automatic cookie management
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true }));
// All subsequent requests automatically send/receive cookies
```

### Rate Limiting (CRITICAL)
- **Fresh session per card** - WooCommerce rate-limits "too soon" on ANY PM attempt
- Rate limit is per-attempt, NOT per successful PM add - even declined cards trigger it
- Deleting PM does NOT reset cooldown - don't waste time implementing this
- Session pooling does NOT work - tried and failed

## Backend Agent Rules

### DO
- Create fresh registration per card for auth validation
- Use `axios-cookiejar-support` + `tough-cookie` for automatic cookie handling
- Use random emails: outlook.com, yahoo.com, hotmail.com, protonmail.com, icloud.com
- Use `first_name`, `last_name` for WooCommerce registration fields
- Handle HTTP 400 as valid response (Stripe decline info comes in 400s)
- Return full card number in `card` field

### DO NOT
- Reuse WooCommerce sessions between cards
- Use gmail.com emails (blocked by sites)
- Use `billing_first_name` (wrong field name)
- Add console.log in production code
- Return masked `cardNumber` field (removed)

### Auth Result Enhancement
- Include `binData` for approved cards via `binLookupClient.lookup()`
- BIN data includes: scheme, type, category, country, countryEmoji, bank

## Common Patterns

### Adding a new shadcn component
```bash
npx shadcn@latest add [component-name]
```

### Using animations
```jsx
import { motion } from 'motion/react';
import { variants, transition, spring } from '@/lib/motion';

<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={transition.opux}
>
```

### Toast notifications
```jsx
import { useToast } from '@/hooks/useToast';
const { success, error, info, warning } = useToast();
```

### Responsive design
```jsx
import { useBreakpoint } from '@/hooks/useMediaQuery';
const { isMobile, isTablet, isDesktop } = useBreakpoint();
```

### Theme toggle with circular reveal
```jsx
// The ThemeToggle component handles this automatically
// Uses View Transitions API for smooth page transition
<ThemeToggle />
```

### Card variants (CVA)
```jsx
import { cardVariants } from '@/lib/styles/card-variants';

<Card className={cardVariants({ 
  variant: 'glass',      // default, elevated, result, flat, panel, glass
  status: 'live',        // none, live, dead, approved, error
  interactive: true 
})}>
```

### Glass effects (dark mode)
```css
/* Available utility classes */
.opux-glass           /* Standard glass */
.opux-glass-elevated  /* Elevated glass */
.opux-glass-subtle    /* Subtle glass */
.opux-glass-ultra-tight /* Minimal blur */
```

### Navigation structure
```jsx
// Navigation items defined in src/components/navigation/config/nav-items.js
// Supports dropdowns, coming soon badges, and icons
```

## Animation Presets (lib/motion.js)

### Durations
- `instant`: 0.1s
- `fast`: 0.15s
- `normal`: 0.2s
- `slow`: 0.3s
- `softEnter`: 0.25s

### Springs
- `spring.default` - Standard spring
- `spring.gentle` - Soft, no bounce
- `spring.soft` - OPUX smooth

### Variants
- `variants.fadeIn` - Fade in/out
- `variants.scaleIn` - Scale and fade
- `variants.softEnter` - OPUX card enter
- `variants.liquidHover` - Glass hover effect

### Transitions
- `transition.default` - Standard
- `transition.opux` - Smooth OPUX style
- `transition.soft` - Gentle easing

## Frontend Notes

### Auth Panel Persistence
- Uses `useLocalStorage` for: cards, results (max 500), stats, concurrency, site
- Stats accumulate - new batches add to existing counts
- Clear button resets both results and stats

### Panel Shadow Consistency
- Both panels use `PanelCard variant="elevated"` 
- Don't use `overflow-auto` on panel wrappers (clips shadows)
- Use `pb-6` on wrappers for bottom shadow space

### Celebration Animation
- CSS in `index.css` (firework-container, confetti, sparkle, ring-explosion)
- Triggers on APPROVED status with 2s throttle
- Uses `createPortal` to render at document.body level

