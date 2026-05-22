"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/layout/MobileShell";
import { PlaceCard } from "@/components/places/PlaceCard";
import { useGeolocation } from "@/components/geo/useGeolocation";
import { useAppStore } from "@/lib/store";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/lib/toast-store";
import { VIBE_MOOD_TO_TAG } from "@/lib/dataset";

const VIBE_MOODS = [
  { id: "cozy", label: "Cozy evening", desc: "Warm corners & slow nights" },
  { id: "energetic", label: "Lively night", desc: "Bars, energy & social buzz" },
  { id: "romantic", label: "Romantic dinner", desc: "Intimate tables & soft light" },
  { id: "adventurous", label: "Outdoor day", desc: "Parks, views & fresh air" },
  { id: "chill", label: "Chill afternoon", desc: "Unhurried hours & easy pace" },
  { id: "traditional", label: "Cultural deep-dive", desc: "History, craft, roots" },
];

export default function VibesPage() {
  useGeolocation();
  const { lat, lng, addPendingStop } = useAppStore();
  const { data: session } = useSession();
  const router = useRouter();
  const pushToast = useToastStore((s) => s.push);
  const [activeVibe, setActiveVibe] = useState<string | null>(null);

  const datasetVibe = activeVibe ? VIBE_MOOD_TO_TAG[activeVibe] || activeVibe : null;

  const { data, isLoading } = useQuery({
    queryKey: ["vibe-rec", datasetVibe, lat, lng],
    enabled: !!datasetVibe,
    queryFn: async () => {
      const res = await fetch(
        `/api/recommendations?vibe=${datasetVibe}&lat=${lat}&lng=${lng}&miniItinerary=true&limit=12`
      );
      return res.json();
    },
  });

  async function saveMiniItinerary() {
    if (!session || !data?.miniItinerary?.length) {
      router.push("/login");
      return;
    }
    const mood = VIBE_MOODS.find((m) => m.id === activeVibe);
    await fetch("/api/itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${mood?.label || activeVibe} plan`,
        stops: data.miniItinerary,
      }),
    });
    router.push("/itinerary");
  }

  return (
    <MobileShell title="Vibes">
      <div className="grid grid-cols-2 gap-2 p-3">
        {VIBE_MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setActiveVibe(m.id)}
            className={`rounded-lg border p-3 text-left ${
              activeVibe === m.id ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"
            }`}
          >
            <span className="block text-sm font-semibold">{m.label}</span>
            <span className="text-xs text-gray-500">{m.desc}</span>
          </button>
        ))}
      </div>
      {activeVibe && (
        <div className="border-t p-3">
          {isLoading && <p className="text-sm text-gray-500">Curating…</p>}
          {data?.miniItinerary && (
            <div className="mb-3 rounded bg-gray-100 p-3">
              <p className="mb-2 text-sm font-medium">Mini-itinerary</p>
              <ol className="list-decimal pl-4 text-xs">
                {data.recommendations?.slice(0, 3).map(
                  (r: { place: { name: string } }, i: number) => (
                    <li key={i}>{r.place.name}</li>
                  )
                )}
              </ol>
              {session && (
                <button
                  type="button"
                  onClick={saveMiniItinerary}
                  className="mt-2 w-full rounded bg-blue-600 py-2 text-sm text-white"
                >
                  Save as itinerary
                </button>
              )}
            </div>
          )}
          <div className="space-y-3">
            {data?.recommendations?.map(
              (r: {
                place: {
                  id: string;
                  name: string;
                  category: string;
                  vibes: string[];
                  images: string[];
                  avgRating: number;
                };
                why: string;
                distanceKm: number;
              }) => (
                <PlaceCard
                  key={r.place.id}
                  place={{
                    ...r.place,
                    feelsLike: r.why,
                    distanceKm: r.distanceKm,
                  }}
                  onAddItinerary={
                    session
                      ? () => {
                          addPendingStop(r.place.id, r.place.name);
                          pushToast({
                            message: `Shtuar: ${r.place.name}`,
                            actionLabel: "Plani",
                            actionHref: "/itinerary",
                          });
                        }
                      : undefined
                  }
                />
              )
            )}
          </div>
        </div>
      )}
    </MobileShell>
  );
}
