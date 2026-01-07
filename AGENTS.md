# AGENTS.md

## Overview
Stripe card validation tool: React + Vite frontend, Node.js + Express backend.
Fully migrated to **shadcn/ui** with Tailwind CSS and **motion** for animations.

**Design System**: Dual-theme with Vintage Banking (light) and Liquid Aurora (dark) aesthetics.

## Architecture

### Backend
- **Pattern**: DI container in `server.js`
- **Flow**: Controllers → Services → Validators (Strategy) → Domain → Infrastructure
- **Key**: `ValidationFacade` orchestrates validation, `ValidatorFactory` creates validators

### Backend Layer Structure
```
backend/src/
├── controllers/     # HTTP handlers, route binding
│   ├── AuthController.js     # Telegram SSO endpoints
│   ├── CreditController.js   # Credit operations
│   ├── AdminController.js    # Admin management
│   └── GatewayController.js  # Gateway management API
├── services/        # Business logic, orchestration, batch processing
│   ├── TelegramAuthService.js    # Telegram SSO validation
│   ├── TelegramBotService.js     # Telegram Bot notifications (approved cards, live SK)
│   ├── CreditManagerService.js   # Credit operations & anti-cheat
│   ├── GatewayManagerService.js  # Central gateway state management
│   ├── SpeedConfigService.js     # Speed config CRUD
│   ├── SpeedManager.js           # Speed executor factory
│   ├── SpeedExecutor.js          # Batch execution with limits
│   ├── RedeemKeyService.js       # Key generation/redemption
│   └── AdminService.js           # User management
├── validators/      # Validation strategies (ChargeValidator, AuthValidator, etc.)
├── domain/          # Entities (Card, AuthResult, ValidationResult, StripeKeys)
│   ├── GatewayState.js   # Gateway state entity
│   └── HealthMetrics.js  # Health tracking entity
├── infrastructure/  # External clients (Stripe API, WooCommerce)
│   ├── auth/        # WooCommerceClient, StripePaymentMethodClient
│   ├── browser/     # Browser utilities (retry, config, proxy-health)
│   ├── database/    # Migrations
│   ├── http/        # ProxyAgentFactory, RetryHandler, ErrorHandler
│   └── stripe/      # StripeAPIClient
├── middleware/      # Express middleware
│   ├── AuthMiddleware.js     # JWT validation
│   ├── CreditMiddleware.js   # Balance check & locks
│   ├── AdminMiddleware.js    # Admin role check
│   └── RateLimitMiddleware.js # Abuse prevention
└── utils/           # Constants, helpers
```

### Adding New Validation Methods
1. **Domain**: Create result entity in `domain/` (e.g., `AuthResult.js`)
2. **Infrastructure**: Create external clients in `infrastructure/` subfolder
3. **Validator**: Create validator in `validators/` extending pattern from `BaseValidator`
4. **Service**: Create service in `services/` for batch processing with EventEmitter
5. **Controller**: Create controller in `controllers/` with `getRoutes()` method
6. **Wire up**: Register in `server.js` DI container and add routes
7. **Config**: Add constants/configs to `utils/constants.js`

## Auth Validation Strategy

### Architecture
```
AuthValidator → WooCommerceClient (registration + nonces)
             → StripePaymentMethodClient (PM creation via Stripe API)
             → WooCommerceClient.submitSetupIntent (AJAX validation)
```

### Site Configuration (constants.js)
```javascript
{
  id: 'auth-1',
  label: 'Auth 1',
  name: 'sitename',
  baseUrl: 'https://example.com',
  accountUrl: 'https://example.com/my-account/',
  paymentMethodUrl: 'https://example.com/my-account/add-payment-method/',
  ajaxUrl: 'https://example.com/wp-admin/admin-ajax.php',
  pkKey: 'pk_live_xxx',
  patterns: {
    registerNonce: /name="woocommerce-register-nonce"[^>]*value="([^"]+)"/,
    setupIntentNonce: /"create_and_confirm_setup_intent_nonce":"([^"]+)"/,
    ajaxNonce: /"ajax_nonce":"([^"]+)"/,
    ajaxUrl: /"ajax_url":"([^"]+)"/
  },
  actions: { setupIntent: 'wc_stripe_create_and_confirm_setup_intent' }
}
```

### Frontend
- **UI Framework**: shadcn/ui (New York preset) with Radix UI primitives
- **Styling**: Tailwind CSS with shadcn CSS variables + CVA (class-variance-authority)
- **Animations**: `motion` package (from motion.dev) + View Transitions API
- **Layout**: `TwoPanelLayout` - config panel left, results right; Sheet drawer on mobile
- **Responsive**: `useBreakpoint()` hook, mobile < 768px
- **File Extensions**: `.jsx` for components, extensionless imports
- **Path Alias**: `@/` maps to `src/`

## Design System

### Light Mode (Vintage Banking / Cream Paper + Copper Foil)
- **Background**: Cream parchment gradient `hsl(40,50%,97%)` → `hsl(35,40%,93%)`
- **Primary**: Copper foil `hsl(25,65%,50%)` with metallic gradients
- **Text**: Sepia ink `hsl(25,40%,25%)` with embossed shadows
- **Cards**: Double-rule certificate borders with inset shadows
- **Borders**: Engraved double-line `border-2` + `shadow-[inset_0_0_0_3px,inset_0_0_0_4px]`
- **Icons**: Wax seal styling with copper coin shadows
- **Badges**: Treasury seal effects with gradient backgrounds
- **Accents**: Corner ornaments (L-shaped borders on cards/dialogs)
- **Texture**: Paper grain SVG noise overlay at 3-4% opacity

#### Key Light Mode Patterns
```css
/* Embossed text shadow */
[text-shadow:0_1px_0_rgba(255,255,255,0.5),0_-1px_0_rgba(101,67,33,0.15)]

/* Certificate double-rule border */
border-2 border-[hsl(30,35%,75%)]
shadow-[inset_0_0_0_3px_hsl(38,45%,96%),inset_0_0_0_4px_hsl(30,30%,80%)]

/* Wax seal icon container */
shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(101,67,33,0.1),0_2px_6px_rgba(101,67,33,0.15)]

/* Copper foil gradient */
bg-gradient-to-b from-[hsl(25,65%,50%)] via-[hsl(30,70%,48%)] to-[hsl(25,60%,42%)]

/* Paper grain texture */
url("data:image/svg+xml,...feTurbulence type='fractalNoise' baseFrequency='0.85'...")
```

