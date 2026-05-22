import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { businessProfileUpdateSchema } from "@/lib/validations";
import { upsertBusinessListing } from "@/lib/business/create-profile";
import { serializeBusinessProfile } from "@/lib/business/serialize-profile";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "BUSINESS") {
    return NextResponse.json({ error: "Not a business account" }, { status: 403 });
  }

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    include: { place: true },
  });
  if (!profile) {
    return NextResponse.json({ profile: null });
  }
  return NextResponse.json({
    profile: serializeBusinessProfile(profile, profile.place),
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "BUSINESS") {
    return NextResponse.json({ error: "Not a business account" }, { status: 403 });
  }

  const existing = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    include: { place: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "No business profile" }, { status: 404 });
  }

  const raw = await req.json();
  const parsed = businessProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const patch = parsed.data;
  const merged = {
    businessName: patch.businessName ?? existing.businessName,
    category: patch.category ?? existing.category,
    description: patch.description ?? existing.description,
    address: patch.address ?? existing.address ?? "",
    city: patch.city ?? existing.city ?? "Prishtina",
    contactEmail:
      patch.contactEmail ?? existing.contactEmail ?? session.user.email ?? "",
    ownerName: patch.ownerName ?? existing.ownerName ?? session.user.name ?? "",
    lat: patch.lat ?? existing.lat ?? existing.place?.lat ?? 42.6629,
    lng: patch.lng ?? existing.lng ?? existing.place?.lng ?? 21.1655,
    placeCategory: patch.placeCategory ?? patch.category ?? existing.category,
    tags: patch.tags,
    services: patch.services,
    photos: patch.photos,
    logo: patch.logo,
    website: patch.website ?? existing.website ?? undefined,
    socialLinks: patch.socialLinks,
    phone: patch.phone ?? existing.phone ?? undefined,
    openingHours: patch.openingHours,
    priceRange: patch.priceRange ?? existing.priceRange ?? undefined,
    priceLevel: patch.priceLevel,
    arbkNumber: patch.arbkNumber ?? existing.arbkNumber ?? undefined,
  };

  const currentPhotos = JSON.parse(existing.photos || "[]") as string[];
  const photos = patch.photos ?? currentPhotos;
  const currentTags = JSON.parse(existing.tags || "[]") as string[];
  const currentServices = JSON.parse(existing.services || "[]") as string[];

  const { profile, place } = await upsertBusinessListing(session.user.id, {
    ...merged,
    contactEmail: merged.contactEmail,
    ownerName: merged.ownerName,
    photos,
    tags: patch.tags ?? currentTags,
    services: patch.services ?? currentServices,
  });

  return NextResponse.json({
    profile: serializeBusinessProfile(profile, place),
  });
}
