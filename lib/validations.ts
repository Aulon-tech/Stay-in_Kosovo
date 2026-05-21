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

export const onboardSchema = z.object({
  businessName: z.string().min(2).max(120),
  description: z.string().min(10).max(3000),
  category: z.string(),
  placeCategory: z.string().optional(),
  vibes: z.array(z.string()).max(10).optional(),
  lat: z.number(),
  lng: z.number(),
  address: z.string().min(3),
  city: z.string().min(2),
  priceLevel: z.number().int().min(1).max(4).optional(),
  arbkNumber: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  images: z.array(z.string().url()).max(10).optional(),
  openingHours: z.record(z.unknown()).optional(),
});

export const adminVerifySchema = z.object({
  placeId: z.string(),
  secret: z.string(),
});
