"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { MobileShell } from "@/components/layout/MobileShell";

export default function ProfilePage() {
  const { data: session } = useSession();
  const prefs = session?.user?.preferences;

  return (
    <MobileShell title="Profile">
      <div className="space-y-4 p-4">
        {session ? (
          <>
            <div className="rounded border bg-white p-4">
              <p className="font-semibold">{session.user?.name || "Traveler"}</p>
              <p className="text-sm text-gray-500">{session.user?.email}</p>
              <p className="mt-1 text-xs capitalize text-gray-400">
                Role: {session.user?.role?.toLowerCase()}
              </p>
            </div>
            {prefs && (
              <div className="rounded border bg-white p-4">
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
                  className="mt-3 block text-sm text-blue-600"
                >
                  Retake vibe quiz
                </Link>
              </div>
            )}
            {session.user?.role === "BUSINESS" && (
              <Link
                href="/business/dashboard"
                className="block rounded border bg-white p-4 text-blue-600"
              >
                Business dashboard →
              </Link>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/discover" })}
              className="w-full rounded border border-red-300 py-2 text-red-600"
            >
              Sign out
            </button>
          </>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-sm text-gray-600">
              Sign in to save itineraries and reviews.
            </p>
            <Link
              href="/login"
              className="inline-block rounded bg-blue-600 px-6 py-2 text-white"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
