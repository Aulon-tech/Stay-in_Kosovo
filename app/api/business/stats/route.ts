import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    return NextResponse.json({ profile, place: null, stats: null });
  }
  const reviewCount = place.reviews.length;
  const avgRating =
    reviewCount > 0
      ? place.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
      : 0;
  return NextResponse.json({
    profile,
    place,
    stats: {
      reviewCount,
      avgRating: Math.round(avgRating * 10) / 10,
      recommendationAppearances: Math.floor(reviewCount * 1.5 + place.avgRating * 10),
      isVerified: place.isVerified,
    },
  });
}
