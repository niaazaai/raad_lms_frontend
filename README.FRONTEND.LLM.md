# Raad LMS Frontend — LLM Context & Coding Standards

> **Purpose:** This file provides complete context for an LLM to generate code that is consistent with this codebase in terms of patterns, naming, architecture, UI/UX design, and quality standards. Feed this file to the LLM before issuing any task.

---

## Architecture Overview

```
Browser → Host Nginx (HTTPS, security headers, routing)
  ├── /* → Docker frontend :3000 (Nginx serving static React SPA)
  ├── /api/* → Docker backend :8000 (FrankenPHP + Octane workers)
  └── /sanctum/* → Docker backend :8000
```

**Tech Stack:**
- React 19 + TypeScript 5.7 (strict mode)
- Vite 6 + Bun (build & runtime)
- Tailwind CSS v4 (CSS-first config, no `tailwind.config.js`)
- shadcn/ui (Radix UI primitives + CVA variants)
- Zustand 5 (global state — auth, layout, errors)
- React Query v5 / TanStack Query (server state)
- React Hook Form + Zod (form validation)
- React Router v7 (routing with lazy loading)
- Apisauce (HTTP client wrapping Axios)
- Sonner (toast notifications)
- Lucide React (icons)
- date-fns (date formatting)

**Two app areas:**
- **Public website** — `PublicLayout` (header + footer). Routes: `/`, `/search/food`, `/search/restaurants`, `/restaurants/:slug`, `/gallery`, `/saved`, `/basket`, `/checkout`, `/orders`, `/about`, `/contact`, and CMS static pages (e.g. `/privacy`, `/terms`, `/cookies`, `/refund`, `/help-center`) via dynamic `:slug` under `StaticPageLayout`. Data from `@/modules/Public` (useHomepage, usePublicRestaurants, useSearchMenuItems, usePublicStaticPage). Basket and saved state from Zustand (persisted). The public header uses the global auth store: when authenticated it shows the user avatar/name and links to the user’s type‑specific dashboard using `getDashboardPath(user.type)`.
- **Dashboard (protected)** — `MainLayout` (sidebar + header). Routes: `/dashboard` (admin), `/courier`, `/restaurant`, `/customer/dashboard`, `/settings`, `/restaurants/*`, `/users/*`, `/roles/*`, `/permissions/*`, `/static-pages/*`. Permission-gated via `ProtectedRoute`; config in `ProtectedRoutes.tsx` and `Routes.ts`. Non‑admin user types are redirected away from `/dashboard` to their own default dashboard path using `getDashboardPath`.

---

## Project Structure

