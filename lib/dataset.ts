/** Prishtina dataset — categories & vibe tags */
export const DATASET_CATEGORIES = [
  "restaurant",
  "cafe",
  "bar",
  "nightlife",
  "culture",
  "nature",
  "attraction",
  "other",
] as const;

export const DATASET_VIBE_TAGS = [
  "romantic",
  "chill",
  "outdoor",
  "budget",
  "social",
  "trendy",
  "traditional",
  "family",
  "solo",
  "lively",
  "cozy",
  "instagrammable",
  "local",
  "tourist-friendly",
  "late-night",
  "breakfast",
  "brunch",
  "lunch",
  "dinner",
] as const;

export type DatasetCategory = (typeof DATASET_CATEGORIES)[number];
export type DatasetVibeTag = (typeof DATASET_VIBE_TAGS)[number];

/** Map dataset category → interest keys for recommender */
export const CATEGORY_TO_INTEREST: Record<string, string> = {
  restaurant: "food",
  cafe: "coffee",
  bar: "nightlife",
  nightlife: "nightlife",
  culture: "culture",
  nature: "nature",
  attraction: "culture",
  other: "food",
};

export function mapPriceLevel(priceLevel: string | number | null | undefined): number {
  if (priceLevel == null || priceLevel === "") return 2;
  if (typeof priceLevel === "number") {
    return Math.min(4, Math.max(1, priceLevel === 0 ? 1 : priceLevel));
  }
  const s = String(priceLevel).trim().toLowerCase();
  const n = parseInt(s, 10);
  if (!Number.isNaN(n)) return Math.min(4, Math.max(1, n === 0 ? 1 : n));
  if (s.includes("$$$$")) return 4;
  if (s.includes("$$$")) return 3;
  if (s.includes("$$")) return 2;
  if (s.includes("$")) return 1;
  const words: Record<string, number> = {
    free: 1,
    inexpensive: 1,
    moderate: 2,
    expensive: 3,
    "very expensive": 4,
  };
  for (const [k, v] of Object.entries(words)) {
    if (s.includes(k)) return v;
  }
  return 2;
}

export function parseDatasetJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function formatCategoryLabel(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ");
}

/** UI mood cards on /vibes → dataset vibe tag */
export const VIBE_MOOD_TO_TAG: Record<string, DatasetVibeTag> = {
  cozy: "cozy",
  energetic: "lively",
  romantic: "romantic",
  adventurous: "outdoor",
  chill: "chill",
  traditional: "traditional",
};
