"use client";

import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import type { MapPlace, MapEvent } from "./MapView";

export function GoogleMapView({
  apiKey,
  center,
  places,
  events,
  onSelectPlace,
  onMapClick,
}: {
  apiKey: string;
  center: { lat: number; lng: number };
  places: MapPlace[];
  events: MapEvent[];
  onSelectPlace: (p: MapPlace) => void;
  onMapClick?: (lat: number, lng: number) => void;
}) {
  return (
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
  );
}
