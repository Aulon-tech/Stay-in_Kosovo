"use client";

import { t, type I18nKey } from "@/lib/i18n";
import { useLocaleStore } from "@/lib/locale-store";

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);
  return {
    locale,
    t: (key: I18nKey) => t(key, locale),
  };
}
