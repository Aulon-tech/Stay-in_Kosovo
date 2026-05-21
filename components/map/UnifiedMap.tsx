"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { GoogleMapView } from "./GoogleMapView";
import type { MapPlace, MapEvent } from "./MapView";

const LeafletMap = dynamic(() => import("./MapInner"), { ssr: false });

export function UnifiedMap({
  center,
  places,
  events,
  onSelectPlace,
  onMapClick,
  heightClass = "h-80",
}: {
  center: [number, number];
  places: MapPlace[];
  events: MapEvent[];
  onSelectPlace: (p: MapPlace) => void;
  onMapClick?: (lat: number, lng: number) => void;
  heightClass?: string;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={`flex ${heightClass} items-center justify-center bg-gray-100`}>
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
        />
      </div>
    );
  }

  return (
    <div className={heightClass}>
      <LeafletMap
        center={center}
        places={places}
        events={events}
        onSelectPlace={onSelectPlace}
        onMapClick={onMapClick}
      />
    </div>
  );
}
