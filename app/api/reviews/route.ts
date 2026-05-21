import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import { reviewSchema } from "@/lib/validations";
import { refreshPlaceFeelsLike } from "@/lib/refresh-feels-like";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("placeId");
  if (!placeId) {
    return NextResponse.json({ error: "placeId required" }, { status: 400 });
  }
  const reviews = await prisma.review.findMany({
    where: { placeId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    reviews.map((r) => ({
      ...r,
      vibeTags: parseJson(r.vibeTags, []),
      photos: parseJson(r.photos, []),
    }))
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const data = parsed.data;
  const photos: string[] = [];

  if (data.photoBase64) {
    try {
      const base64 = data.photoBase64.replace(/^data:image\/\w+;base64,/, "");
      const buf = Buffer.from(base64, "base64");
      const dir = path.join(process.cwd(), "public", "uploads");
      await mkdir(dir, { recursive: true });
      const filename = `${Date.now()}-${session.user.id.slice(0, 6)}.jpg`;
      await writeFile(path.join(dir, filename), buf);
      photos.push(`/uploads/${filename}`);
    } catch (e) {
      console.error("Photo save failed", e);
    }
  }

  const review = await prisma.review.create({
    data: {
      userId: session.user.id,
      placeId: data.placeId,
      rating: data.rating,
      comment: data.comment || null,
      vibeTags: JSON.stringify(data.vibeTags || []),
      photos: JSON.stringify(photos),
    },
  });

  const all = await prisma.review.findMany({ where: { placeId: data.placeId } });
  const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
  await prisma.place.update({
    where: { id: data.placeId },
    data: { avgRating: Math.round(avg * 10) / 10 },
  });
  await refreshPlaceFeelsLike(data.placeId);

  return NextResponse.json({
    ...review,
    vibeTags: parseJson(review.vibeTags, []),
    photos,
  });
}
