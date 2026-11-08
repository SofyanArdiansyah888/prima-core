# Domain — Cabang, Plant, User

## Hierarki

```text
Branch (Cabang)
  └── BatchingPlant (1..N)
User
  ├── belongsTo Branch (wajib jika role=user; nullable jika admin)
  └── belongsToMany BatchingPlant (harus satu cabang dengan user.branch_id)
```

## Identitas 3 lapis

| Field | Pakai untuk | Catatan |
|-------|-------------|---------|
| `id` | FK, join | bigint PK |
| `uuid` | Route `/…/{uuid}` | auto `HasUuid` |
| `code` | UI, laporan, ops | immutable setelah create |

## Penomoran industri (`code`)

| Entitas | Pola | Contoh |
|---------|------|--------|
| Cabang | `BR-{REGION}-{NN}` | `BR-SULSEL-01` |
| Plant | `{BR_CODE}-BP-{NN}` | `BR-SULSEL-01-BP-01` |
| User | `EMP-{SHORT}-{YYYY}{#####}` | `EMP-SULSEL-202600001`, admin `EMP-HQ-…` |

Generator: `Modules\Shared\Services\CodeGenerator` + tabel `document_sequences`.

## Role

- `admin` — super admin: CRUD semua master + transaksi **semua** batching plant; `branch_id` boleh null
- `user` (Operator Plant) — login dashboard; `branch_id` wajib; hanya transaksi plant yang ditugaskan
- `sales` — hanya aplikasi mobile (tidak bisa login dashboard); hanya pesanan plant yang ditugaskan
- `driver` — hanya aplikasi mobile; hanya surat jalan miliknya

## Pemisahan data per batching plant

- Data transaksional (pesanan, SPK, surat jalan, laporan, dashboard) dibatasi ke plant di pivot `batching_plant_user`.
- Akses semua plant: role `admin` **atau** user dengan `users.has_full_plant_access = true` (Master Users → "Akses semua batching plant").
- User non-penuh tanpa plant: tidak melihat data transaksi sama sekali.
- Implementasi: `User::hasFullPlantAccess()`, `User::accessiblePlantIds()`, `User::canAccessPlant()`;
  scope `visibleTo($user)` dari trait `Modules\Shared\Concerns\ScopedByPlant` (Order, WorkOrder, SuratJalan, BatchingPlant);
  cek per record `Modules\Shared\Concerns\AuthorizesPlantAccess::ensurePlantAccess()` (403).
- Surat jalan: plant header harus boleh diakses, setiap pesanan harus dari plant yang sama, SPK harus milik pesanan tersebut.

## Status plant

`OPERATIONAL` | `MAINTENANCE` | `INACTIVE`

Status pesanan, pembayaran, surat jalan, dan SPK: [`status.md`](status.md).
