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
}: {
  places: MapPlace[];
  events: MapEvent[];
  onSelectPlace: (p: MapPlace) => void;
}) {
  const { lat, lng, showEvents } = useAppStore();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div>
      {!apiKey && (
        <p className="bg-amber-50 px-3 py-1 text-xs text-amber-800">
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for Google Maps (using OpenStreetMap
          fallback).
        </p>
      )}
      <UnifiedMap
        center={[lat, lng]}
        places={places}
        events={showEvents ? events : []}
        onSelectPlace={onSelectPlace}
      />
    </div>
  );
}
