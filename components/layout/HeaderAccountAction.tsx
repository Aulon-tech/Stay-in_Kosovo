"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTranslation } from "@/lib/hooks/useTranslation";

export function HeaderAccountAction() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { t } = useTranslation();
  const isBusiness = session?.user?.role === "BUSINESS";
  const onBusinessRoute = pathname.startsWith("/business");

  if (isBusiness || onBusinessRoute) {
    return (
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login?type=business" })}
        className="text-xs font-semibold text-kg-primary underline"
        aria-label={t("signOut")}
      >
        {t("signOut")}
      </button>
    );
  }

  return (
    <Link
      href="/profile"
      className="flex h-8 w-8 items-center justify-center rounded-full bg-kg-gold-soft text-xs font-semibold text-kg-primary"
      aria-label="Profile"
    >
      ◉
    </Link>
  );
}