### Dark Mode (Liquid Aurora Glass)
- **Background**: Deep cosmic blue `hsl(220 18% 7%)` with tile pattern
- **Primary**: Electric indigo `hsl(250 90% 65%)` with aurora accents
- **Aurora Palette**: Indigo (#8b5cf6), Cyan (#22d3ee), Pink (#ec4899)
- **Cards**: Liquid glass morphism with `backdrop-blur-[40-60px]` + `backdrop-saturate-[180-200%]`
- **Borders**: Aurora-tinted `rgba(139,92,246,0.15-0.25)` glass edges
- **Shadows**: Multi-layered aurora glow with indigo/cyan/pink accents
- **Specular**: Top edge highlight `inset_0_1px_0_rgba(255,255,255,0.08-0.12)`
- **Accents**: Prismatic aurora gradients (indigo → cyan → pink)
- **Decorative**: Animated aurora blobs + floating particles + grainy texture

#### Key Dark Mode Patterns
```css
/* Liquid glass base (use dark:bg-none before bg color to reset gradients) */
dark:bg-none dark:bg-[rgba(15,18,25,0.92)]
dark:backdrop-blur-[40px] dark:backdrop-saturate-[180%]
dark:border-[rgba(139,92,246,0.2)]

/* Aurora multi-glow shadow */
dark:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_60px_-20px_rgba(139,92,246,0.15),0_0_40px_-15px_rgba(34,211,238,0.1),inset_0_1px_0_rgba(255,255,255,0.08)]

/* Prismatic aurora accent bar */
dark:from-[#8b5cf6] dark:via-[#22d3ee] dark:to-[#ec4899]

/* Specular edge highlight */
bg-gradient-to-r from-transparent via-white/[0.12] to-transparent
```

#### Premium Liquid Aurora CSS Classes (dark mode only)
- `.prismatic-card` - Animated color-shifting prismatic border
- `.cosmic-card` - Star-field effect with aurora nebulae
- `.depth-card` - Multi-layer 3D depth with aurora ambient on hover
- `.frosted-panel` - Ultra-premium 80px blur frosted glass
- `.holo-badge` - Holographic shimmer with rainbow aurora colors
- `.aurora-reveal` - Radial aurora gradient that expands on hover
- `.aurora-trace` - Animated border that traces around the element
- `.glow-button` - Interactive aurora glow behind buttons on hover
- `.glass-shimmer` - Auto-shimmer overlay animation
- `.specular-sweep` - Light sweep animation on hover
- `.neon-breathe-{emerald|cyan|pink|amber}` - Animated breathing neon glow

#### Aurora Utility Classes
```css
/* Glow effects */
.aurora-glow-indigo   /* Indigo glow shadow */
.aurora-glow-cyan     /* Cyan glow shadow */
.aurora-glow-pink     /* Pink glow shadow */
.aurora-glow-multi    /* Multi-color aurora glow */

/* Neon status indicators */
.neon-glow-emerald    /* Emerald neon for success */
.neon-glow-rose       /* Rose neon for error */
.neon-glow-amber      /* Amber neon for warning */

/* Text effects */
.text-aurora-holographic  /* Animated holographic text */
.text-aurora-gradient     /* Static aurora gradient text */

/* Interactive */
.aurora-underline     /* Hover-reveal aurora underline */
.aurora-ring          /* Hover-reveal gradient ring */
.aurora-dot           /* Glowing aurora indicator */
```

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
- `src/hooks/useSessionStorage.js` - Session-scoped state
- `src/hooks/useToast.js` - Toast notifications wrapper
- `src/hooks/useTheme.js` - Theme context consumer
- `src/hooks/useKeyFilters.js` - Key validation filters
- `src/hooks/useCardFilters.js` - Card validation filters
- `src/hooks/useGatewayStatus.js` - Real-time gateway status via SSE
- `src/hooks/useGatewayAdmin.js` - Admin gateway management operations
- `src/hooks/useAuth.js` - Authentication state and Telegram SSO
- `src/hooks/useCredits.js` - Credit balance, tracking, and consumption

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
- Add `dark:[text-shadow:none]` when adding light mode text shadows
- Use `hsl()` values in the warm 25-40 hue range for vintage feel
- Use `bg-gradient-to-b` with from/via/to for metallic copper effects

### DO NOT
- Create custom CSS classes - use Tailwind utilities
- Use `100vh` - use `--app-dvh` or `h-screen`
- Create new color values - use shadcn CSS variables
- Use `framer-motion` - use `motion` package instead
- Bypass service layer in controllers
- Use `.js` extension in imports - use extensionless
- Add inline styles - use Tailwind classes
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

## Backend Agent Rules

### DO
- Create fresh WooCommerce session per card for auth validation
- Use `axios-cookiejar-support` + `tough-cookie` for automatic cookie handling
- Use random email domains (outlook, yahoo, hotmail, protonmail, icloud) - NOT gmail
- Extract nonces from page HTML using regex patterns
- Return full card in `card` field (not masked)
- Use EventEmitter pattern in services for streaming results
- Fetch BIN data for approved cards via `binLookupClient.lookup()` and include in result

### DO NOT
- Use gmail.com for registration (blocked by sites)
- Add console.log statements in production code
- Return masked card numbers (cardNumber field removed)

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

## Frontend Panel Notes

### Auth Panel (StripeAuthPanel)
- Uses `useLocalStorage` for persistence: `stripeAuthCards`, `stripeAuthResults`, `stripeAuthStats`
- Stats accumulate across sessions - don't reset on new batch
- Celebration animation triggers on APPROVED (2s throttle)
- Status mapping: APPROVED → green border/badge, DECLINED → red border/badge
- BIN data shown inline for approved cards only (brand icon, type, country, bank)
- User-friendly messages via `formatAuthMessage()` helper

### Shadow/Layout Consistency
- Both panels use `PanelCard variant="elevated"` for consistent shadows
- Never use `overflow-auto` on panel wrappers - clips shadows
- Add `pb-6` padding to panel wrappers for bottom shadow space
- Card content uses `overflow-hidden` to clip to rounded corners

### Background Layers
```jsx
// AppBackground handles all layers automatically
<AppBackground />
// Layers: tile → grainy → landscape → vignette
```

## Gateway Management System

### Overview
Central gateway management with real-time maintenance mode, health monitoring, and SSE-based status updates.

### Architecture
```
GatewayManagerService (central registry)
├── Registry: Map<gateway_id, GatewayState>
├── HealthMetrics: Map<gateway_id, HealthMetrics>
├── SSE Clients: Set<Response>
└── EventEmitter for state changes

GatewayController (REST API)
├── GET /api/gateways - List all gateways
├── GET /api/gateways/status/stream - SSE endpoint
├── PUT /api/admin/gateways/:id/state - Update state
├── POST /api/admin/gateways/:id/maintenance - Enable maintenance
└── DELETE /api/admin/gateways/:id/maintenance - Disable maintenance
```

### Key Files
- `backend/src/services/GatewayManagerService.js` - Central gateway management
- `backend/src/services/GatewayConfigService.js` - Credit rate and pricing management
- `backend/src/controllers/GatewayController.js` - REST API endpoints
- `backend/src/domain/GatewayState.js` - Gateway state entity with parentType/subType
- `backend/src/domain/HealthMetrics.js` - Health tracking entity
- `backend/src/utils/constants.js` - Gateway definitions and `getGatewayTypeInfo()` helper
- `frontend/src/hooks/useGatewayStatus.js` - SSE hook for real-time updates
- `frontend/src/hooks/useGatewayAdmin.js` - Admin management hook
- `frontend/src/hooks/useGatewayCreditRates.js` - Credit rates with type hierarchy methods
- `frontend/src/components/ui/GatewayStatusIndicator.jsx` - Status display component
- `frontend/src/components/admin/AdminGatewayManagement.jsx` - Admin panel with type grouping
- `frontend/src/components/credits/EffectiveRateDisplay.jsx` - Pricing range display

### Type Hierarchy Helper
```javascript
// backend/src/utils/constants.js
import { getGatewayTypeInfo } from './constants.js';

const typeInfo = getGatewayTypeInfo('auth-1');
// Returns: { parentType: 'stripe', subType: 'auth' }

const typeInfo = getGatewayTypeInfo('shopify-1');
// Returns: { parentType: 'shopify', subType: null }
```

### Gateway States
- `enabled` - Gateway is operational and accepting requests
- `maintenance` - Gateway temporarily disabled with optional reason
- `disabled` - Gateway fully disabled

### Health Statuses
- `online` - Gateway responding normally
- `degraded` - Error rate > 50% over last 10 requests
- `offline` - 5+ consecutive failures

### Adding a New Gateway

**Step 1: Add to constants.js**
```javascript
// For Auth gateways (Stripe → auth subType)
export const AUTH_SITES = {
    AUTH_4: {
        id: 'auth-4',           // Must follow 'auth-N' pattern
        label: 'Gateway D',     // Display name
        type: 'woocommerce',    // Gateway type
        baseUrl: 'https://example.com',
        // ... other config
    },
};

// For Charge gateways (Stripe → charge subType)
export const CHARGE_SITES = {
    CHARGE_4: {
        id: 'charge-4',         // Must follow 'charge-N' pattern
        label: 'Gateway 4',
        type: 'remember-org',
        // ... config
    },
};

// For Shopify gateways (Shopify parent, no subType)
export const SHOPIFY_SITES = {
    SHOPIFY_4: {
        id: 'shopify-4',        // Must follow 'shopify-N' pattern
        label: 'Shopify 4',
        prodUrl: 'https://example.com/products/item',
    },
};
```

**Step 2: Auto-registration**
GatewayManagerService automatically registers gateways from constants on startup via `_populateDefaultGateways()`. The gateway ID prefix determines its type hierarchy:
- `auth-*` → parentType: 'stripe', subType: 'auth'
- `charge-*` → parentType: 'stripe', subType: 'charge'
- `shopify-*` → parentType: 'shopify', subType: null

**Step 3: Pricing Configuration**
New gateways inherit default pricing from their type. Customize via admin panel or database:
```sql
-- Default pricing is set in migration 014_populate_gateway_configs.sql
-- Admins can adjust via /api/admin/gateways/:id/credit-rate
```

**Step 4: Database Updates (Required for changes)**
When adding, removing, or renaming gateways, update the database:
```sql
-- Remove old/renamed gateway entries
DELETE FROM gateway_states WHERE gateway_id = 'old-gateway-id';
DELETE FROM gateway_configs WHERE gateway_id = 'old-gateway-id';
DELETE FROM gateway_speed_configs WHERE gateway_id = 'old-gateway-id';

-- Add new gateways (or let auto-registration handle it on server restart)
INSERT INTO gateway_states (gateway_id, gateway_type, gateway_label, state, health_status, parent_type, sub_type)
VALUES ('shopify-4', 'shopify', 'Shopify 4$', 'enabled', 'online', 'shopify', NULL)
ON CONFLICT (gateway_id) DO NOTHING;

-- Note: gateway_configs table was simplified - use only these columns:
-- gateway_id, gateway_name, description, parent_type, sub_type, pricing_approved, pricing_live
-- DO NOT use: base_credit_rate, pricing_approved_min/max, pricing_live_min/max (these were dropped)
INSERT INTO gateway_configs (gateway_id, gateway_name, description, parent_type, sub_type, pricing_approved, pricing_live)
VALUES ('shopify-4', 'Shopify 4$', 'Shopify checkout validation', 'shopify', NULL, 5.0, 3.0)
ON CONFLICT (gateway_id) DO NOTHING;
```

**Step 5: Frontend Updates (for gateway type changes)**
If changing gateway type (e.g., Auth → Charge):
1. Update `nav-items.js` - menu structure
2. Update `AppLayout.jsx` - panel routing and imports
3. Rename panel component file and update exports
4. Update localStorage keys in the panel component
5. Update default gateway ID in panel state

**Step 6: Backend Updates (for gateway type changes)**
If renaming service/controller:
1. Rename service file (e.g., `ShopifyAuthService.js` → `ShopifyChargeService.js`)
2. Rename controller file
3. Update class names inside files
4. Update exports in `services/index.js` and `controllers/index.js`
5. Update imports and instantiation in `server.js`
6. Update TelegramBotService label mapping

### Gateway Modification Checklist
When modifying gateways, verify all these files:
- [ ] `backend/src/utils/constants.js` - GATEWAY_IDS and *_SITES
- [ ] `backend/src/services/*Service.js` - service class
- [ ] `backend/src/controllers/*Controller.js` - controller class
- [ ] `backend/src/services/index.js` - service exports
- [ ] `backend/src/controllers/index.js` - controller exports
- [ ] `backend/src/server.js` - imports, instantiation, routes
- [ ] `backend/src/services/TelegramBotService.js` - notification labels
- [ ] `frontend/src/components/navigation/config/nav-items.js` - menu
- [ ] `frontend/src/components/layout/AppLayout.jsx` - panel routing
- [ ] `frontend/src/components/*/panels/*Panel.jsx` - panel component
- [ ] Database tables: gateway_states, gateway_configs, gateway_speed_configs

### Integrating Gateway Status in Services

Services should check gateway availability before processing:

```javascript
// In service constructor
constructor(options = {}) {
    this.gatewayManager = options.gatewayManager || null;
}

// In processBatch method
async processBatch(cards, options = {}) {
    const gatewayId = this.site?.id || 'auth-1';
    
    // Check gateway availability
    if (this.gatewayManager) {
        const isAvailable = this.gatewayManager.isAvailable(gatewayId);
        if (!isAvailable) {
            const reason = this.gatewayManager.getUnavailabilityReason(gatewayId);
            
            // Emit batchComplete to release locks
            this.emit('batchComplete', {
                results: [],
                stats: { approved: 0, declined: 0, errors: 0 },
                unavailable: true,
                unavailableReason: reason,
                gatewayId
            });
            
            return { unavailable: true, unavailableReason: reason };
        }
    }
    
    // Continue with processing...
}

// Record health metrics after each card
if (this.gatewayManager) {
    if (result.isApproved() || result.isDeclined()) {
        this.gatewayManager.recordSuccess(gatewayId, latencyMs);
    } else if (result.status === 'ERROR') {
        this.gatewayManager.recordFailure(gatewayId, result.message);
    }
}
```

### Frontend Gateway Status Integration

**Using the hook:**
```jsx
import { useGatewayStatus } from '@/hooks/useGatewayStatus';
import { GatewayStatusIndicator, GatewayUnavailableMessage } from '@/components/ui/GatewayStatusIndicator';

function MyPanel() {
    const { getGateway, getGatewaysByType, isAnyAvailable } = useGatewayStatus();
    
    const selectedGatewayStatus = getGateway(selectedSite);
    const allUnavailable = !isAnyAvailable('auth');
    
    return (
        <>
            {allUnavailable && <GatewayUnavailableMessage allUnavailable={true} />}
            
            {selectedGatewayStatus && !selectedGatewayStatus.isAvailable && (
                <GatewayUnavailableMessage gateway={selectedGatewayStatus} />
            )}
            
            <Select>
                <SelectContent>
                    {sites.map(site => {
                        const gatewayStatus = getGateway(site.id);
                        return (
                            <SelectItem key={site.id} value={site.id}>
                                <div className="flex items-center gap-2">
                                    {gatewayStatus && (
                                        <GatewayStatusIndicator
                                            state={gatewayStatus.state}
                                            healthStatus={gatewayStatus.healthStatus}
                                            size="sm"
                                        />
                                    )}
                                    <span>{site.label}</span>
                                </div>
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </>
    );
}
```

### Database Tables

```sql
-- gateway_states table
CREATE TABLE gateway_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway_id VARCHAR(50) NOT NULL UNIQUE,
    gateway_type VARCHAR(20) NOT NULL,
    gateway_label VARCHAR(100) NOT NULL,
    state VARCHAR(20) NOT NULL DEFAULT 'enabled',
    maintenance_reason TEXT,
    maintenance_started_at TIMESTAMPTZ,
    maintenance_scheduled_end TIMESTAMPTZ,
    health_status VARCHAR(20) DEFAULT 'online',
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metrics JSONB DEFAULT '{}'::jsonb,
    parent_type VARCHAR(20) DEFAULT 'stripe',  -- Type hierarchy: stripe, shopify
    sub_type VARCHAR(20) DEFAULT 'auth'        -- Sub type: auth, charge, skbased (null for shopify)
);

-- gateway_audit_logs table
CREATE TABLE gateway_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway_id VARCHAR(50) NOT NULL,
    old_state VARCHAR(20),
    new_state VARCHAR(20) NOT NULL,
    admin_id UUID REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Required Migrations
- **015_gateway_type_hierarchy.sql** - Adds `parent_type` and `sub_type` columns to both `gateway_configs` and `gateway_states` tables. Must be run if you see errors about missing `parent_type` column.

### Gateway Management DO
- Check `gatewayManager.isAvailable(gatewayId)` before processing batches
- Emit `batchComplete` event even when gateway unavailable (releases locks)
- Record success/failure metrics via `gatewayManager.recordSuccess/recordFailure`
- Use `useGatewayStatus` hook for real-time status in frontend
- Show `GatewayStatusIndicator` in gateway selectors
- Show `GatewayUnavailableMessage` when gateway unavailable

### Gateway Management DO NOT
- Skip availability check in services
- Forget to emit `batchComplete` when returning early
- Add duplicate status indicators (SelectValue already renders selected item content)
- Block UI when gateway unavailable - show message and allow switching

## Gateway Proxy Configuration

### Overview
Per-gateway proxy configuration allows administrators to configure proxy settings for each gateway individually through the admin panel. Includes failure classification for accurate health monitoring.

### Architecture
```
GatewayManagerService (extended)
├── getProxyConfig(gatewayId) - Retrieve proxy config
├── setProxyConfig(gatewayId, config) - Set proxy config
├── clearProxyConfig(gatewayId) - Remove proxy config
├── testProxyConnection(config) - Test proxy connectivity
└── recordFailure(gatewayId, error, category?) - Classified failure recording

HealthMetrics (extended)
├── failuresByCategory: { proxy_error, gateway_error, timeout, network_error }
├── recordFailure(errorType, category) - Category-aware failure recording
└── getFailureBreakdown() - Get failure counts by category

GatewayController (new endpoints)
├── GET /api/admin/gateways/:id/proxy - Get proxy config (masked password)
├── PUT /api/admin/gateways/:id/proxy - Set proxy config
├── DELETE /api/admin/gateways/:id/proxy - Clear proxy config
└── POST /api/admin/gateways/:id/proxy/test - Test proxy connection
```

### Key Files
- `backend/src/services/GatewayManagerService.js` - Proxy methods added
- `backend/src/domain/GatewayState.js` - proxyConfig field and methods
- `backend/src/domain/HealthMetrics.js` - failuresByCategory tracking
- `backend/src/utils/failureClassifier.js` - Error classification utility
- `backend/src/controllers/GatewayController.js` - Proxy API endpoints
- `frontend/src/components/admin/ProxyConfigForm.jsx` - Proxy config form
- `frontend/src/components/admin/ProxyTestButton.jsx` - Test connection button
- `frontend/src/components/admin/FailureBreakdown.jsx` - Failure category display
- `frontend/src/hooks/useGatewayAdmin.js` - Proxy management methods

### ProxyConfig Data Model
```javascript
interface ProxyConfig {
  host: string;           // Proxy hostname or IP
  port: number;           // Proxy port (1-65535)
  type: 'http' | 'https' | 'socks4' | 'socks5';
  username?: string;      // Optional auth username
  password?: string;      // Optional auth password
}
```

### Failure Categories
```javascript
const FAILURE_CATEGORIES = {
  proxy_error: 'Proxy connection or authentication failed',
  gateway_error: 'Gateway returned HTTP 5xx error',
  timeout: 'Request timed out (ETIMEDOUT)',
  network_error: 'Network connection failed (ECONNREFUSED, ENOTFOUND)'
};
```

### Failure Classification Logic
```javascript
import { classifyFailure } from './utils/failureClassifier.js';

// Auto-classifies errors based on error code/message/response
const category = classifyFailure(error);
// Returns: 'proxy_error' | 'gateway_error' | 'timeout' | 'network_error'

// Classification rules:
// - 407 status or 'proxy' in message → proxy_error
// - ETIMEDOUT or 'timeout' in message → timeout
// - 5xx status → gateway_error
// - ECONNREFUSED, ENOTFOUND, ENETUNREACH → network_error
// - Default → network_error
```

### Database Schema
```sql
-- Add proxy_config column to gateway_states table
ALTER TABLE gateway_states 
ADD COLUMN proxy_config JSONB DEFAULT NULL;
```

### Using Proxy Config in Services
```javascript
// In validation service processBatch method
async processBatch(cards, options = {}) {
    const gatewayId = this.site?.id || 'auth-1';
    
    // Get proxy config from gateway manager
    let proxyConfig = null;
    if (this.gatewayManager) {
        proxyConfig = this.gatewayManager.getProxyConfig(gatewayId);
    }
    
    // Pass proxy to validator
    const result = await this.validator.validate(card, {
        ...options,
        proxy: proxyConfig
    });
    
    // Record failure with classification
    if (result.status === 'ERROR' && this.gatewayManager) {
        this.gatewayManager.recordFailure(gatewayId, result.error);
        // Auto-classifies error into category
    }
}
```

### Frontend Proxy Config Integration
```jsx
import { useGatewayAdmin } from '@/hooks/useGatewayAdmin';
import { ProxyConfigForm } from '@/components/admin/ProxyConfigForm';
import { ProxyTestButton } from '@/components/admin/ProxyTestButton';
import { FailureBreakdown } from '@/components/admin/FailureBreakdown';

function GatewayProxySettings({ gatewayId }) {
    const { 
        getProxyConfig, 
        setProxyConfig, 
        clearProxyConfig, 
        testProxyConnection 
    } = useGatewayAdmin();
    
    const [config, setConfig] = useState(null);
    
    useEffect(() => {
        getProxyConfig(gatewayId).then(setConfig);
    }, [gatewayId]);
    
    const handleSave = async (newConfig) => {
        await setProxyConfig(gatewayId, newConfig);
        toast.success('Proxy configuration saved');
    };
    
    const handleClear = async () => {
        await clearProxyConfig(gatewayId);
        setConfig(null);
        toast.success('Proxy configuration cleared');
    };
    
    const handleTest = async (testConfig) => {
        const result = await testProxyConnection(gatewayId, testConfig);
        if (result.success) {
            toast.success(`Connected in ${result.latencyMs}ms`);
        } else {
            toast.error(result.error);
        }
    };
    
    return (
        <>
            <ProxyConfigForm 
                config={config} 
                onSave={handleSave}
                onClear={handleClear}
            />
            <ProxyTestButton onTest={handleTest} config={config} />
            <FailureBreakdown gatewayId={gatewayId} />
        </>
    );
}
```

### API Endpoints

**GET /api/admin/gateways/:id/proxy**
```javascript
// Response (password masked)
{
  host: "proxy.example.com",
  port: 8080,
  type: "http",
  username: "user",
  password: "********"
}
```

**PUT /api/admin/gateways/:id/proxy**
```javascript
// Request body
{
  host: "proxy.example.com",
  port: 8080,
  type: "http",
  username: "user",
  password: "secret"
}
// Response: { success: true }
```

**POST /api/admin/gateways/:id/proxy/test**
```javascript
// Request body (same as PUT)
// Response on success
{ success: true, latencyMs: 150 }
// Response on failure
{ success: false, error: "Connection refused" }
```

### Proxy Config DO
- Validate host and port are both provided if any proxy field is set
- Mask password in API GET responses (return "********")
- Use `classifyFailure()` for automatic error categorization
- Test proxy connection before saving (optional but recommended)
- Display failure breakdown in admin panel
- Support all proxy types: http, https, socks4, socks5

### Proxy Config DO NOT
- Return actual password in GET responses
- Allow partial proxy config (host without port or vice versa)
- Skip proxy validation (port must be 1-65535)
- Affect health metrics during proxy tests
- Store unencrypted passwords (use masked values in responses)

## Live Streaming Results Pattern

### Overview
All validation services use the `onResult` callback in `SpeedExecutor.executeBatch()` for live streaming results to the frontend as each card is processed.

### Correct Pattern
```javascript
// In service processBatch method
await executor.executeBatch(
    tasks, 
    (completed, totalTasks) => {
        // Progress callback
        this.emit('progress', { processed: completed, total: totalTasks, ...stats });
    },
    (execResult, index) => {
        // Result callback - emit immediately for live streaming
        if (execResult.success) {
            const result = execResult.result;
            results.push(result);
            processed++;
            
            // Update stats
            if (result.isApproved()) stats.approved++;
            else if (result.isDeclined()) stats.declined++;
            else stats.errors++;
            
            this.emit('result', result);
            if (onResult) onResult(result.toJSON ? result.toJSON() : result);
        } else {
            const errorResult = ResultClass.error(execResult.error, { card: cards[index] });
            results.push(errorResult);
            stats.errors++;
            
            this.emit('result', errorResult);
            if (onResult) onResult(errorResult.toJSON ? errorResult.toJSON() : errorResult);
        }
        
        if (onProgress) onProgress({ processed, total, ...stats });
    }
);

// Results already processed via onResult callback - no loop needed after
```

### Live Streaming DO
- Pass `onResult` callback as third argument to `executor.executeBatch()`
- Emit results immediately in the callback
- Process stats in the callback, not after batch completes

### Live Streaming DO NOT
- Store `executorResults` and loop through after batch completes (causes all results to show at once)
- Forget the third `onResult` parameter in `executeBatch()`

## Telegram Auth & Credits System

### Overview
Telegram SSO authentication with credit-based usage model. Users authenticate via Telegram, receive starter credits, and consume credits for LIVE card validations.

### Architecture
```
TelegramAuthService → JWT Token Manager → Session Management
CreditManagerService → Balance tracking, deductions, daily claims
GatewayConfigService → Credit rates per gateway
```

### Key Files
- `backend/src/services/TelegramAuthService.js` - Telegram SSO validation
- `backend/src/services/CreditManagerService.js` - Credit operations
- `backend/src/controllers/AuthController.js` - Auth endpoints
- `backend/src/controllers/CreditController.js` - Credit endpoints
- `frontend/src/hooks/useAuth.js` - Auth state management
- `frontend/src/hooks/useCredits.js` - Credit balance and tracking
- `frontend/src/components/auth/TelegramLoginWidget.jsx` - Login button
- `frontend/src/components/credits/CreditInfo.jsx` - Balance display

### User Tiers
```javascript
const USER_TIERS = {
  free:    { multiplier: 1.0,  dailyClaim: 10 },
  bronze:  { multiplier: 0.95, dailyClaim: 15 },
  silver:  { multiplier: 0.85, dailyClaim: 20 },
  gold:    { multiplier: 0.70, dailyClaim: 30 },
  diamond: { multiplier: 0.50, dailyClaim: 30 }
};
```

### Credit Flow
1. User authenticates via Telegram → receives 25 starter credits
2. User starts validation batch → `CreditMiddleware` checks balance
3. Validation runs → only LIVE/APPROVED cards consume credits
4. Credits deducted = liveCount × baseRate × tierMultiplier
5. Free tier users can claim 10 credits daily

### Key Endpoints
```
POST /api/auth/telegram - Telegram SSO login
POST /api/auth/logout - Logout
GET /api/credits/balance - Get current balance
POST /api/credits/claim - Claim daily credits (free tier)
GET /api/credits/history - Transaction history
```

### Anti-Cheat Protections
- Operation locks prevent concurrent batches per user
- Stale operation cleanup (1 minute threshold)

### Credits DO
- Check balance before starting batch via `CreditMiddleware`
- Deduct credits only for LIVE/APPROVED cards
- Use `useCredits` hook for balance display
- Track live cards via `trackLiveCard()` during batch
- Emit `batchComplete` to release operation locks

### Credits DO NOT
- Deduct credits for DECLINED/ERROR cards
- Allow concurrent batches from same user
- Skip operation lock acquisition

## Tier-Based Gateway Speed System

### Overview
Configurable speed limits (concurrency + delay) per gateway type per user tier. Higher tiers get faster processing.

**Only 2 speed types exist:**
- `auth` - Used by Auth validation services (StripeAuthService, SKBasedAuthService)
- `charge` - Used by Charge validation services (StripeChargeService, SKBasedChargeService, ShopifyChargeService)

### Architecture
```
SpeedConfigService → CRUD for speed configs (auth/charge only)
SpeedManager → Creates SpeedExecutor with tier settings
SpeedExecutor → Enforces concurrency and delay limits
```

### Key Files
- `backend/src/services/SpeedConfigService.js` - Config CRUD
- `backend/src/services/SpeedManager.js` - Executor factory
- `backend/src/services/SpeedExecutor.js` - Batch execution with limits
- `frontend/src/components/ui/SpeedDisplay.jsx` - Current speed display
- `frontend/src/components/ui/TierSpeedControl.jsx` - Speed settings UI

### Speed Type Mapping
| Service | Speed Type |
|---------|------------|
| StripeAuthService | `auth` |
| SKBasedAuthService | `auth` |
| StripeChargeService | `charge` |
| SKBasedChargeService | `charge` |
| ShopifyChargeService | `charge` |

### Default Speed Limits
```javascript
const DEFAULT_SPEED_LIMITS = {
    free:    { concurrency: 1,  delay: 2000 },
    bronze:  { concurrency: 2,  delay: 1500 },
    silver:  { concurrency: 3,  delay: 1000 },
    gold:    { concurrency: 5,  delay: 500  },
    diamond: { concurrency: 10, delay: 200  }
};
```

### Database Table
```sql
CREATE TABLE gateway_speed_configs (
    gateway_id VARCHAR(50) NOT NULL,  -- 'auth' or 'charge' only
    tier VARCHAR(20) NOT NULL,
    concurrency INTEGER NOT NULL,
    delay INTEGER NOT NULL,
    is_custom BOOLEAN DEFAULT FALSE,
    UNIQUE(gateway_id, tier)
);
```

### Integration with Services
```javascript
// In validation service - use 'auth' or 'charge' speed type
const executor = await this.speedManager.createExecutor('auth', tier);  // For auth services
const executor = await this.speedManager.createExecutor('charge', tier); // For charge services
await executor.executeBatch(tasks, onProgress, onResult);
```

### Speed System DO
- Use `SpeedManager.createExecutor()` for all batch operations
- Pass `'auth'` or `'charge'` as speed type (NOT gateway ID like 'auth-1')
- Pass user's tier to get correct speed settings
- Display current speed via `SpeedDisplayCompact` component

### Speed System DO NOT
- Bypass SpeedManager for batch execution
- Hardcode concurrency/delay values
- Pass specific gateway IDs (like 'shopify-1') - use 'auth' or 'charge' only

## Production Readiness (Admin & Redeem Keys)

### Overview
Admin dashboard, redeem key system, and configuration management for production deployment.

### Key Files
- `backend/src/services/RedeemKeyService.js` - Key generation/redemption
- `backend/src/services/AdminService.js` - User management
- `backend/src/controllers/AdminController.js` - Admin endpoints
- `frontend/src/pages/AdminDashboard.jsx` - Admin panel
- `frontend/src/components/admin/KeyGenerator.jsx` - Key generation UI
- `frontend/src/components/profile/RedeemKeyInput.jsx` - Key redemption UI

### Redeem Key Format
```
XXXX-XXXX-XXXX-XXXX (16 chars, no ambiguous chars like 0/O, 1/I/L)
```

### Key Types
- `credits` - Adds credits to user balance
- `tier` - Upgrades user to specified tier

### Admin Endpoints
```
POST /api/admin/keys/generate - Generate redeem keys
GET /api/admin/keys - List all keys
DELETE /api/admin/keys/:id - Revoke key
GET /api/admin/users - List users
PATCH /api/admin/users/:id/tier - Update user tier
PATCH /api/admin/users/:id/credits - Adjust credits
POST /api/admin/users/:id/flag - Flag user
```

### User Endpoints
```
POST /api/redeem - Redeem a key
```

### Database Tables
```sql
-- Redeem keys
CREATE TABLE redeem_keys (
    id UUID PRIMARY KEY,
    code VARCHAR(19) UNIQUE NOT NULL,
    type VARCHAR(10) NOT NULL,
    value VARCHAR(50) NOT NULL,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id)
);

