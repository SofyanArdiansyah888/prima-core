---
name: laravel-best-practice
description: >-
  Laravel best practices for the PKM modular dashboard (nwidart modules,
  Form Requests, policies/middleware, Fortify, Eloquent). Use when writing
  PHP backend code in dashboard/.
---

# Laravel Best Practice — PKM Dashboard

## Structure

- Domain features live in `Modules/{Name}` (Branch, BatchingPlant, User, Shared)
- Auth User model stays `App\Models\User` for Fortify compatibility
- Thin controllers; validation in Form Requests; authorize via `admin` middleware + request `authorize()`
- Prefer eager loading (`with`, `withCount`) — no N+1 on index pages
- Migrations per module under `Modules/*/database/migrations`

## Identity

- FK always `id`
- Route binding via `uuid` (`HasUuid` + `getRouteKeyName`)
- Business `code` via `CodeGenerator`; immutable after create
- Enums for `UserRole`, `PlantStatus`

## Security

- No public registration (Fortify features)
- Master routes: `auth`, `verified`, `admin`
- Block inactive users in `Fortify::authenticateUsing`
- Never expose secrets in seed docs beyond local test passwords

## Style

- Pint-compatible; typed return types on controller methods
- Flash messages: `->with('success'| 'error', …)`
