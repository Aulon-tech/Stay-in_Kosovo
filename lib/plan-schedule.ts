import type { BuiltPlan } from "@/lib/ai/types";

export type PlanScheduleInput = {
  planDate?: string;
  startTime?: string;
};

export type ResolvedPlanSchedule = {
  planDate: string;
  startTime: string;
  startHour24: number;
  startMinute: number;
};

export function defaultPlanDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function defaultPlanStartTime(): string {
  return "10:00";
}

export function normalizePlanSchedule(
  input?: PlanScheduleInput
): ResolvedPlanSchedule {
  const planDate =
    input?.planDate && /^\d{4}-\d{2}-\d{2}$/.test(input.planDate)
      ? input.planDate
      : defaultPlanDate();
  let startTime = defaultPlanStartTime();
  if (input?.startTime) {
    const m = input.startTime.match(/^(\d{1,2}):(\d{2})$/);
    if (m) {
      const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
      const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
      startTime = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }
  }
  const [hRaw, mRaw] = startTime.split(":").map((x) => parseInt(x, 10));
  const startHour24 = Number.isFinite(hRaw)
    ? Math.min(23, Math.max(0, hRaw))
    : 10;
  const startMinute = Number.isFinite(mRaw)
    ? Math.min(59, Math.max(0, mRaw))
    : 0;
  return {
    planDate,
    startTime: `${String(startHour24).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`,
    startHour24,
    startMinute,
  };
}

export function formatArrival12h(hour24: number, minute: number): string {
  const period = hour24 >= 12 ? "PM" : "AM";
  const h12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${h12}:${String(minute).padStart(2, "0")} ${period}`;
}

export function formatStartLabel(schedule: ResolvedPlanSchedule): string {
  return `${formatArrival12h(schedule.startHour24, schedule.startMinute)} on ${formatPlanDateLabel(schedule.planDate)}`;
}

export function formatScheduleSummary(
  planDate: string,
  startTime: string
): string {
  const s = normalizePlanSchedule({ planDate, startTime });
  return `${formatPlanDateLabel(s.planDate)} · starts ${formatArrival12h(s.startHour24, s.startMinute)}`;
}

export function formatPlanDateLabel(planDate: string): string {
  const d = new Date(`${planDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return planDate;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** ISO datetime for Prisma itinerary.date (local date + time from user). */
export function toItineraryDateIso(
  planDate: string,
  startTime: string
): string {
  return new Date(`${planDate}T${startTime}:00`).toISOString();
}

export function scheduleFromItineraryDate(
  date: string | Date | null | undefined
): ResolvedPlanSchedule | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  const planDate = d.toISOString().slice(0, 10);
  const startTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return normalizePlanSchedule({ planDate, startTime });
}

export function restaggerBuiltPlan(
  plan: BuiltPlan,
  startHour24: number,
  startMinute: number
): BuiltPlan {
  let h = startHour24;
  let m = startMinute;
  const stops = plan.stops.map((s, i) => {
    const arrival = formatArrival12h(h, m);
    const stay = s.stay_minutes || 60;
    const transit = i > 0 ? 12 : 0;
    m += transit;
    if (m >= 60) {
      h += Math.floor(m / 60);
      m %= 60;
    }
    const out = { ...s, arrival_time: arrival };
    m += stay;
    if (m >= 60) {
      h += Math.floor(m / 60);
      m %= 60;
    }
    return out;
  });
  return { ...plan, stops };
}
