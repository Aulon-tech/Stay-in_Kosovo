# Deploy to GitHub + Vercel (no Supabase)

## 1. GitHub

```bash
git init
git add .
git commit -m "Initial commit: Stay in Kosovo"
```

Create a repo on GitHub (team org), then:

```bash
git remote add origin https://github.com/YOUR_ORG/stay-in-kosovo.git
git branch -M main
git push -u origin main
```

## 2. Production database (Turso — SQLite compatible)

Vercel cannot use local `file:./dev.db`. Use **Turso** (free tier):

1. Sign up at [turso.tech](https://turso.tech)
2. Create a database, copy **URL** and **auth token**
3. Push schema:

```bash
# with Turso CLI or set env locally:
set TURSO_DATABASE_URL=libsql://...
set TURSO_AUTH_TOKEN=...
npx prisma db push
npm run seed
```

## 3. Google Maps

1. [Google Cloud Console](https://console.cloud.google.com) → APIs → enable **Maps JavaScript API**
2. Create API key, restrict to your Vercel domain
3. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in Vercel env

Without the key, maps fall back to OpenStreetMap (Leaflet).

## 4. Vercel

1. [vercel.com](https://vercel.com) → Import GitHub repo
2. Framework: **Next.js** (auto-detected)
3. Environment variables:

| Variable | Value |
|----------|--------|
| `TURSO_DATABASE_URL` | From Turso |
| `TURSO_AUTH_TOKEN` | From Turso |
| `NEXTAUTH_SECRET` | Random string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional |
| `OPENAI_API_KEY` | Optional |

4. Deploy. After first deploy, run seed once against Turso (locally with Turso env vars).

## 5. Local dev (unchanged)

```bash
# .env — no Turso vars needed
DATABASE_URL="file:./dev.db"
npm run db:push && npm run seed && npm run dev
```

When `TURSO_DATABASE_URL` is set, the app uses Turso instead of the local file.
