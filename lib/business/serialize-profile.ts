import type { BusinessProfile, Place } from "@prisma/client";
import { parseDatasetJson } from "@/lib/dataset";

export type SerializedBusinessProfile = {
  id: string;
  userId: string;
  placeId: string | null;
  businessName: string;
  category: string;
  description: string;
  ownerName: string | null;
  contactEmail: string | null;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  website: string | null;
  socialLinks: Record<string, string>;
  phone: string | null;
  openingHours: Record<string, string>;
  priceRange: string | null;
  photos: string[];
  logo: string | null;
  services: string[];
  tags: string[];
  verificationStatus: string;
  verified: boolean;
  place?: {
    id: string;
    avgRating: number;
    ratingCount: number;
    isVerified: boolean;
  } | null;
};

export function serializeBusinessProfile(
  profile: BusinessProfile,
  place?: Pick<Place, "id" | "avgRating" | "ratingCount" | "isVerified"> | null
): SerializedBusinessProfile {
  return {
    id: profile.id,
    userId: profile.userId,
    placeId: profile.placeId,
    businessName: profile.businessName,
    category: profile.category,
    description: profile.description,
    ownerName: profile.ownerName,
    contactEmail: profile.contactEmail,
    address: profile.address,
    city: profile.city,
    lat: profile.lat,
    lng: profile.lng,
    website: profile.website,
    socialLinks: parseDatasetJson<Record<string, string>>(
      profile.socialLinks,
      {}
    ),
    phone: profile.phone,
    openingHours: parseDatasetJson<Record<string, string>>(
      profile.openingHours,
      {}
    ),
    priceRange: profile.priceRange,
    photos: parseDatasetJson<string[]>(profile.photos, []),
    logo: profile.logo,
    services: parseDatasetJson<string[]>(profile.services, []),
    tags: parseDatasetJson<string[]>(profile.tags, []),
    verificationStatus: profile.verificationStatus,
    verified: profile.verified,
    place: place
      ? {
          id: place.id,
          avgRating: place.avgRating,
          ratingCount: place.ratingCount,
          isVerified: place.isVerified,
        }
      : null,
  };
}
