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
        <div className="kg-card-pad">
          <p className="mb-2 text-sm font-medium text-kg-primary">{t("language")}</p>
          <div className="flex gap-2">
            {(["sq", "en"] as Locale[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                className={`chip ${locale === l ? "chip-active" : "chip-inactive"}`}
              >
                {l === "sq" ? "Shqip" : "English"}
              </button>
            ))}
          </div>
        </div>
        {session ? (
          <>
            <div className="kg-card-pad">
              <p className="font-semibold text-kg-neutral">{session.user?.name || "Traveler"}</p>
              <p className="text-sm text-kg-muted">{session.user?.email}</p>
              <p className="mt-1 text-xs capitalize text-kg-muted">
                Role: {session.user?.role?.toLowerCase()}
              </p>
            </div>
            {prefs && (
              <div className="kg-card-pad">
                <p className="mb-2 text-sm font-medium text-kg-primary">Your vibes</p>
                <div className="flex flex-wrap gap-1">
                  {prefs.vibes?.map((v) => (
                    <span key={v} className="tag-neutral">
                      {v}
                    </span>
                  ))}
                </div>
                <p className="mb-2 mt-3 text-sm font-medium text-kg-primary">Interests</p>
                <div className="flex flex-wrap gap-1">
                  {prefs.interests?.map((i) => (
                    <span key={i} className="tag-neutral">
                      {i}
                    </span>
                  ))}
                </div>
                <Link
                  href="/onboarding/vibe-quiz"
                  className="mt-3 block text-sm text-kg-primary underline"
                >
                  Retake vibe quiz
                </Link>
              </div>
            )}
            {session.user?.role === "BUSINESS" && (
              <Link
                href="/business/dashboard"
                className="kg-card-pad block font-medium text-kg-primary"
              >
                Business dashboard →
              </Link>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/discover" })}
              className="btn-secondary text-kg-primary"
              aria-label={t("signOut")}
            >
              {t("signOut")}
            </button>
          </>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-sm text-kg-muted">
              Sign in to save itineraries and reviews.
            </p>
            <Link href="/login" className="btn-primary inline-block">
              {t("signIn")}
            </Link>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
