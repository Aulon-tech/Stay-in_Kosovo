import Link from "next/link";
import { BottomNav } from "./BottomNav";

export function MobileShell({
  children,
  title,
  hideBrand,
  fillMain,
}: {
  children: React.ReactNode;
  title?: string;
  hideBrand?: boolean;
  /** Map and similar screens: main grows to fill space above bottom nav */
  fillMain?: boolean;
}) {
  return (
    <div className={`kg-shell ${fillMain ? "flex min-h-dvh flex-col" : ""}`}>
      {!hideBrand && (
        <header className="kg-header">
          <div className="flex items-center justify-between">
            <div className="w-8" aria-hidden />
            <span className="kg-brand">KosovoGo</span>
            <Link
              href="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-kg-gold-soft text-xs font-semibold text-kg-primary"
              aria-label="Profile"
            >
              ◉
            </Link>
          </div>
          {title && (
            <p className="mt-1 text-center text-xs font-medium text-kg-muted">
              {title}
            </p>
          )}
        </header>
      )}
      <main className={fillMain ? "flex min-h-0 flex-1 flex-col" : undefined}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
