"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { MobileShell } from "@/components/layout/MobileShell";
import { useLocaleStore } from "@/lib/locale-store";
import { useTranslation } from "@/lib/hooks/useTranslation";
import type { Locale } from "@/lib/i18n";

export default function ProfilePage() {
  const { data: session } = useSession();
  const prefs = session?.user?.preferences;
  const { locale, setLocale } = useLocaleStore();
  const { t } = useTranslation();

  return (
    <MobileShell title={t("profile")}>
      <div className="space-y-4 p-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="mb-2 text-sm font-medium">{t("language")}</p>
          <div className="flex gap-2">
            {(["sq", "en"] as Locale[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                className={`rounded-full px-4 py-1.5 text-sm ${
                  locale === l ? "bg-red-600 text-white" : "bg-gray-100"
                }`}
              >
                {l === "sq" ? "Shqip" : "English"}
              </button>
            ))}
          </div>
        </div>
        {session ? (
          <>
            <div className="rounded-xl border bg-white p-4">
              <p className="font-semibold">{session.user?.name || "Traveler"}</p>
              <p className="text-sm text-gray-500">{session.user?.email}</p>
              <p className="mt-1 text-xs capitalize text-gray-400">
                Role: {session.user?.role?.toLowerCase()}
              </p>
            </div>
            {prefs && (
              <div className="rounded-xl border bg-white p-4">
                <p className="mb-2 text-sm font-medium">Your vibes</p>
                <div className="flex flex-wrap gap-1">
                  {prefs.vibes?.map((v) => (
                    <span key={v} className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                      {v}
                    </span>
                  ))}
                </div>
                <p className="mb-2 mt-3 text-sm font-medium">Interests</p>
                <div className="flex flex-wrap gap-1">
                  {prefs.interests?.map((i) => (
                    <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                      {i}
                    </span>
                  ))}
                </div>
                <Link
                  href="/onboarding/vibe-quiz"
                  className="mt-3 block text-sm text-red-600"
                >
                  Retake vibe quiz
                </Link>
              </div>
            )}
            {session.user?.role === "BUSINESS" && (
              <Link
                href="/business/dashboard"
                className="block rounded-xl border bg-white p-4 text-red-600"
              >
                Business dashboard →
              </Link>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/discover" })}
              className="w-full rounded-xl border border-red-300 py-2 text-red-600"
              aria-label={t("signOut")}
            >
              {t("signOut")}
            </button>
          </>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-sm text-gray-600">
              Sign in to save itineraries and reviews.
            </p>
            <Link
              href="/login"
              className="inline-block rounded-xl bg-red-600 px-6 py-2 text-white"
            >
              {t("signIn")}
            </Link>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
