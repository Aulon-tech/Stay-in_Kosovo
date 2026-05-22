import { geminiJsonCompletion } from "@/lib/ai/gemini-client";
import { parsedIntentSchema, type ParsedIntent } from "@/lib/ai/types";

const INTENT_SYSTEM = `You parse day-planning requests for Prishtina only.
The user writes in Albanian, English, or a mix. Extract structured intent only.
Return strict JSON matching this schema (no markdown):
{
  "vibes": string[],
  "categories": string[] (subset of: restaurant, cafe, bar, nightlife, culture, nature, attraction, other),
  "budget": "low" | "mid" | "high" | null,
  "time_of_day": ("morning"|"afternoon"|"evening"|"night")[],
  "duration_minutes": number | null,
  "specific_requests": string[],
  "language": "sq" | "en" | "mixed",
  "summary_en": string (one line, English)
}
Rules:
- Map nightlife/party/club/bar requests to categories ["bar","nightlife"].
- Map romantic / date night to categories ["restaurant","bar","cafe"] and vibes ["romantic"]. Never include mosques, churches, or cathedrals.
- Map cultural/museum/gallery to ["culture","attraction"].
- Do not invent categories outside the list.
- If duration unclear, use null.`;

function ruleBasedIntent(userText: string, vibeHint?: string): ParsedIntent {
  const t = `${userText} ${vibeHint || ""}`.toLowerCase();
  const vibes: string[] = [];
  const categories: string[] = [];
  const specific_requests: string[] = [];

  const vibeWords = [
    "cozy",
    "romantic",
    "chill",
    "lively",
    "nightlife",
    "traditional",
    "cultural",
    "culture",
    "budget",
    "outdoor",
    "nature",
  ];
  for (const v of vibeWords) {
    if (t.includes(v)) vibes.push(v === "cultural" ? "culture" : v);
  }
  if (vibeHint) vibes.push(vibeHint.toLowerCase());

  if (
    /nightlife|night|club|bar|party|sahat|natë|nate|klub|jetë natën/i.test(t)
  ) {
    categories.push("bar", "nightlife");
    vibes.push("lively", "late-night");
  }
  if (/restaurant|dinner|lunch|food|darkë|darke|ngrenë|ngrene|traditional/i.test(t)) {
    categories.push("restaurant");
  }
  if (/cafe|coffee|kafe|kafeje/i.test(t)) {
    categories.push("cafe");
  }
  if (/museum|gallery|culture|kultur|historic|monument/i.test(t)) {
    categories.push("culture", "attraction");
  }
  if (/nature|park|trail|germia/i.test(t)) {
    categories.push("nature");
  }

  let budget: ParsedIntent["budget"] = null;
  if (/cheap|budget|lirë|lire|shtrenjt|expensive|premium/i.test(t)) {
    budget = /shtrenjt|expensive|premium/i.test(t) ? "high" : "low";
  }

  const time_of_day: ParsedIntent["time_of_day"] = [];
  if (/morning|mëngjes|mengjes|breakfast/i.test(t)) time_of_day.push("morning");
  if (/afternoon|pasdite/i.test(t)) time_of_day.push("afternoon");
  if (/evening|mbrëmje|mbrema|dinner/i.test(t)) time_of_day.push("evening");
  if (/night|natë|nate/i.test(t)) time_of_day.push("night");

  if (
    /romantic|date night|intimate|couple|anniversary/i.test(t) ||
    vibeHint?.toLowerCase() === "romantic"
  ) {
    if (!vibes.includes("romantic")) vibes.push("romantic");
    for (const c of ["restaurant", "bar", "cafe"] as const) {
      if (!categories.includes(c)) categories.push(c);
    }
    if (!time_of_day.includes("evening")) time_of_day.push("evening");
  }

  if (/traditional/i.test(t)) specific_requests.push("traditional");

  let duration_minutes: number | null = null;
  if (/full day/i.test(t)) duration_minutes = 480;
  else if (/half day/i.test(t)) duration_minutes = 240;
  else if (/\b2\s*h|\b2h/i.test(t)) duration_minutes = 120;

  return parsedIntentSchema.parse({
    vibes: Array.from(new Set(vibes)),
    categories: Array.from(new Set(categories)),
    budget,
    time_of_day,
    duration_minutes,
    specific_requests,
    language: /[ëç]/i.test(userText) ? "sq" : "en",
    summary_en: userText.slice(0, 120),
  });
}

export async function parseUserIntent(
  userText: string,
  options?: { vibeHint?: string; windowMinutes?: number }
): Promise<ParsedIntent> {
  const text = userText.trim();
  if (!text && options?.vibeHint) {
    return ruleBasedIntent("", options.vibeHint);
  }
  if (!text) {
    return ruleBasedIntent("relaxed day in Prishtina", options?.vibeHint);
  }

  try {
    const raw = await geminiJsonCompletion<unknown>(
      JSON.stringify({
        user_text: text,
        vibe_button_hint: options?.vibeHint || null,
        window_minutes: options?.windowMinutes ?? null,
      }),
      INTENT_SYSTEM
    );
    const parsed = parsedIntentSchema.safeParse(raw);
    if (parsed.success) {
      const intent = parsed.data;
      if (!intent.duration_minutes && options?.windowMinutes) {
        intent.duration_minutes = options.windowMinutes;
      }
      return intent;
    }
  } catch {
    /* fallback */
  }

  const fallback = ruleBasedIntent(text, options?.vibeHint);
  if (!fallback.duration_minutes && options?.windowMinutes) {
    fallback.duration_minutes = options.windowMinutes;
  }
  return fallback;
}
