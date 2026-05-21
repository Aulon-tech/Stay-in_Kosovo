"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/hooks/useTranslation";

const links = [
  { href: "/discover", key: "discover" as const },
  { href: "/map", key: "map" as const },
  { href: "/vibes", key: "vibes" as const },
  { href: "/itinerary", key: "plan" as const },
  { href: "/profile", key: "profile" as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-md justify-around py-2">
        {links.map((l) => {
          const active = pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-2 py-1 text-xs ${active ? "font-bold text-red-600" : "text-gray-600"}`}
              aria-current={active ? "page" : undefined}
            >
              {t(l.key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
