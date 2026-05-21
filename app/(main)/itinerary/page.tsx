"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { useGeolocation } from "@/components/geo/useGeolocation";
import { useAppStore } from "@/lib/store";
import { calculateTransportOptions } from "@/lib/transport";
import { fetchPlacesList } from "@/lib/places-api";
import { PendingStopsBanner } from "@/components/itinerary/PendingStopsBanner";
import { SortableStops } from "@/components/itinerary/SortableStops";
import { useToastStore } from "@/lib/toast-store";

type Stop = {
  placeId: string;
  order: number;
  plannedTime?: string;
  transportMode?: string;
  placeName?: string;
};

type Itinerary = {
  id: string;
  title: string;
  date: string | null;
  stops: Stop[];
  isPublic: boolean;
};

export default function ItineraryPage() {
  useGeolocation();
  const { lat, lng, pendingStops, clearPendingStops } = useAppStore();
  const pushToast = useToastStore((s) => s.push);
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [smartMinutes, setSmartMinutes] = useState(240);
  const [smartVibe, setSmartVibe] = useState("cozy");

  const { data: itineraries, isLoading } = useQuery<Itinerary[]>({
    queryKey: ["itineraries"],
    queryFn: async () => {
      const res = await fetch("/api/itinerary");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });

  const { data: placesData } = useQuery({
    queryKey: ["all-places-itin"],
    queryFn: () => fetchPlacesList(`lat=${lat}&lng=${lng}&limit=50`),
  });
  const places = placesData?.items;

  const placeMap: Map<string, string> = new Map(
    (places || []).map((p: { id: string; name: string }) => [p.id, p.name] as [string, string])
  );

  const saveMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      stops: s,
    }: {
      id: string;
      title: string;
      stops: Stop[];
    }) => {
      const res = await fetch(`/api/itinerary/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, stops: s }),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itineraries"] });
      setEditingId(null);
    },
  });

  async function createNew() {
    const s =
      pendingStops.length > 0
        ? pendingStops.map((p, i) => ({
            placeId: p.placeId,
            order: i + 1,
            plannedTime: `${10 + i}:00`,
            transportMode: "WALK",
          }))
        : [];
    const res = await fetch("/api/itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "My itinerary", stops: s }),
    });
    const it = await res.json();
    clearPendingStops();
    qc.invalidateQueries({ queryKey: ["itineraries"] });
    setEditingId(it.id);
    setStops(it.stops || s);
    pushToast({ message: "Itinerary created", actionLabel: "Edit", actionHref: "/itinerary" });
  }

  function mergePendingIntoStops() {
    const base = [...stops];
    pendingStops.forEach((p) => {
      if (!base.some((s) => s.placeId === p.placeId)) {
        base.push({
          placeId: p.placeId,
          order: base.length + 1,
          plannedTime: `${10 + base.length}:00`,
          transportMode: "WALK",
        });
      }
    });
    setStops(base.map((s, i) => ({ ...s, order: i + 1 })));
    clearPendingStops();
  }

  async function smartFill() {
    const res = await fetch("/api/itinerary/smart-fill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        windowMinutes: smartMinutes,
        vibe: smartVibe,
        lat,
        lng,
      }),
    });
    const data = await res.json();
    const createRes = await fetch("/api/itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: data.title, stops: data.stops }),
    });
    const it = await createRes.json();
    qc.invalidateQueries({ queryKey: ["itineraries"] });
    setEditingId(it.id);
    setStops(it.stops);
  }

  function startEdit(it: Itinerary) {
    setEditingId(it.id);
    setStops([...it.stops].sort((a, b) => a.order - b.order));
  }

  function calcTotals() {
    let duration = 0;
    let cost = 0;
    const sorted = [...stops].sort((a, b) => a.order - b.order);
    for (let i = 0; i < sorted.length; i++) {
      duration += 45;
      if (i > 0) {
        const prev = places?.find(
          (p: { id: string }) => p.id === sorted[i - 1].placeId
        );
        const curr = places?.find(
          (p: { id: string }) => p.id === sorted[i].placeId
        );
        if (prev && curr) {
          const opts = calculateTransportOptions(
            prev.lat,
            prev.lng,
            curr.lat,
            curr.lng
          );
          const mode = sorted[i].transportMode || "WALK";
          const opt = opts.find((o) => o.mode === mode) || opts[0];
          duration += opt.durationMin;
          cost += opt.cost;
        }
      }
    }
    return { duration, cost };
  }

  const totals = editingId ? calcTotals() : null;

  return (
    <MobileShell title="Itinerary">
      <div className="space-y-3 p-3">
        <PendingStopsBanner
          onSaveToNew={createNew}
          onSaveToEditing={mergePendingIntoStops}
          editing={!!editingId}
        />
        <button
          type="button"
          onClick={createNew}
          className="w-full rounded-xl bg-red-600 py-2 text-white"
        >
          Create new
        </button>
        <div className="rounded border bg-white p-3">
          <p className="mb-2 text-sm font-medium">Smart-fill</p>
          <input
            type="number"
            className="mb-2 w-full rounded border p-2 text-sm"
            value={smartMinutes}
            onChange={(e) => setSmartMinutes(Number(e.target.value))}
            placeholder="Minutes available"
          />
          <input
            className="mb-2 w-full rounded border p-2 text-sm"
            value={smartVibe}
            onChange={(e) => setSmartVibe(e.target.value)}
            placeholder="Vibe"
          />
          <button
            type="button"
            onClick={smartFill}
            className="w-full rounded border border-blue-600 py-2 text-sm text-blue-600"
          >
            Generate with AI / rules
          </button>
        </div>
        {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {itineraries?.map((it) => (
          <div key={it.id} className="rounded border bg-white p-3">
            <h3 className="font-semibold">{it.title}</h3>
            <p className="text-xs text-gray-500">
              {it.stops.length} stops {it.isPublic ? "· Public" : ""}
            </p>
            {it.isPublic && (
              <Link
                href={`/itinerary/share/${it.id}`}
                className="mt-1 block text-xs text-red-600"
              >
                Share link →
              </Link>
            )}
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="text-sm text-blue-600"
                onClick={() => startEdit(it)}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-sm text-red-600"
                onClick={async () => {
                  await fetch(`/api/itinerary/${it.id}`, { method: "DELETE" });
                  qc.invalidateQueries({ queryKey: ["itineraries"] });
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {editingId && (
          <div className="rounded border-2 border-blue-200 bg-white p-3">
            <h3 className="mb-2 font-semibold">Edit stops</h3>
            {totals && (
              <p className="mb-2 text-xs text-gray-600">
                Est. {totals.duration} min · €{totals.cost.toFixed(2)} transport
              </p>
            )}
            <SortableStops
              stops={stops}
              placeMap={placeMap}
              onChange={setStops}
            />
            <button
              type="button"
              className="mt-2 w-full rounded-xl bg-red-600 py-2 text-white"
              onClick={() =>
                saveMutation.mutate({
                  id: editingId,
                  title:
                    itineraries?.find((i) => i.id === editingId)?.title ||
                    "My itinerary",
                  stops,
                })
              }
            >
              Save
            </button>
            <button
              type="button"
              className="mt-1 w-full text-xs text-gray-500"
              onClick={() => setEditingId(null)}
            >
              Cancel
            </button>
          </div>
        )}
        <Link href="/discover" className="block text-center text-sm text-blue-600">
          Browse places to add
        </Link>
      </div>
    </MobileShell>
  );
}
