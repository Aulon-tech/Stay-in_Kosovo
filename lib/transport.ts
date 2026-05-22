import { haversineKm } from "@/lib/utils";
import {
  getRoadDistanceFactor,
  isMountainArea,
  resolveTransportOrigin,
} from "@/lib/geo";

export type TransportOption = {
  mode: "WALK" | "BUS" | "TAXI" | "BIKE";
  durationMin: number;
  distanceKm: number;
  roadDistanceKm: number;
  cost: number;
  label: string;
  recommended?: boolean;
};

export type TransportResult = {
  options: TransportOption[];
  originLabel: string;
  originType: "you" | "city_center";
  straightLineKm: number;
  roadDistanceKm: number;
  roadFactor: number;
  isEstimate: boolean;
};

const SPEEDS_URBAN_KMH: Record<TransportOption["mode"], number> = {
  WALK: 4.5,
  BUS: 18,
  TAXI: 28,
  BIKE: 12,
};

const SPEEDS_INTERCITY_KMH: Record<TransportOption["mode"], number> = {
  WALK: 4.5,
  BUS: 55,
  TAXI: 70,
  BIKE: 12,
};

const SPEEDS_MOUNTAIN_KMH: Record<TransportOption["mode"], number> = {
  WALK: 3.5,
  BUS: 35,
  TAXI: 38,
  BIKE: 10,
};

const INTERCITY_ROAD_KM = 50;
const MAX_WALK_KM = 2.5;
const MAX_WALK_MIN = 45;

function taxiFareEur(roadKm: number, mountain: boolean): number {
  const base = mountain ? 3 : 2;
  const perKm = mountain ? 1.1 : 0.85;
  return Math.round((base + roadKm * perKm) * 100) / 100;
}

function busFareEur(): number {
  return 0.5;
}

export function calculateTransportOptions(
  userLat: number,
  userLng: number,
  toLat: number,
  toLng: number
): TransportResult {
  const origin = resolveTransportOrigin(userLat, userLng, toLat, toLng);
  const straightLineKm = haversineKm(origin.lat, origin.lng, toLat, toLng);
  const roadFactor = getRoadDistanceFactor(
    origin.lat,
    origin.lng,
    toLat,
    toLng
  );
  const roadDistanceKm =
    Math.round(straightLineKm * roadFactor * 100) / 100;

  const mountain =
    isMountainArea(toLat, toLng) || isMountainArea(origin.lat, origin.lng);
  const interCity = roadDistanceKm > INTERCITY_ROAD_KM && !mountain;
  const speeds = mountain
    ? SPEEDS_MOUNTAIN_KMH
    : interCity
      ? SPEEDS_INTERCITY_KMH
      : SPEEDS_URBAN_KMH;

  const modes: TransportOption["mode"][] = ["WALK", "BUS", "TAXI", "BIKE"];

  const options: TransportOption[] = modes
    .filter((mode) => mode !== "WALK" || roadDistanceKm <= MAX_WALK_KM)
    .map((mode) => {
      const speed = speeds[mode];
      const durationMin = Math.max(
        1,
        Math.round((roadDistanceKm / speed) * 60)
      );
      let cost = 0;
      if (mode === "BUS") cost = busFareEur();
      if (mode === "TAXI") {
        cost =
          interCity && !mountain
            ? Math.round((25 + roadDistanceKm * 0.75) * 100) / 100
            : taxiFareEur(roadDistanceKm, mountain);
      }

      let label: string;
      if (mode === "WALK" && durationMin > MAX_WALK_MIN) {
        label = `Walk ~${durationMin} min`;
      } else if (mode === "BUS") {
        cost =
          interCity && !mountain
            ? Math.max(4, Math.round(roadDistanceKm * 0.12 * 100) / 100)
            : cost;
        label =
          interCity && !mountain
            ? `Bus ~${durationMin} min · ~€${cost.toFixed(2)}`
            : `Bus ~${durationMin} min · ~€${cost.toFixed(2)}`;
      } else if (mode === "TAXI") {
        label = `Taxi ~${durationMin} min · ~€${cost.toFixed(2)}`;
      } else if (mode === "BIKE") {
        label = `Bike ~${durationMin} min`;
      } else {
        label = `Walk ${durationMin} min`;
      }

      return {
        mode,
        durationMin,
        distanceKm: straightLineKm,
        roadDistanceKm,
        cost,
        label,
      };
    });

  if (roadDistanceKm > MAX_WALK_KM) {
    options.unshift({
      mode: "WALK",
      durationMin: 0,
      distanceKm: straightLineKm,
      roadDistanceKm,
      cost: 0,
      label: `Too far to walk (~${roadDistanceKm} km by road)`,
    });
  }

  const recommended =
    roadDistanceKm <= 1.2
      ? "WALK"
      : mountain || roadDistanceKm > 8
        ? "TAXI"
        : "BUS";

  for (const o of options) {
    o.recommended = o.mode === recommended;
  }

  return {
    options,
    originLabel: origin.labelText,
    originType: origin.label,
    straightLineKm: Math.round(straightLineKm * 100) / 100,
    roadDistanceKm,
    roadFactor,
    isEstimate: true,
  };
}
