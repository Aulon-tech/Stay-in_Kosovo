"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function ShareItineraryPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

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
      <div className="mx-auto max-w-md p-6 text-sm text-gray-500">Loading…</div>
    );
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-md p-6">
        <p className="text-red-600">Itinerary not found or not public.</p>
        <Link href="/discover" className="text-red-600">
          {t("discover")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md pb-8">
      <header className="bg-gradient-to-r from-red-700 to-amber-600 px-4 py-6 text-white">
        <p className="text-xs uppercase opacity-80">Shared itinerary</p>
        <h1 className="text-xl font-bold">{data.title}</h1>
      </header>
      <ol className="space-y-3 p-4">
        {data.stops?.map(
          (
            s: {
              order: number;
              plannedTime?: string;
              transportMode?: string;
              place?: { id: string; name: string; city: string };
            },
            i: number
          ) => (
            <li key={i} className="rounded-xl border bg-white p-3">
              <p className="font-semibold">
                {s.order}. {s.place?.name || "Stop"}
              </p>
              <p className="text-xs text-gray-500">
                {s.plannedTime} · {s.transportMode} · {s.place?.city}
              </p>
              {s.place?.id && (
                <Link
                  href={`/place/${s.place.id}`}
                  className="mt-1 block text-xs text-red-600"
                >
                  View place →
                </Link>
              )}
            </li>
          )
        )}
      </ol>
      <div className="px-4">
        <Link
          href="/discover"
          className="block w-full rounded-xl bg-red-600 py-3 text-center text-white"
        >
          {t("discover")}
        </Link>
      </div>
    </div>
  );
}
