"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPlace, MapEvent } from "./MapView";
import {
  userLocationIcon,
  placeMarkerIcon,
  placeMarkerSelectedIcon,
  calendarEventIcon,
} from "./map-icons";

function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

/** Leaflet needs a real pixel height; flex parents often report 0 until invalidateSize */
function MapResize() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    fix();
    const t1 = window.setTimeout(fix, 50);
    const t2 = window.setTimeout(fix, 300);
    window.addEventListener("resize", fix);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", fix);
    };
  }, [map]);
  return null;
}

function FitPlacesBounds({
  center,
  places,
  enabled,
}: {
  center: [number, number];
  places: MapPlace[];
  enabled: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || places.length === 0) return;
    const points: [number, number][] = [
      center,
      ...places.map((p) => [p.lat, p.lng] as [number, number]),
    ];
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
  }, [center, places, enabled, map]);
  return null;
}

export default function MapInner({
  center,
  places,
  events,
  onSelectPlace,
  onMapClick,
  selectedPlaceId,
  routePath,
}: {
  center: [number, number];
  places: MapPlace[];
  events: MapEvent[];
  onSelectPlace: (p: MapPlace) => void;
  onMapClick?: (lat: number, lng: number) => void;
  selectedPlaceId?: string | null;
  routePath?: [number, number][] | null;
}) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      className="h-full w-full z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapResize />
      <FitPlacesBounds center={center} places={places} enabled={places.length > 0} />
      {places.length === 0 && (
        <Recenter lat={center[0]} lng={center[1]} />
      )}
      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
      {routePath && routePath.length >= 2 && (
        <Polyline
          positions={routePath}
          pathOptions={{
            color: "#EBA33D",
            weight: 4,
            opacity: 0.9,
            dashArray: "10 8",
          }}
        />
      )}
      <Marker position={center} icon={userLocationIcon}>
        <Popup>You are here</Popup>
      </Marker>
      {places.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={
            selectedPlaceId === p.id ? placeMarkerSelectedIcon : placeMarkerIcon
          }
          eventHandlers={{ click: () => onSelectPlace(p) }}
        >
          <Popup>
            <strong>{p.name}</strong>
            <br />
            {p.category} · ★ {p.avgRating}
          </Popup>
        </Marker>
      ))}
      {events.map((e) => (
        <Marker
          key={e.id}
          position={[e.lat, e.lng]}
          icon={calendarEventIcon}
        >
          <Popup>
            <strong>{e.name}</strong>
            <br />
            Event · {e.category}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
