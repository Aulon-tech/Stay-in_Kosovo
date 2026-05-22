# Prishtina dataset

## Aktual: `places_curated_cleaned.json` (rekomanduar)

Vendos skedarin këtu: `data/places_curated_cleaned.json` (ose `places_curated.json`)

319 vende të kuratuara me vibe tags, foto Google, orar, `real_quote`, etj.

```bash
npm run import:places
```

## Opsione të tjera

| Skedar | Përshkrim |
|--------|-----------|
| `data/places_curated.json` | JSON i kuruar (prioritet #1) |
| `places_curated.json` (në root) | E njëjta, lexohet nëse mungon në `data/` |
| `data/places_final.db` | SQLite legacy (420 rreshta) |
| `data/places.json` | Array JSON me skemën e vjetër |

`DATASET_PATH=/rruga/skedarit npm run import:places`

## Pas importit

Të dhënat shkojnë në `prisma/dev.db` (Prisma SQLite). App-i lexon përmes API `/api/places`.
