import { prisma } from "@/lib/db";
import type { CuratedPlace } from "@/lib/curated-import";
import { getCuratedById } from "@/lib/ai/curated-data";
import type { BuiltPlan, ResolvedItineraryStop } from "@/lib/ai/types";
import { inferLegTransportMode } from "@/lib/transport";
import { isValidCoord } from "@/lib/geo";

export async function resolveBuiltPlan(
  plan: BuiltPlan,
  curated: CuratedPlace[]
): Promise<ResolvedItineraryStop[]> {
  const slugs = plan.stops.map((s) => s.place_id);
  const dbPlaces = await prisma.place.findMany({
    where: { curatedSlug: { in: slugs } },
  });
  const bySlug = new Map(
    dbPlaces
      .filter((p) => p.curatedSlug)
      .map((p) => [p.curatedSlug!.toLowerCase(), p])
  );

  const resolved: ResolvedItineraryStop[] = [];
  const coords: { lat: number; lng: number }[] = [];

  for (let i = 0; i < plan.stops.length; i++) {
    const stop = plan.stops[i];
    const slug = stop.place_id.toLowerCase().trim();
    let db = bySlug.get(slug);

    if (!db) {
      const row = getCuratedById(curated, stop.place_id);
      if (row) {
        db =
          (await prisma.place.findFirst({
            where: {
              OR: [
                { curatedSlug: row.id },
                { name: row.name },
              ],
            },
          })) ?? undefined;
      }
    }

    if (!db) continue;

    coords.push({ lat: db.lat, lng: db.lng });

    resolved.push({
      placeId: db.id,
      curatedPlaceId: db.curatedSlug || stop.place_id,
      order: i + 1,
      plannedTime: stop.arrival_time,
      transportMode: i === 0 ? "WALK" : "WALK",
      why: stop.why_this_place,
      whatToDo: stop.what_to_do,
      stayMinutes: stop.stay_minutes,
    });
  }

  for (let i = 1; i < resolved.length; i++) {
    const from = coords[i - 1];
    const to = coords[i];
    if (isValidCoord(from.lat, from.lng) && isValidCoord(to.lat, to.lng)) {
      resolved[i].transportMode = inferLegTransportMode(
        from.lat,
        from.lng,
        to.lat,
        to.lng
      );
    }
  }

  if (resolved.length === 0 && plan.stops.length > 0) {
    throw new Error(
      "Could not match AI plan stops to database — run npm run import:places"
    );
  }

  if (resolved.length < plan.stops.length) {
    throw new Error(
      `Only ${resolved.length} of ${plan.stops.length} stops are in the database — run: npm run import:places`
    );
  }

  return resolved;
}
