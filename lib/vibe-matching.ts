import type { ParsedIntent } from "@/lib/ai/types";

export type VibeModeId =
  | "all_nighter"
  | "chill"
  | "adventure"
  | "foodie"
  | "study"
  | "romantic"
  | "culture";

export type ScorablePlace = {
  name: string;
  category: string;
  vibes?: string[];
  description?: string | null;
  curated_tip?: string | null;
  time_of_day?: string[];
  openingHours?: string | null;
};

export type VibeRules = {
  id: VibeModeId;
  label: string;
  intent: string;
  preferredCategories: string[];
  avoidCategories: string[];
  maxRestaurants: number | null;
  preferredTags: string[];
  avoidTags: string[];
  keywordPatterns: RegExp;
  intentVibes: string[];
  intentCategories: string[];
  timeOfDay: ParsedIntent["time_of_day"];
};

const VIBE_RULES: Record<VibeModeId, VibeRules> = {
  all_nighter: {
    id: "all_nighter",
    label: "All nighter",
    intent: "Party, clubs, bars, music and late-night fun",
    preferredCategories: ["bar", "nightlife", "night_club"],
    avoidCategories: ["culture", "nature", "attraction", "museum"],
    maxRestaurants: 1,
    preferredTags: [
      "lively",
      "late-night",
      "nightlife",
      "social",
      "trendy",
      "club",
      "music",
      "dance",
    ],
    avoidTags: ["family", "solo", "breakfast", "brunch"],
    keywordPatterns:
      /\b(all nighter|all-nighter|party|partying|club|clubs|nightlife|night life|bar|bars|drinks|drinking|dancing|dance|music|live music|dj|cocktail|beer|fun all night|going out|late night|natë|nate|klub|jetë natën|sahat)\b/i,
    intentVibes: ["lively", "late-night", "nightlife"],
    intentCategories: ["bar", "nightlife"],
    timeOfDay: ["night", "evening"],
  },
  chill: {
    id: "chill",
    label: "Chill",
    intent: "Relaxed, calm, coffee and slow pace",
    preferredCategories: ["cafe", "nature", "attraction", "culture"],
    avoidCategories: ["nightlife"],
    maxRestaurants: 2,
    preferredTags: ["chill", "cozy", "solo", "peaceful", "relaxed"],
    avoidTags: ["lively", "late-night", "club"],
    keywordPatterns:
      /\b(chill|relaxed|calm|peaceful|slow|coffee|cozy|quiet|walk|stroll|qetë|qete|i qetë)\b/i,
    intentVibes: ["chill", "cozy"],
    intentCategories: ["cafe", "nature", "attraction"],
    timeOfDay: ["morning", "afternoon"],
  },
  adventure: {
    id: "adventure",
    label: "Adventure",
    intent: "Nature, hiking, viewpoints and outdoor exploration",
    preferredCategories: ["nature", "attraction", "culture"],
    avoidCategories: ["nightlife", "bar"],
    maxRestaurants: 2,
    preferredTags: ["outdoor", "adventurous", "nature", "scenic"],
    avoidTags: ["late-night", "club", "lively"],
    keywordPatterns:
      /\b(adventure|explore|hiking|hike|trail|nature|mountain|park|germia|viewpoint|road trip|outdoor|aventur|natyr)\b/i,
    intentVibes: ["outdoor", "adventurous"],
    intentCategories: ["nature", "attraction"],
    timeOfDay: ["morning", "afternoon"],
  },
  foodie: {
    id: "foodie",
    label: "Foodie",
    intent: "Food-focused day — restaurants, cafés, local cuisine",
    preferredCategories: ["restaurant", "cafe", "bar"],
    avoidCategories: [],
    maxRestaurants: null,
    preferredTags: [
      "traditional",
      "local",
      "dinner",
      "lunch",
      "brunch",
      "breakfast",
    ],
    avoidTags: [],
    keywordPatterns:
      /\b(food|foodie|eat|eating|hungry|restaurant|dinner|lunch|breakfast|brunch|traditional food|street food|ngren|darkë|darke|restorant)\b/i,
    intentVibes: ["traditional", "local"],
    intentCategories: ["restaurant", "cafe"],
    timeOfDay: ["afternoon", "evening"],
  },
  study: {
    id: "study",
    label: "Study / productive",
    intent: "Quiet places to work or study with Wi‑Fi",
    preferredCategories: ["cafe"],
    avoidCategories: ["nightlife", "bar"],
    maxRestaurants: 1,
    preferredTags: ["cozy", "chill", "solo"],
    avoidTags: ["lively", "late-night", "club", "nightlife"],
    keywordPatterns:
      /\b(study|studying|work|working|productive|productivity|laptop|focus|wifi|wi-fi|library|coworking|quiet|calm café)\b/i,
    intentVibes: ["cozy", "chill", "solo"],
    intentCategories: ["cafe"],
    timeOfDay: ["morning", "afternoon"],
  },
  romantic: {
    id: "romantic",
    label: "Romantic",
    intent: "Date night — cozy restaurants, scenic spots, intimate atmosphere",
    preferredCategories: ["restaurant", "bar", "cafe", "attraction"],
    avoidCategories: ["nightlife"],
    maxRestaurants: 2,
    preferredTags: ["romantic", "cozy", "scenic", "intimate"],
    avoidTags: ["lively", "club"],
    keywordPatterns:
      /\b(romantic|date night|date|couple|anniversary|sunset|intimate|special night|dashuri|romantik)\b/i,
    intentVibes: ["romantic"],
    intentCategories: ["restaurant", "bar", "cafe"],
    timeOfDay: ["evening", "night"],
  },
  culture: {
    id: "culture",
    label: "Culture & history",
    intent: "Museums, heritage, galleries and historic sights",
    preferredCategories: ["culture", "attraction"],
    avoidCategories: ["nightlife", "bar"],
    maxRestaurants: 1,
    preferredTags: ["traditional", "culture", "tourist-friendly", "historic"],
    avoidTags: ["club", "late-night"],
    keywordPatterns:
      /\b(culture|cultural|museum|gallery|historic|history|heritage|monument|kultur|tradit)\b/i,
    intentVibes: ["traditional", "culture"],
    intentCategories: ["culture", "attraction"],
    timeOfDay: ["morning", "afternoon"],
  },
};

