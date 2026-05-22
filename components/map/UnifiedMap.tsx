"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { GoogleMapView } from "./GoogleMapView";
import type { MapPlace, MapEvent } from "./MapView";

const LeafletMap = dynamic(
  () =>
    import("@/components/map/LeafletMapClient").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[12rem] items-center justify-center bg-kg-surface text-sm text-kg-muted">
        Loading map…
      </div>
    ),
  }
);

export function UnifiedMap({
  center,
  places,
  events,
  onSelectPlace,
  onMapClick,
  heightClass = "h-80",
  selectedPlaceId,
  routePath,
}: {
  center: [number, number];
  places: MapPlace[];
  events: MapEvent[];
  onSelectPlace: (p: MapPlace) => void;
  onMapClick?: (lat: number, lng: number) => void;
  heightClass?: string;
  selectedPlaceId?: string | null;
  routePath?: [number, number][] | null;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={`flex items-center justify-center bg-kg-surface ${heightClass}`}
      >
        Loading map…
      </div>
    );
  }

  if (apiKey) {
    return (
      <div className={heightClass}>
        <GoogleMapView
          apiKey={apiKey}
          center={{ lat: center[0], lng: center[1] }}
          places={places}
          events={events}
          onSelectPlace={onSelectPlace}
          onMapClick={onMapClick}
          selectedPlaceId={selectedPlaceId}
          routePath={routePath}
        />
      </div>
    );
  }

  return (
    <div className={`${heightClass} [&_.leaflet-container]:h-full`}>
      <LeafletMap
        center={center}
        places={places}
        events={events}
        onSelectPlace={onSelectPlace}
        onMapClick={onMapClick}
        selectedPlaceId={selectedPlaceId}
        routePath={routePath}
      />
    </div>
  );
}
