"use client";

import { useAppStore } from "@/lib/store";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { DATASET_CATEGORIES, DATASET_VIBE_TAGS } from "@/lib/dataset";

const DISTANCES = [null, 1, 3, 5, 10] as const;

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-red-600 text-white"
          : "bg-white text-gray-700 border border-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

export function DiscoverFilters() {
  const { filters, setFilters, resetFilters } = useAppStore();
  const { t } = useTranslation();

  return (
    <div className="space-y-2 border-b border-gray-200 bg-gray-50 px-3 py-3">
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Category">
        <Chip
          active={!filters.category}
          onClick={() => setFilters({ category: "" })}
        >
          All
        </Chip>
        {DATASET_CATEGORIES.map((c) => (
          <Chip
            key={c}
            active={filters.category === c}
            onClick={() => setFilters({ category: c })}
          >
            {c}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Vibe">
        <Chip active={!filters.vibe} onClick={() => setFilters({ vibe: "" })}>
          All vibes
        </Chip>
        {DATASET_VIBE_TAGS.map((v) => (
          <Chip
            key={v}
            active={filters.vibe === v}
            onClick={() => setFilters({ vibe: v })}
          >
            {v}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Distance">
        {DISTANCES.map((d) => (
          <Chip
            key={String(d)}
            active={filters.distance === d}
            onClick={() => setFilters({ distance: d })}
          >
            {d ? `${d} km` : t("anyDist")}
          </Chip>
        ))}
        <Chip
          active={filters.openNow}
          onClick={() => setFilters({ openNow: !filters.openNow })}
        >
          {t("openNow")}
        </Chip>
        <button
          type="button"
          onClick={resetFilters}
          className="shrink-0 text-xs text-gray-500 underline"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
