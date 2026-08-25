---
name: ui-ux-design-max-pro
description: >-
  UI/UX max-pro rules for PKM Dashboard (Laravel Inertia React). Use when
  building or restyling dashboard pages, forms, tables, auth, or layouts.
---

# UI/UX Design Max Pro — PKM Dashboard

## Direction

Industrial utilitarian ready-mix / Semen Tonasa: emerald + stone neutrals, serif display for titles, clean mono for `code` fields. **Never** default purple gradients, Inter-only stacks, or generic AI SaaS chrome.

## First principles

- One job per page/section (index = find & act; form = edit one entity)
- Brand/product presence in shell (logo + ops eyebrow), not cluttered hero
- No decorative card grids in dashboards unless they are interactive summary links
- Prefer tables + filters over card lists for master data
- Empty states with clear next action
- Inline validation errors; disable submit while `processing`
- Confirm before deactivate; never hard-delete master rows in UI (soft `is_active`)
- Show business `code` as primary identifier; never show numeric `id` in UI
- Motion: subtle page enter / hover only — no noise

## Patterns

- Index: search + filters + paginated table + primary “Tambah” CTA
- Form: single column max-w-2xl; immutable `code` read-only on edit
- User form: branch first → plant multi-select scoped to branch
- Flash success/error via toast from Inertia shared `flash`

## Accessibility

- Labels on every control; keyboard-reachable selects/checkboxes
- Sufficient contrast on emerald badges over stone backgrounds
