"use client";

import { useState } from "react";
import { UnifiedMap } from "@/components/map/UnifiedMap";

export default function PickLocationMap({
  lat,
  lng,
  onPick,
}: {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
}) {
  const [pos, setPos] = useState({ lat, lng });

  return (
    <div>
      <p className="mb-1 text-xs text-gray-500">
        Tap a pin on the map or use Google Maps click (set location via coordinates
        below if using OSM).
      </p>
      <UnifiedMap
        center={[pos.lat, pos.lng]}
        places={[
          {
            id: "pick",
            name: "Your business",
            lat: pos.lat,
            lng: pos.lng,
            category: "",
            avgRating: 0,
          },
        ]}
        events={[]}
        onSelectPlace={(p) => {
          setPos({ lat: p.lat, lng: p.lng });
          onPick(p.lat, p.lng);
        }}
        onMapClick={(la, ln) => {
          setPos({ lat: la, lng: ln });
          onPick(la, ln);
        }}
        heightClass="h-48"
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          type="number"
          step="any"
          className="rounded border p-2 text-sm"
          value={pos.lat}
          onChange={(e) => {
            const v = Number(e.target.value);
            setPos((s) => ({ ...s, lat: v }));
            onPick(v, pos.lng);
          }}
          placeholder="Latitude"
        />
        <input
          type="number"
          step="any"
          className="rounded border p-2 text-sm"
          value={pos.lng}
          onChange={(e) => {
            const v = Number(e.target.value);
            setPos((s) => ({ ...s, lng: v }));
            onPick(pos.lat, v);
          }}
          placeholder="Longitude"
        />
      </div>
    </div>
  );
}
