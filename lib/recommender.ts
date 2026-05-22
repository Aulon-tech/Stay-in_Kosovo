import OpenAI from "openai";
import { Place } from "@prisma/client";
import {
  haversineKm,
  isOpenNow,
  parseJson,
  timeOfDayFit,
  UserPreferences,
} from "@/lib/utils";
import {
  isDateNightVibeTag,
  isReligiousOrWorshipPlace,
} from "@/lib/place-suitability";
import {
  getVibeRules,
  resolveVibeMode,
  scorePlaceForVibe,
  type VibeModeId,
} from "@/lib/vibe-matching";

export type RecommendInput = {
  places: Place[];
  preferences: UserPreferences;
  lat: number;
  lng: number;
  time?: Date;
  weather?: string;
  availableMinutes?: number;
  vibe?: string;
  category?: string;
  maxDistanceKm?: number;
  openNow?: boolean;
  limit?: number;
  vibeMode?: VibeModeId;
  userText?: string;
};

export type RankedPlace = {
  place: Place;
  score: number;
  why: string;
  distanceKm: number;
};

function ruleBasedScore(
  place: Place,
  input: RecommendInput
): { score: number; why: string; distanceKm: number } {
  if (
    isDateNightVibeTag(input.vibe) &&
    isReligiousOrWorshipPlace({
      name: place.name,
      description: place.description,
      id: place.id,
    })
  ) {
    return { score: 0, why: "Not a typical date-night spot", distanceKm: 0 };
  }

  const prefs = input.preferences;
  const placeVibes = parseJson<string[]>(place.vibes, []);
  const hours = place.openingHours;
  const now = input.time || new Date();
  const distanceKm = haversineKm(input.lat, input.lng, place.lat, place.lng);

  if (input.maxDistanceKm && distanceKm > input.maxDistanceKm) {
    return { score: 0, why: "Outside your distance filter", distanceKm };
  }

  const userVibes = input.vibe
    ? [input.vibe, ...prefs.vibes]
    : prefs.vibes;
  const vibeOverlap = userVibes.filter((v) =>
    placeVibes.map((pv) => pv.toLowerCase()).includes(v.toLowerCase())
  );
  const vibeScore =
    userVibes.length > 0
      ? vibeOverlap.length / Math.max(userVibes.length, 1)
      : placeVibes.length > 0
        ? 0.4
        : 0.2;

  const maxDist = input.maxDistanceKm || 10;
  const proximityScore = Math.max(0, 1 - distanceKm / maxDist);

  const open = isOpenNow(hours, now);
  const openScore = input.openNow && !open ? 0 : open ? 1 : 0.5;

  const ratingScore = (place.avgRating || 0) / 5;
  const todScore = timeOfDayFit(place.category, now.getHours());

  let weatherBoost = 0;
  const w = (input.weather || "clear").toLowerCase();
  const cat = place.category.toLowerCase();
  if (w === "rain" && ["cafe", "restaurant", "culture", "bar"].includes(cat)) {
    weatherBoost = 0.08;
  }
  if (w === "clear" && ["nature", "culture", "attraction"].includes(cat)) {
    weatherBoost = 0.05;
  }

  let interestBoost = 0;
  if (prefs.interests?.length) {
    const catMap: Record<string, string> = {
      restaurant: "food",
      cafe: "coffee",
      bar: "nightlife",
      nightlife: "nightlife",
      culture: "culture",
      nature: "nature",
      attraction: "culture",
      other: "food",
      FOOD: "food",
      CULTURE: "culture",
      NIGHTLIFE: "nightlife",
      NATURE: "nature",
      SHOPPING: "shopping",
      CAFE: "coffee",
    };
    const catInterest = catMap[place.category];
    if (catInterest && prefs.interests.includes(catInterest)) interestBoost = 0.1;
  }

  let score =
    vibeScore * 0.4 +
    proximityScore * 0.25 +
    openScore * 0.15 +
    ratingScore * 0.1 +
    todScore * 0.1 +
    interestBoost +
    weatherBoost;

  const mode =
    input.vibeMode || resolveVibeMode(input.vibe, input.userText);
  if (mode) {
    score += scorePlaceForVibe(
      {
        name: place.name,
        category: place.category,
        vibes: placeVibes,
        description: place.description,
        openingHours: place.openingHours,
      },
      getVibeRules(mode),
      input.userText
    );
  }

  const reasons: string[] = [];
  if (vibeOverlap.length)
    reasons.push(`matches your ${vibeOverlap.slice(0, 2).join(", ")} vibe`);
  if (distanceKm < 1) reasons.push("very close to you");
  else if (distanceKm < 3) reasons.push("nearby");
  if (open) reasons.push("open now");
  if (place.avgRating >= 4) reasons.push("highly rated");
  if (todScore > 0.8) reasons.push("great for this time of day");

  return {
    score,
    why: reasons.length ? reasons.join("; ") : "Solid local pick",
    distanceKm,
  };
}

