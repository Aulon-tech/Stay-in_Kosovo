# Stay in Kosovo

Smart experience and mobility platform for citizens, tourists, and local businesses in Kosovo. Mobile-first, functionality-focused web app.

## Tech stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** (utility classes only)
- **SQLite** + Prisma ORM
- **NextAuth.js** (credentials: email + password)
- **Leaflet** + OpenStreetMap
- **Zustand** (client state) + **TanStack React Query** (server state)
- **OpenAI API** (optional) with rule-based recommender fallback

## Quick start

```bash
npm install
cp .env.example .env
npm run db:push

# Dataset: data/places_curated.json (319 vende Prishtinë)
npm run import:places

npm run seed          # përdorues demo
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/discover`.

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Traveler | `demo@stay.kosovo` | `password123` |
| Business | `business1@stay.kosovo` | `password123` |

New users complete a **vibe quiz** after first login (3–5 vibes + interests).

## Environment variables

See `.env.example`:

- `DATABASE_URL` — SQLite path (default `file:./dev.db`, stored as `prisma/dev.db`)
- `NEXTAUTH_URL` — app URL (default `http://localhost:3000`)
- `NEXTAUTH_SECRET` — random secret for JWT/session
- `OPENAI_API_KEY` — optional; enables GPT recommendations and vibe summaries

Without `OPENAI_API_KEY`, the app uses a **rule-based recommender** (vibe 40%, proximity 25%, open-now 15%, rating 10%, time-of-day 10%).

## Feature walkthrough

### Discover (`/discover`)
- Personalized place cards from preferences + geolocation + time
- Filters: category, vibe, distance, price, open-now
- “What’s the vibe right now?” smart prompt → `/api/recommendations`
- “Feels like” atmospheric line per place (reviews + tags → GPT or templates)
- Add to itinerary (queued in Zustand; save on Plan page)

### Vibes (`/vibes`)
- Mood grid (cozy evening, energetic night, etc.)
- Curated list + auto mini-itinerary → save as full itinerary

### Map (`/map`)
- Leaflet map, user location (default Prishtina)
- Place pins, optional events layer
- Pin drawer: directions (mock transport), add to itinerary

### Place (`/place/[id]`)
- Details, mini map, transport options, reviews, submit review (photo → `/public/uploads`)

### Itinerary (`/itinerary`) — requires login
- List/create/edit/delete itineraries
- Reorder stops, times, transport between stops
- Total duration & cost estimates
- Smart-fill: time window + vibe → AI/rules itinerary
- Seed includes **“Perfect Evening in Prishtina”** (public)

### Profile (`/profile`)
- Account, preferences, business dashboard link, sign out

### Business
- `/business/onboard` — multi-step: info, category/vibes, map pin, ARBK, photos
- `/business/dashboard` — listing, review stats, recommendation estimate

## API routes

| Method | Path | Description |
|--------|------|-------------|
| * | `/api/auth/*` | NextAuth |
| POST | `/api/auth/register` | Register user/business |
| GET | `/api/places` | List/filter places |
| GET | `/api/places/[id]` | Place detail |
| POST | `/api/places` | Business create place |
| GET | `/api/recommendations` | Smart recommendations |
| GET/POST | `/api/itinerary` | User itineraries |
| PUT/DELETE | `/api/itinerary/[id]` | Update/delete |
| POST | `/api/itinerary/smart-fill` | Generate itinerary |
| GET/POST | `/api/reviews` | Reviews by place |
| GET | `/api/transport` | Walk/bus/taxi/bike estimates |
| GET | `/api/events` | Upcoming events |
| POST | `/api/business/onboard` | Business + place onboarding |
| GET | `/api/business/stats` | Dashboard stats |
| PUT | `/api/user/preferences` | Vibe quiz save |

## Seed data

`npm run seed` loads:

- **34** Kosovo places (Prishtina, Prizren, Peja, Gjakova, etc.)
- **5** business users + profiles
- **55** reviews with vibe tags
- **10** events
- **3** itineraries (including public “Perfect Evening in Prishtina”)

## Project structure

```
app/
  (auth)/login, register
  (main)/discover, map, vibes, itinerary, profile
  business/dashboard, onboard, [id]
  place/[id]
  api/...
components/   # feature-organized UI
lib/          # db, auth, recommender, transport, vibe-summary
prisma/
seed/
```

## Design choices (documented)

- **SQLite** for zero-friction local dev; swap `DATABASE_URL` for Postgres in production if needed.
- **JSON columns** in Prisma for arrays (vibes, stops) — SQLite-friendly pattern.
- **Middleware** redirects logged-in users without completed vibe quiz to `/onboarding/vibe-quiz`.
- **Discover/map/vibes/place** are public; itinerary, profile, business require auth.
- **Transport** is mock but consistent: walk 5 km/h, bus €0.50 flat, taxi €0.50/km, bike 15 km/h.
- **Images** use Unsplash URLs in seed; uploads stored under `public/uploads/`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:push` | Push Prisma schema to SQLite |
| `npm run seed` | Seed database |
| `npm run db:studio` | Prisma Studio |

## GitHub & Vercel deploy

See **[docs/DEPLOY.md](docs/DEPLOY.md)** for:

- Pushing to GitHub (team repo)
- **Vercel** deploy with **Turso** (hosted SQLite — not Supabase)
- **Google Maps** API key setup
- CI runs on push via `.github/workflows/ci.yml`

```bash
git init && git add . && git commit -m "Stay in Kosovo"
# then add remote and push — see docs/DEPLOY.md
```

## Non-goals (current version)

Custom design system, push notifications, payments, i18n, social features, full test suite.
