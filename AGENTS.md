# AGENTS.md

Quick operational guide for coding agents working in `raad_lms_frontend`.

## Mission

Build and update features in a way that stays consistent with the existing Raad LMS frontend architecture, UI patterns, and API contract.

## Stack Snapshot

- React 19 + TypeScript (strict)
- Vite + Bun
- Tailwind CSS v4 + shadcn/ui
- Zustand (client state only)
- React Query (`useQueryApi`, `useMutationApi`) for server state
- React Hook Form + Zod for forms
- React Router v7 (lazy routes)
- Apisauce-based API layer (`callApi`)
- Icon set: `iconoir-react` only

## Project Layout (high signal)

- `src/modules/*` → feature modules (UserManagement, Course, Notifications)
- `src/routes/*` → app and protected route registration
- `src/components/ui/*` → shared UI primitives (DataTable, Button, etc.)
- `src/hooks/common/*` → shared API/query helpers
- `src/store/*` → Zustand stores (auth, layout, errors)
- `src/assets/css/index.css` → global design tokens and theme variables

## Core Coding Patterns

### Components

- Use arrow-function components with typed `interface` props.
- Prefer `export default` at bottom.
- Use `@/` path alias for imports from `src`.
- Keep imports ordered logically: React/hooks/components/icons/types/utils.
- Do not use `React.FC`.

### Data Fetching

- Use `useQueryApi` for GET endpoints.
- Use `useMutationApi` for POST/PUT/DELETE.
- Use `useApi` only for imperative/one-off requests.
- Route all requests through `callApi` (never direct `fetch`/`axios`).

### State Management

- Use Zustand for client-side state only (auth, layout, UI/error state).
- Keep server-fetched data in React Query, not Zustand.
- Persist only needed UI preferences, with `raad-lms-` key prefix.

### Forms

- Use React Hook Form + Zod resolver.
- Define schema first, infer types from schema.
- Keep validation errors user-facing and explicit.
- Avoid duplicate success/error toasts when `callApi` already handles them.

### Routing & Permissions

- Protected pages are under `MainLayout`.
- Register routes in `src/routes/ProtectedRoutes.tsx`.
- Enforce permissions in routes and UI (`ProtectedRoute`, `Can`, `CanAny`).
- Keep central route references aligned in `src/routes/Routes.ts`.

### Tables & CRUD Pages

- Use shared `DataTable` for index/list pages.
- Keep server-side search/sort/pagination/filter contract:
  - query: `search`, `page`, `per_page`, `sort_by`, `sort_dir`, filters...
  - response: `data[]` + `meta.pagination`
- Use `useDataTableParams` for table state.

## UI & Design Rules

- Use Tailwind utility classes; avoid inline styles.
- Reuse tokens from `src/assets/css/index.css`.
- Maintain light/dark mode parity.
- Standard page wrapper: `space-y-6`.
- Prefer border-based visual separation over heavy shadows.
- Loading indicators should use shared `Spinner`.

## Naming & File Conventions

- Component/Page: PascalCase (`UserList.tsx`, `Dashboard.tsx`)
- Hook: camelCase with `use` prefix (`useUsers.ts`)
- Store: camelCase with `Store` suffix (`authStore.ts`)
- Models/Schemas: PascalCase files (`User.ts`)
- Constants/Utilities: camelCase (`endpoints.ts`, `formatDate.ts`)
- Feature routes: `routes/index.tsx`

## Do

- Keep features modular in `src/modules/<FeatureName>/`.
- Add endpoint constants and query keys before writing hooks.
- Reuse shared UI components and established variants.
- Handle loading, empty, error, and permission states explicitly.
- Keep TypeScript strict and avoid implicit `any`.

## Don't

- Do not use `lucide-react` (use `iconoir-react` only).
- Do not use direct `fetch()`/`axios`.
- Do not store server state in Zustand.
- Do not hardcode API URLs or route strings when shared helpers/constants exist.
- Do not bypass Zod validation for forms.
- Do not skip permission checks for protected UI/actions.
- Do not add `console.log` in committed code.

## New Feature Quick Checklist

1. Add module constants (`endpoints`, `query keys`).
2. Add Zod models/types (`Create*`, `Update*` schemas).
3. Add hooks (`useQueryApi`, `useMutationApi`).
4. Build pages/components (DataTable for lists).
5. Register module routes in `ProtectedRoutes`.
6. Add route aggregate entries (if used for menus/breadcrumbs).
7. Verify permission guards in route + UI actions.
8. Confirm API contract compatibility (`success`, `message`, `data`, `meta`).

## Reference Docs

- `README.FRONTEND.LLM.md` → full coding standards and examples.
- `DESIGN.md` → unified visual/layout system and token conventions.

## Course hub (recent surface area)

- Routes live in `src/modules/Course/routes/index.tsx`: list, **create wizard**, **edit wizard**, **`/course/courses/:courseId/view`** (catalog-style read-only page). Use `useCourseEntity*` hooks and permission keys `course.courses.*`.
