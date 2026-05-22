import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeBusinessProfile } from "@/lib/business/serialize-profile";
import { parseDatasetJson } from "@/lib/dataset";

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const profile = await prisma.businessProfile.findUnique({
    where: { userId: params.userId },
    include: {
      place: {
        include: {
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 12,
            include: { user: { select: { name: true } } },
          },
          events: {
            where: { startTime: { gte: new Date() } },
            orderBy: { startTime: "asc" },
            take: 8,
          },
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const place = profile.place;
  const reviews =
    place?.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      vibeTags: parseDatasetJson<string[]>(r.vibeTags, []),
      createdAt: r.createdAt,
      userName: r.user.name,
    })) ?? [];

  return NextResponse.json({
    profile: serializeBusinessProfile(profile, place),
    place: place
      ? {
          id: place.id,
          name: place.name,
          description: place.description,
          category: place.category,
          lat: place.lat,
          lng: place.lng,
          address: place.address,
          city: place.city,
          images: parseDatasetJson<string[]>(place.images, []),
          openingHours: parseDatasetJson<Record<string, string>>(
            place.openingHours,
            {}
          ),
          website: place.website,
          phone: place.phone,
          avgRating: place.avgRating,
          ratingCount: place.ratingCount,
          vibes: parseDatasetJson<string[]>(place.vibes, []),
        }
      : null,
    reviews,
    events: place?.events ?? [],
    posts: [],
  });
}
