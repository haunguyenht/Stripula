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

### DO NOT
- Create custom CSS classes - use Tailwind utilities
- Use `100vh` - use `--app-dvh` or `h-screen`
- Create new color values - use shadcn CSS variables
- Use `framer-motion` - use `motion` package instead
- Bypass service layer in controllers
- Use `.js` extension in imports - use extensionless
- Add inline styles - use Tailwind classes

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
