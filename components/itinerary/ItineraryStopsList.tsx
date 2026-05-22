"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import {
  calculateTransportOptions,
  getTransitLegSubtitle,
  pickTransportOption,
} from "@/lib/transport";
import { formatCategoryLabel } from "@/lib/dataset";

type Stop = {
  placeId: string;
  order: number;
  plannedTime?: string;
  transportMode?: string;
};

type PlaceInfo = {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  city: string;
  displayCity?: string;
  vibes: string[];
  images: string[];
  feelsLike?: string | null;
  lat: number;
  lng: number;
};

function formatPlannedTime(raw?: string): string | null {
  if (!raw) return null;
  if (/AM|PM/i.test(raw)) return raw;
  const parts = raw.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1] ? parseInt(parts[1], 10) : 0;
  if (Number.isNaN(h)) return raw;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function visitMinutes(category: string): number {
  const cat = category.toLowerCase();
  if (cat === "restaurant" || cat === "food") return 75;
  if (["culture", "attraction"].includes(cat)) return 90;
  return 60;
}

function vibeTagLabel(v: string): string {
  const map: Record<string, string> = {
    cozy: "Local Vibe",
    chill: "Lazy & Cozy",
    romantic: "Date Night",
    traditional: "Traditional",
    trendy: "Coffee & Books",
    outdoor: "Nature Escape",
    lively: "Out All Night",
  };
  return map[v.toLowerCase()] || v.charAt(0).toUpperCase() + v.slice(1);
}

async function fetchPlacesForStops(ids: string[]): Promise<Map<string, PlaceInfo>> {
  const unique = Array.from(new Set(ids));
  const results = await Promise.all(
    unique.map(async (id) => {
      const res = await fetch(`/api/places/${id}`);
      if (!res.ok) return null;
      return res.json() as Promise<PlaceInfo>;
    })
  );
  return new Map(
    results.filter((p): p is PlaceInfo => p != null).map((p) => [p.id, p])
  );
}

function TransitLeg({
  from,
  to,
  mode,
}: {
  from: PlaceInfo;
  to: PlaceInfo;
  mode?: string;
}) {
  const leg = calculateTransportOptions(from.lat, from.lng, to.lat, to.lng);
  const pick = pickTransportOption(from.lat, from.lng, to.lat, to.lng, mode);
  const isTaxi = pick.mode === "TAXI";
  const isWalk = pick.mode === "WALK";
  const subtitle = getTransitLegSubtitle(pick, leg.roadDistanceKm);

  return (
    <div className="relative mb-3 ml-14 flex flex-wrap items-center gap-2 py-1">
      <span
        className={
          isTaxi
            ? "mobility-badge-taxi"
            : isWalk
              ? "mobility-badge-walk"
              : "mobility-badge-bus"
        }
      >
        {isWalk && <span aria-hidden>🚶 </span>}
        {isTaxi && <span aria-hidden>🚕 </span>}
        {!isWalk && !isTaxi && <span aria-hidden>🚌 </span>}
        {isTaxi
          ? `€${pick.cost.toFixed(0)} · ${pick.durationMin} min`
          : `${pick.durationMin} min`}
      </span>
      <span className="text-xs text-kg-muted">{subtitle}</span>
    </div>
  );
}

export type StopEnrichment = {
  why?: string;
  whatToDo?: string;
};

