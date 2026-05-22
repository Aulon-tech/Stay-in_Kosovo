import { geminiJsonCompletion, getGeminiApiKey } from "@/lib/ai/gemini-client";
import type { CuratedPlace } from "@/lib/curated-import";
import { buildFallbackPlan } from "@/lib/ai/fallback-plan";
import {
  builtPlanSchema,
  type BuiltPlan,
  type CandidateForAi,
  type ParsedIntent,
} from "@/lib/ai/types";
import { intentWantsDateNight } from "@/lib/place-suitability";
import {
  formatArrival12h,
  type ResolvedPlanSchedule,
} from "@/lib/plan-schedule";

const PLAN_SYSTEM_BASE = `You are a local Prishtina day-planning guide.
You MUST only use places from the provided JSON candidate list.
NEVER invent, rename, or reference a place_id not in the list.
Return strict JSON:
{
  "title": string,
  "stops": [
    {
      "place_id": string (exact id from list),
      "arrival_time": string (e.g. "09:00 AM"),
      "why_this_place": string,
      "what_to_do": string,
      "stay_minutes": number,
      "transport_mode": "WALK"|"BUS"|"TAXI"|"BIKE" (optional)
    }
  ]
}
Sequence stops in natural day rhythm: cafe/breakfast morning, sights midday, dinner evening, bars at night.
Respect total time and budget. Use 3-5 stops unless duration is very short.
why_this_place MUST cite the candidate description or rating from the list — no generic filler.`;

function planSystemFor(intent: ParsedIntent, replan = false): string {
  const lang =
    intent.language === "sq"
      ? "Albanian"
      : intent.language === "en"
        ? "English"
        : "English or Albanian";
  const langLine = `Write why_this_place in ${lang}.`;
  const dateNightLine = intentWantsDateNight(intent)
    ? "Date-night / romantic: only restaurants, bars, cafes — never mosques, churches, or cathedrals."
    : "";
  if (replan) {
    return `${PLAN_SYSTEM_BASE}
${langLine}${dateNightLine ? `\n${dateNightLine}` : ""}
The user already has a plan and wants changes. Adjust the plan: swap stops, shorten, cheaper options, more food, etc.
Still use ONLY candidates from the list. Return a full updated plan JSON.`;
  }
  return `${PLAN_SYSTEM_BASE}\n${langLine}${dateNightLine ? `\n${dateNightLine}` : ""}`;
}

function validatePlanIds(
  plan: BuiltPlan,
  candidates: CandidateForAi[],
  intent?: ParsedIntent
): BuiltPlan | null {
  const allowed = new Set(candidates.map((c) => c.place_id.toLowerCase()));
  const stops = plan.stops.filter((s) =>
    allowed.has(s.place_id.toLowerCase().trim())
  );
  if (stops.length === 0) return null;
  if (intent && intentWantsDateNight(intent)) {
    const byId = new Map(candidates.map((c) => [c.place_id.toLowerCase(), c]));
    const filtered = stops.filter((s) => {
      const c = byId.get(s.place_id.toLowerCase().trim());
      if (!c) return false;
      const blob = `${c.name} ${c.category}`.toLowerCase();
      return !/\b(mosque|xhami|cathedral|church|kisha)\b/.test(blob);
    });
    if (filtered.length === 0) return null;
    return { ...plan, stops: filtered };
  }
  return { ...plan, stops };
}

export async function buildDayPlanFromCandidates(
  userText: string,
  intent: ParsedIntent,
  candidates: CandidateForAi[],
  curated: CuratedPlace[],
  windowMinutes: number,
  schedule?: ResolvedPlanSchedule
): Promise<{ plan: BuiltPlan; usedGemini: boolean }> {
  if (candidates.length === 0) {
    throw new Error("No candidates available for planning");
  }

  const listJson = JSON.stringify(candidates.slice(0, 45));

  const anchor = schedule
    ? { startHour24: schedule.startHour24, startMinute: schedule.startMinute }
    : undefined;

  if (!getGeminiApiKey()) {
    return {
      plan: buildFallbackPlan(
        candidates,
        intent,
        curated,
        windowMinutes,
        anchor
      ),
      usedGemini: false,
    };
  }

  const userPrompt = JSON.stringify({
    user_request: userText,
    parsed_intent: intent,
    total_minutes: windowMinutes,
    city: "Prishtina",
    schedule: schedule
      ? {
          date: schedule.planDate,
          start_time: formatArrival12h(
            schedule.startHour24,
            schedule.startMinute
          ),
          first_stop_at_or_after: schedule.startTime,
        }
      : null,
    candidates: JSON.parse(listJson),
  });

  try {
    const raw = await geminiJsonCompletion<unknown>(
      userPrompt,
      planSystemFor(intent)
    );
    const parsed = builtPlanSchema.safeParse(raw);
    if (parsed.success) {
      const valid = validatePlanIds(parsed.data, candidates, intent);
      if (valid) return { plan: valid, usedGemini: true };
    }
  } catch {
    /* retry handled in client; fall through */
  }

  try {
    const raw = await geminiJsonCompletion<unknown>(
      `${userPrompt}\n\nReminder: use ONLY place_id values from candidates.`,
      planSystemFor(intent)
    );
    const parsed = builtPlanSchema.safeParse(raw);
    if (parsed.success) {
      const valid = validatePlanIds(parsed.data, candidates, intent);
      if (valid) return { plan: valid, usedGemini: true };
    }
  } catch {
    /* fallback */
  }

  return {
    plan: buildFallbackPlan(
      candidates,
      intent,
      curated,
      windowMinutes,
      anchor
    ),
    usedGemini: false,
  };
}

export async function replanDay(
  changeRequest: string,
  currentPlan: BuiltPlan,
  intent: ParsedIntent,
  candidates: CandidateForAi[],
  curated: CuratedPlace[],
  windowMinutes: number,
  schedule?: ResolvedPlanSchedule
): Promise<{ plan: BuiltPlan; usedGemini: boolean }> {
  if (!getGeminiApiKey()) {
    return { plan: currentPlan, usedGemini: false };
  }

  const userPrompt = JSON.stringify({
    change_request: changeRequest,
    current_plan: currentPlan,
    parsed_intent: intent,
    total_minutes: windowMinutes,
    schedule: schedule
      ? {
          date: schedule.planDate,
          start_time: formatArrival12h(
            schedule.startHour24,
            schedule.startMinute
          ),
        }
      : null,
    candidates: candidates.slice(0, 45),
  });

  try {
    const raw = await geminiJsonCompletion<unknown>(
      userPrompt,
      planSystemFor(intent, true)
    );
    const parsed = builtPlanSchema.safeParse(raw);
    if (parsed.success) {
      const valid = validatePlanIds(parsed.data, candidates, intent);
      if (valid) return { plan: valid, usedGemini: true };
    }
  } catch {
    /* fallback */
  }

  return { plan: currentPlan, usedGemini: false };
}
