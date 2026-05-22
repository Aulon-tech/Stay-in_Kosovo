import { NextResponse } from "next/server";
import { replanDayFromRequest } from "@/lib/ai/day-planner";
import { builtPlanSchema } from "@/lib/ai/types";
import { z } from "zod";

const bodySchema = z.object({
  changeRequest: z.string().min(1).max(2000),
  currentPlan: builtPlanSchema,
  userText: z.string().max(2000).optional(),
  vibeHint: z.string().max(80).optional(),
  windowMinutes: z.number().int().min(60).max(720).optional(),
  planDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  startTime: z
    .string()
    .regex(/^\d{1,2}:\d{2}$/)
    .optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const result = await replanDayFromRequest({
      changeRequest: parsed.data.changeRequest,
      currentPlan: parsed.data.currentPlan,
      windowMinutes: parsed.data.windowMinutes ?? 240,
      planDate: parsed.data.planDate,
      startTime: parsed.data.startTime,
      intent: parsed.data.userText
        ? {
            userText: parsed.data.userText,
            vibeHint: parsed.data.vibeHint,
            windowMinutes: parsed.data.windowMinutes,
          }
        : undefined,
    });

    return NextResponse.json({
      title: result.title,
      stops: result.stops.map((s) => ({
        placeId: s.placeId,
        order: s.order,
        plannedTime: s.plannedTime,
        transportMode: s.transportMode,
      })),
      planDetail: result.stops,
      intent: result.intent,
      candidateCount: result.candidateCount,
      usedGemini: result.usedGemini,
      structuredEdit: result.structuredEdit ?? false,
      editKind: result.editKind,
      planDate: result.planDate,
      startTime: result.startTime,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Replan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
