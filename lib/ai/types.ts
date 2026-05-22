import { z } from "zod";

export const parsedIntentSchema = z.object({
  vibes: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  budget: z.enum(["low", "mid", "high"]).nullable().default(null),
  time_of_day: z
    .array(z.enum(["morning", "afternoon", "evening", "night"]))
    .default([]),
  duration_minutes: z.number().int().positive().nullable().default(null),
  specific_requests: z.array(z.string()).default([]),
  language: z.enum(["sq", "en", "mixed"]).default("en"),
  summary_en: z.string().default(""),
});

export type ParsedIntent = z.infer<typeof parsedIntentSchema>;

export const planStopSchema = z.object({
  place_id: z.string(),
  arrival_time: z.string(),
  why_this_place: z.string(),
  what_to_do: z.string(),
  stay_minutes: z.number().int().positive(),
  transport_mode: z.enum(["WALK", "BUS", "TAXI", "BIKE"]).optional(),
});

export const builtPlanSchema = z.object({
  title: z.string(),
  stops: z.array(planStopSchema).min(1),
});

export type BuiltPlan = z.infer<typeof builtPlanSchema>;

export type CandidateForAi = {
  place_id: string;
  name: string;
  category: string;
  vibes: string[];
  budget: string;
  time_of_day: string[];
  avg_duration_min: number;
  rating: number;
  description_short: string;
};

export type ResolvedItineraryStop = {
  placeId: string;
  curatedPlaceId: string;
  order: number;
  plannedTime: string;
  transportMode: string;
  why: string;
  whatToDo: string;
  stayMinutes: number;
};

export type DayPlanResult = {
  title: string;
  stops: ResolvedItineraryStop[];
  intent: ParsedIntent;
  candidateCount: number;
  usedGemini: boolean;
  planDate?: string;
  startTime?: string;
};
