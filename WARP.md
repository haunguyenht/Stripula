# WARP.md

## Overview
Stripe card validation tool: React + Vite frontend (port 4000), Node.js + Express backend (port 5001).

## Commands
```bash
# Dev
cd backend && npm run dev
cd frontend && npm run dev

# Test & Lint
cd frontend && npm run test
cd frontend && npm run lint
```

## Architecture

### Backend
- **Pattern**: Dependency injection via container in `server.js`
- **Structure**: Controllers → Services → Validators (Strategy pattern) → Domain → Infrastructure
- **Key files**: `ValidationFacade` (orchestration), `ValidatorFactory` (creates validators from `VALIDATION_METHODS`)

### Frontend
- **Layout**: `TwoPanelLayout` with drawer for mobile (<768px)
- **Styling**: CSS classes in `index.css`, NOT inline Tailwind. Use `cn()` for merging.
- **Theme**: CSS variables (`--luma-*`), use `--app-dvh` for viewport height

## Agent Rules

### DO
- Use `.js` extension in all imports
- Use existing CSS classes from `index.css`
- Use `useBreakpoint()` hook for responsive logic
- Follow DI pattern - inject dependencies via constructor
- Add new validators via `ValidatorFactory`

### DO NOT
- Use inline Tailwind classes - use predefined CSS classes
- Use `100vh` - use `--app-dvh`
- Create new styling patterns - extend existing theme
- Bypass the service layer in controllers
