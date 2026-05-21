import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { smartFillItinerary } from "@/lib/recommender";
import { UserPreferences } from "@/lib/utils";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { windowMinutes, vibe, lat, lng } = await req.json();
  const places = await prisma.place.findMany();
  const prefs: UserPreferences = session.user.preferences || {
    vibes: [],
    interests: [],
  };
  const result = await smartFillItinerary(
    places,
    prefs,
    lat ?? 42.6629,
    lng ?? 21.1655,
    windowMinutes || 240,
    vibe || prefs.vibes[0] || "cozy"
  );
  return NextResponse.json(result);
}
