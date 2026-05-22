"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MobileShell } from "@/components/layout/MobileShell";
import { PlaceCard } from "@/components/places/PlaceCard";
import { useGeolocation } from "@/components/geo/useGeolocation";
import { useAppStore } from "@/lib/store";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/lib/toast-store";
import { VIBE_MOOD_TO_TAG } from "@/lib/dataset";
import { getVibeRules, type VibeModeId } from "@/lib/vibe-matching";

const VIBE_MOODS = [
  { id: "all_nighter", label: "Out All Night", desc: "Clubs, bars & party", icon: "🌙", color: "bg-indigo-100" },
  { id: "chill", label: "Chill", desc: "Calm coffee & walks", icon: "☕", color: "bg-orange-100" },
  { id: "foodie", label: "Foodie", desc: "Restaurants & local food", icon: "🍽️", color: "bg-red-100" },
  { id: "adventure", label: "Adventure", desc: "Nature & trails", icon: "🌲", color: "bg-green-100" },
  { id: "romantic", label: "Date Night", desc: "Intimate & romantic", icon: "❤️", color: "bg-pink-100" },
  { id: "culture", label: "Culture", desc: "Museums & heritage", icon: "🏛️", color: "bg-teal-100" },
  { id: "study", label: "Focus", desc: "Quiet cafés & Wi‑Fi", icon: "💻", color: "bg-slate-100" },
];

type VibeRec = {
  place: {
    id: string;
    name: string;
    category: string;
    vibes: string[];
    images: string[];
    avgRating: number;
    city?: string;
    displayCity?: string;
  };
  why: string;
  distanceKm: number;
};

function matchesPrishtina(place: { city?: string; displayCity?: string }) {
  const c = (place.displayCity || place.city || "").toLowerCase();
  if (c.includes("prizren")) return false;
  return (
    c.includes("prishtina") ||
    c.includes("pristina") ||
    c.includes("gračanica") ||
    c.includes("gracanica") ||
    !c
  );
}

export default function VibesPage() {
  useGeolocation();
  const { lat, lng, addPendingStop, setFilters } = useAppStore();
  const { data: session } = useSession();
  const router = useRouter();
  const pushToast = useToastStore((s) => s.push);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [activeVibe, setActiveVibe] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");

  const datasetVibe = activeVibe ? VIBE_MOOD_TO_TAG[activeVibe] || activeVibe : null;
  const activeMood = VIBE_MOODS.find((m) => m.id === activeVibe);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["vibe-rec", activeVibe, datasetVibe, lat, lng, freeText],
    enabled: !!activeVibe,
    queryFn: async () => {
      const q = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        miniItinerary: "true",
        limit: "20",
        distance: "50",
        mood: activeVibe || "",
      });
      if (datasetVibe) q.set("vibe", datasetVibe);
      if (freeText.trim()) q.set("prompt", freeText.trim());
      const res = await fetch(`/api/recommendations?${q.toString()}`);
      if (!res.ok) throw new Error("Failed to load recommendations");
      return res.json();
    },
  });

  const { displayRecs, usedCityFallback } = useMemo(() => {
    const all = (data?.recommendations || []) as VibeRec[];
    if (!all.length) return { displayRecs: [] as VibeRec[], usedCityFallback: false };
    const inCity = all.filter((r) => matchesPrishtina(r.place));
    if (inCity.length > 0) {
      return { displayRecs: inCity, usedCityFallback: false };
    }
    return { displayRecs: all.slice(0, 12), usedCityFallback: true };
  }, [data]);

  useEffect(() => {
    if (activeVibe && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeVibe, isLoading]);

  function selectVibe(id: string) {
    setActiveVibe(id);
    const tag = VIBE_MOOD_TO_TAG[id] || id;
    setFilters({ vibe: tag });
  }

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
    <MobileShell>
      <div className="p-4">
        <h1 className="kg-page-title">What{"'"}s your vibe today?</h1>
        <p className="kg-subtitle mt-1">
          Tell us the mood, {"we'll"} plan your day in Prishtina.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {VIBE_MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => selectVibe(m.id)}
              aria-pressed={activeVibe === m.id}
              className={`vibe-mood-card ${activeVibe === m.id ? "vibe-mood-card-active" : ""}`}
            >
              <span
                className={`mb-2 flex h-14 w-14 items-center justify-center rounded-full text-2xl ${m.color}`}
              >
                {m.icon}
              </span>
              <span className="text-sm font-semibold text-kg-neutral">{m.label}</span>
              <span className="mt-0.5 text-center text-xs text-kg-muted">{m.desc}</span>
            </button>
          ))}
        </div>

        <div className="relative mt-4">
          <input
            className="input-kg pr-12"
            placeholder="…or just tell us what you want"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-kg-primary">
            🎤
          </span>
        </div>
      </div>

      {activeVibe && (
        <div ref={resultsRef} className="border-t border-kg-border p-4">
          <h2 className="text-base font-bold text-kg-primary">
            {activeMood?.label} in Prishtina
          </h2>
          <p className="kg-subtitle mt-1">
            {activeVibe && getVibeRules(activeVibe as VibeModeId).intent}
          </p>

          {isLoading && (
            <p className="mt-4 text-sm text-kg-muted">Curating places for you…</p>
          )}
          {isError && (
            <p className="mt-4 text-sm text-kg-primary">
              Could not load picks. Check your connection and try again.
            </p>
          )}

          {!isLoading && !isError && usedCityFallback && displayRecs.length > 0 && (
            <p className="mt-3 rounded-kg border border-kg-border bg-kg-teal-soft px-3 py-2 text-xs text-kg-primary">
              Few exact matches in Prishtina for this vibe — showing the best nearby picks.
            </p>
          )}

          {!isLoading && !isError && displayRecs.length === 0 && (
            <div className="kg-card-pad mt-4 text-center">
              <p className="text-sm font-medium text-kg-neutral">
                No places matched this vibe yet.
              </p>
              <p className="mt-1 text-xs text-kg-muted">
                Try another mood or describe what you want in the box above.
              </p>
              <Link href="/discover" className="btn-secondary mt-3 inline-block !w-auto px-6">
                Browse all places
              </Link>
            </div>
          )}

          {!isLoading && displayRecs.length > 0 && data?.miniItinerary?.length > 0 && (
            <div className="kg-card-pad mt-4">
              <p className="mb-2 text-sm font-semibold text-kg-primary">Suggested mini-day</p>
              <ol className="list-decimal space-y-1 pl-4 text-sm text-kg-neutral">
                {displayRecs.slice(0, 3).map((r, i) => (
                  <li key={r.place.id}>{r.place.name}</li>
                ))}
              </ol>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Make it shorter", "More food", "Cheaper options"].map((chip) => (
                  <span key={chip} className="chip chip-inactive text-xs">
                    {chip}
                  </span>
                ))}
              </div>
              {session ? (
                <button type="button" onClick={saveMiniItinerary} className="btn-primary mt-3">
                  ✨ Build my day
                </button>
              ) : (
                <Link href="/login" className="btn-primary mt-3 block text-center">
                  Sign in to save plan
                </Link>
              )}
            </div>
          )}

          <div className="mt-4 space-y-4">
            {displayRecs.map((r) => (
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
            ))}
          </div>

          {!isLoading && displayRecs.length > 0 && (
            <Link
              href="/onboarding/vibe-quiz"
              className="mt-4 block text-center text-sm font-medium text-kg-primary underline"
            >
              Shape a full day →
            </Link>
          )}
        </div>
      )}
    </MobileShell>
  );
}
