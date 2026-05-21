"use client";

import { useTranslation } from "@/lib/hooks/useTranslation";

export function DiscoverSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <label className="block px-3 pb-2">
      <span className="sr-only">{t("searchPlaceholder")}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        aria-label={t("searchPlaceholder")}
      />
    </label>
  );
}