-- Key redemptions
CREATE TABLE key_redemptions (
    key_id UUID REFERENCES redeem_keys(id),
    user_id UUID REFERENCES users(id),
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(key_id, user_id)
);
```

### Admin DO
- Require `is_admin` flag for all admin endpoints
- Log all admin actions to audit_logs
- Validate key format before redemption

### Admin DO NOT
- Allow non-admin users to access admin endpoints
- Allow same user to redeem same key twice
- Allow redemption of expired/revoked keys


## Batch Import/Export System

### Overview
File-based import/export for card validation panels. Users can import cards from CSV/TXT files and export validation results in multiple formats. Handles large datasets (up to 10,000 cards) with chunked processing.

### Architecture
```
Frontend Only (no backend changes)
├── file-utils.js - Parsing and formatting utilities
├── useFileImport - File reading and card parsing hook
├── useFileExport - Result formatting and download hook
├── ImportButton - File picker UI component
├── ExportButton - Format selection dropdown
└── ImportPreviewDialog - Preview with stats and options
```

### Key Files
- `frontend/src/lib/utils/file-utils.js` - CSV/TXT parsing, export formatting, chunked processing
- `frontend/src/lib/utils/card-parser.js` - Existing card line parsing (reused)
- `frontend/src/hooks/useFileImport.js` - File import hook with progress tracking
- `frontend/src/hooks/useFileExport.js` - Export hook with format/column selection
- `frontend/src/components/ui/ImportButton.jsx` - Import button with file picker
- `frontend/src/components/ui/ExportButton.jsx` - Export dropdown with options
- `frontend/src/components/ui/ImportPreviewDialog.jsx` - Import preview dialog

### Limits and Thresholds
```javascript
const MAX_CARDS_LIMIT = 10000;      // Maximum cards per import
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max file size
const DEFAULT_CHUNK_SIZE = 500;     // Cards per processing chunk
const PROGRESS_THRESHOLD = 1000;    // Show progress for 1000+ cards
const SAMPLE_SIZE = 5;              // Preview sample cards
```

### CSV Column Detection
Supports flexible column headers (case-insensitive):
```javascript
// Card number columns
['card_number', 'number', 'cc', 'card', 'cardnumber', 'card_no', 'pan']

