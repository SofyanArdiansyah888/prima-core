# PKM Dashboard

Laravel + Inertia React dashboard untuk PT Prima Karya Manunggal.

Lihat dokumentasi root:

- [AGENTS.md](../AGENTS.md)
- [docs/setup.md](../docs/setup.md)
- [docs/domain.md](../docs/domain.md)
- [docs/architecture.md](../docs/architecture.md)
- [docs/modules.md](../docs/modules.md)

## Quick start

```bash
cp .env.example .env
# set MySQL remote + php artisan key:generate
composer install && npm install
php artisan migrate --seed
composer run dev
```

Docker: `docker compose up -d --build` → http://localhost:8080

Seed: `admin@pkm.test` / `password`
