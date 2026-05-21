"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/discover", label: "Discover" },
  { href: "/map", label: "Map" },
  { href: "/vibes", label: "Vibes" },
  { href: "/itinerary", label: "Plan" },
  { href: "/profile", label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-md justify-around py-2">
        {links.map((l) => {
          const active = pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-2 py-1 text-xs ${active ? "font-bold text-blue-600" : "text-gray-600"}`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
