import { NextResponse } from "next/server";
import { buildDayPlan } from "@/lib/ai/day-planner";
import { z } from "zod";

const bodySchema = z.object({
  userText: z.string().min(1).max(2000),
  vibeHint: z.string().max(80).optional(),
  windowMinutes: z.number().int().min(60).max(720).optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const result = await buildDayPlan({
      userText: parsed.data.userText,
      vibeHint: parsed.data.vibeHint,
      windowMinutes: parsed.data.windowMinutes ?? 240,
    });

    return NextResponse.json({
      title: result.title,
      stops: result.stops,
      intent: result.intent,
      candidateCount: result.candidateCount,
      usedGemini: result.usedGemini,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Plan build failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
