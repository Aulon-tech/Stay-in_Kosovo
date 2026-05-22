"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ShareItineraryPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["share-itinerary", id],
    queryFn: async () => {
      const res = await fetch(`/api/itinerary/share/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="kg-shell p-6 text-sm text-kg-muted">Loading…</div>
    );
  }
  if (error || !data) {
    return (
      <div className="kg-shell p-6">
        <p className="text-kg-primary">Itinerary not found or not public.</p>
        <Link href="/discover" className="text-kg-primary underline">
          Discover places
        </Link>
      </div>
    );
  }

  return (
    <div className="kg-shell pb-8">
      <header className="bg-gradient-to-br from-kg-primary to-kg-primary-dark px-4 py-8 text-white">
        <p className="text-xs font-medium uppercase tracking-wider text-white/70">
          KosovoGo
        </p>
        <h1 className="mt-2 text-2xl font-bold">{data.title}</h1>
        <p className="mt-1 text-sm text-white/85">Shared itinerary</p>
      </header>
      <div className="relative space-y-4 p-4 pl-8">
        <div className="timeline-line" aria-hidden />
        {data.stops?.map(
          (
            s: {
              order: number;
              plannedTime?: string;
              transportMode?: string;
              place?: { name: string; city: string; category: string };
            },
            i: number
          ) => (
            <div key={i} className="relative">
              <div className="timeline-dot" aria-hidden />
              <div className="kg-card ml-2 p-4">
                {s.plannedTime && (
                  <span className="tag-teal mb-1 inline-block">{s.plannedTime}</span>
                )}
                <p className="font-semibold text-kg-neutral">
                  {s.place?.name || "Place"}
                </p>
                <p className="text-xs text-kg-muted">
                  {s.place?.category} · {s.place?.city}
                  {s.transportMode ? ` · ${s.transportMode}` : ""}
                </p>
                {s.place && (
                  <Link
                    href={`/discover`}
                    className="mt-2 block text-xs text-kg-primary underline"
                  >
                    Explore in KosovoGo
                  </Link>
                )}
              </div>
            </div>
          )
        )}
      </div>
      <div className="px-4">
        <Link href="/discover" className="btn-primary block text-center">
          Start your own plan
        </Link>
      </div>
    </div>
  );
}
