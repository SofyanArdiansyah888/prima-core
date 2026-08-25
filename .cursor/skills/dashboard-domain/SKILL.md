---
name: dashboard-domain
description: >-
  PKM/Tonasa dashboard domain: branches, batching plants, users, industrial
  codes, roles. Use when changing master data models, seeders, or business rules.
---

# Dashboard Domain — PKM

## Entities

- **Branch** `BR-{REGION}-{NN}` — has many plants & users
- **BatchingPlant** `{BR_CODE}-BP-{NN}` — belongs to branch
- **User** `EMP-{SHORT}-{YYYY}{#####}` — belongs to branch (required if role=user); M2M plants in same branch

## Rules

1. FK = `id`; public route = `uuid`; display = `code`
2. `code` immutable after create
3. Admin may have `branch_id = null` (HQ); code uses `EMP-HQ-…`
4. Assigned plants must match `users.branch_id`
5. Soft deactivate via `is_active` (plants also set status `INACTIVE`)

## Seed reference

- Branch `BR-SULSEL-01`
- Plants BP-01 Pangkep, BP-02 Makassar KIMA, BP-03 Maros
- `admin@pkm.test` / `operator@pkm.test` password `password`

## Terms

PKM = PT Prima Karya Manunggal (Semen Tonasa Group). Prototype SPA under `/prototype` is reference only.
