# WARP.md

## Overview
Stripe card validation tool: React + Vite frontend (port 4000), Node.js + Express backend (port 5001).
UI built with **shadcn/ui** + Tailwind CSS, animations via **motion** package.

**Design System**: Dual-theme - Vintage Banking (light mode) + Liquid Aurora glass (dark mode).

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
- **Theme**: CSS variables (shadcn), dual-theme support (Vintage Banking light / Liquid Aurora dark)
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
- **AppBackground** - Layered background with animated aurora blobs + floating particles

## Design Tokens

### Light Mode (Vintage Banking)
- **Background**: Cream parchment `hsl(40,50%,97%)` → `hsl(35,40%,93%)`
- **Primary**: Copper foil `hsl(25,65%,50%)`
- **Text**: Sepia ink `hsl(25,40%,25%)` with embossed shadows
- **Border**: Double-rule certificate `hsl(30,35%,75%)`
- **Cards**: Certificate borders with inset shadows
- **Icons**: Wax seal styling with copper coin shadows
- **Texture**: Paper grain SVG noise at 3-4% opacity

### Dark Mode (Liquid Aurora)
- **Background**: `hsl(220 18% 7%)` (deep cosmic blue) with tile pattern
- **Primary**: `hsl(250 90% 65%)` (electric indigo)
- **Aurora Colors**: Indigo (#8b5cf6), Cyan (#22d3ee), Pink (#ec4899)
- **Glass**: `backdrop-blur-[40-60px]` + `backdrop-saturate-[180-200%]`
- **Specular**: `inset_0_1px_0_rgba(255,255,255,0.08)` (top edge highlight)
- **Card shadow**: Aurora multi-glow `shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_60px_-20px_rgba(139,92,246,0.15)]`
- **Accent bar**: Prismatic gradient `from-[#8b5cf6] via-[#22d3ee] to-[#ec4899]`

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
- Add `dark:[text-shadow:none]` when adding light mode text shadows
- Use `hsl()` values in warm 25-40 hue range for vintage feel
- Use `bg-gradient-to-b` with from/via/to for metallic copper effects

### DO NOT
- Create custom CSS classes - use Tailwind utilities
- Use `100vh` - use `--app-dvh`
- Create new color values - use shadcn CSS variables
- Use `framer-motion` - use `motion` package
- Bypass the service layer in controllers
- Use `.js` extension in imports
- Forget to preserve dark mode styles when enhancing light mode
- Forget `dark:bg-none` when overriding light mode gradients in dark mode

### Critical: Gradient Reset Pattern
When light mode uses `bg-gradient-to-*` and dark mode needs a solid color or different gradient:
```jsx
// ❌ WRONG - gradient shows through (background-image > background-color)
className="bg-gradient-to-b from-cream to-paper dark:bg-[rgba(15,18,25,0.92)]"

// ✅ CORRECT - reset gradient first, then set color
className="bg-gradient-to-b from-cream to-paper dark:bg-none dark:bg-[rgba(15,18,25,0.92)]"

// ✅ CORRECT - gradient to gradient
className="bg-gradient-to-b from-X to-Y dark:bg-none dark:bg-gradient-to-b dark:from-A dark:to-B"
```
The `dark:bg-none` sets `background-image: none` so `background-color` takes effect.
This is required because CSS specificity: `background-image` > `background-color`.

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
/* Liquid glass utility classes */
.liquid-glass           /* Base 40px blur glass */
.liquid-glass-elevated  /* Premium 60px blur glass */
.liquid-glass-frosted   /* Frosted 80px blur glass */
.liquid-glass-aurora    /* Glass with indigo aurora tint */

/* Premium card variants */
.prismatic-card    /* Animated color-shifting border */
.cosmic-card       /* Star-field with aurora nebulae */
.depth-card        /* Multi-layer 3D depth */
.frosted-panel     /* Ultra-premium frosted glass */

/* Interactive effects */
.aurora-reveal     /* Radial aurora on hover */
.glass-shimmer     /* Auto shimmer overlay */
.specular-sweep    /* Light sweep on hover */
.glow-button       /* Aurora glow behind button */

/* Neon status glows */
.neon-breathe-emerald  /* Green breathing glow */
.neon-breathe-cyan     /* Cyan breathing glow */
.neon-breathe-pink     /* Pink breathing glow */
.neon-breathe-amber    /* Amber breathing glow */

/* Aurora utilities */
.aurora-glow-indigo   /* Indigo glow shadow */
.aurora-glow-cyan     /* Cyan glow shadow */
.aurora-glow-pink     /* Pink glow shadow */
.aurora-glow-multi    /* Multi-color aurora */
.holo-badge           /* Holographic shimmer badge */
.aurora-trace         /* Animated border trace */
```

### Vintage Banking patterns (light mode)
```jsx
/* Certificate card with double-rule border */
<div className={cn(
  "bg-gradient-to-b from-[hsl(40,50%,97%)] via-[hsl(38,45%,95%)] to-[hsl(35,40%,93%)]",
  "border-2 border-[hsl(30,35%,75%)]",
  "shadow-[inset_0_0_0_3px_hsl(38,45%,96%),inset_0_0_0_4px_hsl(30,30%,80%)]"
)}>

/* Embossed text (add dark:[text-shadow:none]) */
<h3 className="text-[hsl(25,40%,25%)] [text-shadow:0_1px_0_rgba(255,255,255,0.5)] dark:[text-shadow:none]">

/* Wax seal icon container */
<div className={cn(
  "bg-gradient-to-br from-[hsl(25,65%,50%)] via-[hsl(30,70%,48%)] to-[hsl(25,60%,42%)]",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_6px_rgba(101,67,33,0.25)]"
)}>

/* Corner ornaments (L-shaped borders) */
<div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-[hsl(25,60%,55%)]/50 rounded-tl-sm dark:hidden" />
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

