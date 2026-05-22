import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminVerifySchema } from "@/lib/validations";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = adminVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (parsed.data.secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const place = await prisma.place.update({
    where: { id: parsed.data.placeId },
    data: { isVerified: true },
  });
  if (place.ownerId) {
    await prisma.businessProfile.updateMany({
      where: { userId: place.ownerId },
      data: { verified: true, verificationStatus: "verified" },
    });
  }
  return NextResponse.json({ ok: true, place });
}
