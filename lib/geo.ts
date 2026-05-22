import { haversineKm, PRISHTINA, PRIZREN_ITP } from "@/lib/utils";

export const PRISHTINA_BOUNDS = {
  minLat: 42.58,
  maxLat: 42.75,
  minLng: 21.08,
  maxLng: 21.25,
};

export const PRIZREN_BOUNDS = {
  minLat: 42.18,
  maxLat: 42.26,
  minLng: 20.66,
  maxLng: 20.8,
};

export function isNearPrishtina(lat: number, lng: number): boolean {
  return (
    lat >= PRISHTINA_BOUNDS.minLat &&
    lat <= PRISHTINA_BOUNDS.maxLat &&
    lng >= PRISHTINA_BOUNDS.minLng &&
    lng <= PRISHTINA_BOUNDS.maxLng
  );
}

export function isNearPrizren(lat: number, lng: number): boolean {
  return (
    lat >= PRIZREN_BOUNDS.minLat &&
    lat <= PRIZREN_BOUNDS.maxLat &&
    lng >= PRIZREN_BOUNDS.minLng &&
    lng <= PRIZREN_BOUNDS.maxLng
  );
}

export function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

export type TransportOrigin = {
  lat: number;
  lng: number;
  label: "you" | "city_center";
  labelText: string;
};

/** Default origin while team works from ITP Prizren */
export function getDefaultOrigin(): { lat: number; lng: number } {
  return PRIZREN_ITP;
}

export function resolveTransportOrigin(
  userLat: number,
  userLng: number,
  placeLat: number,
  placeLng: number,
  maxWalkKm = 6
): TransportOrigin {
  if (!isValidCoord(userLat, userLng)) {
    return {
      lat: PRIZREN_ITP.lat,
      lng: PRIZREN_ITP.lng,
      label: "city_center",
      labelText: "From ITP Prizren",
    };
  }

  if (isNearPrizren(userLat, userLng)) {
    return {
      lat: userLat,
      lng: userLng,
      label: "you",
      labelText: "From your location (Prizren)",
    };
  }

  if (isNearPrishtina(userLat, userLng)) {
    const distToPlace = haversineKm(userLat, userLng, placeLat, placeLng);
    if (distToPlace <= maxWalkKm) {
      return {
        lat: userLat,
        lng: userLng,
        label: "you",
        labelText: "From your location (Prishtina)",
      };
    }
  }

  // GPS outside Kosovo cities (e.g. denied / wrong) — use ITP as project default
  if (!isNearPrizren(userLat, userLng) && !isNearPrishtina(userLat, userLng)) {
    return {
      lat: PRIZREN_ITP.lat,
      lng: PRIZREN_ITP.lng,
      label: "city_center",
      labelText: "From ITP Prizren",
    };
  }

  return {
    lat: userLat,
    lng: userLng,
    label: "you",
    labelText: "From your location",
  };
}

export function cityCenterForPlace(
  placeLat: number,
  placeLng: number
): { lat: number; lng: number; name: string } {
  if (isNearPrizren(placeLat, placeLng)) {
    return { lat: PRIZREN_ITP.lat, lng: PRIZREN_ITP.lng, name: "Prizren" };
  }
  return { lat: PRISHTINA.lat, lng: PRISHTINA.lng, name: "Prishtina" };
}

/** Sharr / Brezovica / Prevalla — winding mountain roads */
export function isMountainArea(lat: number, lng: number): boolean {
  return (
    lat >= 42.08 &&
    lat <= 42.32 &&
    lng >= 20.78 &&
    lng <= 21.05 &&
    !isNearPrishtina(lat, lng) &&
    !isNearPrizren(lat, lng)
  );
}

/** Fix dataset rows tagged Prishtina but located in mountains or Prizren */
export function inferCityFromCoords(
  lat: number,
  lng: number,
  fallback = "Prishtina"
): string {
  if (isNearPrizren(lat, lng)) return "Prizren";
  if (isNearPrishtina(lat, lng)) return "Prishtina";
  if (isMountainArea(lat, lng)) return "Sharr Mountains";
  return fallback;
}

export function resolvePlaceCity(
  storedCity: string | null | undefined,
  lat: number,
  lng: number
): string {
  const inferred = inferCityFromCoords(lat, lng, storedCity || "Prishtina");
  const stored = (storedCity || "").trim();
  if (!stored) return inferred;
  const s = stored.toLowerCase();
  if (s === "prishtina" && inferred !== "Prishtina") return inferred;
  return stored;
}

/** Road distance multiplier: mountains need ~2× vs straight line */
export function getRoadDistanceFactor(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const straight = haversineKm(fromLat, fromLng, toLat, toLng);
  if (straight > 40) return 1.45;
  if (isMountainArea(fromLat, fromLng) || isMountainArea(toLat, toLng)) {
    return 2.35;
  }
  if (straight < 3) return 1.25;
  return 1.35;
}
