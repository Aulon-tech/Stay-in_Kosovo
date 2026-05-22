"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { MapView, MapPlace } from "@/components/map/MapView";
import { DiscoverFilters } from "@/components/places/DiscoverFilters";
import { useGeolocation } from "@/components/geo/useGeolocation";
import { useAppStore } from "@/lib/store";
import { useSession } from "next-auth/react";
import { useToastStore } from "@/lib/toast-store";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { fetchPlacesList } from "@/lib/places-api";
import { DirectionLinks } from "@/components/directions/DirectionLinks";

export default function MapPage() {
  useGeolocation();
  const { lat, lng, filters, showEvents, showTransit, setShowEvents, setShowTransit, addPendingStop } = useAppStore();
  const { data: session } = useSession();
  const pushToast = useToastStore((s) => s.push);
  const { t } = useTranslation();
  const [selected, setSelected] = useState<MapPlace | null>(null);
  const [transport, setTransport] = useState<{ label: string; mode: string }[]>([]);

  const { data: placesData } = useQuery({
    queryKey: ["map-places", lat, lng, filters, showEvents],
    queryFn: () => {
      const qs = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        limit: showEvents ? "200" : "30",
      });
      if (showEvents) {
        qs.set("distance", "80");
      } else if (filters.distance) {
        qs.set("distance", String(filters.distance));
      }
      if (filters.category) qs.set("category", filters.category);
      if (filters.vibe) qs.set("vibe", filters.vibe);
      if (filters.openNow) qs.set("openNow", "true");
      return fetchPlacesList(qs.toString());
    },
  });
  const places = placesData?.items;

  const { data: calendarEvents } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      return res.json();
    },
    enabled: showEvents,
  });

  const eventMarkers: MapPlace[] = useMemo(() => {
    if (!showEvents || !Array.isArray(calendarEvents)) return [];
    return calendarEvents
      .map(
        (e: {
          id: string;
          name: string;
          lat?: number;
          lng?: number;
          category?: string;
          place?: { lat: number; lng: number };
        }) => ({
          id: `event-${e.id}`,
          name: e.name,
          lat: e.lat ?? e.place?.lat ?? 0,
          lng: e.lng ?? e.place?.lng ?? 0,
          category: e.category || "event",
          avgRating: 0,
        })
      )
      .filter((e) => e.lat !== 0 && e.lng !== 0);
  }, [calendarEvents, showEvents]);

  async function loadDirections(p: MapPlace) {
    const res = await fetch(
      `/api/transport?fromLat=${lat}&fromLng=${lng}&toLat=${p.lat}&toLng=${p.lng}`
    );
    const data = await res.json();
    setTransport(data.options || []);
  }

  function handleSelect(p: MapPlace) {
    setSelected(p);
    if (showTransit) {
      loadDirections(p);
    } else {
      setTransport([]);
    }
  }

  useEffect(() => {
    if (selected && showTransit) {
      loadDirections(selected);
    }
  }, [showTransit, selected?.id, lat, lng]);

  const mapPlaces: MapPlace[] = useMemo(
    () =>
      (places || []).map((p) => ({
        id: p.id,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        category: p.category,
        avgRating: p.avgRating,
      })),
    [places]
  );

  const routePath: [number, number][] | null =
    showTransit && selected
      ? [
          [lat, lng],
          [selected.lat, selected.lng],
        ]
      : null;

  return (
    <MobileShell title="Map">
      <DiscoverFilters />
      <div className="flex shrink-0 gap-2 border-b bg-white px-3 py-2">
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={showEvents}
            onChange={(e) => setShowEvents(e.target.checked)}
          />
          Events & places
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={showTransit}
            onChange={(e) => setShowTransit(e.target.checked)}
          />
          Transit hints
        </label>
        {mapPlaces.length > 0 && (
          <span className="ml-auto text-[10px] text-kg-muted">
            {mapPlaces.length} pins
          </span>
        )}
      </div>
      <MapView
        fillHeight
        places={mapPlaces}
        events={eventMarkers}
        selectedPlaceId={selected?.id ?? null}
        routePath={routePath}
        onSelectPlace={handleSelect}
      />
      {selected && (
        <div className="fixed bottom-16 left-0 right-0 z-50 mx-auto max-w-md border-t bg-white p-4 shadow-lg">
          <h3 className="font-semibold">{selected.name}</h3>
          <p className="text-xs text-gray-500">{selected.category}</p>
          {showTransit && routePath && (
            <p className="mt-1 text-xs text-kg-primary">
              Route shown on map (estimate)
            </p>
          )}
          {showTransit && transport.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {transport.map((tr) => (
                <span key={tr.mode} className="tag-teal text-xs">
                  {tr.label}
                </span>
              ))}
            </div>
          )}
          <div className="mt-2">
            <DirectionLinks lat={selected.lat} lng={selected.lng} name={selected.name} />
          </div>
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
                className="btn-primary flex-1 !py-2 text-sm"
                onClick={() => {
                  addPendingStop(selected.id, selected.name);
                  pushToast({
                    message: `${t("addedItinerary")}: ${selected.name}`,
                    actionLabel: t("goToPlan"),
                    actionHref: "/itinerary",
                  });
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