// Expiry month columns
['exp_month', 'month', 'mm', 'expmonth', 'exp_mm', 'expiry_month']

// Expiry year columns
['exp_year', 'year', 'yy', 'yyyy', 'expyear', 'exp_yy', 'expiry_year']

// CVV columns
['cvv', 'cvc', 'security_code', 'cvv2', 'cvc2', 'securitycode', 'cv2']

// Combined expiry columns (MMYY, MM/YY)
['exp', 'expiry', 'expiration', 'exp_date', 'expiry_date']
```

### Export Formats
- **CSV** - Customizable columns with proper escaping
- **TXT** - Plain text: `card | status | message`
- **JSON** - Full result objects with BIN data
- **Cards Only** - Just card data for re-processing: `number|mm|yy|cvv`

### Export Columns
```javascript
const EXPORT_COLUMNS = {
  card: 'Card',
  status: 'Status',
  message: 'Message',
  duration: 'Duration (ms)',
  brand: 'Brand',      // BIN data
  type: 'Type',        // BIN data
  country: 'Country',  // BIN data
  bank: 'Bank',        // BIN data
  riskLevel: 'Risk Level',
  riskScore: 'Risk Score',
};
```

### Using Import in Panels
```jsx
import { useFileImport } from '@/hooks/useFileImport';
import { ImportButton } from '@/components/ui/ImportButton';
import { ImportPreviewDialog } from '@/components/ui/ImportPreviewDialog';

function MyPanel() {
  const { importFile, isImporting, progress } = useFileImport();
  const [showPreview, setShowPreview] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleFileSelect = async (file) => {
    const result = await importFile(file);
    if (result.success) {
      setImportResult(result);
      setShowPreview(true);
    }
  };

  const handleConfirmImport = (options) => {
    // Populate textarea with imported cards
    setCards(importResult.rawInput);
    setShowPreview(false);
  };

  return (
    <>
      <ImportButton
        onFileSelect={handleFileSelect}
        isLoading={isImporting}
        progress={progress}
      />
      <ImportPreviewDialog
        open={showPreview}
        stats={importResult?.stats}
        sampleCards={importResult?.sampleCards}
        onConfirm={handleConfirmImport}
        effectiveRate={effectiveRate}
        balance={balance}
      />
    </>
  );
}
```

### Using Export in Panels
```jsx
import { useFileExport } from '@/hooks/useFileExport';
import { ExportButton } from '@/components/ui/ExportButton';

