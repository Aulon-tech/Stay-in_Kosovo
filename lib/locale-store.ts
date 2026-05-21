import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/lib/i18n";

type LocaleState = {
  locale: Locale;
  setLocale: (l: Locale) => void;
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "sq",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "stay-locale" }
  )
);
