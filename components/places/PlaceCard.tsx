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

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: "bg-orange-100 text-orange-800",
  CAFE: "bg-amber-100 text-amber-800",
  CULTURE: "bg-purple-100 text-purple-800",
  NIGHTLIFE: "bg-pink-100 text-pink-800",
  NATURE: "bg-green-100 text-green-800",
  SHOPPING: "bg-sky-100 text-sky-800",
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
  const catClass =
    CATEGORY_COLORS[place.category] || "bg-gray-100 text-gray-700";

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <Link href={`/place/${place.id}`} className="block">
        <div className="relative h-44 w-full bg-gray-100">
          <Image
            src={img}
            alt={place.name}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium ${catClass}`}
          >
            {place.category}
          </span>
          {place.avgRating > 0 && (
            <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              ★ {place.avgRating}
            </span>
          )}
          <h3 className="absolute bottom-3 left-3 right-3 text-lg font-bold text-white">
            {place.name}
          </h3>
        </div>
        <div className="p-3">
          <p className="text-xs text-gray-500">
            {place.distanceKm != null
              ? formatDistance(place.distanceKm)
              : "Kosovo"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {place.vibes?.slice(0, 4).map((v) => (
              <span
                key={v}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-700"
              >
                {v}
              </span>
            ))}
          </div>
          {place.feelsLike && (
            <p className="mt-2 line-clamp-2 text-xs italic text-gray-600">
              {place.feelsLike}
            </p>
          )}
        </div>
      </Link>
      {onAddItinerary && (
        <div className="border-t px-3 pb-3">
          <button
            type="button"
            onClick={onAddItinerary}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white"
          >
            + Add to itinerary
          </button>
        </div>
      )}
    </article>
  );
}
