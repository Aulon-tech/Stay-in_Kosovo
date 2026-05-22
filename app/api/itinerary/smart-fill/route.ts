import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildDayPlan } from "@/lib/ai/day-planner";
import { z } from "zod";

const bodySchema = z.object({
  windowMinutes: z.number().int().optional(),
  vibe: z.string().max(80).optional(),
  prompt: z.string().max(2000).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { windowMinutes, vibe, prompt, planDate, startTime } = parsed.data;
    const userText =
      prompt?.trim() ||
      (vibe
        ? `A ${vibe} day in Prishtina for about ${windowMinutes || 240} minutes`
        : `Plan a great day in Prishtina for ${windowMinutes || 240} minutes`);

    const result = await buildDayPlan({
      userText,
      vibeHint: vibe,
      windowMinutes: windowMinutes || 240,
      planDate,
      startTime,
    });

    return NextResponse.json({
      title: result.title,
      planDate: result.planDate,
      startTime: result.startTime,
      stops: result.stops.map((s) => ({
        placeId: s.placeId,
        order: s.order,
        plannedTime: s.plannedTime,
        transportMode: s.transportMode,
      })),
      intent: result.intent,
      candidateCount: result.candidateCount,
      usedGemini: result.usedGemini,
      planDetail: result.stops.map((s) => ({
        placeId: s.placeId,
        curatedPlaceId: s.curatedPlaceId,
        plannedTime: s.plannedTime,
        transportMode: s.transportMode,
        why: s.why,
        whatToDo: s.whatToDo,
        stayMinutes: s.stayMinutes,
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Smart fill failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
