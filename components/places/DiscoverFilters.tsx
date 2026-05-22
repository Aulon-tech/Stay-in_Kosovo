"use client";

import { useAppStore } from "@/lib/store";
import { DATASET_CATEGORIES, DATASET_VIBE_TAGS } from "@/lib/dataset";

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
      className={`chip shrink-0 ${active ? "chip-active" : "chip-inactive"}`}
    >
      {children}
    </button>
  );
}

export function DiscoverFilters() {
  const { filters, setFilters, resetFilters } = useAppStore();

  return (
    <div className="space-y-2 border-b border-kg-border bg-white px-3 py-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip active={!filters.category} onClick={() => setFilters({ category: "" })}>
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
      <div className="flex gap-2 overflow-x-auto pb-1">
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
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="flex items-center gap-1 text-kg-muted">
          <input
            type="checkbox"
            checked={filters.openNow}
            onChange={(e) => setFilters({ openNow: e.target.checked })}
            className="accent-kg-primary"
          />
          Open now
        </label>
        <button
          type="button"
          onClick={resetFilters}
          className="text-kg-primary underline"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
