"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDistance } from "@/lib/utils";

export type PlaceCardData = {
  id: string;
  name: string;
  category: string;
  vibes: string[];
  images: string[];
  avgRating: number;
  distanceKm?: number | null;
  feelsLike?: string | null;
};

export function PlaceCard({
  place,
  onAddItinerary,
}: {
  place: PlaceCardData;
  onAddItinerary?: () => void;
}) {
  const img =
    place.images?.[0] ||
    "https://images.unsplash.com/photo-1501339847302-ac826a4a87f3?w=800";
  const catKey = place.category?.toLowerCase() || "other";

  return (
    <article className="kg-card">
      <Link href={`/place/${place.id}`} className="block">
        <div className="relative h-44 w-full bg-kg-surface">
          <Image
            src={img}
            alt={place.name}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          <span className="tag-teal absolute left-3 top-3">{catKey}</span>
          {place.avgRating > 0 && (
            <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-0.5 text-xs font-medium text-white">
              ★ {place.avgRating}
            </span>
          )}
          <h3 className="absolute bottom-3 left-3 right-3 text-lg font-bold text-white">
            {place.name}
          </h3>
        </div>
        <div className="p-4">
          <p className="text-xs text-kg-muted">
            {place.distanceKm != null
              ? formatDistance(place.distanceKm)
              : "Prishtina"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {place.vibes?.slice(0, 4).map((v) => (
              <span key={v} className="tag-neutral">
                {v}
              </span>
            ))}
          </div>
          {place.feelsLike && (
            <p className="mt-2 line-clamp-2 text-xs italic text-kg-muted">
              {place.feelsLike}
            </p>
          )}
        </div>
      </Link>
      {onAddItinerary && (
        <div className="border-t border-kg-border px-4 pb-4">
          <button type="button" onClick={onAddItinerary} className="btn-primary">
            + Add to my day
          </button>
        </div>
      )}
    </article>
  );
}
