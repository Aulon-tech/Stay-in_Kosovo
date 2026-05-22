"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";

export function PendingStopsBanner({
  onSaveToNew,
  onSaveToEditing,
  editing,
}: {
  onSaveToNew: () => void;
  onSaveToEditing: () => void;
  editing: boolean;
}) {
  const { pendingStops } = useAppStore();
  if (!pendingStops.length) return null;

  return (
    <div className="rounded-kg border border-kg-accent/40 bg-kg-gold-soft p-4">
      <p className="text-sm font-semibold text-kg-neutral">
        {pendingStops.length} stop(s) queued
      </p>
      <ul className="mt-1 text-xs text-kg-muted">
        {pendingStops.map((p) => (
          <li key={p.placeId}>{p.placeName || p.placeId}</li>
        ))}
      </ul>
      <div className="mt-3 grid gap-2">
        <button type="button" onClick={onSaveToNew} className="btn-primary">
          Save to new plan
        </button>
        {editing && (
          <button type="button" onClick={onSaveToEditing} className="btn-secondary">
            Add to current plan
          </button>
        )}
        <Link href="/discover" className="text-center text-xs text-kg-primary underline">
          Add more places
        </Link>
      </div>
    </div>
  );
}
