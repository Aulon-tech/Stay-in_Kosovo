"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/hooks/useTranslation";

export function HomeHero() {
  const { t } = useTranslation();
  return (
    <section className="bg-gradient-to-br from-kg-primary via-kg-primary to-kg-primary-dark px-4 py-6 text-white">
      <p className="text-xs font-medium uppercase tracking-wider text-white/70">
        KosovoGo
      </p>
      <h1 className="mt-1 text-2xl font-bold leading-tight">
        {t("discover")} Prishtina
      </h1>
      <p className="mt-2 text-sm text-white/85">
        Vende me vibe, itinerare smart, dhe mobiliteit — për turistë dhe lokalë.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/vibes"
          className="rounded-full bg-kg-accent px-4 py-2 text-xs font-semibold text-kg-neutral"
        >
          {t("vibe")}
        </Link>
        <Link
          href="/map"
          className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-medium text-white"
        >
          {t("map")}
        </Link>
      </div>
    </section>
  );
}