```
src/
├── assets/css/index.css         # Tailwind v4 + design tokens (CSS variables)
├── components/
│   ├── ui/                      # shadcn/ui (Button, Input, Card, DataTable, DropdownMenu, etc.)
│   ├── errors/                  # ErrorFallback, error boundary components
│   └── BasketDrawer.tsx         # Mini basket drawer (public header)
├── data/
│   ├── constants/               # API_ENDPOINTS, REQUEST_METHODS
│   ├── enums/                   # TypeScript enums (shared across modules)
│   └── models/                  # Zod schemas + inferred types (global: User, etc.)
├── features/
│   └── auth/                    # Auth feature (AuthWrapper, ProtectedRoute, Can, useAuth)
├── hooks/
│   └── common/                  # useApi, useQueryApi, useMutationApi, useDebounce
├── layouts/
│   ├── components/              # Header, Sidebar (MainLayout); PublicHeader, PublicFooter (public site)
│   ├── MainLayout.tsx           # Dashboard / protected area layout
│   └── PublicLayout.tsx         # Public website layout (header + footer + Outlet)
├── lib/                         # Utility functions (cn, formatDate, etc.)
├── modules/                     # Feature modules (self-contained)
│   ├── Public/                  # Public API (no auth): endpoints, models, hooks (useHomepage, usePublicRestaurants, usePublicStaticPage, usePublicStaticPages, etc.)
│   ├── Cms/                     # Static pages CRUD: StaticPageList, StaticPageForm, useStaticPages
│   ├── Courier/                 # Courier management: CourierList, useCouriers
│   ├── Restaurant/
│   │   ├── components/          # Module-specific components
│   │   ├── data/
│   │   │   ├── constants/       # RESTAURANT_ENDPOINTS, RESTAURANT_QUERY_KEYS
│   │   │   └── models/          # Restaurant.ts (Zod schemas + types)
│   │   ├── hooks/               # useRestaurants, useCreateRestaurant, etc.
│   │   ├── pages/               # RestaurantList, RestaurantDetail, etc.
│   │   └── routes/              # RestaurantRoutes array
│   └── UserManagement/          # Same structure as Restaurant
├── pages/                       # Top-level pages
│   ├── public/                  # Public website: HomePage, FoodSearchPage, BasketPage, CheckoutPage, etc.
│   ├── auth/                    # Login, Register, VerifyEmail, VerifyEmailSuccess, VerifyEmailExpired
│   ├── errors/                  # NotFound, Unauthorized
│   └── Dashboard.tsx            # Admin dashboard; other dashboards are type-specific pages (e.g. Courier, Restaurant, Customer)
├── providers/                   # QueryProvider (React Query config)
├── routes/
│   ├── AppRoutes.tsx            # Root routing (location-aware); PublicLayout + Layout (protected)
│   ├── ProtectedRoutes.tsx     # Flattened protected route config (dashboard + modules)
│   ├── base.ts                  # protectedRoutePrefix, create, show, search constants
│   └── Routes.ts                # Central route aggregate (restaurant, userManagement) for menus/breadcrumbs
├── services/                    # apiClient.ts, callApi.ts (API layer)
├── store/                       # Zustand stores
│   ├── auth/                    # authStore
│   ├── layout/                  # layoutStore (theme, sidebar)
│   ├── errors/                  # errorStore
│   ├── basket/                  # basketStore (persist) — cart items
│   └── saved/                   # savedStore (persist) — liked/saved menu items
├── types/                       # Shared types (api.ts, base.ts, routes.ts, datatable.ts)
├── utils/
│   └── routeHandling.ts         # getProtectedRoute, getCreateRoute, getSearchRoute, getShowRoute, makeShowRoute
├── App.tsx                      # Root component with Toaster + ConfirmDialog
└── main.tsx                     # Entry point with ErrorBoundary + AuthWrapper
```

---

## Coding Patterns & Rules

### 1. Component Pattern

Every component follows this structure:

```tsx
import { useState } from "react";
import { useAuth } from "@/features/auth";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { SomeIcon } from "lucide-react";

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

const MyComponent = ({ title, onAction }: MyComponentProps) => {
  const { hasPermission } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* content */}
      </CardContent>
    </Card>
  );
};

export default MyComponent;
```

**Rules:**
- Arrow function components, `export default` at the bottom
- Props typed with `interface`, not `type`
- Path alias: `@/` maps to `src/`
- Imports order: React → hooks → components → icons → types → utils
- No `React.FC` — use plain typed props
- Destructure props in the function signature

### 2. Page Pattern

Pages are lazy-loaded and wrapped in `Suspense`:

```tsx
// pages/MyFeaturePage.tsx
import { useMyFeatureData } from "@/modules/MyFeature/hooks";
import { Button } from "@/components/ui";

const MyFeaturePage = () => {
  const { data, isLoading } = useMyFeatureData();

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Feature</h1>
        <Button>Add New</Button>
      </div>
      {/* page content */}
    </div>
  );
};

export default MyFeaturePage;
```

### 3. State Management (Zustand)

**Global stores (single entry: `src/store/index.ts`):**
- **auth** — user, `type`, permissions, login/logout, fetchUser (hydrated from `/api/v1/auth/me` using Sanctum session cookie)
- **layout** — theme, sidebar, screen size (persist: themeMode, userSettings)
- **errors** — global error list / toasts
- **basket** — cart items (persist: `raad-lms-basket`); addItem, removeItem, updateQuantity, totalPrice
- **saved** — liked/saved menu items (persist: `raad-lms-saved`); toggleSaved, isSaved, removeSaved

