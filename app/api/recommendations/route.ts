import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recommendFromPrompt } from "@/lib/ai/day-planner";
import { getRecommendations, buildMiniItinerary } from "@/lib/recommender";
import { haversineKm, parseJson, UserPreferences } from "@/lib/utils";
import { fetchWeather } from "@/lib/weather";
import { isPrishtinaAppPlace } from "@/lib/geo";
import {
  buildPromptFromVibeMode,
  filterRecommendationsByVibe,
  resolveVibeMode,
  VIBE_MOOD_TO_MODE,
} from "@/lib/vibe-matching";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get("lat") || 42.6629);
  const lng = Number(sp.get("lng") || 21.1655);
  const vibe = sp.get("vibe") || undefined;
  const mood = sp.get("mood") || undefined;
  const prompt = sp.get("prompt") || undefined;
  const category = sp.get("category") || undefined;
  const maxDistance = sp.get("distance") ? Number(sp.get("distance")) : undefined;
  const openNow = sp.get("openNow") === "true";
  const limit = sp.get("limit") ? Number(sp.get("limit")) : 15;
  const includeItinerary = sp.get("miniItinerary") === "true";

  const vibeMode = resolveVibeMode(
    mood || vibe,
    prompt || undefined
  );
  const userText = prompt?.trim()
    ? prompt.trim()
    : vibeMode
      ? buildPromptFromVibeMode(vibeMode)
      : vibe
        ? `${vibe} places in Prishtina`
        : "";

  if (userText) {
    try {
      const picks = await recommendFromPrompt(
        userText,
        limit,
        mood || vibe,
        vibeMode
      );
      const ids = picks.map((p) => p.placeId);
      const places = await prisma.place.findMany({
        where: { id: { in: ids } },
      });
      const byId = new Map(places.map((p) => [p.id, p]));
      let recommendations = picks
        .map((pick) => {
          const place = byId.get(pick.placeId);
          if (!place) return null;
          return {
            place: {
              ...place,
              vibes: parseJson(place.vibes, []),
              images: parseJson(place.images, []),
            },
            score: pick.score,
            why: pick.why,
            distanceKm: haversineKm(lat, lng, place.lat, place.lng),
          };
        })
        .filter((r): r is NonNullable<typeof r> => r != null);

      if (vibeMode) {
        recommendations = filterRecommendationsByVibe(
          recommendations,
          (r) => ({
            name: r.place.name,
            category: r.place.category,
            vibes: r.place.vibes,
            description: r.place.description,
          }),
          vibeMode,
          { limit, userText: prompt || userText }
        );
      }

      const response: {
        recommendations: typeof recommendations;
        prompt?: string;
        miniItinerary?: ReturnType<typeof buildMiniItinerary>;
      } = { recommendations, prompt: userText };

      if (includeItinerary && recommendations.length > 0) {
        const top = recommendations
          .filter((r): r is NonNullable<typeof r> => r != null)
          .slice(0, 3);
        const baseHour = new Date().getHours();
        response.miniItinerary = top.map((r, i) => ({
          placeId: r.place.id,
          order: i + 1,
          plannedTime: `${String(baseHour + i).padStart(2, "0")}:00`,
          transportMode: "WALK",
        }));
      }

      return NextResponse.json(response);
    } catch (e) {
      console.error("Gemini recommendations failed", e);
      /* fall through to legacy */
    }
  }

  const session = await getServerSession(authOptions);
  const prefs: UserPreferences = session?.user?.preferences || {
    vibes: vibe ? [vibe] : [],
    interests: [],
  };
  if (vibe && !prefs.vibes.includes(vibe)) {
    prefs.vibes = [vibe, ...prefs.vibes];
  }

  const weather = await fetchWeather(lat, lng);
  const allPlaces = await prisma.place.findMany();
  const places = allPlaces.filter((p) =>
    isPrishtinaAppPlace(p.city, p.lat, p.lng)
  );
  const legacyMode =
    vibeMode ||
    resolveVibeMode(mood || vibe, prompt) ||
    (mood && VIBE_MOOD_TO_MODE[mood] ? VIBE_MOOD_TO_MODE[mood] : null);

  const ranked = await getRecommendations({
    places,
    preferences: prefs,
    lat,
    lng,
    vibe: mood || vibe,
    category: category as never,
    maxDistanceKm: maxDistance,
    openNow,
    limit: limit * 2,
    weather: weather.label,
    vibeMode: legacyMode ?? undefined,
    userText: prompt,
  });

  let result = ranked.map((r) => ({
    place: {
      ...r.place,
      vibes: parseJson(r.place.vibes, []),
      images: parseJson(r.place.images, []),
    },
    score: r.score,
    why: r.why,
    distanceKm: r.distanceKm,
  }));

  if (legacyMode) {
    result = filterRecommendationsByVibe(
      result,
      (r) => ({
        name: r.place.name,
        category: r.place.category,
        vibes: r.place.vibes,
        description: r.place.description,
      }),
      legacyMode,
      { limit, userText: prompt || userText }
    );
  } else {
    result = result.slice(0, limit);
  }

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
