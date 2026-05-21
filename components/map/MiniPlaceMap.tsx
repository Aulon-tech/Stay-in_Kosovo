"use client";

import { UnifiedMap } from "./UnifiedMap";

export default function MiniPlaceMap({
  lat,
  lng,
  name,
}: {
  lat: number;
  lng: number;
  name: string;
}) {
  return (
    <UnifiedMap
      center={[lat, lng]}
      places={[
        {
          id: "preview",
          name,
          lat,
          lng,
          category: "",
          avgRating: 0,
        },
      ]}
      events={[]}
      onSelectPlace={() => {}}
      heightClass="h-40"
    />
  );
}
