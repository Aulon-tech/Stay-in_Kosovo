import { haversineKm } from "@/lib/utils";

export type TransportOption = {
  mode: "WALK" | "BUS" | "TAXI" | "BIKE";
  durationMin: number;
  distanceKm: number;
  cost: number;
  label: string;
};

const SPEEDS: Record<string, number> = {
  WALK: 5,
  BUS: 25,
  TAXI: 40,
  BIKE: 15,
};

export function calculateTransportOptions(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): TransportOption[] {
  const distanceKm = haversineKm(fromLat, fromLng, toLat, toLng);
  const modes: Array<"WALK" | "BUS" | "TAXI" | "BIKE"> = [
    "WALK",
    "BUS",
    "TAXI",
    "BIKE",
  ];

  return modes.map((mode) => {
    const speed = SPEEDS[mode];
    const durationMin = Math.max(1, Math.round((distanceKm / speed) * 60));
    let cost = 0;
    if (mode === "BUS") cost = 0.5;
    if (mode === "TAXI") cost = Math.round(distanceKm * 0.5 * 100) / 100;
    const labels: Record<string, string> = {
      WALK: `Walk ${durationMin} min`,
      BUS: `Bus ${durationMin} min · €${cost.toFixed(2)}`,
      TAXI: `Taxi ${durationMin} min · €${cost.toFixed(2)}`,
      BIKE: `Bike ${durationMin} min`,
    };
    return {
      mode,
      durationMin,
      distanceKm: Math.round(distanceKm * 100) / 100,
      cost,
      label: labels[mode],
    };
  });
}
