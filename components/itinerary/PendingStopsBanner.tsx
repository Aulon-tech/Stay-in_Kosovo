"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { useTranslation } from "@/lib/hooks/useTranslation";

export function PendingStopsBanner({
  onSaveToNew,
  onSaveToEditing,
  editing,
}: {
  onSaveToNew: () => void;
  onSaveToEditing?: () => void;
  editing?: boolean;
}) {
  const pendingStops = useAppStore((s) => s.pendingStops);
  const { t } = useTranslation();

  if (!pendingStops.length) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
      <p className="text-sm font-medium text-amber-900">
        {pendingStops.length} vend(e) në radhë
      </p>
      <ul className="mt-1 text-xs text-amber-800">
        {pendingStops.map((p) => (
          <li key={p.placeId}>· {p.placeName || p.placeId}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={onSaveToNew}
          className="rounded-lg bg-red-600 py-2 text-sm text-white"
        >
          {t("saved")} — krijo itinerar të ri
        </button>
        {editing && onSaveToEditing && (
          <button
            type="button"
            onClick={onSaveToEditing}
            className="rounded-lg border border-red-600 py-2 text-sm text-red-700"
          >
            Shto në itinerarin që po redakton
          </button>
        )}
        <Link href="/discover" className="text-center text-xs text-red-700">
          + shto më shumë vende
        </Link>
      </div>
    </div>
  );
}
