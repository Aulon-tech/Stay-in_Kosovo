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
  /** Set when walking is not realistic for this leg */
  walkNotRecommended?: string;
};

/** Options that can actually be used for a leg (excludes "too far to walk" placeholders). */
export function viableTransportOptions(
  options: TransportOption[]
): TransportOption[] {
  return options.filter((o) => o.durationMin > 0);
}

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

/** Prishtina-style urban taxi (€2.50 start + ~€0.90/km). */
function taxiFareEur(roadKm: number, mountain: boolean): number {
  const base = mountain ? 3.5 : 2.5;
  const perKm = mountain ? 1.15 : 0.9;
  const fare = base + roadKm * perKm;
  return Math.round(Math.max(base, fare) * 100) / 100;
}

/** Local bus ~€0.40–0.80; longer / inter-city legs cost more. */
function busFareEur(
  roadKm: number,
  interCity: boolean,
  mountain: boolean
): number {
  if (interCity && !mountain) {
    return Math.max(4, Math.round(roadKm * 0.12 * 100) / 100);
  }
  if (mountain) return 0.8;
  if (roadKm <= 2) return 0.4;
  if (roadKm <= 6) return 0.5;
  return 0.8;
}

export function formatTransportPrice(mode: TransportOption["mode"], cost: number): string {
  if (mode === "WALK") return "Free";
  return `~€${cost.toFixed(2)}`;
}

/** Walk / bus / taxi estimates for one leg (for itinerary UI). */
export function getLegTransportComparison(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): {
  roadDistanceKm: number;
  walk: TransportOption;
  bus: TransportOption;
  taxi: TransportOption;
  walkTooFar: boolean;
} {
  const result = calculateTransportOptions(fromLat, fromLng, toLat, toLng);
  const roadKm = result.roadDistanceKm;
  const walkTooFar = roadKm > MAX_WALK_KM;

  const bus =
    result.options.find((o) => o.mode === "BUS") ??
    ({
      mode: "BUS",
      durationMin: 5,
      distanceKm: result.straightLineKm,
      roadDistanceKm: roadKm,
      cost: busFareEur(roadKm, false, false),
      label: "Bus",
    } as TransportOption);

  const taxi =
    result.options.find((o) => o.mode === "TAXI") ??
    ({
      mode: "TAXI",
      durationMin: 5,
      distanceKm: result.straightLineKm,
      roadDistanceKm: roadKm,
      cost: taxiFareEur(roadKm, false),
      label: "Taxi",
    } as TransportOption);

  const walkFromCalc = result.options.find((o) => o.mode === "WALK");
  const walk: TransportOption = walkFromCalc ?? {
    mode: "WALK",
    durationMin: Math.max(1, Math.round((roadKm / 4.5) * 60)),
    distanceKm: result.straightLineKm,
    roadDistanceKm: roadKm,
    cost: 0,
    label: "Walk",
  };

  return {
    roadDistanceKm: roadKm,
    walkTooFar,
    walk: { ...walk, cost: 0 },
    bus,
    taxi,
  };
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
      if (mode === "BUS") {
        cost = busFareEur(roadDistanceKm, interCity, mountain);
      }
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
        label = `Bus ~${durationMin} min · ~€${cost.toFixed(2)}`;
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

  const walkNotRecommended =
    roadDistanceKm > MAX_WALK_KM
      ? `Too far to walk (~${roadDistanceKm} km by road)`
      : undefined;

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
    walkNotRecommended,
  };
}

/** Pick a real transport option; never returns 0-min walk placeholders. */
export function pickTransportOption(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  preferredMode?: string | null
): TransportOption {
  const result = calculateTransportOptions(fromLat, fromLng, toLat, toLng);
  const viable = viableTransportOptions(result.options);
  if (!viable.length) {
    return {
      mode: "TAXI",
      durationMin: Math.max(5, Math.round(result.roadDistanceKm * 3)),
      distanceKm: result.straightLineKm,
      roadDistanceKm: result.roadDistanceKm,
      cost: taxiFareEur(result.roadDistanceKm, false),
      label: "Taxi",
      recommended: true,
    };
  }

  const want = preferredMode?.toUpperCase() as TransportOption["mode"] | undefined;
  if (want) {
    const match = viable.find((o) => o.mode === want);
    if (match) return match;
  }

  return (
    viable.find((o) => o.recommended) ||
    viable.find((o) => o.mode === "TAXI") ||
    viable.find((o) => o.mode === "BUS") ||
    viable[0]
  );
}

export function inferLegTransportMode(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): TransportOption["mode"] {
  return pickTransportOption(fromLat, fromLng, toLat, toLng).mode;
}

export function getTransitLegSubtitle(
  pick: TransportOption,
  roadDistanceKm: number
): string {
  if (pick.mode === "WALK") {
    if (roadDistanceKm <= 0.8) return "Short stroll nearby";
    if (roadDistanceKm <= 1.5) return "Scenic stroll through the center";
    return `Walk ~${pick.durationMin} min · ~${roadDistanceKm} km`;
  }
  if (pick.mode === "TAXI") {
    return `~${roadDistanceKm} km · taxi ride`;
  }
  if (pick.mode === "BUS") {
    return `~${roadDistanceKm} km · local bus`;
  }
  if (pick.mode === "BIKE") {
    return `~${roadDistanceKm} km · bike`;
  }
  return pick.label;
}
