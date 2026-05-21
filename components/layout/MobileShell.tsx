import { BottomNav } from "./BottomNav";

export function MobileShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-100 pb-20">
      {title && (
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-3">
          <h1 className="text-lg font-semibold">{title}</h1>
        </header>
      )}
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
