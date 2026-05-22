import { parseDatasetJson } from "@/lib/dataset";

export type OpeningHours = Record<
  string,
  { open: string; close: string } | null
>;

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function formatGoogleTime(t: string): string {
  const s = String(t).replace(/\D/g, "").padStart(4, "0");
  return `${s.slice(0, 2)}:${s.slice(2)}`;
}

function isAppOpeningHours(obj: Record<string, unknown>): boolean {
  return DAY_KEYS.some((d) => {
    const v = obj[d];
    return (
      v === null ||
      (typeof v === "object" &&
        v !== null &&
        "open" in v &&
        "close" in v)
    );
  });
}

/** Normalize stored opening_hours (app JSON or Google Places) for isOpenNow(). */
export function normalizeOpeningHours(
  raw: string | OpeningHours | Record<string, unknown> | null | undefined
): OpeningHours | null {
  if (!raw) return null;

  let obj: Record<string, unknown>;
  if (typeof raw === "string") {
    obj = parseDatasetJson<Record<string, unknown>>(raw, {});
    if (!Object.keys(obj).length) return null;
  } else {
    obj = raw as Record<string, unknown>;
  }

  if (isAppOpeningHours(obj)) {
    return obj as OpeningHours;
  }

  const periods = obj.periods as
    | { open: { day: number; time: string }; close?: { day: number; time: string } }[]
    | undefined;

  if (!Array.isArray(periods) || periods.length === 0) {
    if (typeof obj.open_now === "boolean") return null;
    return null;
  }

  const hours: OpeningHours = {};
  for (const p of periods) {
    if (!p?.open || !p.close) continue;
    const key = DAY_KEYS[p.open.day];
    if (!key || hours[key]) continue;
    hours[key] = {
      open: formatGoogleTime(p.open.time),
      close: formatGoogleTime(p.close.time),
    };
  }

  return Object.keys(hours).length ? hours : null;
}

const WEEKDAY_TO_KEY: Record<string, (typeof DAY_KEYS)[number]> = {
  sunday: "sun",
  monday: "mon",
  tuesday: "tue",
  wednesday: "wed",
  thursday: "thu",
  friday: "fri",
  saturday: "sat",
};

function parse12hToken(h: number, m: number, ampm: string): string {
  let hour = h;
  if (ampm.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Google weekday_text lines, e.g. "Monday: 7:00 AM – 11:00 PM" */
export function openHoursFromWeekdayText(lines: string[]): OpeningHours | null {
  const hours: OpeningHours = {};
  const timeRe =
    /(\d{1,2}):(\d{2})\s*(AM|PM)\s*[\u2013\u2014–-]?\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i;

  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const dayName = line.slice(0, idx).trim().toLowerCase();
    const rest = line.slice(idx + 1).trim();
    const key = WEEKDAY_TO_KEY[dayName];
    if (!key) continue;

    if (/closed/i.test(rest)) {
      hours[key] = null;
      continue;
    }

    const m = rest.match(timeRe);
    if (!m) continue;
    hours[key] = {
      open: parse12hToken(Number(m[1]), Number(m[2]), m[3]),
      close: parse12hToken(Number(m[4]), Number(m[5]), m[6]),
    };
  }

  return Object.keys(hours).length ? hours : null;
}
