"use client";

import { useAppStore } from "@/lib/store";
import { UnifiedMap } from "./UnifiedMap";

export type MapPlace = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  avgRating: number;
};

export type MapEvent = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
};

export function MapView({
  places,
  events,
  onSelectPlace,
  fillHeight,
  selectedPlaceId,
  routePath,
}: {
  places: MapPlace[];
  events: MapEvent[];
  onSelectPlace: (p: MapPlace) => void;
  fillHeight?: boolean;
  selectedPlaceId?: string | null;
  routePath?: [number, number][] | null;
}) {
  const { lat, lng } = useAppStore();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const mapHeight = fillHeight
    ? "h-[calc(100dvh-20rem)] min-h-[280px] w-full"
    : "h-80 w-full";

  return (
    <div className={fillHeight ? "w-full shrink-0" : undefined}>
      {!apiKey && (
        <p className="sr-only" aria-hidden>
          Using OpenStreetMap fallback
        </p>
      )}
      <UnifiedMap
        center={[lat, lng]}
        places={places}
        events={events}
        onSelectPlace={onSelectPlace}
        heightClass={mapHeight}
        selectedPlaceId={selectedPlaceId}
        routePath={routePath}
      />
    </div>
  );
}
