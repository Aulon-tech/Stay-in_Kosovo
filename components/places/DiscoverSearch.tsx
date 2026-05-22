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
    <label className="mt-3 block px-3 pb-2">
      <span className="sr-only">{t("searchPlaceholder")}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="input-kg"
        aria-label={t("searchPlaceholder")}
      />
    </label>
  );
}
