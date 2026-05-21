# Stack i ekipit vs implementimi aktual

| Plani origjinal | Implementuar |
|-----------------|--------------|
| Supabase | **Prisma + SQLite** (lokal) / **Turso** (Vercel) |
| Google Maps | **Po** — me `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, fallback OSM |
| Vercel | **Gati** — shiko `docs/DEPLOY.md` |
| Dizajn Stitch (Bleron) | **Placeholder** — ngjyra Kosovo, karta të përmirësuara |

## Verifikim biznesi (admin)

```bash
curl -X POST http://localhost:3000/api/admin/verify \
  -H "Content-Type: application/json" \
  -d "{\"placeId\":\"PLACE_ID\",\"secret\":\"YOUR_ADMIN_SECRET\"}"
```

Vendos `ADMIN_SECRET` në `.env`.
