import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import { refreshPlaceFeelsLike } from "@/lib/refresh-feels-like";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const place = await prisma.place.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      reviews: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!place) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  let feelsLike = place.feelsLike;
  if (!feelsLike) {
    feelsLike = (await refreshPlaceFeelsLike(place.id)) || null;
  }
  return NextResponse.json({
    ...place,
    vibes: parseJson(place.vibes, []),
    images: parseJson(place.images, []),
    openingHours: parseJson(place.openingHours, null),
    reviews: place.reviews.map((r) => ({
      ...r,
      vibeTags: parseJson(r.vibeTags, []),
      photos: parseJson(r.photos, []),
    })),
    feelsLike,
  });
}
