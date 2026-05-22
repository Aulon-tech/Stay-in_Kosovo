"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { MobileShell } from "@/components/layout/MobileShell";
import { HomeHero } from "@/components/home/HomeHero";
import { DiscoverFilters } from "@/components/places/DiscoverFilters";
import { DiscoverSearch } from "@/components/places/DiscoverSearch";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlaceCardSkeleton } from "@/components/ui/PlaceCardSkeleton";
import { TodayEvents } from "@/components/discover/TodayEvents";
import { useGeolocation } from "@/components/geo/useGeolocation";
import { useAppStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast-store";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { fetchPlacesList } from "@/lib/places-api";
import type { PlaceCardData } from "@/components/places/PlaceCard";

export default function DiscoverPage() {
  useGeolocation();
  const { lat, lng, filters, addPendingStop, loading: geoLoading } = useAppStore();
  const { data: session } = useSession();
  const pushToast = useToastStore((s) => s.push);
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState("");
  const [search, setSearch] = useState("");
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartResults, setSmartResults] = useState<
    { place: PlaceCardData; why: string }[] | null
  >(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("lat", String(lat));
    p.set("lng", String(lng));
    p.set("limit", "12");
    if (filters.category) p.set("category", filters.category);
    if (filters.vibe) p.set("vibe", filters.vibe);
    if (filters.distance) p.set("distance", String(filters.distance));
    if (filters.price) p.set("price", String(filters.price));
    if (filters.openNow) p.set("openNow", "true");
    if (search.trim()) p.set("search", search.trim());
    return p.toString();
  }, [lat, lng, filters, search]);

  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["places", qs],
      queryFn: ({ pageParam }) =>
        fetchPlacesList(`${qs}&page=${pageParam}`),
      initialPageParam: 1,
      getNextPageParam: (last, _pages, pageParam) =>
        last.hasMore ? pageParam + 1 : undefined,
    });

  const placesList = data?.pages.flatMap((p) => p.items) ?? [];

  async function askVibe() {
    setSmartLoading(true);
    const res = await fetch(
      `/api/recommendations?lat=${lat}&lng=${lng}&prompt=${encodeURIComponent(prompt || "What's the vibe right now?")}&limit=8`
    );
    const json = await res.json();
    setSmartResults(
      json.recommendations?.map(
        (r: { place: PlaceCardData; why: string }) => ({
          place: { ...r.place, vibes: r.place.vibes, images: r.place.images },
          why: r.why,
        })
      ) || []
    );
    setSmartLoading(false);
  }

  function handleAdd(place: PlaceCardData) {
    addPendingStop(place.id, place.name);
    pushToast({
      message: `${t("addedItinerary")}: ${place.name}`,
      actionLabel: t("goToPlan"),
      actionHref: "/itinerary",
    });
  }

  const list = smartResults
    ? smartResults.map((r) => ({ ...r.place, feelsLike: r.why }))
    : placesList;

  return (
    <MobileShell>
      <HomeHero />
      <DiscoverSearch value={search} onChange={(v) => setSearch(v)} />
      <TodayEvents />
      <div className="p-3">
        <div className="kg-card-pad mb-3">
          <p className="mb-2 text-sm font-semibold text-kg-primary">{t("vibePrompt")}</p>
          <input
            className="input-kg mb-2 !rounded-kg"
            placeholder="e.g. cozy evening coffee..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            aria-label={t("vibePrompt")}
          />
          <button
            type="button"
            onClick={askVibe}
            disabled={smartLoading}
            className="btn-primary disabled:opacity-50"
          >
            {smartLoading ? t("thinking") : t("getRecs")}
          </button>
          {smartResults && (
            <button
              type="button"
              className="mt-2 w-full text-xs text-kg-muted underline"
              onClick={() => setSmartResults(null)}
            >
              {t("clearAll")}
            </button>
          )}
        </div>
        {geoLoading && (
          <p className="mb-2 text-xs text-kg-muted">{t("gettingLocation")}</p>
        )}
      </div>
      <DiscoverFilters />
      <div className="space-y-3 p-3">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <PlaceCardSkeleton key={i} />)}
        {error && (
          <div className="rounded-kg border border-kg-primary/20 bg-kg-teal-soft p-4 text-center text-sm text-kg-primary">
            <p>Could not load places.</p>
            <button type="button" className="mt-2 font-medium underline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}
        {list?.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onAddItinerary={session ? () => handleAdd(place) : undefined}
          />
        ))}
        {!isLoading && !smartResults && list?.length === 0 && (
          <div className="rounded-kg border border-dashed border-kg-border bg-white p-8 text-center">
            <p className="text-sm font-medium text-kg-neutral">{t("noPlaces")}</p>
            <p className="mt-1 text-xs text-kg-muted">{t("tryOtherFilters")}</p>
          </div>
        )}
        {!smartResults && hasNextPage && (
          <button
            type="button"
            className="btn-secondary disabled:opacity-50"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </MobileShell>
  );
}
