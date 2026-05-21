import { prisma } from "@/lib/db";
import { generateVibeSummary } from "@/lib/vibe-summary";
import { parseJson } from "@/lib/utils";

export async function refreshPlaceFeelsLike(placeId: string) {
  const place = await prisma.place.findUnique({
    where: { id: placeId },
    include: { reviews: { take: 15, orderBy: { createdAt: "desc" } } },
  });
  if (!place) return null;
  const feelsLike = await generateVibeSummary(
    place.name,
    parseJson<string[]>(place.vibes, []),
    place.reviews
  );
  await prisma.place.update({
    where: { id: placeId },
    data: { feelsLike },
  });
  return feelsLike;
}
