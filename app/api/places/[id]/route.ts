import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import { normalizeOpeningHours } from "@/lib/opening-hours";
import { resolvePlaceCity } from "@/lib/geo";
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
  const displayCity = resolvePlaceCity(place.city, place.lat, place.lng);

  return NextResponse.json({
    ...place,
    city: displayCity,
    displayCity,
    vibes: parseJson(place.vibes, []),
    images: parseJson(place.images, []),
    openingHours: normalizeOpeningHours(place.openingHours),
    reviews: place.reviews.map((r) => ({
      ...r,
      vibeTags: parseJson(r.vibeTags, []),
      photos: parseJson(r.photos, []),
    })),
    feelsLike,
  });
}
