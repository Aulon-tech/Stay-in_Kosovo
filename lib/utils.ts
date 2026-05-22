import { DATASET_VIBE_TAGS } from "@/lib/dataset";
import {
  normalizeOpeningHours,
  type OpeningHours,
} from "@/lib/opening-hours";

export type { OpeningHours };

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function stringifyJson(value: unknown): string {
  return JSON.stringify(value);
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export const PRISHTINA = { lat: 42.6629, lng: 21.1655 };

/** Innovation & Training Park Prizren (former KFOR camp area) */
export const PRIZREN_ITP = { lat: 42.227, lng: 20.712 };

/** @deprecated use DATASET_VIBE_TAGS — kept for imports */
export const VIBES = DATASET_VIBE_TAGS;

export const INTERESTS = [
  "food",
  "culture",
  "nightlife",
  "nature",
  "shopping",
  "coffee",
  "history",
  "music",
] as const;

export type UserPreferences = {
  vibes: string[];
  interests: string[];
  quizCompleted?: boolean;
};

export type ItineraryStop = {
  placeId: string;
  order: number;
  plannedTime?: string;
  transportMode?: string;
};

export function isOpenNow(
  openingHours: OpeningHours | string | Record<string, unknown> | null,
  now = new Date()
): boolean {
  const hours = normalizeOpeningHours(openingHours);
  if (!hours) return true;
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const key = days[now.getDay()];
  const slot = hours[key];
  if (!slot) return false;
  const [openH, openM] = slot.open.split(":").map(Number);
  const [closeH, closeM] = slot.close.split(":").map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;
  if (closeMins < openMins) return mins >= openMins || mins <= closeMins;
  return mins >= openMins && mins <= closeMins;
}

export function timeOfDayFit(
  category: string,
  hour: number
): number {
  const c = category.toLowerCase();
  const map: Record<string, [number, number][]> = {
    cafe: [[7, 11], [14, 18]],
    restaurant: [[12, 14], [18, 22]],
    bar: [[18, 2]],
    nightlife: [[21, 3]],
    culture: [[10, 18]],
    attraction: [[10, 18]],
    nature: [[8, 19]],
    other: [[10, 20]],
    CAFE: [[7, 11], [14, 18]],
    FOOD: [[12, 14], [18, 22]],
    NIGHTLIFE: [[21, 3]],
    CULTURE: [[10, 18]],
    NATURE: [[8, 19]],
    SHOPPING: [[10, 20]],
  };
  const windows = map[c] || map[category] || [[9, 21]];
  for (const [start, end] of windows) {
    if (start <= end) {
      if (hour >= start && hour <= end) return 1;
    } else {
      if (hour >= start || hour <= end) return 1;
    }
  }
  return 0.3;
}
