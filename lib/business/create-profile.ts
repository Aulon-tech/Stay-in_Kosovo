import { prisma } from "@/lib/db";
import type { z } from "zod";
import type { businessProfileFieldsSchema } from "@/lib/validations";

export type BusinessProfileInput = z.infer<typeof businessProfileFieldsSchema>;

export async function upsertBusinessListing(
  userId: string,
  body: BusinessProfileInput & { tags?: string[]; images?: string[] }
) {
  const photos = body.photos ?? body.images ?? [];
  const tags = body.tags ?? [];
  const placeCategory = body.placeCategory || body.category;
  const priceLevel = body.priceLevel ?? 2;
  const social = body.socialLinks ? JSON.stringify(body.socialLinks) : null;
  const hours = body.openingHours ? JSON.stringify(body.openingHours) : null;

  const profileData = {
    businessName: body.businessName,
    description: body.description,
    category: body.category,
    ownerName: body.ownerName,
    contactEmail: body.contactEmail.toLowerCase(),
    address: body.address,
    city: body.city,
    lat: body.lat,
    lng: body.lng,
    arbkNumber: body.arbkNumber,
    website: body.website || null,
    socialLinks: social,
    phone: body.phone || null,
    openingHours: hours,
    priceRange: body.priceRange || null,
    photos: JSON.stringify(photos),
    logo: body.logo || null,
    services: JSON.stringify(body.services ?? []),
    tags: JSON.stringify(tags),
    verificationStatus: "pending" as const,
    verified: false,
  };

  const existing = await prisma.businessProfile.findUnique({
    where: { userId },
    include: { place: true },
  });

  let profile;
  if (existing) {
    profile = await prisma.businessProfile.update({
      where: { userId },
      data: profileData,
    });
  } else {
    profile = await prisma.businessProfile.create({
      data: { userId, ...profileData },
    });
  }

  const placePayload = {
    name: body.businessName,
    description: body.description,
    category: placeCategory,
    vibes: JSON.stringify(tags),
    lat: body.lat,
    lng: body.lng,
    address: body.address,
    city: body.city,
    priceLevel,
    priceLevelRaw: body.priceRange || null,
    openingHours: hours,
    images: JSON.stringify(photos),
    website: body.website || null,
    phone: body.phone || null,
    ownerId: userId,
    isVerified: false,
  };

  let place;
  if (existing?.placeId) {
    place = await prisma.place.update({
      where: { id: existing.placeId },
      data: placePayload,
    });
  } else {
    const owned = await prisma.place.findFirst({ where: { ownerId: userId } });
    if (owned) {
      place = await prisma.place.update({
        where: { id: owned.id },
        data: placePayload,
      });
    } else {
      place = await prisma.place.create({ data: placePayload });
    }
    await prisma.businessProfile.update({
      where: { userId },
      data: { placeId: place.id },
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: "BUSINESS" },
  });

  return { profile, place };
}
