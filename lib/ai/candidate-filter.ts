import type { CuratedPlace } from "@/lib/curated-import";
import { mapBudget } from "@/lib/curated-import";
import { mapPriceLevel } from "@/lib/dataset";
import type { ParsedIntent } from "@/lib/ai/types";
import {
  curatedPlaceId,
  isPrishtinaPlace,
  toCandidate,
} from "@/lib/ai/curated-data";
import type { CandidateForAi } from "@/lib/ai/types";
import {
  intentWantsDateNight,
  isReligiousOrWorshipPlace,
} from "@/lib/place-suitability";
import {
  getVibeRules,
  parseVibeModeFromIntent,
  resolveVibeMode,
  scorePlaceForVibe,
} from "@/lib/vibe-matching";

function mergeVibes(row: CuratedPlace): string[] {
  return toCandidate(row).vibes;
}

function normalizeCategories(cats: string[]): Set<string> {
  const out = new Set<string>();
  for (const c of cats) {
    const x = c.toLowerCase().trim();
    if (!x) continue;
    if (x === "food") {
      out.add("restaurant");
      continue;
    }
    if (x === "coffee") {
      out.add("cafe");
      continue;
    }
    out.add(x);
  }
  return out;
}

function hardCategoryMatch(
  place: CuratedPlace,
  categories: Set<string>
): boolean {
  if (categories.size === 0) return true;
  const cat = (place.category || "other").toLowerCase();
  if (categories.has(cat)) return true;
  if (categories.has("nightlife") && (cat === "bar" || cat === "nightlife")) {
    return true;
  }
  if (categories.has("bar") && cat === "nightlife") return true;
  return false;
}

function scorePlace(place: CuratedPlace, intent: ParsedIntent): number {
  if (
    intentWantsDateNight(intent) &&
    isReligiousOrWorshipPlace({
      name: place.name,
      description: place.description,
      id: place.id,
      curated_tip: place.curated_tip,
    })
  ) {
    return -1000;
  }

  let score = 1;
  const vibes = mergeVibes(place);
  const desc = `${place.description || ""} ${place.curated_tip || ""} ${place.name}`.toLowerCase();
  const cat = (place.category || "").toLowerCase();

  for (const v of intent.vibes) {
    const q = v.toLowerCase();
    if (vibes.some((pv) => pv.includes(q) || q.includes(pv))) score += 3;
    if (desc.includes(q)) score += 1;
  }

  for (const req of intent.specific_requests) {
    if (desc.includes(req.toLowerCase())) score += 2.5;
  }

  const price = place.budget
    ? mapBudget(place.budget)
    : mapPriceLevel(place.price_level);
  if (intent.budget === "low" && price <= 2) score += 2;
  if (intent.budget === "mid" && price >= 2 && price <= 3) score += 1.5;
  if (intent.budget === "high" && price >= 3) score += 2;

  const tod = (place.time_of_day || []).map((t) => String(t).toLowerCase());
  for (const t of intent.time_of_day) {
    if (tod.some((x) => x.includes(t))) score += 2;
    if (t === "night" && (cat === "bar" || cat === "nightlife")) score += 2;
    if (t === "morning" && cat === "cafe") score += 1.5;
    if (t === "evening" && cat === "restaurant") score += 1.5;
  }

  if (intent.categories.length) {
    const cats = normalizeCategories(intent.categories);
    if (hardCategoryMatch(place, cats)) score += 4;
  }

  if (intentWantsDateNight(intent)) {
    if (["restaurant", "bar", "nightlife", "cafe"].includes(cat)) score += 5;
    if (cat === "culture" || cat === "attraction") score -= 3;
  }

  score += Math.min(2, (place.rating ?? 0) / 2.5);
  score += Math.min(1, (place.rating_count ?? 0) / 200);

  return score;
}

/**
 * Loose filter: HARD city + category only. Vibes/budget/time are soft scores.
 */
export function selectCandidates(
  allPlaces: CuratedPlace[],
  intent: ParsedIntent,
  options?: { minPool?: number; maxCandidates?: number }
): CandidateForAi[] {
  const minPool = options?.minPool ?? 15;
  const maxCandidates = options?.maxCandidates ?? 50;

  const prishtina = allPlaces.filter(isPrishtinaPlace);
  const vibeMode =
    parseVibeModeFromIntent(intent) ||
    resolveVibeMode(intent.vibes[0], intent.summary_en);
  const dateNight = intentWantsDateNight(intent);
  const vibeCats =
    vibeMode === "all_nighter"
      ? ["bar", "nightlife"]
      : vibeMode
        ? getVibeRules(vibeMode).intentCategories
        : [];
  const cats = normalizeCategories(
    intent.categories.length > 0
      ? intent.categories
      : dateNight
        ? ["restaurant", "bar", "cafe", "nightlife"]
        : vibeCats
  );

  let pool: CuratedPlace[] = dateNight
    ? prishtina.filter(
        (p) =>
          !isReligiousOrWorshipPlace({
            name: p.name,
            description: p.description,
            id: p.id,
            curated_tip: p.curated_tip,
          })
      )
    : prishtina;

  if (cats.size > 0) {
    const strict = prishtina.filter((p) => hardCategoryMatch(p, cats));
    pool = strict.length >= minPool ? strict : prishtina;
  }

  const scored = pool
    .map((p) => ({ p, score: scorePlace(p, intent) }))
    .sort((a, b) => b.score - a.score);

  let top = scored.slice(0, maxCandidates).map((s) => toCandidate(s.p));

  if (vibeMode && getVibeRules(vibeMode).maxRestaurants != null) {
    const maxR = getVibeRules(vibeMode).maxRestaurants!;
    let rCount = 0;
    top = top.filter((c) => {
      if (c.category !== "restaurant") return true;
      if (rCount < maxR) {
        rCount++;
        return true;
      }
      return false;
    });
  }

  if (top.length < Math.min(5, minPool) && pool.length > top.length) {
    const seen = new Set(top.map((c) => c.place_id));
    for (const { p } of scored) {
      if (top.length >= minPool) break;
      const id = curatedPlaceId(p);
      if (!seen.has(id)) {
        top.push(toCandidate(p));
        seen.add(id);
      }
    }
  }

  return top;
}
