import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseJson, ItineraryStop } from "@/lib/utils";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const it = await prisma.itinerary.findUnique({
    where: { id: params.id },
  });
  if (!it || !it.isPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const stops = parseJson<ItineraryStop[]>(it.stops, []);
  const placeIds = stops.map((s) => s.placeId);
  const places = await prisma.place.findMany({
    where: { id: { in: placeIds } },
  });
  const byId = new Map(places.map((p) => [p.id, p]));
  return NextResponse.json({
    id: it.id,
    title: it.title,
    date: it.date,
    stops: stops.map((s) => ({
      ...s,
      place: byId.get(s.placeId),
    })),
  });
}
