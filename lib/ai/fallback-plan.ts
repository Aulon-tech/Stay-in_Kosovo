import type { CuratedPlace } from "@/lib/curated-import";
import type { CandidateForAi, ParsedIntent, BuiltPlan } from "@/lib/ai/types";
import { getCuratedById } from "@/lib/ai/curated-data";
import {
  intentWantsDateNight,
  isReligiousOrWorshipPlace,
} from "@/lib/place-suitability";

const CATEGORY_ORDER: Record<string, number> = {
  cafe: 1,
  attraction: 2,
  culture: 3,
  nature: 4,
  restaurant: 5,
  bar: 6,
  nightlife: 7,
  other: 8,
};

function defaultStartHour(intent: ParsedIntent): number {
  if (intent.time_of_day.includes("night")) return 20;
  if (intent.time_of_day.includes("evening")) return 17;
  if (intent.time_of_day.includes("afternoon")) return 13;
  return 10;
}

function formatTime(h: number, m: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function buildFallbackPlan(
  candidates: CandidateForAi[],
  intent: ParsedIntent,
  curated: CuratedPlace[],
  windowMinutes: number,
  anchor?: { startHour24: number; startMinute: number }
): BuiltPlan {
  let pool = candidates;
  if (intentWantsDateNight(intent)) {
    pool = candidates.filter(
      (c) =>
        !isReligiousOrWorshipPlace({
          name: c.name,
          description: c.description_short,
          id: c.place_id,
        }) && ["restaurant", "bar", "nightlife", "cafe"].includes(c.category)
    );
    if (!pool.length) pool = candidates.filter(
      (c) =>
        !isReligiousOrWorshipPlace({
          name: c.name,
          description: c.description_short,
          id: c.place_id,
        })
    );
  }

  const sorted = [...pool].sort(
    (a, b) =>
      (CATEGORY_ORDER[a.category] ?? 9) - (CATEGORY_ORDER[b.category] ?? 9)
  );

  const maxStops =
    windowMinutes >= 360 ? 5 : windowMinutes >= 180 ? 4 : 3;
  const picks = sorted.slice(0, maxStops);

  let cursorH = anchor?.startHour24 ?? defaultStartHour(intent);
  let cursorM = anchor?.startMinute ?? 0;
  let used = 0;

  const stops = picks.map((c, i) => {
    const row = getCuratedById(curated, c.place_id);
    const stay = c.avg_duration_min || 60;
    const arrival = formatTime(cursorH, cursorM);
    used += stay + (i > 0 ? 15 : 0);
    cursorM += stay + 15;
    while (cursorM >= 60) {
      cursorH += Math.floor(cursorM / 60);
      cursorM %= 60;
    }

    return {
      place_id: c.place_id,
      arrival_time: arrival,
      why_this_place:
        row?.curated_tip?.trim() ||
        row?.description?.slice(0, 120) ||
        `A strong ${c.category} pick for your ${intent.summary_en || "day"}.`,
      what_to_do:
        c.category === "restaurant"
          ? "Enjoy a meal and local atmosphere."
          : c.category === "cafe"
            ? "Coffee and a slow start."
            : "Explore and take photos.",
      stay_minutes: stay,
      transport_mode: i === 0 ? ("WALK" as const) : ("WALK" as const),
    };
  });

  const vibeLabel =
    intent.vibes[0] ||
    intent.categories[0] ||
    intent.summary_en.slice(0, 24) ||
    "Prishtina";

  return {
    title: `${vibeLabel.charAt(0).toUpperCase() + vibeLabel.slice(1)} day · ${used} min`,
    stops,
  };
}