export async function getRecommendations(
  input: RecommendInput
): Promise<RankedPlace[]> {
  let places = [...input.places];

  if (isDateNightVibeTag(input.vibe)) {
    places = places.filter(
      (p) =>
        !isReligiousOrWorshipPlace({
          name: p.name,
          description: p.description,
          id: p.id,
        })
    );
  }

  if (input.category) {
    places = places.filter((p) => p.category === input.category);
  }
  // Vibe is a soft signal in rule-based path — do not hard-filter (AND) here.
  if (input.openNow) {
    places = places.filter((p) =>
      isOpenNow(p.openingHours)
    );
  }

  const limit = input.limit || 20;

  if (process.env.OPENAI_API_KEY && places.length > 0) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const summary = places.slice(0, 40).map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        vibes: parseJson<string[]>(p.vibes, []),
        rating: p.avgRating,
        city: p.city,
        dist: haversineKm(input.lat, input.lng, p.lat, p.lng).toFixed(1),
      }));

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Rank Prishtina places for a traveler. Return JSON array of {id, score (0-1), why (short)} max ${limit} items.${
              isDateNightVibeTag(input.vibe)
                ? " Romantic/date night: prefer restaurants, bars, cafes — never mosques or churches."
                : ""
            }`,
          },
          {
            role: "user",
            content: JSON.stringify({
              preferences: input.preferences,
              vibe: input.vibe,
              time: (input.time || new Date()).toISOString(),
              weather: input.weather || "clear",
              minutes: input.availableMinutes,
              places: summary,
            }),
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
      });

      const raw = res.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw) as {
        recommendations?: { id: string; score: number; why: string }[];
        results?: { id: string; score: number; why: string }[];
      };
      const list = parsed.recommendations || parsed.results || [];
      const byId = new Map(places.map((p) => [p.id, p]));
      const ranked: RankedPlace[] = [];
      for (const item of list) {
        const place = byId.get(item.id);
        if (!place) continue;
        ranked.push({
          place,
          score: item.score,
          why: item.why,
          distanceKm: haversineKm(input.lat, input.lng, place.lat, place.lng),
        });
      }
      if (ranked.length > 0) return ranked.slice(0, limit);
    } catch {
      /* rule-based fallback */
    }
  }

  const ranked = places
    .map((place) => {
      const { score, why, distanceKm } = ruleBasedScore(place, input);
      return { place, score, why, distanceKm };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked;
}

export function buildMiniItinerary(
  ranked: RankedPlace[],
  count = 3
): { placeId: string; order: number; plannedTime: string; transportMode: string }[] {
  const picks = ranked.slice(0, count);
  const baseHour = new Date().getHours();
  return picks.map((r, i) => ({
    placeId: r.place.id,
    order: i + 1,
    plannedTime: `${String(baseHour + i).padStart(2, "0")}:00`,
    transportMode: i === 0 ? "WALK" : "WALK",
  }));
}

export async function smartFillItinerary(
  places: Place[],
  preferences: UserPreferences,
  lat: number,
  lng: number,
  windowMinutes: number,
  vibe: string
): Promise<{ title: string; stops: { placeId: string; order: number; plannedTime: string; transportMode: string }[] }> {
  const ranked = await getRecommendations({
    places,
    preferences,
    lat,
    lng,
    vibe,
    availableMinutes: windowMinutes,
    limit: 6,
  });

  const stops: { placeId: string; order: number; plannedTime: string; transportMode: string }[] = [];
  let minutesUsed = 0;
  const start = new Date();
  start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30);

  for (let i = 0; i < ranked.length && minutesUsed < windowMinutes; i++) {
    const r = ranked[i];
    const cat = r.place.category.toLowerCase();
    const visitMin =
      cat === "restaurant" ? 75 : ["culture", "attraction"].includes(cat) ? 60 : 45;
    if (minutesUsed + visitMin > windowMinutes) break;
    const t = new Date(start.getTime() + minutesUsed * 60000);
    stops.push({
      placeId: r.place.id,
      order: stops.length + 1,
      plannedTime: `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`,
      transportMode: i === 0 ? "WALK" : stops.length % 2 === 0 ? "BUS" : "WALK",
    });
    minutesUsed += visitMin + 15;
  }

  const title = vibe
    ? `${vibe.charAt(0).toUpperCase() + vibe.slice(1)} plan · ${windowMinutes} min`
    : `Smart plan · ${windowMinutes} min`;

  return { title, stops };
}
