import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseJson, haversineKm, isOpenNow, OpeningHours } from "@/lib/utils";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const category = sp.get("category");
  const vibe = sp.get("vibe");
  const maxDistance = sp.get("distance") ? Number(sp.get("distance")) : null;
  const priceLevel = sp.get("price") ? Number(sp.get("price")) : null;
  const openNow = sp.get("openNow") === "true";
  const lat = sp.get("lat") ? Number(sp.get("lat")) : null;
  const lng = sp.get("lng") ? Number(sp.get("lng")) : null;
  const city = sp.get("city");
  const search = sp.get("search");
  const page = Math.max(1, Number(sp.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(sp.get("limit") || 20)));

  const where: Prisma.PlaceWhereInput = {};
  if (category) where.category = category;
  if (city) where.city = city;
  if (priceLevel) where.priceLevel = { lte: priceLevel };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { city: { contains: search } },
    ];
  }

  let places = await prisma.place.findMany({
    where,
    orderBy: { avgRating: "desc" },
    take: 200,
  });

  if (vibe) {
    places = places.filter((p) =>
      parseJson<string[]>(p.vibes, [])
        .map((v) => v.toLowerCase())
        .includes(vibe.toLowerCase())
    );
  }
  if (openNow) {
    places = places.filter((p) =>
      isOpenNow(parseJson<OpeningHours | null>(p.openingHours, null))
    );
  }

  const withDistance = places.map((place) => {
    const distanceKm =
      lat != null && lng != null
        ? haversineKm(lat, lng, place.lat, place.lng)
        : null;
    return { place, distanceKm };
  });

  let filtered = withDistance;
  if (maxDistance && lat != null && lng != null) {
    filtered = filtered.filter(
      (x) => x.distanceKm != null && x.distanceKm <= maxDistance
    );
  }
  if (lat != null && lng != null) {
    filtered.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const pageItems = filtered.slice(start, start + limit);

  const enriched = pageItems.map(({ place, distanceKm }) => ({
    ...place,
    vibes: parseJson(place.vibes, []),
    images: parseJson(place.images, []),
    openingHours: parseJson(place.openingHours, null),
    feelsLike: place.feelsLike || null,
    distanceKm,
  }));

  return NextResponse.json({
    items: enriched,
    total,
    page,
    limit,
    hasMore: start + limit < total,
  });
}
