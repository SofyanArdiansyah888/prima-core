---
name: react-best-practice
description: >-
  React + Inertia best practices for PKM Dashboard. Use when writing or
  reviewing resources/js pages and components.
---

# React Best Practice — PKM Dashboard (Inertia)

## Data

- Server data via Inertia props only — no client waterfall fetch for master CRUD
- Filters/search: `router.get` with `preserveState`
- Forms: Inertia `<Form>` with `processing` + `errors`
- Shared auth/flash from `usePage().props`

## Bundle

- Import components directly (`@/components/ui/button`) — avoid barrel re-exports of heavy UI
- Keep pages under `resources/js/pages/modules/{domain}/`
- Prefer existing shadcn primitives over new dependencies

## Components

- Page owns layout breadcrumbs via `Page.layout = { breadcrumbs }`
- Controlled state only when needed (branch → plant filter); otherwise uncontrolled defaults
- Type props explicitly; mirror backend field names (`snake_case` from Laravel)

## UX hooks

- Toast on `flash.success` / `flash.error`
- Disable buttons when `processing`