```tsx
import { create } from "zustand";
import { persist } from "zustand/middleware"; // only if persistence needed

interface MyState {
  items: Item[];
  selectedItem: Item | null;
  setItems: (items: Item[]) => void;
  selectItem: (item: Item | null) => void;
  reset: () => void;
}

export const useMyStore = create<MyState>()((set) => ({
  items: [],
  selectedItem: null,
  setItems: (items) => set({ items }),
  selectItem: (item) => set({ selectedItem: item }),
  reset: () => set({ items: [], selectedItem: null }),
}));
```

**Rules:**
- Zustand is for client-only state (auth session, UI layout, error tracking, basket, saved items)
- Server state (API data) uses React Query, NOT Zustand
- Store files live in `src/store/<domain>/`
- Export both the store hook and the state interface from `src/store/index.ts`
- Use `persist` middleware for basket and saved so they survive refresh

### 4. API & Data Fetching

**All API calls go through `callApi()`.** Never use `fetch()` or `axios` directly.

```tsx
// hooks/useMyFeature.ts
import { useQueryApi, useMutationApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { MY_ENDPOINTS, MY_QUERY_KEYS } from "../data/constants";

export function useMyItems(params?: Record<string, unknown>) {
  return useQueryApi<MyItem[]>({
    queryKey: [...MY_QUERY_KEYS.items, params],
    url: MY_ENDPOINTS.ITEMS.BASE,
    method: RequestMethod.GET,
    params,
  });
}

export function useCreateItem() {
  return useMutationApi<MyItem, CreateItemData>({
    url: MY_ENDPOINTS.ITEMS.BASE,
    method: RequestMethod.POST,
    invalidateKeys: [MY_QUERY_KEYS.items],
  });
}

export function useUpdateItem(id: number) {
  return useMutationApi<MyItem, UpdateItemData>({
    url: MY_ENDPOINTS.ITEMS.BY_ID(id),
    method: RequestMethod.PUT,
    invalidateKeys: [MY_QUERY_KEYS.items],
  });
}

export function useDeleteItem(id: number) {
  return useMutationApi<void, void>({
    url: MY_ENDPOINTS.ITEMS.BY_ID(id),
    method: RequestMethod.DELETE,
    invalidateKeys: [MY_QUERY_KEYS.items],
  });
}
```

**Rules:**
- `useQueryApi` for GET requests (React Query `useQuery`)
- `useMutationApi` for POST/PUT/DELETE (React Query `useMutation`)
- `useApi` for imperative calls (rare — use for one-off actions)
- CSRF is handled automatically by `callApi` for state-changing requests
- 419 responses auto-retry with fresh CSRF token

### 5. Endpoints & Query Keys

```tsx
// modules/MyFeature/data/constants/endpoints.ts
export const MY_ENDPOINTS = {
  ITEMS: {
    BASE: "/my-items",
    BY_ID: (id: number) => `/my-items/${id}`,
    STATUS: (id: number) => `/my-items/${id}/status`,
  },
} as const;

export const MY_QUERY_KEYS = {
  items: ["my-items"] as const,
  item: (id: number) => ["my-items", id] as const,
};
```

### 6. User Management — Status & Hooks

**User status (UserManagement module):** Only `active` and `inactive`. Labels:
- `active` → display label **"Activate"**
- `inactive` → display label **"Suspend"**

**UserStatus enum** (`src/modules/UserManagement/data/models/User.ts` and `src/data/enums/index.ts`):
```ts
export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}
export const UserStatusLabels: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: "Activate",
  [UserStatus.INACTIVE]: "Suspend",
};
```

**Legacy API values:** If the API returns `suspended` or `pending`, treat them as `inactive` for display and toggle logic (e.g. `const isInactive = raw === "inactive" || raw === "suspended" || raw === "pending"`).

