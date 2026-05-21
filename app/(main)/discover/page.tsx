"use client";

import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/layout/MobileShell";
import { HomeHero } from "@/components/home/HomeHero";
import { DiscoverFilters } from "@/components/places/DiscoverFilters";
import { PlaceCard } from "@/components/places/PlaceCard";
import { useGeolocation } from "@/components/geo/useGeolocation";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { useSession } from "next-auth/react";
import type { PlaceCardData } from "@/components/places/PlaceCard";

export default function DiscoverPage() {
  useGeolocation();
  const { lat, lng, filters, addPendingStop, loading: geoLoading } = useAppStore();
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartResults, setSmartResults] = useState<
    { place: PlaceCardData; why: string }[] | null
  >(null);

  const qs = new URLSearchParams();
  qs.set("lat", String(lat));
  qs.set("lng", String(lng));
  if (filters.category) qs.set("category", filters.category);
  if (filters.vibe) qs.set("vibe", filters.vibe);
  if (filters.distance) qs.set("distance", String(filters.distance));
  if (filters.price) qs.set("price", String(filters.price));
  if (filters.openNow) qs.set("openNow", "true");

  const { data: places, isLoading, error } = useQuery<PlaceCardData[]>({
    queryKey: ["places", lat, lng, filters],
    queryFn: async () => {
      const res = await fetch(`/api/places?${qs}`);
      if (!res.ok) throw new Error("Failed to load places");
      return res.json();
    },
  });

  async function askVibe() {
    setSmartLoading(true);
    const res = await fetch(
      `/api/recommendations?lat=${lat}&lng=${lng}&prompt=${encodeURIComponent(prompt || "What's the vibe right now?")}&limit=8`
    );
    const data = await res.json();
    setSmartResults(
      data.recommendations?.map(
        (r: { place: PlaceCardData; why: string }) => ({
          place: { ...r.place, vibes: r.place.vibes, images: r.place.images },
          why: r.why,
        })
      ) || []
    );
    setSmartLoading(false);
  }

  const list = smartResults
    ? smartResults.map((r) => ({ ...r.place, feelsLike: r.why }))
    : places;

  return (
    <MobileShell>
      <HomeHero />
      <div className="p-3">
        <div className="mb-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-medium">What&apos;s the vibe right now?</p>
          <input
            className="mb-2 w-full rounded border border-gray-300 p-2 text-sm"
            placeholder="e.g. cozy evening coffee..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            type="button"
            onClick={askVibe}
            disabled={smartLoading}
            className="w-full rounded bg-blue-600 py-2 text-sm text-white"
          >
            {smartLoading ? "Thinking…" : "Get recommendations"}
          </button>
          {smartResults && (
            <button
              type="button"
              className="mt-2 w-full text-xs text-gray-500"
              onClick={() => setSmartResults(null)}
            >
              Clear · show all places
            </button>
          )}
        </div>
        {geoLoading && (
          <p className="mb-2 text-xs text-gray-500">Getting your location…</p>
        )}
      </div>
      <DiscoverFilters />
      <div className="space-y-3 p-3">
        {isLoading && <p className="text-sm text-gray-500">Loading places…</p>}
        {error && (
          <p className="text-sm text-red-600">Could not load places. Try again.</p>
        )}
        {list?.map((place) => (
          <div key={place.id}>
            <PlaceCard
              place={place}
              onAddItinerary={
                session
                  ? () => addPendingStop(place.id, place.name)
                  : undefined
              }
            />
          </div>
        ))}
        {!isLoading && list?.length === 0 && (
          <p className="text-sm text-gray-500">No places match your filters.</p>
        )}
      </div>
    </MobileShell>
  );
}
