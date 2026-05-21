import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password, name, role } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: await hashPassword(password),
        name: name || null,
        role: role === "BUSINESS" ? "BUSINESS" : "USER",
        preferences: JSON.stringify({ vibes: [], interests: [], quizCompleted: false }),
      },
    });
    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
