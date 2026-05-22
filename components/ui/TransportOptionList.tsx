const MODE_STYLE: Record<
  string,
  { icon: string; bg: string; label: string }
> = {
  WALK: { icon: "🚶", bg: "bg-emerald-100", label: "Walking" },
  BUS: { icon: "🚌", bg: "bg-sky-100", label: "Bus" },
  TAXI: { icon: "🚕", bg: "bg-amber-100", label: "Taxi" },
  BIKE: { icon: "🚲", bg: "bg-violet-100", label: "Bike" },
};

export function TransportOptionList({
  options,
  originLabel,
  roadDistanceKm,
  walkNotRecommended,
}: {
  options: { mode: string; label: string; recommended?: boolean }[];
  originLabel?: string;
  roadDistanceKm?: number;
  walkNotRecommended?: string;
}) {
  return (
    <div>
      {originLabel && (
        <p className="mb-2 text-xs text-kg-muted">
          {originLabel}
          {roadDistanceKm != null ? ` · ~${roadDistanceKm} km by road (estimate)` : ""}
        </p>
      )}
      {walkNotRecommended && (
        <p className="mb-2 text-xs font-medium text-amber-700">{walkNotRecommended}</p>
      )}
      <div className="space-y-2">
        {options.map((tr) => {
          const style = MODE_STYLE[tr.mode] || MODE_STYLE.WALK;
          const parts = tr.label.match(/(\d+\s*min[^·]*)/i);
          const time = parts?.[0] || tr.label;
          const rest = tr.label.replace(time, "").trim();
          return (
            <div
              key={tr.mode}
              className={`transport-row ${tr.recommended ? "transport-row-active" : ""}`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${style.bg}`}
              >
                {style.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-kg-neutral">{style.label}</p>
                <p className="text-xs text-kg-muted">From your location</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-kg-primary">{time}</p>
                {rest && (
                  <p className="text-xs text-kg-muted">{rest.replace(/^·\s*/, "")}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
