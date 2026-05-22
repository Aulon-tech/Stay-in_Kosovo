import { loadCuratedJson, type CuratedPlace } from "@/lib/curated-import";
import { resolveCuratedDatasetPath } from "@/lib/dataset-path";
import { mapBudget } from "@/lib/curated-import";
import { mapPriceLevel } from "@/lib/dataset";
import type { CandidateForAi } from "@/lib/ai/types";

let cache: CuratedPlace[] | null = null;
let cachePath: string | null = null;

export function loadCuratedPlaces(): CuratedPlace[] {
  const path = resolveCuratedDatasetPath();
  if (!path) {
    throw new Error(
      "Curated dataset not found. Add data/places_curated.json or set DATASET_PATH."
    );
  }
  if (cache && cachePath === path) return cache;
  cache = loadCuratedJson(path);
  cachePath = path;
  return cache;
}

export function clearCuratedCache() {
  cache = null;
  cachePath = null;
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
  return Array.from(set);
}

export function isPrishtinaPlace(row: CuratedPlace): boolean {
  const c = (row.city || "Prishtina").toLowerCase();
  return (
    c.includes("prishtina") ||
    c.includes("pristina") ||
    !row.city
  );
}

export function curatedPlaceId(row: CuratedPlace): string {
  return String(row.id || row.name).trim();
}

export function toCandidate(row: CuratedPlace): CandidateForAi {
  const desc =
    row.description?.trim() ||
    row.curated_tip?.trim() ||
    `${row.name} · ${row.category || "place"}`;
  return {
    place_id: curatedPlaceId(row),
    name: row.name,
    category: (row.category || "other").toLowerCase(),
    vibes: mergeVibes(row),
    budget: (() => {
      const level = row.budget
        ? mapBudget(row.budget)
        : mapPriceLevel(row.price_level);
      return level <= 1 ? "low" : level >= 3 ? "high" : "mid";
    })(),
    time_of_day: (row.time_of_day || []).map((t) => String(t).toLowerCase()),
    avg_duration_min: row.avg_duration_min ?? 60,
    rating: row.rating ?? 0,
    description_short: desc.slice(0, 220),
  };
}

export function getCuratedById(
  places: CuratedPlace[],
  placeId: string
): CuratedPlace | undefined {
  const id = placeId.toLowerCase().trim();
  return places.find(
    (p) =>
      curatedPlaceId(p).toLowerCase() === id ||
      p.name.toLowerCase() === id
  );
}
