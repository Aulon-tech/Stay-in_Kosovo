"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPlace, MapEvent } from "./MapView";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const userIcon = L.divIcon({
  className: "user-marker",
  html: '<div style="width:14px;height:14px;background:#2563eb;border-radius:50%;border:2px solid white"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

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

export default function MapInner({
  center,
  places,
  events,
  onSelectPlace,
  onMapClick,
}: {
  center: [number, number];
  places: MapPlace[];
  events: MapEvent[];
  onSelectPlace: (p: MapPlace) => void;
  onMapClick?: (lat: number, lng: number) => void;
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
      <Recenter lat={center[0]} lng={center[1]} />
      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
      <Marker position={center} icon={userIcon}>
        <Popup>You are here</Popup>
      </Marker>
      {places.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={icon}
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
          icon={L.divIcon({
            className: "",
            html: '<div style="width:12px;height:12px;background:#dc2626;border-radius:2px"></div>',
            iconSize: [12, 12],
          })}
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