function MyPanel() {
  const { exportResults } = useFileExport();
  const [results, setResults] = useState([]);
  const [filter, setFilter] = useState('all');

  return (
    <ExportButton
      results={results}
      filter={filter}
      disabled={results.length === 0}
    />
  );
}
```

### Import Flow
1. User clicks ImportButton → file picker opens
2. File read via FileReader API
3. Content parsed (CSV or TXT auto-detected)
4. Cards deduplicated and expired filtered
5. ImportPreviewDialog shows stats and sample
6. User confirms → cards populate textarea

### Export Flow
1. User clicks ExportButton → dropdown shows formats
2. User selects format and options (columns, BIN data, cards-only)
3. Results filtered by current filter (approved/declined/error/all)
4. Content formatted and downloaded with timestamped filename

### Chunked Processing
Large files (1000+ cards) are processed in chunks to prevent UI blocking:
```javascript
// Process in 500-card chunks with progress updates
for (let i = 0; i < chunks.length; i++) {
  const chunkResult = processCardInput(chunks[i].join('\n'), options);
  // Update progress
  setProgress(50 + Math.round(((i + 1) / chunks.length) * 40));
  // Yield to event loop
  await new Promise(resolve => setTimeout(resolve, 0));
}
```

### Import/Export DO
- Use `useFileImport` hook for all file imports
- Use `useFileExport` hook for all exports
- Show progress indicator for 1000+ cards
- Display truncation warning when file exceeds 10,000 cards
- Apply deduplication and expiry filtering via `processCardInput`
- Include filter name in exported filename
- Store column preferences in localStorage

### Import/Export DO NOT
- Import files larger than 5MB
- Process more than 10,000 cards (truncate with warning)
- Block UI during large file processing (use chunks)
- Skip the preview dialog for imports
- Export without respecting current filter


## Gateway Credit Configuration System

### Overview
Per-gateway credit rate configuration allows administrators to set custom credit costs for each gateway. Includes confirmation dialogs, toast notifications, and real-time SSE updates for configuration changes.

### Architecture
```
GatewayConfigService (credit rate management)
├── getCreditRate(gatewayId) - Get rate with isCustom flag
├── setCreditRate(gatewayId, rate, adminId) - Set rate with validation
├── resetCreditRate(gatewayId, adminId) - Reset to default
├── getAllCreditRates() - Get all rates with metadata
└── calculateEffectiveRate(gatewayId, tier) - Apply tier multiplier

GatewayController (credit rate endpoints)
├── GET /api/admin/gateways/:id/credit-rate - Get gateway rate
├── PUT /api/admin/gateways/:id/credit-rate - Update gateway rate
├── DELETE /api/admin/gateways/:id/credit-rate - Reset to default
└── GET /api/gateways/credit-rates - Public rates for authenticated users
```

### Key Files
- `backend/src/services/GatewayConfigService.js` - Credit rate CRUD with caching
- `backend/src/controllers/GatewayController.js` - Credit rate API endpoints
- `frontend/src/components/admin/CreditRateConfig.jsx` - Admin rate input
- `frontend/src/components/admin/EffectiveRatePreview.jsx` - Tier rate preview
- `frontend/src/components/admin/ResetToDefaultButton.jsx` - Reset button
- `frontend/src/components/ui/ConfirmationDialog.jsx` - Generic confirmation dialog
- `frontend/src/components/credits/BatchConfirmDialog.jsx` - Batch validation confirm
- `frontend/src/components/credits/EffectiveRateDisplay.jsx` - User rate display
- `frontend/src/components/credits/CostEstimator.jsx` - Cost calculation display
- `frontend/src/hooks/useConfirmation.js` - Promise-based confirmation hook
- `frontend/src/hooks/useGatewayCreditRates.js` - SSE-enabled rates hook
- `frontend/src/hooks/useGatewayAdmin.js` - Admin credit rate methods
- `frontend/src/hooks/useAdminNotifications.js` - Admin SSE notifications

### Credit Rate Validation
```javascript
const CREDIT_RATE_LIMITS = {
  MIN: 0.1,
  MAX: 100.0
};

// Validation in GatewayConfigService.setCreditRate()
if (rate < CREDIT_RATE_LIMITS.MIN || rate > CREDIT_RATE_LIMITS.MAX) {
  throw new Error(`Credit rate must be between ${CREDIT_RATE_LIMITS.MIN} and ${CREDIT_RATE_LIMITS.MAX}`);
}
```

### Gateway Type Hierarchy
Gateways are organized by parent type and sub type:
```
STRIPE (parentType)
├── auth (subType)      → auth-1, auth-2, auth-3
└── charge (subType)    → charge-1, charge-2, charge-3

SHOPIFY (parentType)
└── (no subType)        → shopify-05, shopify-1, shopify-2, shopify-3
```

### Pricing Model (Fixed Values)
Credits are deducted based on validation result status, NOT user tier:
```javascript
// All users pay the same rate regardless of tier
// Fixed credit costs per status:
const PRICING = {
  approved: 5,   // APPROVED cards: 5 credits
  live: 3,       // LIVE cards: 3 credits
  dead: 0,       // DECLINED/ERROR/CAPTCHA: Free
};

// Database columns:
// - pricing_approved (credits for approved cards)
// - pricing_live (credits for live cards)
```

### UI Rate Display
Display both approved and live rates clearly:
```jsx
// EffectiveRateBadge shows: "✓ 5" (green) and "◐ 3" (blue) badges
<EffectiveRateBadge pricing={{ approved: 5, live: 3 }} />

// Compact mode shows: "5|3"
<EffectiveRateBadge pricing={{ approved: 5, live: 3 }} compact />
```

### Admin Pricing API
```javascript
// PUT /api/admin/gateways/:id/pricing
// Body: { approved: 5, live: 3 }
const result = await setPricing(gatewayId, { approved: 5, live: 3 });
```

### Using Credit Rate Config in Admin Panel
```jsx
import { CreditRateConfig } from '@/components/admin/CreditRateConfig';
import { EffectiveRatePreview } from '@/components/admin/EffectiveRatePreview';
import { ResetToDefaultButton } from '@/components/admin/ResetToDefaultButton';
import { useGatewayAdmin } from '@/hooks/useGatewayAdmin';
import { useConfirmation } from '@/hooks/useConfirmation';

function GatewayCreditSettings({ gateway }) {
  const { getCreditRate, setCreditRate, resetCreditRate } = useGatewayAdmin();
  const { isOpen, config, confirm, handleConfirm, handleCancel, setOpen } = useConfirmation();
  const [rateInfo, setRateInfo] = useState(null);

  const handleSave = async (newRate) => {
    const confirmed = await confirm({
      title: 'Update Credit Rate',
      description: `Change ${gateway.label} rate from ${rateInfo.rate} to ${newRate}?`,
      confirmText: 'Update Rate'
    });
    
    if (confirmed) {
      await setCreditRate(gateway.id, newRate);
      toast.success('Credit rate updated');
    }
  };

  const handleReset = async () => {
    const confirmed = await confirm({
      title: 'Reset to Default',
      description: `Reset ${gateway.label} to default rate (${rateInfo.defaultRate})?`,
      destructive: true
    });
    
    if (confirmed) {
      await resetCreditRate(gateway.id);
      toast.success('Credit rate reset to default');
    }
  };

  return (
    <>
      <CreditRateConfig
        gateway={gateway}
        currentRate={rateInfo?.rate}
        defaultRate={rateInfo?.defaultRate}
        isCustom={rateInfo?.isCustom}
        onSave={handleSave}
      />
      <EffectiveRatePreview baseRate={rateInfo?.rate} />
      {rateInfo?.isCustom && (
        <ResetToDefaultButton onReset={handleReset} />
      )}
      <ConfirmationDialog
        open={isOpen}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        {...config}
      />
    </>
  );
}
```

### Using Batch Confirmation in Validation Panels
```jsx
import { BatchConfirmDialog, useBatchConfirmation, BATCH_CONFIRM_THRESHOLD } from '@/components/credits/BatchConfirmDialog';
import { useGatewayCreditRates } from '@/hooks/useGatewayCreditRates';
import { useCredits } from '@/hooks/useCredits';

function ValidationPanel() {
  const { getEffectiveRate } = useGatewayCreditRates();
  const { balance } = useCredits();
  const [cards, setCards] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState('auth-1');

  const effectiveRate = getEffectiveRate(selectedGateway);
  
  const { confirm, dialogProps } = useBatchConfirmation({
    cardCount: cards.length,
    balance,
    effectiveRate,
    gatewayName: selectedGateway
  });

  const handleStartValidation = async () => {
    // Shows dialog if cards.length > BATCH_CONFIRM_THRESHOLD (10)
    const confirmed = await confirm();
    if (!confirmed) return;
    
    // Proceed with validation...
  };

  return (
    <>
      <Button onClick={handleStartValidation}>Start Validation</Button>
      <BatchConfirmDialog {...dialogProps} />
    </>
  );
}
```

### SSE Credit Rate Updates
```javascript
// GatewayConfigService broadcasts via GatewayManagerService
_broadcastCreditRateChange(gatewayId, oldRate, newRate, isCustom) {
  if (this.gatewayManager) {
    this.gatewayManager.broadcastCreditRateChange(gatewayId, oldRate, newRate, isCustom);
  }
}

// Frontend hook handles SSE events
// useGatewayCreditRates.js
const handleSSEMessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'creditRateChange') {
    setRates(prev => {
      const updated = [...prev];
      const index = updated.findIndex(r => r.gatewayId === data.gatewayId);
      if (index >= 0) {
        updated[index] = {
          ...updated[index],
          rate: data.newRate,
          isCustom: data.isCustom,
          effectiveRate: data.newRate * tierMultiplier
        };
      }
      return updated;
    });
  }
};
```

### Audit Logging
```javascript
// Credit rate changes are logged to gateway_audit_logs
const CREDIT_RATE_AUDIT_ACTIONS = {
  CHANGE: 'credit_rate_change',
  RESET: 'credit_rate_reset'
};

// Audit entry includes:
// - gateway_id
// - old_state (old rate as string)
// - new_state (new rate as string)
// - admin_id
// - reason (action type + rate change)
```

### API Endpoints

**GET /api/admin/gateways/:id/credit-rate**
```javascript
// Response
{
  status: 'OK',
  gatewayId: 'auth-1',
  gatewayName: 'Auth Gateway',
  rate: 1.5,
  defaultRate: 1.0,
  isCustom: true,
  updatedAt: '2024-01-15T10:30:00Z'
}
```

**PUT /api/admin/gateways/:id/credit-rate**
```javascript
// Request body
{ rate: 2.0 }

