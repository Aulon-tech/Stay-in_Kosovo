import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { onboardSchema } from "@/lib/validations";
import { upsertBusinessListing } from "@/lib/business/create-profile";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = await req.json();
  const parsed = onboardSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const body = parsed.data;
  const photos = body.photos ?? body.images ?? [];
  const tags = body.tags ?? body.vibes ?? [];

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  const { profile, place } = await upsertBusinessListing(session.user.id, {
    businessName: body.businessName,
    description: body.description,
    category: body.category,
    address: body.address,
    city: body.city,
    contactEmail: body.contactEmail ?? user?.email ?? "",
    ownerName: body.ownerName ?? user?.name ?? "Owner",
    lat: body.lat,
    lng: body.lng,
    placeCategory: body.placeCategory || body.category,
    tags,
    photos,
    website: body.website,
    phone: body.phone,
    openingHours: body.openingHours,
    priceLevel: body.priceLevel,
    priceRange: body.priceRange,
    arbkNumber: body.arbkNumber,
    services: body.services,
  });

  return NextResponse.json({ profile, place, ok: true });
}