export function ItineraryStopsList({
  stops,
  city,
  vibe,
  totalCost,
  enrichByPlaceId,
  candidateCount,
  planScheduleLabel,
}: {
  stops: Stop[];
  city?: string;
  vibe?: string;
  totalCost?: number;
  enrichByPlaceId?: Map<string, StopEnrichment>;
  candidateCount?: number;
  planScheduleLabel?: string;
}) {
  const sorted = [...stops].sort((a, b) => a.order - b.order);
  const ids = sorted.map((s) => s.placeId).join(",");

  const { data: placeById, isLoading } = useQuery({
    queryKey: ["itinerary-stop-places", ids],
    queryFn: () => fetchPlacesForStops(sorted.map((s) => s.placeId)),
    enabled: sorted.length > 0,
  });

  const displayCity = useMemo(() => {
    if (city) return city;
    const first = sorted[0] && placeById?.get(sorted[0].placeId);
    return first?.displayCity || first?.city || "Prishtina";
  }, [city, sorted, placeById]);

  if (sorted.length === 0) return null;

  const summaryVibe = vibe?.trim() || "relaxed";
  const transportEst =
    totalCost != null && totalCost > 0
      ? `~€${totalCost.toFixed(0)} transport (estimate)`
      : null;

  return (
    <section className="perfect-day-timeline" aria-label="Your perfect day">
      <header className="mb-6">
        <h1 className="kg-page-title">Your Perfect Day in {displayCity}</h1>
        <p className="mt-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-kg-primary">
          <span aria-hidden>📍</span> {displayCity.toUpperCase()}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-kg-muted">
          <span aria-hidden>🌿</span>
          A {summaryVibe} day, {sorted.length} stops
          {transportEst ? ` · ${transportEst}` : ""}
        </p>
        {planScheduleLabel && (
          <p className="mt-1 flex items-center gap-1 text-xs text-kg-muted">
            <span aria-hidden>🗓</span> {planScheduleLabel}
          </p>
        )}
        {candidateCount != null && candidateCount > 0 && (
          <p className="mt-1 text-xs text-kg-muted">
            Picked from {candidateCount} curated Prishtina places
          </p>
        )}
      </header>

      {isLoading && (
        <p className="text-sm text-kg-muted">Building your day…</p>
      )}

      <div className="relative pl-14">
        <div className="timeline-line" aria-hidden />

        {sorted.map((stop, index) => {
          const place = placeById?.get(stop.placeId);
          const prev = index > 0 ? placeById?.get(sorted[index - 1].placeId) : null;
          const img =
            place?.images?.[0] ||
            "https://images.unsplash.com/photo-1501339847302-ac826a4a87f3?w=800";
          const timeLabel = formatPlannedTime(stop.plannedTime);
          const stayMin = place ? visitMinutes(place.category) : 60;
          const extra = enrichByPlaceId?.get(stop.placeId);
          const description =
            extra?.why ||
            place?.feelsLike?.replace(/^Feels like:\s*/i, "") ||
            place?.description ||
            "";
          const whatToDo = extra?.whatToDo;
          const tags = place?.vibes?.slice(0, 2) || [];
          const catLabel = place ? formatCategoryLabel(place.category) : null;

          return (
            <div key={`${stop.placeId}-${index}`} className="relative mb-6">
              {index > 0 && prev && place && (
                <TransitLeg
                  from={prev}
                  to={place}
                  mode={stop.transportMode}
                />
              )}

              {timeLabel && (
                <div className="timeline-time-marker">{timeLabel}</div>
              )}

              <article className="kg-card overflow-hidden shadow-kg">
                <Link href={`/place/${stop.placeId}`} className="block">
                  <div className="relative h-44 w-full bg-kg-surface">
                    <Image
                      src={img}
                      alt={place?.name || "Place"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <h2 className="text-lg font-bold text-kg-neutral">
                    {place?.name || stop.placeId}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {catLabel && (
                      <span className="tag-teal">{catLabel}</span>
                    )}
                    {tags.map((v) => (
                      <span key={v} className="tag-neutral">
                        {vibeTagLabel(v)}
                      </span>
                    ))}
                  </div>
                  {description && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-kg-primary">
                        Why you{"'"}d love it
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-kg-muted">
                        {description}
                      </p>
                    </div>
                  )}
                  {whatToDo && (
                    <p className="mt-2 text-xs text-kg-muted">
                      <span className="font-medium text-kg-neutral">Do: </span>
                      {whatToDo}
                    </p>
                  )}
                  <div className="mt-4 border-t border-kg-border pt-3">
                    <p className="flex items-center gap-1.5 text-xs text-kg-muted">
                      <span aria-hidden>⏳</span>
                      Stay ~{stayMin} min
                    </p>
                  </div>
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </section>
  );
}
