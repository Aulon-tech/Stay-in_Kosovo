import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const todayOnly = req.nextUrl.searchParams.get("today") === "true";
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const events = await prisma.event.findMany({
    where: todayOnly
      ? { startTime: { gte: now, lte: endOfDay } }
      : { startTime: { gte: now } },
    include: { place: true },
    orderBy: { startTime: "asc" },
    take: todayOnly ? 12 : 50,
  });
  return NextResponse.json(events);
}
