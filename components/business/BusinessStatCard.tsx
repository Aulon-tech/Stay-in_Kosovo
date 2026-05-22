"use client";

export function BusinessStatCard({
  icon,
  label,
  value,
  changeLabel,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  changeLabel?: string;
  subtitle?: string;
}) {
  return (
    <article className="kg-card flex items-start gap-3 p-4 shadow-kg">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-kg bg-kg-teal-soft text-lg"
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-kg-muted">{label}</p>
        <p className="mt-0.5 text-3xl font-bold tracking-tight text-kg-neutral">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {changeLabel && (
          <p className="mt-1 text-xs font-medium text-emerald-600">{changeLabel}</p>
        )}
        {subtitle && !changeLabel && (
          <p className="mt-1 text-xs text-kg-muted">{subtitle}</p>
        )}
      </div>
    </article>
  );
}
