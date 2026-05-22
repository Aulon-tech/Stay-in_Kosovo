import { haversineKm, PRISHTINA, PRIZREN_ITP } from "@/lib/utils";

/** KosovoGo is a Prishtina-only experience (map default center stays at ITP coords). */
export const APP_CITY = "Prishtina";

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
      labelText: "From map start point",
    };
  }

  if (isNearPrizren(userLat, userLng)) {
    return {
      lat: userLat,
      lng: userLng,
      label: "you",
      labelText: "From your location",
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
      labelText: "From map start point",
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
  return { lat: PRISHTINA.lat, lng: PRISHTINA.lng, name: APP_CITY };
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

/** Display city for KosovoGo (Prishtina-only; map may center on ITP coords). */
export function inferCityFromCoords(
  lat: number,
  lng: number,
  fallback = APP_CITY
): string {
  if (isMountainArea(lat, lng)) return "Germia & outskirts";
  return fallback;
}

export function isPrishtinaAppPlace(
  storedCity: string | null | undefined,
  lat: number,
  lng: number
): boolean {
  const c = (storedCity || "").toLowerCase();
  if (c.includes("prizren")) return false;
  if (isNearPrizren(lat, lng) && !isNearPrishtina(lat, lng)) return false;
  return true;
}

export function resolvePlaceCity(
  storedCity: string | null | undefined,
  lat: number,
  lng: number
): string {
  const stored = (storedCity || "").trim();
  if (stored.toLowerCase().includes("prizren")) return APP_CITY;
  if (!stored) return inferCityFromCoords(lat, lng);
  const s = stored.toLowerCase();
  if (s === "prishtina" || s === "pristina") return APP_CITY;
  if (isMountainArea(lat, lng)) return inferCityFromCoords(lat, lng);
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
