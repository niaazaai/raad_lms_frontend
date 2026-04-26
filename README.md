# Raad LMS — Frontend

React 19 + TypeScript SPA with Vite, Tailwind CSS v4, and shadcn/ui.

## Tech Stack

- **React 19** + TypeScript 5.7 (strict mode)
- **Vite 6** + Bun (build & runtime)
- **Tailwind CSS v4** (CSS-first config)
- **shadcn/ui** (Radix UI primitives + CVA variants)
- **Zustand 5** (global state — auth, layout, errors)
- **React Query v5 / TanStack Query** (server state)
- **React Hook Form + Zod** (form validation)
- **React Router v7** (routing with lazy loading)
- **Apisauce** (HTTP client)
- **Sonner** (toast notifications)
- **Iconoir React** (icons) + shared **`Spinner`** component for loading states

## Features Included

- Login / Register pages
- Email verification flow
- Two-Factor Authentication (2FA) UI
- Admin Dashboard with stats
- User management (CRUD with DataTable)
- Role management (CRUD)
- Permission management (read-only)
- Course catalog hub (categories, courses, lessons, subscriptions, classes, etc.) with permission-gated admin UI
- Settings page
- Dark mode support
- Responsive sidebar navigation
- Permission-gated UI components (`<Can>`, `<CanAny>`)
- Docker-based deployment

## Color Scheme

- **Primary:** `#0069B4` (blue)
- **Auxiliary:** `#9B3D9A` (purple)

## Quick Start

```bash
# 1. Install dependencies for IDE support
make install

# 2. Copy env
cp .env.example .env

# 3. Start production container
make up
```

## Available Commands

| Command | Description |
|---------|-------------|
| `make up` | Build and start frontend |
| `make down` | Stop container |
| `make install` | Install deps (for IDE) |
| `make force-rebuild` | Full rebuild |
| `make health` | Verify frontend |
| `make logs` | Follow logs |

## Adding New Features

See `README.FRONTEND.LLM.md` for detailed coding patterns, component architecture, and the new feature checklist.
