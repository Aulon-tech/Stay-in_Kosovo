/**
 * Minimal seed: demo users only. Places come from npm run import:places
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "demo@stay.kosovo" },
    create: {
      email: "demo@stay.kosovo",
      password,
      name: "Demo Traveler",
      role: "USER",
      preferences: JSON.stringify({
        vibes: ["chill", "cozy", "local"],
        interests: ["restaurant", "cafe", "culture"],
        quizCompleted: true,
      }),
    },
    update: {},
  });

  for (let i = 1; i <= 3; i++) {
    await prisma.user.upsert({
      where: { email: `business${i}@stay.kosovo` },
      create: {
        email: `business${i}@stay.kosovo`,
        password,
        name: `Business ${i}`,
        role: "BUSINESS",
        preferences: JSON.stringify({ vibes: [], interests: [], quizCompleted: true }),
      },
      update: {},
    });
  }

  console.log("Minimal users seeded. Run: npm run import:places");
}

main()
  .finally(() => prisma.$disconnect());
