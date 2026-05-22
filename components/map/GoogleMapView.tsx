"use client";

import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import type { MapPlace, MapEvent } from "./MapView";

function RoutePolyline({ path }: { path: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || path.length < 2) return;
    const line = new google.maps.Polyline({
      path: path.map(([lat, lng]) => ({ lat, lng })),
      geodesic: true,
      strokeColor: "#EBA33D",
      strokeOpacity: 0.9,
      strokeWeight: 4,
    });
    line.setMap(map);
    return () => line.setMap(null);
  }, [map, path]);
  return null;
}

export function GoogleMapView({
  apiKey,
  center,
  places,
  events,
  onSelectPlace,
  onMapClick,
  selectedPlaceId,
  routePath,
}: {
  apiKey: string;
  center: { lat: number; lng: number };
  places: MapPlace[];
  events: MapEvent[];
  onSelectPlace: (p: MapPlace) => void;
  onMapClick?: (lat: number, lng: number) => void;
  selectedPlaceId?: string | null;
  routePath?: [number, number][] | null;
}) {
  return (
    <div className="h-full w-full">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={13}
          gestureHandling="greedy"
          className="h-full w-full"
          onClick={(e) => {
            const ll = e.detail.latLng;
            if (ll && onMapClick) onMapClick(ll.lat, ll.lng);
          }}
        >
          <Marker position={center} title="You are here" />
          {routePath && routePath.length >= 2 && <RoutePolyline path={routePath} />}
          {places.map((p) => (
            <Marker
              key={p.id}
              position={{ lat: p.lat, lng: p.lng }}
              title={p.name}
              onClick={() => onSelectPlace(p)}
            />
          ))}
          {events.map((e) => (
            <Marker
              key={e.id}
              position={{ lat: e.lat, lng: e.lng }}
              title={e.name}
            />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