/** UI mood card id or dataset vibe tag → vibe mode */
export const VIBE_MOOD_TO_MODE: Record<string, VibeModeId> = {
  all_nighter: "all_nighter",
  energetic: "all_nighter",
  lively: "all_nighter",
  chill: "chill",
  cozy: "chill",
  adventurous: "adventure",
  adventure: "adventure",
  outdoor: "adventure",
  foodie: "foodie",
  food: "foodie",
  study: "study",
  productive: "study",
  romantic: "romantic",
  traditional: "culture",
  culture: "culture",
};

export function getVibeRules(mode: VibeModeId): VibeRules {
  return VIBE_RULES[mode];
}

export function getAllVibeModes(): VibeModeId[] {
  return Object.keys(VIBE_RULES) as VibeModeId[];
}

function placeBlob(place: ScorablePlace): string {
  const vibes = (place.vibes || []).join(" ");
  return `${place.name} ${place.category} ${place.description || ""} ${place.curated_tip || ""} ${vibes}`.toLowerCase();
}

function normalizeCategory(cat: string): string {
  const c = cat.toLowerCase();
  if (c === "food") return "restaurant";
  if (c === "coffee") return "cafe";
  if (c === "night_club" || c === "club") return "nightlife";
  return c;
}

function isLateNightPlace(place: ScorablePlace): boolean {
  const blob = placeBlob(place);
  if (/\b(late.?night|open late|until \d|24.?hour)\b/i.test(blob)) return true;
  const tod = (place.time_of_day || []).map((t) => String(t).toLowerCase());
  return tod.some((t) => t.includes("night") || t.includes("evening"));
}