// Response
{
  status: 'OK',
  message: 'Credit rate updated successfully',
  gatewayId: 'auth-1',
  oldRate: 1.5,
  newRate: 2.0,
  defaultRate: 1.0,
  isCustom: true
}
```

**DELETE /api/admin/gateways/:id/credit-rate**
```javascript
// Response
{
  status: 'OK',
  message: 'Credit rate reset to default',
  gatewayId: 'auth-1',
  oldRate: 2.0,
  newRate: 1.0,
  defaultRate: 1.0,
  isCustom: false
}
```

**GET /api/gateways/credit-rates** (authenticated users)
```javascript
// Response includes effective rate for user's tier
{
  status: 'OK',
  rates: [
    {
      gatewayId: 'auth-1',
      gatewayName: 'Auth Gateway',
      rate: 1.0,
      defaultRate: 1.0,
      isCustom: false,
      effectiveRate: 0.85,  // For silver tier
      userTier: 'silver',
      tierMultiplier: 0.85
    }
  ],
  userTier: 'silver',
  tierMultiplier: 0.85
}
```

### Gateway Credit Config DO
- Validate rate is between 0.1 and 100.0
- Show confirmation dialog before saving rate changes
- Display effective rates for all tiers in admin preview
- Show "Custom" badge when rate differs from default
- Invalidate cache immediately on rate update
- Broadcast SSE event on rate change
- Log all rate changes to audit log
- Show batch confirmation for >10 cards
- Display estimated cost before validation

### Gateway Credit Config DO NOT
- Allow rates outside 0.1-100.0 range
- Skip confirmation dialogs for rate changes
- Forget to invalidate cache after updates
- Skip SSE broadcast on rate changes
- Allow batch validation without confirmation for large batches
- Show actual cost (only show estimated max cost)

## Telegram Bot Notification System

### Overview
Real-time Telegram notifications for approved cards and live SK keys. Sends to both the user who performed the action AND admin channel.

### Architecture
```
TelegramBotService
├── sendMessage(chatId, text) - Core Telegram API call
├── notifyCardApproved({ user, result, gateway, type }) - Card approval notification
├── notifyLiveSK({ user, result, isManualInput }) - Live SK key notification
└── notifyAdmin(title, details) - Admin-only system notifications
```

### Key Files
- `backend/src/services/TelegramBotService.js` - Core notification service
- `backend/src/controllers/AuthController.js` - Auth validation notifications
- `backend/src/controllers/ChargeController.js` - Charge validation notifications
- `backend/src/controllers/ShopifyAuthController.js` - Shopify validation notifications
- `backend/src/controllers/SKBasedController.js` - SK-based charge notifications
- `backend/src/controllers/SKBasedAuthController.js` - SK-based auth notifications
- `backend/src/controllers/KeyController.js` - SK key check notifications

### Environment Variables
```bash
# Required: Same bot token used for SSO
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Optional: Admin chat ID for admin notifications
# Get from @userinfobot on Telegram
# For channels, prefix with -100
TELEGRAM_ADMIN_CHAT_ID=your-admin-chat-id
```

### Notification Events
| Event | User Receives | Admin Receives |
|-------|---------------|----------------|
| Card APPROVED (Auth) | ✅ | ✅ |
| Card APPROVED (Charge) | ✅ | ✅ |
| Card APPROVED (Shopify) | ✅ | ✅ |
| Card APPROVED/LIVE (SK-Based) | ✅ | ✅ |
| SK Key LIVE (Manual Check) | ✅ | ✅ |

### Message Format
```
🎉 Card APPROVED!

💳 4111111111111111|12|25|123
🏷️ Brand: VISA
📇 Type: CREDIT
🌍 Country: US
🔗 Gateway: auth-1
📝 Type: AUTH
⏰ 12/27/2024, 10:30:00 AM UTC
```

### Adding Notifications to New Controllers
```javascript
// 1. Add to constructor
constructor(options = {}) {
    this.telegramBotService = options.telegramBotService;
}

// 2. In onResult callback, after processing
if (this.telegramBotService && result.status === 'APPROVED') {
    this.telegramBotService.notifyCardApproved({
        user: req.user,
        result,
        gateway: siteId || 'gateway-name',
        type: 'auth' // or 'charge'
    }).catch(() => {}); // Fire and forget
}

// 3. Wire up in server.js
const controller = new MyController({
    myService,
    telegramBotService
});
```

### Telegram Bot DO
- Use fire-and-forget pattern (`.catch(() => {})`) to not block validation
- Include full card in notification (user's own data)
- Include BIN data when available
- Include user info in admin notifications
- Use HTML parse mode for formatting

### Telegram Bot DO NOT
- Block validation flow waiting for notification
- Expose bot token in frontend
- Send notifications for DECLINED/ERROR cards
- Skip error handling on sendMessage calls

## Tier Duration Management System

### Overview
Comprehensive tier duration management for subscription-based user tiers. Supports both permanent and time-limited tier subscriptions with automatic expiration detection, user-facing countdown displays, admin management, and key redemption integration.

### Architecture
```
UserService (tier duration methods)
├── checkAndResetExpiredTier(userId) - Check and auto-downgrade expired tiers
├── setTierWithDuration(userId, tier, durationDays) - Set tier with optional duration
├── extendTierDuration(userId, additionalDays) - Extend existing tier
├── getExpiredTierUsers() - Find all expired tier users
└── resetAllExpiredTiers() - Batch reset for cron jobs

AdminService (admin tier management)
├── updateUserTier(userId, tier, durationDays) - Admin tier update with duration
└── extendUserTier(userId, additionalDays) - Admin tier extension

RedeemKeyService (key redemption)
├── generateKeys({ durationDays }) - Generate tier keys with duration
└── _redeemTierKey() - Handle tier key redemption with extension logic
```

### Key Files
- `backend/src/services/UserService.js` - Core tier duration methods
- `backend/src/services/AdminService.js` - Admin tier management
- `backend/src/services/RedeemKeyService.js` - Key generation/redemption with duration
- `backend/src/controllers/AdminController.js` - Admin API endpoints
- `frontend/src/components/ui/TierExpirationCountdown.jsx` - Countdown display component
- `frontend/src/components/profile/TierInfoCard.jsx` - Tier info with expiration display
- `frontend/src/hooks/useTierExpirationWarning.js` - Expiration warning hook
- `frontend/src/components/admin/UsersList.jsx` - Admin user list with tier management

### Database Schema
```sql
-- Users table tier duration fields
ALTER TABLE users ADD COLUMN tier_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Redeem keys table duration field
ALTER TABLE redeem_keys ADD COLUMN duration_days INTEGER DEFAULT NULL;

-- Index for efficient expired tier queries
CREATE INDEX idx_users_tier_expires ON users(tier, tier_expires_at) 
WHERE tier != 'free' AND tier_expires_at IS NOT NULL;
```

### Tier Duration Rules
- `tier_expires_at = NULL` for non-free tier → Permanent subscription
- `tier_expires_at = timestamp` → Time-limited subscription
- `tier = 'free'` → Always has `tier_expires_at = NULL`
- Duration range: 1-365 days (0 or null = permanent)

### Urgency Classification (Frontend)
```javascript
// calculateTimeRemaining() returns urgency levels:
// - 'expired': timestamp is in the past
// - 'critical': expiring within 24 hours
// - 'warning': expiring within 1-3 days
// - 'notice': expiring within 4-7 days
// - 'normal': expiring in more than 7 days
```

### Display Formatting Rules
```javascript
// formatExpirationDate() returns display text:
// - More than 30 days: "Expires {formatted date}"
// - 8-30 days: "Expires in X days" (normal styling)
// - 2-7 days: "Expires in X days" (warning styling)
// - Tomorrow: "Expires tomorrow" (urgent styling)
// - Today: "Expires today" (critical styling)
// - Less than 24 hours: "Xh Xm remaining" (critical styling)
// - Expired: "Expired" (error styling)
```

### API Endpoints

**GET /api/auth/me** - Returns `tierExpiresAt` in user response

**PUT /api/admin/users/:id/tier**
```javascript
// Request
{ tier: "gold", durationDays: 30 }  // null/0 for permanent

// Response
{
  status: "OK",
  user: {
    previousTier: "silver",
    newTier: "gold",
    tierExpiresAt: "2025-01-28T00:00:00.000Z",
    durationDays: 30
  }
}
```

**POST /api/admin/users/:id/tier/extend**
```javascript
// Request
{ additionalDays: 15 }

// Response
{
  status: "OK",
  user: {
    tier: "gold",
    previousExpiresAt: "2025-01-28T00:00:00.000Z",
    newExpiresAt: "2025-02-12T00:00:00.000Z",
    daysAdded: 15
  }
}
```

### Extension Logic
- Active subscription: Add days to current `tier_expires_at`
- Expired subscription: Calculate from today
- Permanent tier: Convert to timed (calculate from today)
- Free tier: Reject with error

### Key Redemption with Duration
```javascript
// Generate tier key with duration
await redeemKeyService.generateKeys({
  type: 'tier',
  value: 'gold',
  quantity: 5,
  durationDays: 30  // null for permanent
});

// Redemption behavior:
// - Different tier: Upgrade to new tier with duration
// - Same tier (active): Extend by adding duration to current expiration
// - Same tier (expired): Set new expiration from today
```

### Frontend Components

**TierExpirationCountdown**
```jsx
import { TierExpirationCountdown, calculateTimeRemaining } from '@/components/ui/TierExpirationCountdown';

// Variants: 'badge' | 'full' | 'compact' | 'inline'
<TierExpirationCountdown 
  expiresAt={user.tierExpiresAt}
  tier={user.tier}
  variant="badge"
  onExpired={() => refreshUser()}
/>
```

**TierInfoCard**
```jsx
import { TierInfoCard, formatExpirationDate } from '@/components/profile/TierInfoCard';

<TierInfoCard tier={{
  name: user.tier,
  multiplier: 0.7,
  dailyClaim: 30,
  expiresAt: user.tierExpiresAt  // null for permanent
}} />
```

**useTierExpirationWarning Hook**
```jsx
import { useTierExpirationWarning } from '@/hooks/useTierExpirationWarning';

function MyComponent() {
  const { isExpired, isExpiringSoon, daysRemaining } = useTierExpirationWarning();
  // Shows toast warnings once per session
  // Triggers user data refresh on expiration
}
```

### Admin Panel Integration
```jsx
// UsersList.jsx - Tier management in admin panel
// - Duration input (1-365 days) with "Permanent" toggle
// - Extend button for paid tiers
// - Shows current expiration status
// - Highlights expiring soon users
```

### Tier Duration DO
- Check tier expiration on every authenticated request via `checkAndResetExpiredTier()`
- Log tier expirations to `audit_logs` table
- Show "Permanent" badge for tiers with null `tier_expires_at`
- Show countdown/warning for expiring tiers
- Use session-based deduplication for warning toasts
- Validate duration is 1-365 days (or null/0 for permanent)
- Handle extension logic correctly (add to current vs calculate from today)

### Tier Duration DO NOT
- Allow duration > 365 days
- Allow extending free tier
- Show multiple warning toasts per session
- Set `tier_expires_at` for free tier (always null)
- Skip audit logging for tier expirations
- Forget to refresh user data when tier expires during session


## Dashboard Leaderboard System

### Overview
Real-time dashboard homepage for authenticated users featuring personal/global statistics, leaderboard, online user tracking, gateway status overview, and Telegram notifications for gateway health issues. Uses SSE for live updates.

### Architecture
```
DashboardService (central stats management)
├── Stats Cache: 30-second TTL for global stats
├── SSE Clients: Set<Response> for real-time broadcasts
├── Personal Stats: Per-user cards checked & hits
├── Global Stats: Platform-wide aggregates
└── Leaderboard: Top 5 users by hits

OnlineUserTracker (middleware)
├── Updates last_active_at on authenticated requests
├── 5-minute threshold for online status
└── Efficient batch updates

DashboardController (REST API)
├── GET /api/dashboard/stats - Personal + global stats
├── GET /api/dashboard/stats/stream - SSE endpoint
├── GET /api/dashboard/leaderboard - Top 5 users
└── GET /api/dashboard/online-users - Paginated list
```

### Key Files
- `backend/src/services/DashboardService.js` - Stats aggregation, caching, SSE broadcasting
- `backend/src/controllers/DashboardController.js` - REST API endpoints
- `backend/src/middleware/OnlineUserTracker.js` - Activity tracking middleware
- `backend/src/services/TelegramBotService.js` - Gateway health notifications (extended)
- `frontend/src/pages/DashboardPage.jsx` - Main dashboard page
- `frontend/src/hooks/useDashboardStats.js` - Personal/global stats with SSE
- `frontend/src/hooks/useLeaderboard.js` - Leaderboard data hook
- `frontend/src/hooks/useOnlineUsers.js` - Paginated online users hook
- `frontend/src/lib/services/dashboardSSE.js` - SSE connection manager
- `frontend/src/components/dashboard/PersonalStatsCard.jsx` - User's stats display
- `frontend/src/components/dashboard/GlobalStatsCard.jsx` - Platform stats display
- `frontend/src/components/dashboard/LeaderboardCard.jsx` - Top users display
- `frontend/src/components/dashboard/OnlineUsersCard.jsx` - Online users list
- `frontend/src/components/dashboard/GatewayOverview.jsx` - Gateway status grouped by type

### Database Schema
```sql
-- User statistics columns (added to users table)
ALTER TABLE users ADD COLUMN total_cards_checked INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN total_hits INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes for efficient queries
CREATE INDEX idx_users_last_active ON users(last_active_at DESC);
CREATE INDEX idx_users_total_hits ON users(total_hits DESC);

