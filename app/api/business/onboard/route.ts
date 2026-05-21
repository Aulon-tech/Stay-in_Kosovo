import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { onboardSchema } from "@/lib/validations";

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

  const existingProfile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (existingProfile) {
    await prisma.businessProfile.update({
      where: { userId: session.user.id },
      data: {
        businessName: body.businessName,
        description: body.description,
        category: body.category,
        arbkNumber: body.arbkNumber,
        website: body.website,
        phone: body.phone,
      },
    });
  } else {
    await prisma.businessProfile.create({
      data: {
        userId: session.user.id,
        businessName: body.businessName,
        description: body.description,
        category: body.category,
        arbkNumber: body.arbkNumber,
        website: body.website,
        phone: body.phone,
        verified: false,
      },
    });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role: "BUSINESS" },
  });

  const place = await prisma.place.create({
    data: {
      name: body.businessName,
      description: body.description,
      category: body.placeCategory || body.category,
      vibes: JSON.stringify(body.vibes || []),
      lat: body.lat,
      lng: body.lng,
      address: body.address,
      city: body.city || "Prishtina",
      priceLevel: body.priceLevel || 2,
      openingHours: JSON.stringify(body.openingHours || {}),
      images: JSON.stringify(body.images || []),
      ownerId: session.user.id,
      isVerified: false,
    },
  });

  return NextResponse.json({ place, ok: true });
}
