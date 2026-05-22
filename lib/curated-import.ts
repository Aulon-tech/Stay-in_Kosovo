import { mapPriceLevel } from "@/lib/dataset";
import { resolvePlaceCity } from "@/lib/geo";
import { openHoursFromWeekdayText, type OpeningHours } from "@/lib/opening-hours";

export type CuratedPlace = {
  id: string;
  google_place_id?: string | null;
  name: string;
  city?: string;
  category?: string;
  vibes?: string[];
  coords?: { lat?: number; lng?: number };
  lat?: number;
  lng?: number;
  rating?: number;
  rating_count?: number;
  open_hours?: string[];
  opening_hours?: string | string[] | null;
  address?: string;
  photo_url?: string | null;
  google_maps_url?: string | null;
  website?: string | null;
  phone?: string | null;
  description?: string | null;
  real_quote?: string | null;
  curated_tip?: string | null;
  good_for?: string[];
  time_of_day?: string[];
  budget?: string | null;
  price_level?: string | number | null;
  avg_duration_min?: number;
  subcategory?: string | null;
  google_types?: string | string[] | null;
  vibe_tags?: string | string[] | null;
};

export function mapBudget(budget: string | null | undefined): number {
  if (!budget) return 2;
  const s = budget.toLowerCase().trim();
  if (s === "low" || s === "budget") return 1;
  if (s === "mid" || s === "moderate") return 2;
  if (s === "high" || s === "expensive") return 3;
  if (s === "premium" || s === "luxury") return 4;
  return mapPriceLevel(budget);
}

function mergeVibes(row: CuratedPlace): string[] {
  const fromTags = Array.isArray(row.vibe_tags)
    ? row.vibe_tags
    : typeof row.vibe_tags === "string"
      ? (JSON.parse(row.vibe_tags) as string[])
      : row.vibes || [];
  const extra = row.good_for || [];
  const set = new Set<string>();
  for (const v of [...fromTags, ...extra]) {
    const t = String(v).toLowerCase().trim();
    if (t) set.add(t);
  }
  return [...set];
}

function resolveOpeningHours(row: CuratedPlace): string | null {
  let hours: OpeningHours | null = null;
  if (Array.isArray(row.open_hours) && row.open_hours.length) {
    hours = openHoursFromWeekdayText(row.open_hours);
  } else if (typeof row.opening_hours === "string") {
    return row.opening_hours;
  } else if (Array.isArray(row.opening_hours)) {
    hours = openHoursFromWeekdayText(row.opening_hours);
  }
  return hours ? JSON.stringify(hours) : null;
}

export function curatedToPrismaPlace(row: CuratedPlace) {
  const tags = mergeVibes(row);
  const lat = row.coords?.lat ?? row.lat ?? 42.6629;
  const lng = row.coords?.lng ?? row.lng ?? 21.1655;
  const photo = row.photo_url?.trim();
  const desc =
    row.description?.trim() ||
    `${row.name} in ${row.city || "Prishtina"}${row.category ? ` · ${row.category}` : ""}.`;

  const top = tags.slice(0, 3).join(", ");
  let feelsLike = top ? `Feels like: ${top} — ${row.name}` : null;
  const tip = row.curated_tip?.trim() || row.real_quote?.trim();
  if (tip) {
    feelsLike = feelsLike ? `${feelsLike}. "${tip}"` : `"${tip}"`;
  }

  const types = Array.isArray(row.google_types)
    ? row.google_types
    : typeof row.google_types === "string"
      ? (JSON.parse(row.google_types) as string[])
      : row.subcategory
        ? [row.subcategory]
        : [];

  return {
    curatedSlug: row.id || null,
    googlePlaceId: row.google_place_id || null,
    name: row.name,
    description: desc,
    category: (row.category || "other").toLowerCase(),
    vibes: JSON.stringify(tags),
    googleTypes: types.length ? JSON.stringify(types) : null,
    lat,
    lng,
    address: row.address || "Prishtina",
    city: resolvePlaceCity(row.city, lat, lng),
    priceLevel: row.price_level != null ? mapPriceLevel(row.price_level) : mapBudget(row.budget),
    priceLevelRaw: row.budget || (row.price_level != null ? String(row.price_level) : null),
    openingHours: resolveOpeningHours(row),
    images: JSON.stringify(photo ? [photo] : []),
    website: row.website || null,
    phone: row.phone || null,
    googleMapsUrl: row.google_maps_url || null,
    avgRating: row.rating ?? 0,
    ratingCount: row.rating_count ?? 0,
    feelsLike,
    isVerified: Boolean(row.google_place_id && photo),
    datasetId: null as number | null,
  };
}

import fs from "fs";

export function loadCuratedJson(filePath: string): CuratedPlace[] {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const list = Array.isArray(raw) ? raw : raw.places || [];
  return list as CuratedPlace[];
}