-- Platform stats cache table (single row)
CREATE TABLE platform_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_members INTEGER DEFAULT 0,
  total_cards_checked BIGINT DEFAULT 0,
  total_hits BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);
```

### Statistics Tracking Integration
Validation services call `dashboardService.incrementUserStats()` after each batch:

```javascript
// In validation service (e.g., StripeAuthService, ShopifyChargeService)
async processBatch(cards, options = {}) {
    // ... validation logic ...
    
    // After batch completes, increment stats
    if (this.dashboardService && userId) {
        const hitsCount = results.filter(r => 
            r.status === 'APPROVED' || r.status === 'LIVE'
        ).length;
        
        await this.dashboardService.incrementUserStats(
            userId,
            results.length,  // cardsCount
            hitsCount        // hitsCount (APPROVED + LIVE only)
        );
    }
}
```

### SSE Real-Time Updates
```javascript
// Frontend connection via dashboardSSE service
import { dashboardSSE } from '@/lib/services/dashboardSSE';

// Connect and subscribe to updates
dashboardSSE.connect(token);
dashboardSSE.subscribe('statsUpdate', (data) => {
    // Update personal/global stats
});
dashboardSSE.subscribe('leaderboardUpdate', (data) => {
    // Update leaderboard
});

// SSE Event Types
interface StatsUpdateEvent {
  type: 'statsUpdate';
  personal?: { totalCards: number; totalHits: number };
  global?: { totalMembers: number; onlineCount: number; totalCards: number; totalHits: number };
  timestamp: string;
}
```

### Gateway Health Notifications
```javascript
// TelegramBotService.notifyGatewayHealth()
// Triggered when gateway health changes to offline/degraded or recovers

await telegramBotService.notifyGatewayHealth({
    gatewayId: 'auth-1',
    gatewayLabel: 'Auth Gateway 1',
    previousStatus: 'online',
    newStatus: 'offline',
    isRecovery: false,
    timestamp: new Date().toISOString()
});

// Message format:
// 🔴 Gateway OFFLINE
// Gateway: Auth Gateway 1 (auth-1)
// Status: online → offline
// Time: 1/1/2026, 10:30:00 AM UTC
```

### API Endpoints

**GET /api/dashboard/stats**
```javascript
// Response
{
  status: 'OK',
  personal: { totalCards: 150, totalHits: 23 },
  global: { totalMembers: 500, onlineCount: 42, totalCards: 50000, totalHits: 3200 },
  timestamp: '2026-01-01T10:30:00.000Z'
}
```

**GET /api/dashboard/leaderboard**
```javascript
// Response
{
  status: 'OK',
  leaderboard: [
    { rank: 1, userId: 'uuid', username: 'user1', firstName: 'John', tier: 'gold', totalHits: 500 },
    { rank: 2, userId: 'uuid', username: 'user2', firstName: 'Jane', tier: 'silver', totalHits: 350 }
  ],
  timestamp: '2026-01-01T10:30:00.000Z'
}
```

**GET /api/dashboard/online-users?page=1&limit=10**
```javascript
// Response
{
  status: 'OK',
  users: [
    { userId: 'uuid', username: 'user1', firstName: 'John', tier: 'gold', lastActiveAt: '...' }
  ],
  pagination: { page: 1, limit: 10, total: 42, totalPages: 5 },
  timestamp: '2026-01-01T10:30:00.000Z'
}
```

### Frontend Usage

**DashboardPage**
```jsx
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { useGatewayStatus } from '@/hooks/useGatewayStatus';

function DashboardPage() {
    const { personalStats, globalStats, isConnected } = useDashboardStats();
    const { leaderboard, isLoading: leaderboardLoading } = useLeaderboard();
    const { users: onlineUsers, pagination, setPage } = useOnlineUsers();
    const { gateways } = useGatewayStatus();

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PersonalStatsCard stats={personalStats} />
            <GlobalStatsCard stats={globalStats} />
            <GatewayOverview gateways={gateways} />
            <LeaderboardCard users={leaderboard} />
            <OnlineUsersCard 
                users={onlineUsers} 
                pagination={pagination}
                onPageChange={setPage}
            />
        </div>
    );
}
```

### Online User Threshold
- Users are considered "online" if `last_active_at` is within 5 minutes
- Activity is tracked via `OnlineUserTracker` middleware on all authenticated requests
- Middleware updates `last_active_at` efficiently (debounced per request)

### Dashboard DO
- Use `useDashboardStats` hook for personal/global stats with SSE
- Use `useLeaderboard` hook for top 5 users
- Use `useOnlineUsers` hook for paginated online users
- Call `dashboardService.incrementUserStats()` after validation batches
- Include gateway health notifications via `TelegramBotService`
- Group gateways by `parentType` and `subType` in `GatewayOverview`
- Use 30-second cache TTL for global stats

### Dashboard DO NOT
- Hardcode stats data in frontend components
- Skip stats increment after validation batches
- Forget to clean up SSE connections on unmount
- Block validation flow waiting for stats update
- Count DECLINED/ERROR cards as hits (only APPROVED/LIVE)


## Maintenance Mode & Error Pages System

### Overview
System-wide maintenance mode with error handling pages (404, 403, 500), security protection middleware, and automated error reporting to Telegram. Administrators can toggle maintenance mode via admin panel or Telegram bot commands.

### Architecture
```
Backend Middleware Stack (order matters):
1. SecurityMiddleware (first) - Blocks security threats
2. MaintenanceMiddleware - Blocks non-admin users during maintenance
3. Routes - Normal request handling
4. GlobalErrorHandler (last) - Catches unhandled errors

MaintenanceService (state management)
├── State: { enabled, reason, estimatedEndTime, enabledAt, enabledBy }
├── SSE Clients: Set<Response> for real-time broadcasts
├── Persistence: system_settings table
└── Telegram integration for notifications

ErrorReporterService (error reporting)
├── Rate limiting: max 10 per minute per error type
├── Telegram notifications with error details
├── Unique error reference IDs
└── Database logging to error_logs table
```

### Key Files
- `backend/src/services/MaintenanceService.js` - Maintenance state management
- `backend/src/services/ErrorReporterService.js` - Error reporting with rate limiting
- `backend/src/middleware/SecurityMiddleware.js` - Security threat detection
- `backend/src/middleware/MaintenanceMiddleware.js` - Maintenance mode enforcement
- `backend/src/middleware/GlobalErrorHandler.js` - Global error catching
- `backend/src/controllers/SystemController.js` - Maintenance API endpoints
- `frontend/src/pages/MaintenancePage.jsx` - Maintenance mode display
- `frontend/src/pages/NotFoundPage.jsx` - 404 error page
- `frontend/src/pages/ForbiddenPage.jsx` - 403 error page
- `frontend/src/pages/ErrorPage.jsx` - 500 error page with reference ID
- `frontend/src/components/ui/GlobalErrorBoundary.jsx` - React error boundary
- `frontend/src/components/admin/MaintenanceControls.jsx` - Admin panel controls
- `frontend/src/hooks/useMaintenanceStatus.js` - SSE-based status hook
- `frontend/src/lib/services/maintenanceSSE.js` - SSE connection manager


### Database Schema
```sql
-- System settings table (maintenance state persistence)
CREATE TABLE system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Security logs table (blocked requests)
CREATE TABLE security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(45) NOT NULL,
    path TEXT NOT NULL,
    attack_type VARCHAR(50) NOT NULL,
    user_agent TEXT,
    blocked_at TIMESTAMPTZ DEFAULT NOW(),
    request_headers JSONB
);

-- Error logs table (reported errors)
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_id VARCHAR(20) NOT NULL UNIQUE,
    message TEXT NOT NULL,
    stack TEXT,
    path TEXT,
    user_id UUID REFERENCES users(id),
    ip_address VARCHAR(45),
    reported_to_telegram BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```


### Security Middleware Patterns
```javascript
// Blocked patterns (path traversal, XSS)
const BLOCKED_PATTERNS = [
    /\.\.\//,           // Path traversal
    /\.\.\\/, 
    /%2e%2e/i,          // URL encoded
    /<script/i,         // XSS
    /javascript:/i,
    /on\w+\s*=/i,       // Event handlers
];

// Blocked file extensions
const BLOCKED_EXTENSIONS = [
    '.env', '.git', '.sql', '.log', '.bak', '.config',
    '.htaccess', '.htpasswd', '.ini', '.sh', '.bash'
];

// SQL injection patterns
const SQL_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i,
    /('|"|;|--)/,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i
];
```


### API Endpoints

**Maintenance Status (Public)**
```javascript
GET /api/system/maintenance/status
// Response
{
  status: 'OK',
  maintenance: {
    enabled: true,
    reason: 'Scheduled maintenance',
    estimatedEndTime: '2026-01-05T14:00:00.000Z',
    enabledAt: '2026-01-05T12:00:00.000Z'
  }
}

GET /api/system/maintenance/stream  // SSE endpoint
// Events: { type: 'status', enabled, reason, estimatedEndTime }
```

**Maintenance Control (Admin)**
```javascript
POST /api/admin/maintenance/enable
// Body: { reason?: string, estimatedEndTime?: ISO string }
// Response: { status: 'OK', message: 'Maintenance mode enabled' }

POST /api/admin/maintenance/disable
// Response: { status: 'OK', message: 'Maintenance mode disabled' }
```

**Error Reporting**
```javascript
POST /api/errors/report
// Body: { message, stack?, componentStack?, url, userAgent, timestamp }
// Response: { status: 'OK', errorId: 'ERR-ABC123XY' }
```


### Telegram Bot Commands
```
/maintenance_on [reason]  - Enable maintenance mode with optional reason
/maintenance_off          - Disable maintenance mode
/maintenance_status       - Check current maintenance state
```

Only admin users (validated via `_isAdminUser()`) can execute these commands.

### Frontend Integration

**AppLayout Maintenance Check**
```jsx
import { useMaintenanceStatus } from '@/hooks/useMaintenanceStatus';

function AppLayout() {
    const { isMaintenanceMode, reason, estimatedEndTime } = useMaintenanceStatus();
    const isAdmin = user?.isAdmin;

    // Show maintenance page for non-admin users during maintenance
    if (isMaintenanceMode && !isAdmin) {
        return <MaintenancePage reason={reason} estimatedEndTime={estimatedEndTime} />;
    }

    return <NormalLayout />;
}
```

**GlobalErrorBoundary**
```jsx
// Wraps entire app in AppLayout
<GlobalErrorBoundary>
    <ValidationProvider>
        <AppLayoutInner />
    </ValidationProvider>
