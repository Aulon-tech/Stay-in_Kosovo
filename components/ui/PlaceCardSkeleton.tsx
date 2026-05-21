export function PlaceCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="h-44 bg-gray-200" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-1/3 rounded bg-gray-200" />
        <div className="h-3 w-2/3 rounded bg-gray-200" />
        <div className="flex gap-1">
          <div className="h-5 w-14 rounded-full bg-gray-200" />
          <div className="h-5 w-14 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
