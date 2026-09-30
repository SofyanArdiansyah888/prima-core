# AGENTS.md — Entrypoint untuk AI / agent

Baca file ini dulu sebelum mengubah kode.

## Peta repo

| Path | Fungsi |
|------|--------|
| [`dashboard/`](dashboard/) | App produksi Laravel 13 + Inertia React + Tailwind |
| [`prototype/`](prototype/) | SPA demo lama (referensi UI/domain saja) |
| [`docs/`](docs/) | Arsitektur, domain, modul, setup |
| [`.cursor/skills/`](.cursor/skills/) | Skills proyek (UI/UX, Laravel, React, domain) |

## Urutan baca

1. [`docs/setup.md`](docs/setup.md) — jalankan app & DB
2. [`docs/domain.md`](docs/domain.md) — Cabang → Plant → User, penomoran
3. [`docs/architecture.md`](docs/architecture.md) — modular + Docker
4. [`docs/modules.md`](docs/modules.md) — path file per modul
5. Skills di `.cursor/skills/*/SKILL.md` saat mengimplementasikan fitur

## Stack singkat

- Backend: Laravel 13, Fortify (login + forgot password; **tanpa** public register)
- Frontend: Inertia + React 19 + TypeScript + Tailwind 4 + shadcn
- Modular: `nwidart/laravel-modules` → `Modules/{Shared,Branch,BatchingPlant,User}`
- DB: PostgreSQL remote `72.61.209.61` (lihat `.env`); Docker untuk PHP/Nginx/Mailpit
- Identitas: FK = `id`; URL = `uuid`; bisnis = `code` (industri)

## Perintah umum

```bash
cd dashboard
composer install && npm install
cp .env.example .env   # isi kredensial PostgreSQL remote + APP_KEY
php artisan key:generate
php artisan migrate --seed
composer run dev       # atau: docker compose up -d
```

## Kredensial seed

- Admin: `admin@pkm.test` / `password`
- Operator: `operator@pkm.test` / `password`

## Aturan kerja agent

- Jangan edit `prototype/` kecuali diminta
- Fitur master baru → modul sendiri + update `docs/modules.md`
- Kode bisnis immutable setelah create; generate via `CodeGenerator`
- Plant assign ke user harus sama `branch_id`
- Hanya role `admin` yang akses `/master/*`
