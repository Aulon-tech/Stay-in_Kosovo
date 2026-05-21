"use client";

import Link from "next/link";

export function HomeHero() {
  return (
    <section className="bg-gradient-to-br from-blue-700 to-blue-900 px-4 py-6 text-white">
      <p className="text-xs font-medium uppercase tracking-wider text-blue-200">
        Kosovo · Explore
      </p>
      <h1 className="mt-1 text-2xl font-bold leading-tight">Stay in Kosovo</h1>
      <p className="mt-2 text-sm text-blue-100">
        Discover places by vibe, build itineraries, and get around — built for
        mobile.
      </p>
      <div className="mt-4 flex gap-2">
        <Link
          href="/map"
          className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur"
        >
          Map view
        </Link>
        <Link
          href="/vibes"
          className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-blue-900"
        >
          Browse vibes
        </Link>
      </div>
    </section>
  );
}
