# Architecture

## Request flow

```text
Browser → Nginx/php artisan serve
  → Laravel routes (app + Modules/*/routes/web.php)
  → Middleware auth + verified + admin (master)
  → Controller (thin) + FormRequest
  → Eloquent models
  → Inertia::render('modules/…')
  → React page di resources/js/pages/
```

## Modular (nwidart)

```text
dashboard/
├── app/                    # Fortify, User model, DashboardController
├── Modules/
│   ├── Shared/             # HasUuid, CodeGenerator, EnsureUserIsAdmin, enums
│   ├── Branch/             # Master cabang
│   ├── BatchingPlant/      # Master plant
│   └── User/               # Master user CRUD (model User tetap App\Models\User)
└── resources/js/pages/modules/{branch,batching-plant,user}/
```

Autoload modul via Composer merge-plugin (`Modules/*/composer.json`).

## Docker

- `app` (php-fpm), `nginx`, `mailpit`
- PostgreSQL **tidak** di compose default (remote `.env`, host `72.61.209.61`)
- Profile `local-db` untuk container PostgreSQL opsional

## Frontend

- shadcn di `resources/js/components/ui`
- Layout sidebar: Dashboard, Cabang, Batching Plants, Users
- Visual: industrial emerald/stone (bukan purple AI look)
