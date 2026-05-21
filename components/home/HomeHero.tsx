"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/hooks/useTranslation";

export function HomeHero() {
  const { t } = useTranslation();
  return (
    <section className="bg-gradient-to-br from-red-700 via-red-600 to-amber-600 px-4 py-6 text-white">
      <p className="text-xs font-medium uppercase tracking-wider text-red-100">
        Kosovo · {t("discover")}
      </p>
      <h1 className="mt-1 text-2xl font-bold leading-tight">Stay in Kosovo</h1>
      <p className="mt-2 text-sm text-red-50">
        Vende me vibe, itinerare smart, dhe mobiliteit — për turistë dhe lokalë.
      </p>
      <div className="mt-4 flex gap-2">
        <Link
          href="/map"
          className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium backdrop-blur"
        >
          {t("map")}
        </Link>
        <Link
          href="/vibes"
          className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-red-800"
        >
          {t("vibes")}
        </Link>
      </div>
    </section>
  );
}
