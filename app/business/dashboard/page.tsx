"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function BusinessDashboardPage() {
  const { data: session } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["business-stats"],
    queryFn: async () => {
      const res = await fetch("/api/business/stats");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!session,
  });

  if (!session) {
    return (
      <div className="mx-auto max-w-md p-6">
        <Link href="/login" className="text-blue-600">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="text-xl font-bold">Business dashboard</h1>
      {isLoading && <p className="mt-4 text-sm text-gray-500">Loading…</p>}
      {!isLoading && !data?.place && (
        <div className="mt-4">
          <p className="text-sm text-gray-600">No listing yet.</p>
          <Link
            href="/business/onboard"
            className="mt-2 inline-block rounded bg-blue-600 px-4 py-2 text-white"
          >
            Onboard your business
          </Link>
        </div>
      )}
      {data?.place && (
        <div className="mt-4 space-y-4">
          <div className="rounded border bg-white p-4">
            <h2 className="font-semibold">{data.place.name}</h2>
            <p className="text-sm text-gray-500">{data.place.city}</p>
            <p className="mt-2 text-sm">{data.place.description}</p>
            <p className="mt-2 text-xs">
              Verified: {data.place.isVerified ? "Yes" : "Pending review"}
            </p>
            <Link
              href={`/place/${data.place.id}`}
              className="mt-2 block text-sm text-blue-600"
            >
              View public listing →
            </Link>
          </div>
          {data.stats && (
            <div className="rounded border bg-white p-4">
              <h3 className="font-medium">Stats</h3>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Reviews: {data.stats.reviewCount}</li>
                <li>Avg rating: ★ {data.stats.avgRating}</li>
                <li>
                  Recommendation appearances (est.):{" "}
                  {data.stats.recommendationAppearances}
                </li>
              </ul>
            </div>
          )}
          <Link
            href="/business/onboard"
            className="block text-sm text-blue-600"
          >
            Update listing (re-onboard)
          </Link>
        </div>
      )}
    </div>
  );
}
