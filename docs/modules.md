# Modules map

## Shared

- Path: `dashboard/Modules/Shared`
- Key: `app/Concerns/HasUuid.php`, `app/Services/CodeGenerator.php`, `app/Http/Middleware/EnsureUserIsAdmin.php`, `app/Enums/*`
- Migration: `document_sequences`
- Routes: none (public)

## Branch

- Routes: `/master/branches` (resource, uuid binding)
- Controller: `Modules\Branch\Http\Controllers\BranchController`
- Model: `Modules\Branch\Models\Branch`
- Pages: `resources/js/pages/modules/branch/{index,form}.tsx`

## BatchingPlant

- Routes: `/master/batching-plants`
- Controller: `Modules\BatchingPlant\Http\Controllers\BatchingPlantController`
- Model: `Modules\BatchingPlant\Models\BatchingPlant` (`branch_id` FK)
- Pages: `resources/js/pages/modules/batching-plant/{index,form}.tsx`

## User

- Routes: `/master/users`
- Controller: `Modules\User\Http\Controllers\UserController`
- Model auth: `App\Models\User` (Fortify)
- Pages: `resources/js/pages/modules/user/{index,form}.tsx`
- Sync: `batching_plant_ids[]` → pivot `batching_plant_user`

## Core app

- Dashboard: `App\Http\Controllers\DashboardController` → `pages/dashboard.tsx`
- Auth: Fortify views di `pages/auth/*`
- Middleware alias: `admin` → `EnsureUserIsAdmin`
