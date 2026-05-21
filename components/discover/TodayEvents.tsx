"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useTranslation } from "@/lib/hooks/useTranslation";

export function TodayEvents() {
  const { t } = useTranslation();
  const { data: events } = useQuery({
    queryKey: ["events-today"],
    queryFn: async () => {
      const res = await fetch("/api/events?today=true");
      return res.json() as Promise<
        { id: string; name: string; startTime: string; category: string }[]
      >;
    },
  });

  if (!events?.length) return null;

  return (
    <section className="px-3 pb-2" aria-labelledby="today-events-heading">
      <h2 id="today-events-heading" className="mb-2 text-sm font-semibold text-gray-800">
        {t("todayEvents")}
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {events.slice(0, 8).map((ev) => (
          <div
            key={ev.id}
            className="min-w-[200px] shrink-0 rounded-xl border border-red-100 bg-white p-3 shadow-sm"
          >
            <p className="text-xs font-medium uppercase text-red-600">{ev.category}</p>
            <p className="mt-1 text-sm font-semibold">{ev.name}</p>
            <p className="text-xs text-gray-500">
              {new Date(ev.startTime).toLocaleString(undefined, {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ))}
      </div>
      <Link href="/map" className="mt-1 block text-xs text-red-700">
        → {t("map")}
      </Link>
    </section>
  );
}
