---
inclusion: always
---

# Development Guidelines

## Project Architecture

### Frontend Structure (React + Vite + Tailwind)

```
frontend/src/
├── components/
│   ├── layout/           # Layout components (TwoPanelLayout)
│   ├── navigation/       # Navigation components (TopTabBar, BottomNav, IconRail)
│   ├── stripe/           # Stripe validation components
│   │   ├── panels/       # Panel components (KeysValidationPanel, CardsValidationPanel)
│   │   └── ResultsPanel.jsx  # Shared results panel with stats, pagination
│   └── ui/               # Reusable UI components (Badge, Button, Card, Input)
├── contexts/             # React contexts (ThemeContext)
├── hooks/                # Custom hooks (useTheme, useLocalStorage, useMediaQuery)
├── lib/                  # Utility libraries (utils.js with cn() helper)
└── index.css             # Centralized CSS with Luma theme
```

### CSS Architecture (Luma Theme 2025)

All styling uses centralized CSS classes in `index.css`:

**Status Classes:**
- `.status-live`, `.status-dead`, `.status-error` - Border indicators
- `.status-indicator-live`, `.status-indicator-dead`, `.status-indicator-error` - Badge styling

**Capability Badges:**
- `.capability-badge` - Base badge styling
- `.capability-enabled`, `.capability-disabled` - State variants
- `.capability-blue`, `.capability-purple`, `.capability-pink` - Color variants

**Text Classes:**
- `.text-mono-key`, `.text-mono-pk`, `.text-mono-sm` - Monospace text
- `.text-meta`, `.text-truncate` - Metadata and truncation
- `.text-balance`, `.text-balance-pending` - Balance display

**Input Classes:**
- `.input-container-unified` - Unified input container with toolbar
- `.input-textarea`, `.input-toolbar` - Input elements
- `.input-action-btn`, `.input-action-btn-primary`, `.input-action-btn-stop` - Action buttons
- `.count-badge` - Item count badges

**Empty State Classes:**
- `.empty-state`, `.empty-state-icon`, `.empty-state-icon-lg`
- `.empty-state-title`, `.empty-state-subtitle`

**Icon Action Classes:**
- `.icon-action`, `.icon-action-copy`, `.icon-action-delete`, `.icon-action-refresh`
- `.icon-btn-sm` - Small inline icon buttons

**Navigation Classes:**
- `.nav-container` - Glass morphism nav wrapper with backdrop blur
- `.nav-btn`, `.nav-btn-active` - Nav button base and active states
- `.nav-btn-label` - Nav button text label
- `.nav-btn-coming-soon` - Dimmed state for coming soon items
- `.nav-icon-container` - Icon wrapper in nav buttons
- `.nav-chevron` - Dropdown chevron icon
- `.nav-badge-soon` - "Coming Soon" badge
- `.nav-user-container`, `.nav-user-name` - User info section
- `.nav-dropdown` - Dropdown menu container
- `.nav-dropdown-item`, `.nav-dropdown-item-active` - Dropdown items
- `.nav-dropdown-item-label`, `.nav-dropdown-item-desc` - Dropdown text
- `.nav-dropdown-icon` - Dropdown item icon container

**Theme Colors (CSS Variables):**
- `--luma-coral`, `--luma-coral-dark` - Primary accent
- `--luma-bg`, `--luma-surface`, `--luma-surface-muted` - Backgrounds
- `--luma-text`, `--luma-text-secondary`, `--luma-text-muted` - Text hierarchy
- Dark mode: `.dark` class toggles bubble gum theme with pink accents

### Backend Structure (Node.js + Express)

```
backend/src/
├── controllers/          # Route handlers (CardController, KeyController)
├── domain/               # Domain models (Card, Proxy, StripeKeys)
├── infrastructure/       # External services (Stripe API, Browser, HTTP)
├── services/             # Business logic (ValidationFacade, KeyCheckerService)
├── validators/           # Validation strategies (ChargeValidator, SetupValidator)
└── server.js             # Express server entry point
```

## Custom Commands (Slash Commands)

Custom commands are defined in `.agents/commands/`. Access them via command palette.

| Command | Description |
|---------|-------------|
| `/addtask` | Add a new task |
| `/analyze` | Analyze code or files |
| `/bugfinder` | Find bugs in codebase |
| `/code` | Write or generate code |
| `/commit` | Create git commits |
| `/deepcode` | Deep code analysis |
| `/docs` | Generate documentation |
| `/plan` | Create plans |
| `/pr-review` | PR code review |
| `/review` | Code review |
| `/search` | Search codebase |

## Common Development Commands

**Backend:**
- `cd backend && npm run dev` - Development with --watch flag
- `cd backend && npm start` - Production server

**Frontend:**
- `cd frontend && npm run dev` - Vite dev server (port 3000)
- `cd frontend && npm run build` - Production build
- `cd frontend && npx vitest --run` - Run tests

## Code Style Conventions

### Backend (Node.js + Express)
- ES6 modules with `.js` extension in imports
- Async/await pattern throughout
- camelCase for functions and variables

### Frontend (React + Vite)
- Functional components with hooks
- PascalCase for component names: `KeysValidationPanel.jsx`
- Use centralized CSS classes from `index.css` instead of inline Tailwind
- Use `cn()` utility from `lib/utils.js` for conditional class names
- Framer Motion for animations
- All colors should use CSS variables for theme consistency
