import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "register";
    const rl = rateLimit(`register:${ip}`, 5, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Too many attempts. Retry in ${rl.retryAfter}s` },
        { status: 429 }
      );
    }
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { email, password, name, role } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
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
