"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import type { BuiltPlan } from "@/lib/ai/types";
import type { StopEnrichment } from "@/components/itinerary/ItineraryStopsList";
import { ItineraryReplan } from "@/components/itinerary/ItineraryReplan";
import { MobileShell } from "@/components/layout/MobileShell";
import { useGeolocation } from "@/components/geo/useGeolocation";
import { useAppStore } from "@/lib/store";
import { pickTransportOption } from "@/lib/transport";
import { inferCityFromCoords } from "@/lib/geo";
import { fetchPlacesList } from "@/lib/places-api";
import { PendingStopsBanner } from "@/components/itinerary/PendingStopsBanner";
import { ItineraryStopsList } from "@/components/itinerary/ItineraryStopsList";
import { SortableStops } from "@/components/itinerary/SortableStops";
import { useToastStore } from "@/lib/toast-store";
import {
  defaultPlanDate,
  defaultPlanStartTime,
  formatScheduleSummary,
  scheduleFromItineraryDate,
  toItineraryDateIso,
} from "@/lib/plan-schedule";

const TIME_OPTIONS = [
  { minutes: 120, label: "2h" },
  { minutes: 240, label: "Half day" },
  { minutes: 480, label: "Full day" },
] as const;

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
  const [planDate, setPlanDate] = useState(defaultPlanDate);
  const [planStartTime, setPlanStartTime] = useState(defaultPlanStartTime);

  /** Default vibe only when sending to API — never while typing (empty must stay editable). */
  function vibeForPlan(raw: string): string {
    const v = raw.trim().toLowerCase();
    if (!v || v === "prizren" || v === "prishtina" || v === "kosovo") return "cozy";
    return raw.trim();
  }
  const [dayPrompt, setDayPrompt] = useState("");
  const [viewTitle, setViewTitle] = useState<string | null>(null);
  const [geminiPlan, setGeminiPlan] = useState<BuiltPlan | null>(null);
  const [stopEnrich, setStopEnrich] = useState<Map<string, StopEnrichment>>(
    new Map()
  );
  const [planLoading, setPlanLoading] = useState(false);
  const [buildDayExpanded, setBuildDayExpanded] = useState(false);
  const [planMeta, setPlanMeta] = useState<{
    candidateCount?: number;
    usedGemini?: boolean;
  } | null>(null);

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

  function applyPlanResult(data: {
    title: string;
    stops: Stop[];
    planDetail?: {
      placeId: string;
      curatedPlaceId?: string;
      why: string;
      whatToDo: string;
      plannedTime: string;
      stayMinutes: number;
    }[];
    intent?: { summary_en?: string };
  }) {
    const enrich = new Map<string, StopEnrichment>();
    data.planDetail?.forEach((d) => {
      enrich.set(d.placeId, { why: d.why, whatToDo: d.whatToDo });
    });
    setStopEnrich(enrich);
    setGeminiPlan({
      title: data.title,
      stops:
        data.planDetail?.map((d) => ({
          place_id: d.curatedPlaceId || d.placeId,
          arrival_time: d.plannedTime,
          why_this_place: d.why,
          what_to_do: d.whatToDo,
          stay_minutes: d.stayMinutes,
        })) ||
        data.stops.map((s, i) => ({
          place_id: s.placeId,
          arrival_time: s.plannedTime || `${9 + i}:00 AM`,
          why_this_place: "",
          what_to_do: "",
          stay_minutes: 60,
        })),
    });
    setViewTitle(data.title);
    setStops(data.stops);
  }

  async function smartFill() {
    const userText =
      dayPrompt.trim() ||
      `A ${vibeForPlan(smartVibe)} day in Prishtina, about ${smartMinutes} minutes`;
    setPlanLoading(true);
    try {
      const res = await fetch("/api/itinerary/smart-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          windowMinutes: smartMinutes,
          vibe: vibeForPlan(smartVibe),
          prompt: userText,
          lat,
          lng,
          planDate,
          startTime: planStartTime,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.stops?.length) {
        pushToast({
          message:
            data.error ||
            "No places matched — try different words or a broader vibe.",
        });
        return;
      }
      const createRes = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          stops: data.stops,
          date: toItineraryDateIso(planDate, planStartTime),
        }),
      });
      const it = await createRes.json();
      qc.invalidateQueries({ queryKey: ["itineraries"] });
      setEditingId(it.id);
      applyPlanResult({ ...data, stops: it.stops || data.stops });
      setPlanMeta({
        candidateCount: data.candidateCount,
        usedGemini: data.usedGemini,
      });
      if (data.usedGemini === false) {
        pushToast({
          message: "AI slow or offline — used a backup plan. Try again on Wi‑Fi.",
        });
      } else {
        pushToast({ message: "Your day is ready" });
      }
    } finally {
      setPlanLoading(false);
    }
  }

  async function handleReplan(changeRequest: string) {
    if (!geminiPlan) return;
    setPlanLoading(true);
    try {
      const res = await fetch("/api/ai/replan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeRequest,
          currentPlan: geminiPlan,
          windowMinutes: smartMinutes,
          vibeHint: vibeForPlan(smartVibe),
          userText: dayPrompt,
          planDate,
          startTime: planStartTime,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.stops?.length) {
        pushToast({ message: data.error || "Could not replan" });
        return;
      }
      if (editingId) {
        await fetch(`/api/itinerary/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            stops: data.stops,
            date: toItineraryDateIso(planDate, planStartTime),
          }),
        });
        qc.invalidateQueries({ queryKey: ["itineraries"] });
      }
      applyPlanResult(data);
      setPlanMeta({
        candidateCount: data.candidateCount,
        usedGemini: data.usedGemini,
      });
      const editMsg =
        data.editKind === "delete"
          ? "Stop removed"
          : data.editKind === "replace"
            ? "Stop replaced"
            : data.editKind === "add"
              ? "Stop added"
              : "Plan updated";
      if (data.usedGemini === false && !data.structuredEdit) {
        pushToast({
          message: "Could not reach AI — your plan was kept as-is.",
        });
      } else {
        pushToast({ message: editMsg });
      }
    } finally {
      setPlanLoading(false);
    }
  }

  const enrichMap = useMemo(() => stopEnrich, [stopEnrich]);

  function startEdit(it: Itinerary) {
    setViewTitle(it.title);
    setEditingId(it.id);
    setStops([...it.stops].sort((a, b) => a.order - b.order));
    const sched = scheduleFromItineraryDate(it.date);
    if (sched) {
      setPlanDate(sched.planDate);
      setPlanStartTime(sched.startTime);
    }
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
          const opt = pickTransportOption(
            prev.lat,
            prev.lng,
            curr.lat,
            curr.lng,
            sorted[i].transportMode
          );
          duration += opt.durationMin;
          cost += opt.cost;
        }
      }
    }
    return { duration, cost };
  }

  const totals = stops.length > 0 ? calcTotals() : null;
  const activeIt = itineraries?.find((i) => i.id === editingId);
  const planCity = inferCityFromCoords(lat, lng);
  const hasPlan = stops.length > 0;
  const planScheduleLabel = formatScheduleSummary(planDate, planStartTime);

  useEffect(() => {
    if (hasPlan) setBuildDayExpanded(false);
  }, [hasPlan]);

  const showBuildForm = !hasPlan || buildDayExpanded;

  return (
    <MobileShell title="My Plan">
      <div className="space-y-4">
        <PendingStopsBanner
          onSaveToNew={createNew}
          onSaveToEditing={mergePendingIntoStops}
          editing={!!editingId}
        />

        {hasPlan ? (
          <>
            <ItineraryStopsList
              stops={stops}
              city={planCity}
              vibe={smartVibe}
              totalCost={totals?.cost}
              enrichByPlaceId={enrichMap}
              candidateCount={planMeta?.candidateCount}
              planScheduleLabel={hasPlan ? planScheduleLabel : undefined}
            />
            <ItineraryReplan
              currentPlan={geminiPlan}
              windowMinutes={smartMinutes}
              vibeHint={smartVibe}
              onReplan={handleReplan}
              loading={planLoading}
            />
          </>
        ) : (
          <div className="p-4">
            <h1 className="kg-page-title">Your Perfect Day</h1>
            <p className="kg-subtitle mt-1">
              Shape your mood and {"we'll"} build a timeline for you.
            </p>
          </div>
        )}

        <div className={`kg-card-pad mx-4 ${hasPlan ? "border border-kg-border" : ""}`}>
          <h2 className="text-base font-bold text-kg-primary">
            {hasPlan ? "Build another plan" : "Let\u2019s shape your day"}
          </h2>
          <p className="kg-subtitle mt-1">
            {hasPlan
              ? "Generate a new day with smart-fill (time, vibe, prompt)."
              : "Time window & vibe for smart-fill"}
          </p>

          {hasPlan && !showBuildForm ? (
            <button
              type="button"
              className="btn-primary mt-3 w-full"
              onClick={() => setBuildDayExpanded(true)}
            >
              Open & plan a new day
            </button>
          ) : (
            <>
              {hasPlan && (
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-kg-muted underline"
                  onClick={() => setBuildDayExpanded(false)}
                >
                  Close
                </button>
              )}
              <p className="mt-3 text-xs font-medium text-kg-primary">
                When are you free?
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs text-kg-muted">Date</span>
                  <input
                    type="date"
                    className="input-kg mt-1 block w-full !rounded-kg"
                    value={planDate}
                    min={defaultPlanDate()}
                    onChange={(e) => setPlanDate(e.target.value)}
                    disabled={planLoading}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-kg-muted">Start time</span>
                  <input
                    type="time"
                    className="input-kg mt-1 block w-full !rounded-kg"
                    value={planStartTime}
                    onChange={(e) => setPlanStartTime(e.target.value)}
                    disabled={planLoading}
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {TIME_OPTIONS.map(({ minutes, label }) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setSmartMinutes(minutes)}
                    className={`chip ${smartMinutes === minutes ? "chip-active" : "chip-inactive"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs font-medium text-kg-primary">
                What do you want today? (SQ / EN)
              </p>
              <textarea
                className="input-kg mt-2 block min-h-[88px] w-full !rounded-kg !py-3"
                value={dayPrompt}
                onChange={(e) => setDayPrompt(e.target.value)}
                placeholder="e.g. chill cultural afternoon then traditional dinner… / dua një mbrëmje romantike"
                autoComplete="off"
              />
              <input
                className="input-kg mt-3 block w-full !rounded-kg"
                value={smartVibe}
                onChange={(e) => setSmartVibe(e.target.value)}
                placeholder="Vibe tag (e.g. cozy, nightlife, cultural)"
                autoComplete="off"
                name="vibe-tag"
              />
              <button
                type="button"
                onClick={smartFill}
                disabled={planLoading}
                className="btn-primary mt-3 w-full disabled:opacity-50"
              >
                {planLoading ? "Building…" : "✨ Build my day"}
              </button>
              {hasPlan && (
                <button type="button" onClick={createNew} className="btn-secondary mt-2 w-full">
                  Create empty plan
                </button>
              )}
            </>
          )}
        </div>

        {isLoading && (
          <p className="px-4 text-sm text-kg-muted">Loading saved plans…</p>
        )}
        <div className="space-y-3 px-4 pb-4">
        {itineraries?.map((it) => (
          <div key={it.id} className="kg-card-pad">
            <h3 className="font-semibold text-kg-neutral">{it.title}</h3>
            <p className="text-xs text-kg-muted">
              {it.stops.length} stops {it.isPublic ? "· Public" : ""}
            </p>
            {it.isPublic && (
              <Link
                href={`/itinerary/share/${it.id}`}
                className="mt-1 block text-xs text-kg-primary underline"
              >
                Share link →
              </Link>
            )}
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                className="text-sm font-medium text-kg-primary"
                onClick={() => startEdit(it)}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-sm text-kg-muted"
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

        {editingId && hasPlan && (
          <details className="kg-card-pad">
            <summary className="cursor-pointer font-semibold text-kg-primary">
              Edit times & order
            </summary>
            <div className="mt-3">
              <SortableStops stops={stops} placeMap={placeMap} onChange={setStops} />
              <button
                type="button"
                className="btn-primary mt-4"
                onClick={() =>
                  saveMutation.mutate({
                    id: editingId,
                    title:
                      viewTitle ||
                      itineraries?.find((i) => i.id === editingId)?.title ||
                      "My itinerary",
                    stops,
                  })
                }
              >
                Save plan
              </button>
            </div>
          </details>
        )}

        <Link
          href="/discover"
          className="block px-4 pb-6 text-center text-sm text-kg-primary underline"
        >
          Browse places to add
        </Link>
        </div>
      </div>
    </MobileShell>
  );
}
