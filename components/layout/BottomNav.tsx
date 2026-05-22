"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/hooks/useTranslation";

const links = [
  { href: "/discover", key: "discover" as const, icon: "◎" },
  { href: "/map", key: "map" as const, icon: "⌖" },
  { href: "/vibes", key: "vibes" as const, icon: "✦" },
  { href: "/itinerary", key: "plan" as const, icon: "▣" },
  { href: "/profile", key: "profile" as const, icon: "○" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-kg-border bg-white/95 backdrop-blur"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-md justify-around px-2 py-2">
        {links.map((l) => {
          const active = pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${
                active ? "font-bold text-kg-neutral" : "text-kg-muted"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={`flex h-8 min-w-[2rem] items-center justify-center text-base ${
                  active ? "nav-active-pill" : ""
                }`}
              >
                {l.icon}
              </span>
              {t(l.key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
