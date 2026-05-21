import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const events = await prisma.event.findMany({
    where: { startTime: { gte: new Date() } },
    include: { place: true },
    orderBy: { startTime: "asc" },
    take: 50,
  });
  return NextResponse.json(events);
}
