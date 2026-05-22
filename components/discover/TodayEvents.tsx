"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/lib/hooks/useTranslation";

export function TodayEvents() {
  const { t } = useTranslation();
  const { data: events } = useQuery({
    queryKey: ["events-today"],
    queryFn: async () => {
      const res = await fetch("/api/events?today=true");
      return res.json();
    },
  });

  if (!events?.length) return null;

  return (
    <section className="border-b border-kg-border bg-white px-3 py-3">
      <h2 className="text-sm font-semibold text-kg-primary">{t("todayEvents")}</h2>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {events.map(
          (ev: {
            id: string;
            name: string;
            category: string;
            startTime: string;
          }) => (
            <div
              key={ev.id}
              className="min-w-[200px] shrink-0 rounded-kg border border-kg-border bg-kg-surface p-3 shadow-kg-sm"
            >
              <p className="text-xs font-medium uppercase text-kg-primary">{ev.category}</p>
              <p className="mt-1 text-sm font-medium text-kg-neutral">{ev.name}</p>
              <p className="text-xs text-kg-muted">
                {new Date(ev.startTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )
        )}
      </div>
      <Link href="/map" className="mt-1 block text-xs text-kg-primary underline">
        View on map →
      </Link>
    </section>
  );
}
