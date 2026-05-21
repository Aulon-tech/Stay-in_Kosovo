import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/utils";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.itinerary.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json();
  const it = await prisma.itinerary.update({
    where: { id: params.id },
    data: {
      title: body.title ?? existing.title,
      date: body.date ? new Date(body.date) : existing.date,
      stops: body.stops ? JSON.stringify(body.stops) : existing.stops,
      isPublic: body.isPublic ?? existing.isPublic,
    },
  });
  return NextResponse.json({ ...it, stops: parseJson(it.stops, []) });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.itinerary.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.itinerary.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
