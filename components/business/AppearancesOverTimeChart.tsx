"use client";

import { useMemo, useState } from "react";
import type { ChartPoint } from "@/lib/business/visibility-analytics";

const TEAL = "#0E6E6E";
const GOLD = "#EBA33D";

function buildPath(
  points: { x: number; y: number }[],
  height: number
): string {
  if (points.length === 0) return "";
  const d = points
    .map((p, i) => {
      const y = height - p.y;
      return `${i === 0 ? "M" : "L"} ${p.x} ${y}`;
    })
    .join(" ");
  return d;
}

function LinePaths({
  data,
  width,
  height,
  padX,
  padY,
}: {
  data: ChartPoint[];
  width: number;
  height: number;
  padX: number;
  padY: number;
}) {
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const max = Math.max(
    ...data.flatMap((d) => [d.shownInPlans, d.profileViews]),
    1
  );

  const coords = data.map((d, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * innerW;
    return {
      x,
      plansY: (d.shownInPlans / max) * innerH,
      viewsY: (d.profileViews / max) * innerH,
    };
  });

  const plansPath = buildPath(
    coords.map((c) => ({ x: c.x, y: c.plansY })),
    height - padY
  );
  const viewsPath = buildPath(
    coords.map((c) => ({ x: c.x, y: c.viewsY })),
    height - padY
  );

  const baseline = height - padY;

  return (
    <g>
      <path
        d={plansPath}
        fill="none"
        stroke={TEAL}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={viewsPath}
        fill="none"
        stroke={GOLD}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map((c, i) => (
        <g key={data[i].label}>
          <circle cx={c.x} cy={baseline - c.plansY} r={3.5} fill={TEAL} />
          <circle cx={c.x} cy={baseline - c.viewsY} r={3.5} fill={GOLD} />
        </g>
      ))}
    </g>
  );
}

export function AppearancesOverTimeChart({
  weekly,
  monthly,
}: {
  weekly: ChartPoint[];
  monthly: ChartPoint[];
}) {
  const [range, setRange] = useState<"weekly" | "monthly">("weekly");
  const data = range === "weekly" ? weekly : monthly;

  const width = 320;
  const height = 160;
  const padX = 12;
  const padY = 12;

  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i <= 4; i++) {
      const y = padY + (i / 4) * (height - padY * 2);
      lines.push(y);
    }
    return lines;
  }, []);

  return (
    <article className="kg-card p-4 shadow-kg">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-kg-primary">
          Appearances Over Time
        </h2>
        <div className="city-toggle shrink-0">
          <button
            type="button"
            className={`city-toggle-item !px-3 !py-1.5 text-xs ${
              range === "weekly" ? "city-toggle-active" : "city-toggle-inactive"
            }`}
            onClick={() => setRange("weekly")}
          >
            Weekly
          </button>
          <button
            type="button"
            className={`city-toggle-item !px-3 !py-1.5 text-xs ${
              range === "monthly" ? "city-toggle-active" : "city-toggle-inactive"
            }`}
            onClick={() => setRange("monthly")}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mx-auto h-44 w-full max-w-full"
          role="img"
          aria-label="Appearances over time chart"
        >
          {gridLines.map((y) => (
            <line
              key={y}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="#E2E8E6"
              strokeDasharray="4 4"
            />
          ))}
          <LinePaths
            data={data}
            width={width}
            height={height}
            padX={padX}
            padY={padY}
          />
          {data.map((d, i) => {
            const x = padX + (i / Math.max(data.length - 1, 1)) * (width - padX * 2);
            return (
              <text
                key={d.label}
                x={x}
                y={height - 2}
                textAnchor="middle"
                className="fill-kg-muted text-[10px]"
                style={{ fontSize: 10 }}
              >
                {d.label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex justify-center gap-4 text-xs text-kg-muted">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: TEAL }}
          />
          Shown in plans
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: GOLD }}
          />
          Profile views
        </span>
      </div>
    </article>
  );
}
