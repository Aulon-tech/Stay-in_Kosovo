import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { businessRegisterSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { upsertBusinessListing } from "@/lib/business/create-profile";
import { DEFAULT_BUSINESS_PHOTO } from "@/lib/business/normalize-register";

function formatZodErrors(
  issues: { path: (string | number)[]; message: string }[]
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path[0]?.toString() || "form";
    if (!out[key]) out[key] = i.message;
  }
  return out;
}

export async function POST(req: Request) {
  let createdUserId: string | null = null;
  try {
    const ip = req.headers.get("x-forwarded-for") || "register-biz";
    const rl = rateLimit(`register-biz:${ip}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Too many attempts. Retry in ${rl.retryAfter}s` },
        { status: 429 }
      );
    }
    const body = await req.json();
    const parsed = businessRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please check the form — some fields need fixing.",
          fieldErrors: formatZodErrors(parsed.error.issues),
        },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const loginEmail = data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: loginEmail },
    });
    if (existing) {
      return NextResponse.json(
        {
          error: "Email already registered",
          fieldErrors: { email: "This email is already in use — try signing in" },
        },
        { status: 400 }
      );
    }

    const photos =
      data.photos.length > 0 ? data.photos : [DEFAULT_BUSINESS_PHOTO];

    const user = await prisma.user.create({
      data: {
        email: loginEmail,
        password: await hashPassword(data.password),
        name: data.ownerName,
        role: "BUSINESS",
        preferences: JSON.stringify({
          vibes: [],
          interests: [],
          quizCompleted: true,
        }),
      },
    });
    createdUserId = user.id;

    await upsertBusinessListing(user.id, {
      ...data,
      photos,
      tags: data.tags ?? [],
      logo: data.logo,
      website: data.website,
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (e) {
    console.error("register-business:", e);
    if (createdUserId) {
      try {
        await prisma.businessProfile.deleteMany({
          where: { userId: createdUserId },
        });
        await prisma.place.deleteMany({ where: { ownerId: createdUserId } });
        await prisma.user.delete({ where: { id: createdUserId } });
      } catch (rollbackErr) {
        console.error("rollback failed:", rollbackErr);
      }
    }
    const message =
      e instanceof Error ? e.message : "Business registration failed";
    return NextResponse.json(
      {
        error:
          "Could not complete registration. Please try again or use simpler photo links (https://…).",
        detail: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
