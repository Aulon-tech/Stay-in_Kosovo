import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseJson, haversineKm, isOpenNow, OpeningHours } from "@/lib/utils";
import { generateVibeSummary } from "@/lib/vibe-summary";

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

  let places = await prisma.place.findMany({
    orderBy: { avgRating: "desc" },
  });

  if (category) places = places.filter((p) => p.category === category);
  if (city) places = places.filter((p) => p.city.toLowerCase() === city.toLowerCase());
  if (search) {
    const q = search.toLowerCase();
    places = places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }
  if (vibe) {
    places = places.filter((p) =>
      parseJson<string[]>(p.vibes, [])
        .map((v) => v.toLowerCase())
        .includes(vibe.toLowerCase())
    );
  }
  if (priceLevel) places = places.filter((p) => p.priceLevel <= priceLevel);
  if (openNow) {
    places = places.filter((p) =>
      isOpenNow(parseJson<OpeningHours | null>(p.openingHours, null))
    );
  }

  const enriched = await Promise.all(
    places.map(async (place) => {
      const reviews = await prisma.review.findMany({
        where: { placeId: place.id },
        take: 10,
      });
      const feelsLike = await generateVibeSummary(
        place.name,
        parseJson<string[]>(place.vibes, []),
        reviews
      );
      let distanceKm: number | null = null;
      if (lat != null && lng != null) {
        distanceKm = haversineKm(lat, lng, place.lat, place.lng);
        if (maxDistance && distanceKm > maxDistance) return null;
      }
      return {
        ...place,
        vibes: parseJson(place.vibes, []),
        images: parseJson(place.images, []),
        openingHours: parseJson(place.openingHours, null),
        feelsLike,
        distanceKm,
      };
    })
  );

  const filtered = enriched.filter(Boolean) as NonNullable<(typeof enriched)[0]>[];
  if (lat != null && lng != null) {
    filtered.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
  }

  return NextResponse.json(filtered);
}

export async function POST(req: Request) {
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth");
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "BUSINESS") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const place = await prisma.place.create({
    data: {
      name: body.name,
      description: body.description,
      category: body.category,
      vibes: JSON.stringify(body.vibes || []),
      lat: body.lat,
      lng: body.lng,
      address: body.address,
      city: body.city,
      priceLevel: body.priceLevel || 2,
      openingHours: JSON.stringify(body.openingHours || {}),
      images: JSON.stringify(body.images || []),
      ownerId: session.user.id,
      isVerified: false,
    },
  });
  return NextResponse.json(place);
}
