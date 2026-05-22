import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(["USER", "BUSINESS"]).optional(),
});

export const reviewSchema = z.object({
  placeId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  vibeTags: z.array(z.string()).max(8).optional(),
  photoBase64: z.string().max(6_000_000).optional(),
});

export const itinerarySchema = z.object({
  title: z.string().min(1).max(120),
  date: z.string().datetime().optional().nullable(),
  stops: z
    .array(
      z.object({
        placeId: z.string(),
        order: z.number().int(),
        plannedTime: z.string().optional(),
        transportMode: z.string().optional(),
      })
    )
    .max(20),
  isPublic: z.boolean().optional(),
});

const optionalUrlField = z
  .string()
  .max(500)
  .optional()
  .transform((v) => {
    if (!v?.trim()) return undefined;
    const t = v.trim();
    const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    try {
      new URL(withProto);
      return withProto;
    } catch {
      return undefined;
    }
  });

const imageUrl = z
  .string()
  .min(1)
  .max(2000)
  .transform((v) => {
    const t = v.trim();
    const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    return withProto;
  })
  .pipe(z.string().url({ message: "Enter a valid image link (e.g. https://…)" }));

const photosArray = z
  .array(z.string().min(1).max(2000))
  .max(10)
  .optional()
  .default([])
  .transform((arr) => {
    const normalized: string[] = [];
    for (const raw of arr) {
      const t = raw.trim();
      if (!t) continue;
      const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
      try {
        new URL(withProto);
        normalized.push(withProto);
      } catch {
        /* skip invalid line */
      }
    }
    return normalized;
  });

export const businessProfileFieldsSchema = z.object({
  businessName: z.string().min(2, "Business name is required").max(120),
  category: z.string().min(1, "Category is required"),
  description: z
    .string()
    .min(10, "Description should be at least 10 characters")
    .max(3000),
  address: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required").default("Prishtina"),
  contactEmail: z.string().email("Valid contact email is required"),
  ownerName: z.string().min(2, "Owner name is required").max(120),
  lat: z.number(),
  lng: z.number(),
  placeCategory: z.string().optional(),
  tags: z.array(z.string()).max(16).optional(),
  services: z.array(z.string()).max(20).optional(),
  photos: photosArray,
  logo: optionalUrlField,
  website: optionalUrlField,
  socialLinks: z
    .object({
      instagram: z.string().max(200).optional(),
      facebook: z.string().max(200).optional(),
      tiktok: z.string().max(200).optional(),
    })
    .optional(),
  phone: z.string().max(40).optional(),
  openingHours: z.record(z.string()).optional(),
  priceRange: z.string().max(40).optional(),
  priceLevel: z.number().int().min(1).max(4).optional(),
  arbkNumber: z.string().max(80).optional(),
  images: z.array(imageUrl).max(10).optional(),
});

export const businessRegisterSchema = registerSchema
  .extend({
    role: z.literal("BUSINESS"),
  })
  .merge(businessProfileFieldsSchema);

export const onboardSchema = businessProfileFieldsSchema
  .omit({ photos: true, contactEmail: true, ownerName: true })
  .extend({
    contactEmail: z.string().email().optional(),
    ownerName: z.string().min(2).max(120).optional(),
    photos: z.array(imageUrl).max(10).optional(),
    images: z.array(imageUrl).max(10).optional(),
    vibes: z.array(z.string()).max(16).optional(),
  })
  .refine(
    (d) =>
      (d.photos?.length ?? 0) + (d.images?.length ?? 0) >= 1,
    { message: "Add at least one business photo (image URL)", path: ["photos"] }
  );

export const businessProfileUpdateSchema = businessProfileFieldsSchema
  .partial()
  .extend({
    photos: z.array(imageUrl).min(1).optional(),
  });

export const adminVerifySchema = z.object({
  placeId: z.string(),
  secret: z.string(),
});
