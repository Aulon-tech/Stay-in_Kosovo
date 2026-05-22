/**
 * Import Prishtina places from curated JSON or legacy SQLite/JSON.
 * Usage: npm run import:places
 * Env: DATASET_PATH=./data/places_curated.json
 */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { curatedToPrismaPlace, loadCuratedJson } from "../lib/curated-import";
import {
  mapPriceLevel,
  parseDatasetJson,
} from "../lib/dataset";

const prisma = new PrismaClient();

type LegacyRow = {
  id?: number;
  google_place_id?: string | null;
  name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  category?: string | null;
  google_types?: string | null;
  rating?: number | null;
  rating_count?: number | null;
  price_level?: string | null;
  opening_hours?: string | null;
  website?: string | null;
  phone?: string | null;
  description?: string | null;
  photo_url?: string | null;
  google_maps_url?: string | null;
  vibe_tags?: string | null;
};

function buildFeelsLike(name: string, tags: string[]): string | null {
  if (!tags.length) return null;
  const top = tags.slice(0, 3).join(", ");
  return `Feels like: ${top} — ${name}`;
}

function legacyRowToPlaceData(row: LegacyRow) {
  const tags = parseDatasetJson<string[]>(row.vibe_tags, []);
  const types = parseDatasetJson<string[]>(row.google_types, []);
  const desc =
    row.description?.trim() ||
    `${row.name} in Prishtina${row.category ? ` · ${row.category}` : ""}.`;
  const photo = row.photo_url?.trim();
  const images = JSON.stringify(photo ? [photo] : []);

  return {
    curatedSlug: null as string | null,
    googlePlaceId: row.google_place_id || null,
    name: row.name,
    description: desc,
    category: (row.category || "other").toLowerCase(),
    vibes: JSON.stringify(tags),
    googleTypes: types.length ? JSON.stringify(types) : null,
    lat: row.lat ?? 42.6629,
    lng: row.lng ?? 21.1655,
    address: row.address || "Prishtina",
    city: "Prishtina",
    priceLevel: mapPriceLevel(row.price_level),
    priceLevelRaw: row.price_level ? String(row.price_level) : null,
    openingHours: row.opening_hours || null,
    images,
    website: row.website || null,
    phone: row.phone || null,
    googleMapsUrl: row.google_maps_url || null,
    avgRating: row.rating ?? 0,
    ratingCount: row.rating_count ?? 0,
    feelsLike: buildFeelsLike(row.name, tags),
    isVerified: Boolean(row.google_place_id && photo),
    datasetId: row.id ?? null,
  };
}

async function loadFromSqlite(dbPath: string): Promise<LegacyRow[]> {
  const Database = (await import("better-sqlite3")).default;
  const db = new Database(dbPath, { readonly: true });
  const rows = db
    .prepare(
      `SELECT id, google_place_id, name, address, lat, lng, category, google_types,
        rating, rating_count, price_level, opening_hours, website, phone,
        description, photo_url, google_maps_url, vibe_tags
       FROM places ORDER BY id`
    )
    .all() as LegacyRow[];
  db.close();
  return rows;
}

function resolveDatasetPath(root: string): string | null {
  const candidates = [
    process.env.DATASET_PATH,
    path.join(root, "data", "json.txt"),
    path.join(root, "data", "places_curated_cleaned.json"),
    path.join(root, "data", "places_curated.json"),
    path.join(root, "places_curated.json"),
    path.join(root, "data", "places_final.db"),
    path.join(root, "data", "places.json"),
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function upsertPlace(
  data: ReturnType<typeof curatedToPrismaPlace>
) {
  if (data.googlePlaceId) {
    await prisma.place.upsert({
      where: { googlePlaceId: data.googlePlaceId },
      create: data,
      update: data,
    });
    return;
  }
  if (data.curatedSlug) {
    await prisma.place.upsert({
      where: { curatedSlug: data.curatedSlug },
      create: data,
      update: data,
    });
    return;
  }
  await prisma.place.create({ data });
}

async function main() {
  const root = process.cwd();
  const datasetPath = resolveDatasetPath(root);

  if (!datasetPath) {
    console.error(
      "Dataset not found. Add one of:\n" +
        "  data/places_curated.json\n" +
        "  places_curated.json\n" +
        "  data/places_final.db\n" +
        "  data/places.json\n" +
        "Or set DATASET_PATH"
    );
    process.exit(1);
  }

  let rows: ReturnType<typeof curatedToPrismaPlace>[] = [];

  if (datasetPath.endsWith(".json") || datasetPath.endsWith(".txt")) {
    console.log(`Loading curated JSON: ${datasetPath}`);
    const curated = loadCuratedJson(datasetPath);
    rows = curated.map(curatedToPrismaPlace);
  } else if (datasetPath.endsWith(".db")) {
    console.log(`Loading SQLite: ${datasetPath}`);
    const legacy = await loadFromSqlite(datasetPath);
    rows = legacy.map(legacyRowToPlaceData);
  } else {
    console.error(`Unsupported dataset: ${datasetPath}`);
    process.exit(1);
  }

  console.log(`Found ${rows.length} places. Importing…`);

  await prisma.review.deleteMany();
  await prisma.event.deleteMany();
  await prisma.place.deleteMany();

  let imported = 0;
  let skipped = 0;
  const seenSlugs = new Set<string>();

  for (let data of rows) {
    if (data.curatedSlug) {
      let slug = data.curatedSlug;
      if (seenSlugs.has(slug)) {
        const suffix = (data.googlePlaceId || data.name).slice(-8);
        slug = `${slug}-${suffix}`;
      }
      seenSlugs.add(slug);
      data = { ...data, curatedSlug: slug };
    }
    if (!data.name?.trim()) {
      skipped++;
      continue;
    }
    try {
      await upsertPlace(data);
      imported++;
    } catch (e) {
      console.warn(`Skip ${data.name}:`, (e as Error).message);
      skipped++;
    }
  }

  const count = await prisma.place.count();
  console.log(
    `Done. Imported: ${imported}, skipped: ${skipped}, total in DB: ${count}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
