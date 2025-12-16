# AGENTS.md

## Overview
Stripe card validation tool: React + Vite frontend, Node.js + Express backend.

## Architecture

### Backend
- **Pattern**: DI container in `server.js`
- **Flow**: Controllers → Services → Validators (Strategy) → Domain → Infrastructure
- **Key**: `ValidationFacade` orchestrates validation, `ValidatorFactory` creates validators

### Frontend
- **Layout**: `TwoPanelLayout` - results first on mobile, config in drawer
- **Styling**: CSS classes in `index.css` (Luma theme), use `cn()` for merging
- **Responsive**: `useBreakpoint()` hook, mobile < 768px

## CSS Quick Reference
- **Status**: `.status-live`, `.status-dead`, `.status-error`
- **Surfaces**: `.surface-glass`, `.surface-glass-strong`, `.surface-glass-muted`
- **Layout**: `.app-shell`, `.panel-scroll`, `.results-scroll`
- **Nav**: `.nav-btn`, `.nav-mobile-trigger`, `.nav-mobile-menu`
- **Theme vars**: `--luma-coral`, `--luma-bg`, `--luma-text`, `--app-dvh`

## Agent Rules

### DO
- Use `.js` extension in all imports
- Use existing CSS classes from `index.css`
- Use `useBreakpoint()` for responsive logic
- Use `--app-dvh` for viewport height
- Use `Drawer` component for mobile slide-ins
- Follow DI pattern in backend

### DO NOT
- Use inline Tailwind - use predefined CSS classes
- Use `100vh` - use `--app-dvh`
- Create new color values - use CSS variables
- Bypass service layer in controllers
- Hardcode breakpoints - use `useBreakpoint()`
