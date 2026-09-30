# Setup — PKM Dashboard

## Prasyarat

- PHP 8.3+, Composer, Node 20+/22+, Docker (opsional)
- PostgreSQL remote (server online) — whitelist IP mesin/Docker Anda

## 1. Env

```bash
cd dashboard
cp .env.example .env
php artisan key:generate
```

Isi di `.env`:

```env
DB_CONNECTION=pgsql
DB_HOST=72.61.209.61
DB_PORT=5432
DB_DATABASE=<nama_db>
DB_USERNAME=<user>
DB_PASSWORD=<password>
APP_URL=http://localhost:8080
```

Lokal tanpa PostgreSQL: sementara `DB_CONNECTION=sqlite` + file `database/database.sqlite` (sudah dipakai bootstrap awal).

## 2. Install & migrate

```bash
composer install
npm install
php artisan migrate --seed
npm run build
```

## 3. Jalankan

**Host (tanpa Docker app):**

```bash
composer run dev
```

**Docker (app + nginx + mailpit):**

```bash
docker compose up -d --build
# app: http://localhost:8080
# mailpit: http://localhost:8025
docker compose exec app php artisan migrate --seed
```

PostgreSQL lokal darurat:

```bash
docker compose --profile local-db up -d
# set DB_HOST=postgres di .env
```

## Seed akun

| Email | Password | Role |
|-------|----------|------|
| admin@pkm.test | password | admin |
| operator@pkm.test | password | user |

## Auth

- Login + forgot/reset password (Fortify)
- Public register **off** — user dibuat di Master User
- User `is_active=false` tidak bisa login
