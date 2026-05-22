import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBusinessVisibilityAnalytics } from "@/lib/business/visibility-analytics";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const place = await prisma.place.findFirst({
    where: { ownerId: session.user.id },
    include: { reviews: true },
  });
  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!place) {
    return NextResponse.json({
      profile,
      place: null,
      visibility: getBusinessVisibilityAnalytics({
        businessId: profile?.id ?? null,
        placeId: null,
      }),
    });
  }

  const reviewCount = place.reviews.length;
  const avgRating =
    reviewCount > 0
      ? place.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
      : 0;

  // DEMO: map a few DB-derived hints onto placeholder analytics until real tracking exists
  const visibility = getBusinessVisibilityAnalytics({
    businessId: profile?.id ?? session.user.id,
    placeId: place.id,
    partial: {
      timesShownInPlans: Math.max(
        1248,
        Math.floor(reviewCount * 12 + place.avgRating * 20)
      ),
      profileViews: Math.max(892, reviewCount * 8 + 120),
      thisWeekInteractions: Math.max(345, reviewCount * 3 + 40),
    },
  });

  return NextResponse.json({
    profile,
    place: {
      id: place.id,
      name: place.name,
      city: place.city,
      isVerified: place.isVerified,
    },
    stats: {
      reviewCount,
      avgRating: Math.round(avgRating * 10) / 10,
      isVerified: place.isVerified,
    },
    visibility,
  });
}