**UserManagement hooks** (`src/modules/UserManagement/hooks/useUsers.ts`):
- `useUsers(params)` — list users
- `useUser(id)` — single user
- `useCreateUser()` — create
- `useUpdateUser(id)` — update (when id is fixed, e.g. in form)
- **`useUpdateUserMutation()`** — update any user by id (for list actions; accepts `{ id, data }`)
- **`useDeleteUserMutation()`** — delete any user by id (for list actions; accepts `{ id }`)

When using UserList or any component that performs update/delete on rows, **import both** `useUpdateUserMutation` and `useDeleteUserMutation` from `../../hooks` (relative to the feature folder).

---

### 7. Zod Schemas & Types

Models live alongside the feature module. Schema FIRST, type inferred from schema.

```tsx
// modules/MyFeature/data/models/MyItem.ts
import * as z from "zod";

export enum MyItemStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export const MyItemStatusLabels: Record<MyItemStatus, string> = {
  [MyItemStatus.DRAFT]: "Draft",
  [MyItemStatus.ACTIVE]: "Active",
  [MyItemStatus.ARCHIVED]: "Archived",
};

export const MyItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.nativeEnum(MyItemStatus),
  description: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type MyItem = z.infer<typeof MyItemSchema>;

export const CreateMyItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(5000).optional(),
  status: z.nativeEnum(MyItemStatus).optional(),
});

export type CreateMyItemData = z.infer<typeof CreateMyItemSchema>;

export const UpdateMyItemSchema = CreateMyItemSchema.partial();
export type UpdateMyItemData = z.infer<typeof UpdateMyItemSchema>;
```

**Rules:**
- Schema name: `<Entity>Schema`, type: `<Entity>`
- Form schemas: `Create<Entity>Schema`, `Update<Entity>Schema`
- Enum labels and colors maps alongside enums
- API response types use the schema type; form types use form schema types
- Nullable API fields: `.nullable().optional()`
- Required form fields: plain validators with error messages

### 8. Forms (React Hook Form + Zod)

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateMyItemSchema, type CreateMyItemData } from "../data/models";
import { Button, Input, Label } from "@/components/ui";
import { toast } from "sonner";

interface CreateMyItemFormProps {
  onSuccess?: () => void;
}

