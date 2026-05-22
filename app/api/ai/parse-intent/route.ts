import { NextResponse } from "next/server";
import { parseUserIntent } from "@/lib/ai/intent-parser";
import { z } from "zod";

const bodySchema = z.object({
  userText: z.string().min(1).max(2000),
  vibeHint: z.string().max(80).optional(),
  windowMinutes: z.number().int().optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const intent = await parseUserIntent(parsed.data.userText, {
      vibeHint: parsed.data.vibeHint,
      windowMinutes: parsed.data.windowMinutes,
    });
    return NextResponse.json({ intent });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Parse failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