</GlobalErrorBoundary>

// Reports errors to backend and displays ErrorPage with reference ID
```


### Admin Panel Controls
```jsx
import { MaintenanceControls } from '@/components/admin/MaintenanceControls';

// Features:
// - Toggle switch for enable/disable
// - Reason input field (optional)
// - Estimated end time picker (optional)
// - Real-time status via SSE
// - Confirmation dialogs before changes
```

### Error Page Components

**MaintenancePage** - Shows during maintenance mode
- Displays maintenance reason if provided
- Shows estimated end time countdown
- Auto-refreshes every 30 seconds
- Redirects when maintenance ends

**NotFoundPage (404)** - Unknown routes
- Generic "Page Not Found" message
- Navigation to dashboard
- Does NOT expose file paths

**ForbiddenPage (403)** - Access denied
- Generic "Access Denied" message
- Does NOT reveal what resource was requested
- Navigation to dashboard

**ErrorPage (500)** - Unhandled errors
- Generic "Something went wrong" message
- Shows unique error reference ID
- Retry and navigation options


### Middleware Order in server.js
```javascript
// 1. Security Middleware - FIRST (blocks threats before any processing)
app.use(securityMiddleware.protect());

// 2. Maintenance Middleware - After auth, before routes
app.use('/api', (req, res, next) => {
    // Skip for auth/health routes
    const skipPaths = ['/auth/telegram/callback', '/system/maintenance/status', '/health'];
    if (skipPaths.some(p => req.path.startsWith(p))) return next();
    return maintenanceMiddleware.checkAPI()(req, res, next);
});

// 3. Routes...

// 4. 404 Handler - After all routes
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ status: 'ERROR', error: { code: 404, message: 'Not found' }});
    }
    // Return HTML 404 page
});

// 5. Global Error Handler - LAST
app.use(globalErrorHandler.handle());
```


### Maintenance Mode DO
- Check `useMaintenanceStatus` hook in AppLayout for maintenance state
- Allow admin bypass during maintenance mode
- Persist maintenance state to database (survives server restarts)
- Broadcast status changes via SSE to all connected clients
- Show confirmation dialogs before enabling/disabling
- Include reason and estimated end time when enabling
- Log maintenance state changes to audit log

### Maintenance Mode DO NOT
- Block auth/health/maintenance-status routes during maintenance
- Expose internal error details in error pages
- Skip admin validation for Telegram commands
- Forget to initialize MaintenanceService on server startup

### Security Middleware DO
- Apply as FIRST middleware after basic Express setup
- Log blocked requests to security_logs table
- Return generic 403 without revealing security rules
- Check path traversal, SQL injection, XSS, sensitive files

### Security Middleware DO NOT
- Reveal specific security rules in error responses
- Skip logging for blocked requests
- Allow partial path traversal patterns

### Error Handling DO
- Generate unique error reference IDs (format: ERR-XXXXXXXX)
- Rate limit Telegram notifications (max 10/min per error type)
- Report errors to backend from GlobalErrorBoundary
- Show error reference ID to users for support

### Error Handling DO NOT
- Expose stack traces in production error responses
- Skip rate limiting for error notifications
- Block user flow waiting for error report


## Gateway Health Manual Control System

### Overview
Manual gateway health status control via Telegram bot inline buttons. Replaces automatic health status detection with admin-controlled status changes. Administrators receive alert notifications with action buttons when gateway metrics exceed thresholds and can decide when to change gateway health status.

### Architecture
```
HealthMetrics (alert detection only)
├── ALERT_THRESHOLDS: { CONSECUTIVE_FAILURES: 15, SUCCESS_RATE_PERCENT: 30, ROLLING_WINDOW_SIZE: 50, RECOVERY_CONSECUTIVE: 5 }
├── shouldTriggerAlert() - Check if alert thresholds exceeded
├── shouldTriggerRecovery() - Check if recovery threshold met (5 consecutive successes)
└── consecutiveSuccesses tracking for recovery detection

GatewayManagerService (manual control)
├── alertState: Map<gateway_id, { inAlert, lastAlertAt }>
├── alertCooldown: 5 minutes between alerts
├── setManualHealthStatus(gatewayId, status, options) - Manual status change
├── _checkAndSendAlert(gatewayId, metrics) - Send Telegram alert if thresholds exceeded
├── _checkAndSendRecovery(gatewayId, metrics) - Send recovery notification
└── clearAlertState(gatewayId) - Clear alert state after admin action

TelegramBotService (inline buttons)
├── sendHealthAlert({ gatewayId, gatewayLabel, currentStatus, metrics, reason }) - Alert with buttons
├── sendRecoveryNotification({ gatewayId, gatewayLabel, currentStatus }) - Recovery info
├── editMessageText(chatId, messageId, text, options) - Edit message after button click
└── answerCallbackQuery(callbackQueryId, text) - Acknowledge button click

TelegramWebhookController (button callbacks)
├── POST /api/telegram/webhook - Handle Telegram updates
├── _handleCallbackQuery(callbackQuery) - Route button clicks
├── _handleSetHealth(callbackId, gatewayId, status, from, message) - Handle status change
├── _handleDismissAlert(callbackId, gatewayId, from, message) - Handle dismiss
└── _isAdminUser(telegramId) - Validate admin authorization
```

### Key Files
- `backend/src/domain/HealthMetrics.js` - Alert threshold detection (no auto status changes)
- `backend/src/services/GatewayManagerService.js` - Manual control, alert state tracking
- `backend/src/services/TelegramBotService.js` - Inline keyboard alerts
- `backend/src/controllers/TelegramWebhookController.js` - Webhook handler for button clicks
- `backend/src/controllers/GatewayController.js` - Manual health status API endpoints
- `frontend/src/components/admin/HealthConfigPanel.jsx` - Admin panel health controls

### Alert Thresholds (Notification Only)
```javascript
// Alerts are sent when thresholds exceeded, but NO automatic status change
const ALERT_THRESHOLDS = {
    CONSECUTIVE_FAILURES: 15,      // Alert at 15+ consecutive failures
    SUCCESS_RATE_PERCENT: 30,      // Alert at <30% success rate
    ROLLING_WINDOW_SIZE: 50,       // Track last 50 requests for rate
    RECOVERY_CONSECUTIVE: 5        // Recovery notification after 5 consecutive successes
};
```

### Telegram Alert Message Format
```
⚠️ Gateway Health Alert
━━━━━━━━━━━━━━━━━━━━━━━

🔗 Gateway: Auth Gateway 1 (auth-1)
📊 Current Status: 🟢 ONLINE

📈 Metrics (last 50 requests):
• Success Rate: 25%
• Consecutive Failures: 18
• Last Error: rate_limit

⏰ Time: Jan 05, 10:30 UTC

[🔴 Mark Offline] [🟡 Mark Degraded]
[✅ Dismiss]
```

### Telegram Callback Data Format
```javascript
// Inline button callback_data (JSON stringified, max 64 bytes)
{
    action: 'set_health' | 'dismiss_alert',
    gateway_id: string,
    status?: 'online' | 'degraded' | 'offline'
}
```

### API Endpoints

**POST /api/admin/gateways/:id/health-status** (Manual status change)
```javascript
// Request body
{ status: 'offline', reason: 'Manual maintenance' }

// Response
{
    status: 'OK',
    message: 'Gateway health status updated to offline',
    gatewayId: 'auth-1',
    oldHealth: 'online',
    newHealth: 'offline',
    timestamp: '2026-01-05T10:30:00.000Z'
}
```

**POST /api/admin/gateways/:id/reset-metrics** (Reset metrics without status change)
```javascript
// Response
{
    status: 'OK',
    message: 'Health metrics reset successfully',
    gatewayId: 'auth-1',
    healthStatus: 'offline',  // Status unchanged
    metrics: { consecutiveFailures: 0, successRate: 0, ... },
    timestamp: '2026-01-05T10:30:00.000Z'
}
```

**POST /api/telegram/webhook** (Telegram callback handler)
```javascript
// Telegram sends callback_query when button clicked
// Always returns 200 OK to prevent retries
{ ok: true }
```

### Telegram Webhook Setup

The webhook allows Telegram to send button click events to your server. This is required for the inline button functionality to work.

**Prerequisites:**
- Your server must be accessible via HTTPS (Telegram requires SSL)
- The webhook URL must be publicly accessible (not localhost)
- Supported ports: 443, 80, 88, or 8443

**Step 1: Set the webhook URL**
After deployment, run this command (replace placeholders):
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_SERVER_URL>/api/telegram/webhook"
```

**Example:**
```bash
curl -X POST "https://api.telegram.org/bot123456789:ABCdefGHIjklMNOpqrsTUVwxyz/setWebhook?url=https://yourdomain.com/api/telegram/webhook"
```

**Step 2: Verify webhook is set**
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

**For local development (using ngrok):**
```bash
# Start ngrok tunnel
ngrok http 3000

# Use the ngrok HTTPS URL for webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://abc123.ngrok.io/api/telegram/webhook"
```

**To remove webhook:**
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

**Environment Variables Required:**
```bash
TELEGRAM_BOT_TOKEN=your-bot-token      # Same token used for SSO
TELEGRAM_ADMIN_CHAT_ID=your-chat-id    # Admin chat for notifications
```

### Alert Flow
1. Gateway records failure via `recordFailure()`
2. `_checkAndSendAlert()` checks if thresholds exceeded
3. If alert conditions met AND cooldown passed (5 min), send Telegram alert
4. Alert includes inline buttons: "Mark Offline", "Mark Degraded", "Dismiss"
5. Admin clicks button → webhook receives callback
6. `TelegramWebhookController` validates admin and processes action
7. Status updated via `setManualHealthStatus()` → SSE broadcast → audit log

### Recovery Flow
1. Gateway records success via `recordSuccess()`
2. `_checkAndSendRecovery()` checks if gateway is in alert state
3. If 5 consecutive successes, send recovery notification
4. Clear alert state (no buttons needed - informational only)

### Integration with Services
```javascript
// Services call recordSuccess/recordFailure which triggers alert checks
// NO automatic status changes - only alerts sent

// In validation service
if (this.gatewayManager) {
    if (result.isApproved() || result.isDeclined()) {
        // Records success, may trigger recovery notification
        this.gatewayManager.recordSuccess(gatewayId, latencyMs);
    } else if (result.status === 'ERROR') {
        // Records failure, may trigger alert notification
        this.gatewayManager.recordFailure(gatewayId, result.message);
    }
}
```

### Gateway Health Manual Control DO
- Use `setManualHealthStatus()` for all health status changes
- Check admin authorization before processing Telegram callbacks
- Enforce 5-minute cooldown between alerts for same gateway
- Clear alert state when admin takes action (status change or dismiss)
- Always return 200 OK to Telegram webhook (prevents retries)
- Log all manual status changes to audit log
- Broadcast status changes via SSE

### Gateway Health Manual Control DO NOT
- Automatically change health status based on metrics
- Send alerts more frequently than 5-minute cooldown
- Allow non-admin users to change status via Telegram
- Skip SSE broadcast after status change
- Forget to clear alert state after admin action
- Block webhook response waiting for status update

