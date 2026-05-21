"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { MapView, MapPlace } from "@/components/map/MapView";
import { DiscoverFilters } from "@/components/places/DiscoverFilters";
import { useGeolocation } from "@/components/geo/useGeolocation";
import { useAppStore } from "@/lib/store";
import { useSession } from "next-auth/react";

export default function MapPage() {
  useGeolocation();
  const { lat, lng, filters, showEvents, showTransit, setShowEvents, setShowTransit, addPendingStop } = useAppStore();
  const { data: session } = useSession();
  const [selected, setSelected] = useState<MapPlace | null>(null);
  const [transport, setTransport] = useState<{ label: string; mode: string }[]>([]);

  const qs = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  if (filters.category) qs.set("category", filters.category);
  if (filters.vibe) qs.set("vibe", filters.vibe);
  if (filters.distance) qs.set("distance", String(filters.distance));
  if (filters.openNow) qs.set("openNow", "true");

  const { data: places } = useQuery({
    queryKey: ["map-places", lat, lng, filters],
    queryFn: async () => {
      const res = await fetch(`/api/places?${qs}`);
      return res.json();
    },
  });

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      return res.json();
    },
  });

  async function loadDirections(p: MapPlace) {
    const res = await fetch(
      `/api/transport?fromLat=${lat}&fromLng=${lng}&toLat=${p.lat}&toLng=${p.lng}`
    );
    const opts = await res.json();
    setTransport(opts);
  }

  function handleSelect(p: MapPlace) {
    setSelected(p);
    loadDirections(p);
  }

  return (
    <MobileShell title="Map">
      <DiscoverFilters />
      <div className="flex gap-2 border-b bg-white px-3 py-2">
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={showEvents}
            onChange={(e) => setShowEvents(e.target.checked)}
          />
          Events
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={showTransit}
            onChange={(e) => setShowTransit(e.target.checked)}
          />
          Transit hints
        </label>
      </div>
      <MapView
        places={(places || []).map((p: MapPlace & { lat: number; lng: number }) => ({
          id: p.id,
          name: p.name,
          lat: p.lat,
          lng: p.lng,
          category: p.category,
          avgRating: p.avgRating,
        }))}
        events={showEvents ? (events || []) : []}
        onSelectPlace={handleSelect}
      />
      {selected && (
        <div className="fixed bottom-16 left-0 right-0 z-50 mx-auto max-w-md border-t bg-white p-4 shadow-lg">
          <h3 className="font-semibold">{selected.name}</h3>
          <p className="text-xs text-gray-500">{selected.category}</p>
          {showTransit && transport.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {transport.map((t) => (
                <span key={t.mode} className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                  {t.label}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <Link
              href={`/place/${selected.id}`}
              className="flex-1 rounded border py-2 text-center text-sm"
            >
              Details
            </Link>
            {session && (
              <button
                type="button"
                className="flex-1 rounded bg-blue-600 py-2 text-sm text-white"
                onClick={() => {
                  addPendingStop(selected.id, selected.name);
                  alert("Added to itinerary queue — open Plan to save");
                }}
              >
                Add to itinerary
              </button>
            )}
          </div>
          <button
            type="button"
            className="mt-2 w-full text-xs text-gray-500"
            onClick={() => setSelected(null)}
          >
            Close
          </button>
        </div>
      )}
    </MobileShell>
  );
}
