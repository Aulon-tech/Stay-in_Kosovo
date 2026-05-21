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

export const VIBES = [
  "cozy",
  "energetic",
  "romantic",
  "adventurous",
  "chill",
  "trendy",
  "traditional",
  "scenic",
] as const;

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

export type OpeningHours = Record<
  string,
  { open: string; close: string } | null
>;

export function isOpenNow(
  openingHours: OpeningHours | null,
  now = new Date()
): boolean {
  if (!openingHours) return true;
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const key = days[now.getDay()];
  const hours = openingHours[key];
  if (!hours) return false;
  const [openH, openM] = hours.open.split(":").map(Number);
  const [closeH, closeM] = hours.close.split(":").map(Number);
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
  const map: Record<string, [number, number][]> = {
    CAFE: [[7, 11], [14, 18]],
    FOOD: [[12, 14], [18, 22]],
    NIGHTLIFE: [[21, 3]],
    CULTURE: [[10, 18]],
    NATURE: [[8, 19]],
    SHOPPING: [[10, 20]],
  };
  const windows = map[category] || [[9, 21]];
  for (const [start, end] of windows) {
    if (start <= end) {
      if (hour >= start && hour <= end) return 1;
    } else {
      if (hour >= start || hour <= end) return 1;
    }
  }
  return 0.3;
}
