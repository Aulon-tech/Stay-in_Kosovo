export function PlaceCardSkeleton() {
  return (
    <div className="kg-card animate-pulse">
      <div className="h-44 bg-kg-border" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-2/3 rounded bg-kg-border" />
        <div className="h-3 w-1/2 rounded bg-kg-border" />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-kg-border" />
          <div className="h-6 w-16 rounded-full bg-kg-border" />
        </div>
      </div>
    </div>
  );
}
