"use client";

import { googleMapsDirectionsUrl, wazeDirectionsUrl } from "@/lib/deeplink";
import { useTranslation } from "@/lib/hooks/useTranslation";

export function DirectionLinks({
  lat,
  lng,
  name,
}: {
  lat: number;
  lng: number;
  name?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={googleMapsDirectionsUrl(lat, lng, name)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-teal"
        aria-label={t("googleMaps")}
      >
        {t("googleMaps")}
      </a>
      <a
        href={wazeDirectionsUrl(lat, lng)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary !w-auto px-4 py-2"
        aria-label={t("waze")}
      >
        {t("waze")}
      </a>
    </div>
  );
}
