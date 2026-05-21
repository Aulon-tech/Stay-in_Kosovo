import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const preferences = {
    vibes: body.vibes || [],
    interests: body.interests || [],
    quizCompleted: true,
  };
  await prisma.user.update({
    where: { id: session.user.id },
    data: { preferences: JSON.stringify(preferences) },
  });
  return NextResponse.json({ preferences });
}