/** Infer vibe mode from free text (highest keyword hit count). */
export function detectVibeFromText(text: string): VibeModeId | null {
  const t = text.trim();
  if (!t) return null;
  let best: VibeModeId | null = null;
  let bestScore = 0;
  for (const mode of getAllVibeModes()) {
    const rules = getVibeRules(mode);
    const matches = t.match(rules.keywordPatterns);
    const score = matches ? matches.length : 0;
    if (score > bestScore) {
      bestScore = score;
      best = mode;
    }
  }
  return bestScore > 0 ? best : null;
}

/** Resolve mode from UI mood id, dataset tag, or user description. */
export function resolveVibeMode(
  vibeHint?: string | null,
  userText?: string | null
): VibeModeId | null {
  const text = userText?.trim() || "";
  const detected = detectVibeFromText(text);
  if (detected) return detected;

  const hint = vibeHint?.trim().toLowerCase();
  if (!hint) return null;
  if (VIBE_MOOD_TO_MODE[hint]) return VIBE_MOOD_TO_MODE[hint];
  for (const mode of getAllVibeModes()) {
    if (getVibeRules(mode).intentVibes.includes(hint)) return mode;
  }
  return null;
}

export function enrichIntentWithVibeMode(
  intent: ParsedIntent,
  mode: VibeModeId
): ParsedIntent {
  const rules = getVibeRules(mode);
  return {
    ...intent,
    vibes: Array.from(new Set([...intent.vibes, ...rules.intentVibes])),
    categories:
      intent.categories.length > 0
        ? intent.categories
        : [...rules.intentCategories],
    time_of_day:
      intent.time_of_day.length > 0 ? intent.time_of_day : [...rules.timeOfDay],
    specific_requests: Array.from(
      new Set([...intent.specific_requests, `vibe_mode:${mode}`])
    ),
    summary_en: intent.summary_en || rules.intent,
  };
}

export function parseVibeModeFromIntent(intent: ParsedIntent): VibeModeId | null {
  const tag = intent.specific_requests.find((r) => r.startsWith("vibe_mode:"));
  if (!tag) return null;
  const id = tag.replace("vibe_mode:", "") as VibeModeId;
  return id in VIBE_RULES ? id : null;
}

export function scorePlaceForVibe(
  place: ScorablePlace,
  rules: VibeRules,
  userText?: string
): number {
  const cat = normalizeCategory(place.category);
  const blob = placeBlob(place);
  const tags = (place.vibes || []).map((v) => v.toLowerCase());
  let score = 0;

  if (rules.preferredCategories.includes(cat)) score += 8;
  if (cat === "bar" || cat === "nightlife") {
    if (rules.id === "all_nighter") score += 6;
  }
  if (rules.avoidCategories.includes(cat)) score -= 12;

  for (const t of rules.preferredTags) {
    if (tags.some((v) => v.includes(t) || t.includes(v))) score += 4;
    if (blob.includes(t)) score += 2;
  }
  for (const t of rules.avoidTags) {
    if (tags.some((v) => v.includes(t))) score -= 5;
  }

  if (rules.id === "all_nighter") {
    if (cat === "restaurant") {
      score += isLateNightPlace(place) ? 2 : -10;
    }
    if (/\b(club|dj|cocktail|beer|lounge|danc|live music|nightclub)\b/i.test(blob))
      score += 6;
    if (cat === "cafe") score -= 6;
    if (cat === "culture" || cat === "nature") score -= 8;
    if (isLateNightPlace(place)) score += 3;
  }

  if (rules.id === "foodie") {
    if (cat === "restaurant") score += 10;
    if (cat === "cafe") score += 5;
    if (/\b(traditional|local|grill|pizza|soup|burek)\b/i.test(blob)) score += 3;
  }

  if (rules.id === "study") {
    if (cat === "cafe") score += 10;
    if (/\b(wifi|wi-fi|quiet|work|laptop|study)\b/i.test(blob)) score += 5;
    if (cat === "bar" || cat === "nightlife") score -= 15;
  }

  if (rules.id === "chill") {
    if (cat === "cafe") score += 7;
    if (cat === "nature") score += 5;
    if (cat === "bar" || cat === "nightlife") score -= 10;
  }

  if (rules.id === "adventure") {
    if (cat === "nature") score += 10;
    if (cat === "attraction") score += 4;
    if (cat === "bar" || cat === "nightlife") score -= 12;
  }

  if (rules.id === "romantic") {
    if (cat === "restaurant") score += 7;
    if (cat === "bar") score += 4;
    if (/\b(cozy|intimate|scenic|rooftop|wine)\b/i.test(blob)) score += 4;
    if (cat === "nightlife") score -= 8;
  }

  if (rules.id === "culture") {
    if (cat === "culture" || cat === "attraction") score += 10;
    if (/\b(museum|gallery|historic|monument|heritage)\b/i.test(blob)) score += 5;
    if (cat === "bar" || cat === "nightlife") score -= 8;
  }

  if (userText?.trim()) {
    const extra = detectVibeFromText(userText);
    if (extra && extra === rules.id) score += 4;
    const words = userText.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    for (const w of words) {
      if (blob.includes(w)) score += 1;
    }
  }

  return score;
}

