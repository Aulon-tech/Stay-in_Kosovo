"use client";

import { useState } from "react";
import type { BuiltPlan } from "@/lib/ai/types";

const QUICK_CHIPS = [
  { label: "Change 1st stop", command: "change the first stop to another place" },
  { label: "Remove first", command: "delete the first stop" },
  { label: "Add a cafe", command: "add a cafe" },
  { label: "Swap stop 2", command: "replace the second stop with a cafe" },
];

export function ItineraryReplan({
  currentPlan,
  windowMinutes,
  vibeHint,
  onReplan,
  loading,
}: {
  currentPlan: BuiltPlan | null;
  windowMinutes: number;
  vibeHint?: string;
  onReplan: (changeRequest: string) => void;
  loading?: boolean;
}) {
  const [text, setText] = useState("");

  if (!currentPlan) return null;

  return (
    <div className="kg-card-pad mx-4 border border-kg-border">
      <p className="text-sm font-semibold text-kg-primary">Adjust your day</p>
      <p className="kg-subtitle mt-1">
        Change a stop in order — e.g.{" "}
        <span className="text-kg-neutral">change the first to a cafe</span>,{" "}
        <span className="text-kg-neutral">first should disappear, put another restaurant</span>.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.command}
            type="button"
            className="chip chip-inactive text-xs"
            disabled={loading}
            onClick={() => onReplan(chip.command)}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <div className="relative mt-3">
        <input
          className="input-kg pr-12"
          placeholder='e.g. change the first to a cafe / të pari zhduket, vendos një restorant'
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.trim()) {
              onReplan(text.trim());
              setText("");
            }
          }}
          disabled={loading}
        />
        <button
          type="button"
          disabled={loading || !text.trim()}
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-kg-accent text-sm font-bold text-kg-neutral disabled:opacity-50"
          aria-label="Send"
          onClick={() => {
            if (text.trim()) {
              onReplan(text.trim());
              setText("");
            }
          }}
        >
          →
        </button>
      </div>
      {loading && (
        <p className="mt-2 text-xs text-kg-muted">Updating your plan…</p>
      )}
    </div>
  );
}
