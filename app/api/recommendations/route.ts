import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRecommendations, buildMiniItinerary } from "@/lib/recommender";
import { parseJson, UserPreferences } from "@/lib/utils";
import { fetchWeather } from "@/lib/weather";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get("lat") || 42.6629);
  const lng = Number(sp.get("lng") || 21.1655);
  const vibe = sp.get("vibe") || undefined;
  const prompt = sp.get("prompt") || undefined;
  const category = sp.get("category") || undefined;
  const maxDistance = sp.get("distance") ? Number(sp.get("distance")) : undefined;
  const openNow = sp.get("openNow") === "true";
  const limit = sp.get("limit") ? Number(sp.get("limit")) : 15;
  const includeItinerary = sp.get("miniItinerary") === "true";

  const session = await getServerSession(authOptions);
  const prefs: UserPreferences = session?.user?.preferences || {
    vibes: vibe ? [vibe] : [],
    interests: [],
  };
  if (vibe && !prefs.vibes.includes(vibe)) {
    prefs.vibes = [vibe, ...prefs.vibes];
  }

  const weather = await fetchWeather(lat, lng);
  const places = await prisma.place.findMany();
  const ranked = await getRecommendations({
    places,
    preferences: prefs,
    lat,
    lng,
    vibe: vibe || (prompt ? undefined : undefined),
    category: category as never,
    maxDistanceKm: maxDistance,
    openNow,
    limit,
    weather: weather.label,
  });

  const result = ranked.map((r) => ({
    place: {
      ...r.place,
      vibes: parseJson(r.place.vibes, []),
      images: parseJson(r.place.images, []),
    },
    score: r.score,
    why: r.why,
    distanceKm: r.distanceKm,
  }));

  const response: {
    recommendations: typeof result;
    prompt?: string;
    miniItinerary?: ReturnType<typeof buildMiniItinerary>;
  } = { recommendations: result };

  if (prompt) {
    response.prompt = prompt;
  }
  if (includeItinerary) {
    response.miniItinerary = buildMiniItinerary(ranked);
  }

  return NextResponse.json(response);
}