const CreateMyItemForm = ({ onSuccess }: CreateMyItemFormProps) => {
  const { mutateAsync, isPending } = useCreateItem();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateMyItemData>({
    resolver: zodResolver(CreateMyItemSchema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = async (data: CreateMyItemData) => {
    try {
      await mutateAsync(data);
      // Success toast: callApi shows it when backend returns `message`; avoid duplicate toast
      reset();
      onSuccess?.();
    } catch {
      // Error toast handled by callApi
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} placeholder="Enter name" />
        {errors.name && <p className="text-sm text-danger">{errors.name.message}</p>}
      </div>
      <Button type="submit" loading={isPending}>Create</Button>
    </form>
  );
};
```

### 8. Routing, User Types & Permissions

**Route architecture (aligned with central config + helpers):**

- **`src/routes/base.ts`** — Segment constants and protected prefix:
  - `protectedRoutePrefix` (e.g. `"dashboard"`)
  - `create`, `show`, `search` (for building paths)
- **`src/utils/routeHandling.ts`** — Path helpers (use with `@/routes/base`):
  - `getProtectedRoute(route?)` — `/dashboard` or `/dashboard/${route}`
  - `getCreateRoute(route)` — `${route}/create`
  - `getSearchRoute(route)` — `${route}/search`
  - `getShowRoute(route, idParamName?)` — `${route}/show/:id`
  - `makeShowRoute(route, id)` — `${route}/show/${id}`
- **`src/routes/Routes.ts`** — Central aggregate of module route configs (e.g. `routes.restaurant`, `routes.userManagement`). Use for breadcrumbs, menus, or any non-React reference.
- **`src/routes/AppRoutes.tsx`** — Uses `useLocation()` and `<Routes location={location}>`. Three groups:
  1. **Public (PublicLayout)** — `/`, `/search/food`, `/search/restaurants`, `/restaurants/:slug`, `/gallery`, `/saved`, `/basket`, `/checkout`, `/checkout/thank-you`, `/orders`, `/courier-signup`, `/about`, `/contact`, CMS static pages via `StaticPageLayout` (dynamic `:slug`: `/privacy`, `/terms`, `/cookies`, `/refund`, `/help-center`, etc.). No auth.
  2. **Auth (no layout)** — `/login`, `/register`, `/verify-email`, `/verify-email/success`, `/verify-email/expired`
  3. **Protected (Layout / MainLayout)** — Each route from `ProtectedRoutes.tsx` mapped to `<Route path={...} element={<Layout />}><Route index element={content} /></Route>`. Content wrapped in `ProtectedRoute` with optional `permission` / `anyPermission`. `AuthWrapper` runs `fetchUser()` on mount and redirects unauthenticated users to `/login?redirect=...`.

**Defining module routes:**

```tsx
// modules/MyFeature/routes/index.tsx
import { lazy } from "react";
import type { ProtectedRouteType } from "@/types/routes";

const MyItemList = lazy(() => import("../pages/MyItemList"));
const MyItemDetail = lazy(() => import("../pages/MyItemDetail"));

export const MyFeatureRoutes: ProtectedRouteType[] = [
  { path: "/my-items", component: <MyItemList />, permission: "my-items.read" },
  { path: "/my-items/:id", component: <MyItemDetail />, permission: "my-items.read" },
];
```

Register in `src/routes/ProtectedRoutes.tsx`:

```tsx
import { MyFeatureRoutes } from "@/modules/MyFeature/routes";

const ProtectedRoutes: ProtectedRouteType[] = [
  { path: "/dashboard", component: <Dashboard />, permission: "" },
  ...RestaurantRoutes,
  ...UserManagementRoutes,
  ...CmsRoutes,
  ...MyFeatureRoutes,  // ← add here
];
```

When adding a new module, also add its routes to `src/routes/Routes.ts` for the central aggregate.

**Permission-gated UI:**

```tsx
import { Can, CanAny } from "@/features/auth";

// Single permission
<Can permission="my-items.create">
  <Button onClick={handleCreate}>Add Item</Button>
</Can>

// Any of multiple permissions
<CanAny permissions={["my-items.update", "my-items.delete"]}>
  <ActionsDropdown />
</CanAny>
```

### 10. Confirmation Dialogs

```tsx
import { useConfirmDialog, confirmPresets } from "@/components/ui/confirm-dialog";

const handleDelete = async (id: number) => {
  const confirmed = await confirm(confirmPresets.delete("item"));
  if (!confirmed) return;
  await deleteItem(id);
  toast.success("Item deleted");
};
```

### 11. DataTable Component

**The DataTable is the standard, production-grade table component used across the application.** Use it for all list/CRUD pages that display tabular data.

**Location:** `src/components/ui/data-table.tsx`  
**Types:** `src/types/datatable.ts`  
**Hook:** `src/hooks/common/useDataTableParams.ts`

**Features:**
- **Server-side search** — debounced (400ms default), only re-renders DataTable, not the whole page
- **Server-side pagination** — page, per_page; default 10, options: 10, 25, 50, 100, 250
- **Server-side sorting** — sort_by, sort_dir per column
- **Excel-like column filters** — dropdown per column with configurable options; can be disabled per column or globally
- **Actions column** — dropdown with Edit, Delete, custom actions
- **Horizontal scroll** — table scrolls horizontally when many columns; page layout does not scroll
- **Fully configurable** — all options set at initialization
- **Reusable** — same component for Users, Restaurants, Static Pages, etc.
- **Typesense placeholder** — architecture supports future search adapter integration

**Usage pattern:**

```tsx
import { DataTable, useConfirmDialog, confirmPresets } from "@/components/ui";
import { useDataTableParams } from "@/hooks";
import type { DataTableConfig, DataTablePaginationMeta } from "@/types/datatable";

const MyListPage = () => {
  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 10,
    defaultSortBy: "created_at",
    defaultSortDir: "desc",
    searchDebounceMs: 400,
  });

  const apiParams = {
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
    ...params.filters, // e.g. status, category
  };

  const { data, isLoading } = useMyItems(apiParams);
  const items = extractListFromResponse(data);
  const pagination = extractPaginationFromResponse(data);

  const config: DataTableConfig<MyItem> = {
    columns: [
      {
        key: "name",
        header: "Name",
        render: (row) => <span>{row.name}</span>,
        sortable: true,
        filterable: false,
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <StatusBadge status={row.status} />,
        sortable: true,
        filterable: true,
        filterOptions: [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ],
      },
    ],
    rowId: (row) => row.id,
    searchable: true,
    searchPlaceholder: "Search...",
    filtersEnabled: true,
    pageSizeOptions: [10, 25, 50, 100, 250],
    defaultPageSize: 10,
    paginationEnabled: true,
    emptyMessage: "No records found.",
    actions: [
      { key: "edit", label: "Edit", icon: <Edit />, onClick: (row) => navigate(`/items/${row.id}/edit`) },
      { key: "delete", label: "Delete", icon: <Trash2 />, variant: "danger", onClick: handleDelete },
    ],
  };

  return (
    <DataTable
      data={items}
      config={config}
      params={params}
      onParamsChange={updateParams}
      pagination={pagination}
      isLoading={isLoading}
    />
  );
};
```

**Column config:**
- `key` — maps to API `sort_by` and filter param names
- `filterable: false` — disables filter for that column
- `filterOptions` — options for the filter dropdown; omit to disable filter
- `sortable: false` — disables sorting for that column
- `filtersEnabled: false` — disables all column filters
- `showRecordCount: false` — hides "X to Y of Z records" in the footer

**useDataTableParams defaults (configurable):**
- `defaultSortBy: "created_at"` — latest records first
- `defaultSortDir: "desc"` — newest at top
- Override per page: `useDataTableParams({ defaultSortBy: "sort_order", defaultSortDir: "asc" })`

**Backend API contract:**
- Query params: `search`, `page`, `per_page`, `sort_by`, `sort_dir`, plus filter keys (e.g. `category`, `is_published`)
- Response: `{ data: T[], meta: { pagination: { total, count, per_page, current_page, total_pages, has_more_pages } } }`

**Reference implementation:** `src/modules/Cms/features/StaticPageList/StaticPageList.tsx`

### 12. Error Handling

- API errors are handled globally by `callApi()` → shows toast via Sonner
- 401: Auth store clears, redirects to login
- 419: Auto-retries with fresh CSRF cookie
- 422: Shows first validation error
- Components wrapped in `<ErrorBoundary>` at the root

---

## UI/UX Design System

### Design Tokens (CSS Variables)

```css
:root {
  --primary: #06D001;        /* Green — brand color */
  --primary-active: #00B400;
  --danger: #ef4444;          /* Red */
  --success: #06D001;         /* Green */
  --warning: #f59e0b;         /* Amber */
  --info: #3b82f6;            /* Blue */
  --background: oklch(1 0 0); /* White */
  --foreground: #071437;      /* Dark blue-black */
  --border: oklch(0.922 0 0); /* Light gray */
  --radius: 0.625rem;         /* 10px border radius */
}

.dark {
  --background: #0f0f0f;
  --foreground: #e7e7e7;
  --primary: #2AFA21;
}
```

### Styling Rules

- **Tailwind utility classes only** — no inline styles, no CSS modules
- Use `cn()` from `@/lib/utils` for conditional classes
- Spacing: `space-y-4`, `space-y-6`, `gap-4` (4px grid)
- Cards: `rounded-lg border border-border bg-card`
- Page layout: `<div className="space-y-6">` as wrapper
- Page header: `<div className="flex items-center justify-between">`
- Text hierarchy: `text-2xl font-bold` (h1), `text-lg font-semibold` (h2), `text-sm text-muted-foreground` (subtitle)
- Dark mode support via `.dark` class (toggled by layout store)

### Component Variants (CVA)

Button variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `success`, `warning`, `info`

```tsx
<Button variant="default">Primary Action</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost" size="sm">Edit</Button>
<Button loading={isPending}>Saving...</Button>
```

### Icons

Prefer `lucide-react`. Size: `h-4 w-4` (small), `h-5 w-5` (default), `h-6 w-6` (large). Use custom SVG when lucide lacks the icon (e.g. X / Twitter logo).

```tsx
import { Plus, Pencil, Trash2, Search, ChevronRight } from "lucide-react";
<Button><Plus className="h-4 w-4" /> Add</Button>
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Component | PascalCase | `MyItemList.tsx` |
| Page | PascalCase | `Dashboard.tsx` |
| Hook | camelCase, `use` prefix | `useRestaurants.ts` |
| Store | camelCase, `Store` suffix | `authStore.ts` |
| Model/Schema | PascalCase | `Restaurant.ts` |
| Constants | camelCase | `endpoints.ts` |
| Utility | camelCase | `formatDate.ts` |
| Route config | `index.tsx` | `routes/index.tsx` |

---

## API Response Contract

All backend responses follow this shape:

```ts
// Success
{ success: true, message: "...", data: T }

// Success with pagination
{ success: true, message: "...", data: T[], meta: { pagination: { total, count, per_page, current_page, total_pages, has_more_pages } }, links: { first, last, prev, next } }

// Error
{ success: false, message: "...", errors?: Record<string, string[]> }
```

---

## Adding a New Feature Module (Checklist)

1. **Backend first** — create model, migration, controller, service, routes, policy, form requests
2. Create `src/modules/<FeatureName>/` with:
   - `data/constants/endpoints.ts` — endpoints + query keys
   - `data/models/<Entity>.ts` — Zod schemas + TypeScript types
   - `data/models/index.ts` — barrel export
   - `hooks/use<Entity>.ts` — `useQueryApi` / `useMutationApi` wrappers
   - `hooks/index.ts` — barrel export
   - `pages/<Entity>List.tsx` — list page
   - `pages/<Entity>Detail.tsx` — detail page (if needed)
   - `components/` — module-specific components (forms, tables, cards)
   - `routes/index.tsx` — route definitions with permissions (use `ProtectedRouteType` from `@/types/routes`; optionally use `getCreateRoute` / `getShowRoute` from `@/utils/routeHandling` for path consistency)
3. Register routes in `src/routes/ProtectedRoutes.tsx` (spread `...MyFeatureRoutes`)
4. Add the module to the central aggregate in `src/routes/Routes.ts` (e.g. `myFeature: MyFeatureRoutes`)
5. Add sidebar link in `src/layouts/components/Sidebar.tsx`

**Public website pages** (no auth, under PublicLayout) live in `src/pages/public/` and use the `Public` module (`src/modules/Public/`) for data (useHomepage, usePublicRestaurants, useSearchMenuItems, usePublicStaticPage, etc.). New public pages are added as `<Route path="..." element={...} />` inside the `PublicLayout` group in `AppRoutes.tsx`.

**Footer Legal & Support** — The footer shows exactly 5 links: Privacy Policy, Terms of Service, Cookie Policy, Refund Policy, Help Center. These are CMS static pages (slugs: `privacy`, `terms`, `cookies`, `refund`, `help-center`). The sidebar in `StaticPageLayout` matches these 5 when viewing a static page.

---

## DO NOT

- Use `any` type (use `unknown` or proper types)
- Use `fetch()` or `axios` directly (use `callApi`)
- Put server state in Zustand (use React Query)
- Create inline styles (use Tailwind classes)
- Skip Zod validation on forms
- Hardcode API URLs (use endpoint constants)
- Skip permission checks on routes and UI elements
- Use `React.FC` (use typed props directly)
- Add `console.log` in committed code (use proper error handling)
- Skip loading/error states in pages
