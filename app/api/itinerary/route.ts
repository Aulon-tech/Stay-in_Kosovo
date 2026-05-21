import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJson, ItineraryStop } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const itineraries = await prisma.itinerary.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  const publicOnes = await prisma.itinerary.findMany({
    where: { isPublic: true, NOT: { userId: session.user.id } },
    take: 5,
  });
  const all = [...itineraries, ...publicOnes.filter((p) => !itineraries.find((i) => i.id === p.id))];
  return NextResponse.json(
    all.map((it) => ({
      ...it,
      stops: parseJson<ItineraryStop[]>(it.stops, []),
    }))
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const it = await prisma.itinerary.create({
    data: {
      userId: session.user.id,
      title: body.title || "New itinerary",
      date: body.date ? new Date(body.date) : null,
      stops: JSON.stringify(body.stops || []),
      isPublic: body.isPublic ?? false,
    },
  });
  return NextResponse.json({ ...it, stops: parseJson(it.stops, []) });
}
