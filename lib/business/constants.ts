/** Business categories for registration & profiles */
export const BUSINESS_CATEGORIES = [
  "restaurant",
  "cafe",
  "club",
  "bar",
  "hotel",
  "hostel",
  "tour_agency",
  "ngo",
  "event_organizer",
  "museum",
  "activity_provider",
  "nightlife",
  "culture",
  "other",
] as const;

export const BUSINESS_TAG_SUGGESTIONS = [
  "nightlife",
  "food",
  "coffee",
  "music",
  "hiking",
  "events",
  "student-friendly",
  "tourist-friendly",
  "budget-friendly",
  "romantic",
  "chill",
  "outdoor",
  "social",
  "trendy",
  "traditional",
  "family",
  "local",
  "late-night",
] as const;

export const VERIFICATION_STATUSES = ["pending", "verified", "rejected"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export function formatCategoryLabel(cat: string): string {
  return cat
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