export function shouldSkipPlaceForVibe(
  place: ScorablePlace,
  rules: VibeRules
): boolean {
  const cat = normalizeCategory(place.category);
  if (!rules.avoidCategories.includes(cat)) return false;
  const vibeScore = scorePlaceForVibe(place, rules);
  return vibeScore < 2;
}

export type RankedForVibe<T> = T & { score: number };

/** Sort by vibe fit and enforce category caps (e.g. max 1 restaurant for party). */
export function filterRecommendationsByVibe<T extends { score: number }>(
  items: T[],
  getPlace: (item: T) => ScorablePlace,
  mode: VibeModeId,
  options?: { limit?: number; userText?: string }
): T[] {
  const rules = getVibeRules(mode);
  const limit = options?.limit ?? 20;
  const userText = options?.userText;

  const ranked = items
    .map((item) => ({
      item,
      vibeScore: scorePlaceForVibe(getPlace(item), rules, userText),
      total: item.score + scorePlaceForVibe(getPlace(item), rules, userText),
    }))
    .filter(({ item }) => !shouldSkipPlaceForVibe(getPlace(item), rules))
    .sort((a, b) => b.total - a.total);

  const out: T[] = [];
  let restaurantCount = 0;

  for (const { item } of ranked) {
    if (out.length >= limit) break;
    const cat = normalizeCategory(getPlace(item).category);
    if (rules.maxRestaurants != null && cat === "restaurant") {
      if (restaurantCount >= rules.maxRestaurants) continue;
      restaurantCount++;
    }
    out.push(item);
  }

  if (out.length < Math.min(5, limit)) {
    for (const { item } of ranked) {
      if (out.length >= limit) break;
      if (out.includes(item)) continue;
      const cat = normalizeCategory(getPlace(item).category);
      if (rules.maxRestaurants != null && cat === "restaurant") {
        if (
          restaurantCount >= rules.maxRestaurants &&
          !out.some((x) => normalizeCategory(getPlace(x).category) === "restaurant")
        )
          continue;
        if (cat === "restaurant") restaurantCount++;
      }
      out.push(item);
    }
  }

  return out.slice(0, limit);
}

export function buildPromptFromVibeMode(
  mode: VibeModeId,
  extraText?: string
): string {
  const rules = getVibeRules(mode);
  const extra = extraText?.trim();
  return extra ? `${rules.intent}. ${extra}` : rules.intent;
}
