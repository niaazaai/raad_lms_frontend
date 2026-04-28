---
version: "alpha"
name: "Raad LMS Unified Design System"
description: "Shared visual and layout contract for Raad LMS frontend and backend APIs that feed UI state."
colors:
  primary: "#0069B4"
  primary-active: "#005A9A"
  auxiliary: "#9B3D9A"
  success: "#22C55E"
  warning: "#F59E0B"
  danger: "#EF4444"
  info: "#3B82F6"
  background: "#FFFFFF"
  foreground: "#071437"
  border: "#E5E7EB"
  muted: "#F3F4F6"
  muted-foreground: "#6B7280"
  sidebar-bg: "#FFFFFF"
  sidebar-fg: "#071437"
  dark-background: "#0F0F0F"
  dark-foreground: "#E7E7E7"
typography:
  h1:
    fontFamily: "Inter"
    fontSize: "1.5rem"
    fontWeight: "700"
    lineHeight: "2rem"
  h2:
    fontFamily: "Inter"
    fontSize: "1.125rem"
    fontWeight: "600"
    lineHeight: "1.75rem"
  body:
    fontFamily: "Inter"
    fontSize: "1rem"
    fontWeight: "400"
    lineHeight: "1.5rem"
  caption:
    fontFamily: "Inter"
    fontSize: "0.875rem"
    fontWeight: "400"
    lineHeight: "1.25rem"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  page-shell:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  card-default:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "0.625rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-active}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "0.625rem 1rem"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "0.625rem 1rem"
  input-default:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
  sidebar-default:
    backgroundColor: "{colors.sidebar-bg}"
    textColor: "{colors.sidebar-fg}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
---

## Overview

Raad LMS uses one unified visual language across the React dashboard and Laravel API responses. The frontend defines tokens in `src/assets/css/index.css` and consumes them through Tailwind utilities + shadcn primitives; backend endpoints must continue delivering stable status/message/meta structures that preserve consistent UI feedback patterns.

Core experience principles:
- One protected application shell (`/dashboard`) with consistent spacing, cards, and table behavior.
- Action colors are semantic and fixed: primary for main actions, danger for destructive actions, and success/warning/info for feedback.
- Dark mode must preserve hierarchy and readability by switching only token values, not component structure.

## Colors

Primary brand color is blue (`#0069B4`) with an active state (`#005A9A`). Auxiliary purple (`#9B3D9A`) is secondary emphasis only. Semantic colors are fixed:
- Success: `#22C55E`
- Warning: `#F59E0B`
- Danger: `#EF4444`
- Info: `#3B82F6`

Surface and text contract:
- Light mode uses white surfaces with dark foreground (`#071437`) and neutral borders.
- Dark mode uses `#0F0F0F` background with `#E7E7E7` foreground and muted neutral borders.
- Sidebar follows dedicated tokens and should remain visually connected to the main layout.

## Typography

The system font is Inter. Headings and body copy should align with existing frontend conventions:
- Page title: equivalent to Tailwind `text-2xl font-bold`
- Section title: equivalent to `text-lg font-semibold`
- Supporting copy: equivalent to `text-sm text-muted-foreground`

Do not introduce additional font families unless the full token set and existing components are migrated together.

## Layout

Canonical dashboard layout:
- Main wrapper: `space-y-6`
- Header row: `flex items-center justify-between`
- Content blocks: cards with border + radius + neutral background
- Data density: 4px/8px rhythm with spacing scales (`gap-4`, `space-y-4`, `space-y-6`)

Table/list pages must use the shared DataTable pattern:
- Server-side search, sort, pagination, and filters
- Horizontal table scroll only (avoid whole-page horizontal scroll)
- Actions grouped in a dropdown for row operations

## Elevation & Depth

The current style is intentionally low elevation:
- Prefer border-based separation over heavy shadows
- Keep cards and panels flat with clear contrast
- Focus states should use ring/border tokens, not glowing effects

## Shapes

Default corner radius is medium-soft (`0.625rem` token baseline).
- Buttons and inputs: medium radius
- Cards and panel containers: large radius
- Keep shape language consistent across modules (UserManagement, Course, Notifications)

## Components

### Navigation shell
- Protected routes render inside `MainLayout` with sidebar + header.
- Avoid alternate shells for feature modules unless product requirements explicitly change.

### Buttons
- Use semantic variants (`default`, `destructive`, `secondary`, `outline`, `ghost`, `success`, `warning`, `info`).
- Hover/active states must map to `*-active` tokens.
- Loading states use the shared `Spinner` component, not ad-hoc icon spinners.

### Forms
- Use React Hook Form + Zod in frontend and FormRequest validation in backend.
- Required fields, validation messages, and status badges must be consistent with API enums/contracts.

### Data display
- DataTable is the standard for CRUD index pages.
- Empty, loading, and error states should follow existing component patterns and API response messages.

### API-backed feedback
- Backend responses remain in `{ success, message, data, meta?, links? }` structure.
- Frontend toasts and error handling rely on this contract for consistent UX.

## Do's and Don'ts

Do:
- Reuse existing tokens/components before adding new visual primitives.
- Keep route and permission patterns aligned between backend and frontend modules.
- Maintain consistent status naming and mapping across API + UI.
- Preserve dark mode parity for any new component.

Don't:
- Introduce one-off colors, spacing scales, or radius values without token updates.
- Bypass shared API client/response handling for UI notifications.
- Create custom list/table patterns when DataTable already fits.
- Mix icon systems; continue using Iconoir in frontend.

