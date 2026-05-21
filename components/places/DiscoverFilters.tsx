"use client";

import { useAppStore } from "@/lib/store";
import { VIBES } from "@/lib/utils";

const CATEGORIES = ["", "FOOD", "CULTURE", "NIGHTLIFE", "NATURE", "SHOPPING", "CAFE"];
const DISTANCES = [null, 1, 3, 5, 10];

export function DiscoverFilters() {
  const { filters, setFilters } = useAppStore();
  return (
    <div className="space-y-2 border-b border-gray-200 bg-white p-3">
      <select
        className="w-full rounded border border-gray-300 p-2 text-sm"
        value={filters.category}
        onChange={(e) => setFilters({ category: e.target.value })}
      >
        <option value="">All categories</option>
        {CATEGORIES.filter(Boolean).map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        className="w-full rounded border border-gray-300 p-2 text-sm"
        value={filters.vibe}
        onChange={(e) => setFilters({ vibe: e.target.value })}
      >
        <option value="">All vibes</option>
        {VIBES.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-2">
        {DISTANCES.map((d) => (
          <button
            key={String(d)}
            type="button"
            onClick={() => setFilters({ distance: d })}
            className={`rounded px-2 py-1 text-xs ${
              filters.distance === d ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            {d ? `${d} km` : "Any dist"}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {[null, 2, 3, 4].map((p) => (
          <button
            key={String(p)}
            type="button"
            onClick={() => setFilters({ price: p })}
            className={`rounded px-2 py-1 text-xs ${
              filters.price === p ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            {p ? `€`.repeat(p) : "Any $"}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFilters({ openNow: !filters.openNow })}
          className={`rounded px-2 py-1 text-xs ${
            filters.openNow ? "bg-green-600 text-white" : "bg-gray-100"
          }`}
        >
          Open now
        </button>
      </div>
    </div>
  );
}
