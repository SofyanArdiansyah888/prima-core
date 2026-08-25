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

- `admin` — CRUD semua master; `branch_id` boleh null
- `user` — login; `branch_id` wajib; plant scoped ke cabangnya

## Status plant

`OPERATIONAL` | `MAINTENANCE` | `INACTIVE`
