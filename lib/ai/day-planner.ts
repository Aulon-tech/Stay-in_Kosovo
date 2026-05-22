import { loadCuratedPlaces } from "@/lib/ai/curated-data";
import { selectCandidates } from "@/lib/ai/candidate-filter";
import { parseUserIntent } from "@/lib/ai/intent-parser";
import {
  buildDayPlanFromCandidates,
  replanDay,
} from "@/lib/ai/plan-builder";
import { resolveBuiltPlan } from "@/lib/ai/resolve-plan";
import { tryStructuredPlanEdit } from "@/lib/ai/plan-edits";
import type { BuiltPlan, DayPlanResult } from "@/lib/ai/types";
import {
  normalizePlanSchedule,
  restaggerBuiltPlan,
  type PlanScheduleInput,
} from "@/lib/plan-schedule";

export type BuildDayPlanInput = PlanScheduleInput & {
  userText: string;
  vibeHint?: string;
  windowMinutes?: number;
};

export async function buildDayPlan(
  input: BuildDayPlanInput
): Promise<DayPlanResult> {
  const windowMinutes = input.windowMinutes ?? 240;
  const schedule = normalizePlanSchedule(input);
  const curated = loadCuratedPlaces();
  const scheduleNote = `Free on ${schedule.planDate} from ${schedule.startTime}.`;
  const intent = await parseUserIntent(`${input.userText} ${scheduleNote}`, {
    vibeHint: input.vibeHint,
    windowMinutes,
  });

  const candidates = selectCandidates(curated, intent, {
    minPool: intent.categories.some((c) =>
      ["bar", "nightlife"].includes(c)
    )
      ? 20
      : 15,
    maxCandidates: 50,
  });

  const { plan, usedGemini } = await buildDayPlanFromCandidates(
    input.userText || intent.summary_en,
    intent,
    candidates,
    curated,
    windowMinutes,
    schedule
  );

  const scheduled = restaggerBuiltPlan(
    plan,
    schedule.startHour24,
    schedule.startMinute
  );
  const stops = await resolveBuiltPlan(scheduled, curated);
  if (stops.length === 0) {
    throw new Error("Could not resolve any stops to database places");
  }
  if (stops.length < scheduled.stops.length) {
    throw new Error(
      `Only ${stops.length} of ${scheduled.stops.length} stops matched the database — run: npm run import:places`
    );
  }

  return {
    title: scheduled.title,
    stops,
    intent,
    candidateCount: candidates.length,
    usedGemini,
    planDate: schedule.planDate,
    startTime: schedule.startTime,
  };
}

export type ReplanInput = PlanScheduleInput & {
  changeRequest: string;
  currentPlan: BuiltPlan;
  intent?: BuildDayPlanInput;
  windowMinutes?: number;
};

export async function replanDayFromRequest(
  input: ReplanInput
): Promise<DayPlanResult & { editKind?: string; structuredEdit?: boolean }> {
  const windowMinutes = input.windowMinutes ?? 240;
  const schedule = normalizePlanSchedule(input);
  const curated = loadCuratedPlaces();

  const local = tryStructuredPlanEdit(
    input.changeRequest,
    input.currentPlan,
    curated,
    schedule
  );
  if (local) {
    const stops = await resolveBuiltPlan(local.plan, curated);
    if (stops.length > 0) {
      return {
        title: local.plan.title,
        stops,
        intent: await parseUserIntent(input.changeRequest, { windowMinutes }),
        candidateCount: curated.length,
        usedGemini: false,
        structuredEdit: true,
        editKind: local.editKind,
        planDate: schedule.planDate,
        startTime: schedule.startTime,
      };
    }
  }

  const intent = input.intent
    ? await parseUserIntent(input.intent.userText, {
        vibeHint: input.intent.vibeHint,
        windowMinutes,
      })
    : await parseUserIntent(input.changeRequest, { windowMinutes });

  const candidates = selectCandidates(curated, intent, {
    minPool: 20,
    maxCandidates: 50,
  });

  const { plan, usedGemini } = await replanDay(
    input.changeRequest,
    input.currentPlan,
    intent,
    candidates,
    curated,
    windowMinutes,
    schedule
  );

  const scheduled = restaggerBuiltPlan(
    plan,
    schedule.startHour24,
    schedule.startMinute
  );
  const stops = await resolveBuiltPlan(scheduled, curated);
  if (stops.length === 0) {
    throw new Error("Could not resolve any stops — run: npm run import:places");
  }

  return {
    title: plan.title,
    stops,
    intent,
    candidateCount: candidates.length,
    usedGemini,
    structuredEdit: false,
    planDate: schedule.planDate,
    startTime: schedule.startTime,
  };
}

/** Top recommendations from same pipeline (no full sequencing). */
export async function recommendFromPrompt(
  userText: string,
  limit = 12,
  vibeHint?: string
): Promise<
  {
    placeId: string;
    why: string;
    score: number;
  }[]
> {
  const curated = loadCuratedPlaces();
  const intent = await parseUserIntent(userText, { vibeHint });
  const candidates = selectCandidates(curated, intent, {
    minPool: 15,
    maxCandidates: Math.max(limit, 25),
  });

  const { plan } = await buildDayPlanFromCandidates(
    userText,
    intent,
    candidates,
    curated,
    intent.duration_minutes ?? 240
  );

  const resolved = await resolveBuiltPlan(plan, curated);
  const whyByCurated = new Map(
    plan.stops.map((s) => [s.place_id.toLowerCase(), s.why_this_place])
  );

  return resolved.slice(0, limit).map((r, i) => ({
    placeId: r.placeId,
    why:
      r.why ||
      whyByCurated.get(r.curatedPlaceId.toLowerCase()) ||
      "Great local pick",
    score: 1 - i * 0.05,
  }));
}
