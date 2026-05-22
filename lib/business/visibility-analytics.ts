/**
 * Business visibility analytics — single source for dashboard cards + chart.
 * DEMO / PLACEHOLDER: not wired to real impression tracking yet.
 * Swap `getBusinessVisibilityAnalytics` implementation when analytics DB exists.
 */

export type MetricWithChange = {
  value: number;
  changePercent: number;
  changeLabel: string;
};

export type ChartPoint = {
  label: string;
  shownInPlans: number;
  profileViews: number;
};

export type BusinessVisibilityAnalytics = {
  businessId: string | null;
  placeId: string | null;
  /** Demo placeholder — replace with tracked metrics */
  isDemoData: boolean;
  summary: {
    timesShownInPlans: MetricWithChange;
    profileViews: MetricWithChange;
    thisWeek: { value: number; subtitle: string };
  };
  chart: {
    weekly: ChartPoint[];
    monthly: ChartPoint[];
  };
};

/** Default metrics matching the KosovoGo visibility mockup */
export const DEMO_VISIBILITY_ANALYTICS: BusinessVisibilityAnalytics = {
  businessId: null,
  placeId: null,
  isDemoData: true,
  summary: {
    timesShownInPlans: {
      value: 1248,
      changePercent: 12,
      changeLabel: "+12% from last month",
    },
    profileViews: {
      value: 892,
      changePercent: 5,
      changeLabel: "+5% from last month",
    },
    thisWeek: {
      value: 345,
      subtitle: "Total interactions",
    },
  },
  chart: {
    weekly: [
      { label: "Mon", shownInPlans: 42, profileViews: 28 },
      { label: "Tue", shownInPlans: 55, profileViews: 35 },
      { label: "Wed", shownInPlans: 48, profileViews: 40 },
      { label: "Thu", shownInPlans: 62, profileViews: 38 },
      { label: "Fri", shownInPlans: 78, profileViews: 52 },
      { label: "Sat", shownInPlans: 95, profileViews: 68 },
      { label: "Sun", shownInPlans: 88, profileViews: 61 },
    ],
    monthly: [
      { label: "Jan", shownInPlans: 820, profileViews: 540 },
      { label: "Feb", shownInPlans: 910, profileViews: 610 },
      { label: "Mar", shownInPlans: 980, profileViews: 650 },
      { label: "Apr", shownInPlans: 1050, profileViews: 720 },
      { label: "May", shownInPlans: 1120, profileViews: 780 },
      { label: "Jun", shownInPlans: 1248, profileViews: 892 },
    ],
  },
};

export function getBusinessVisibilityAnalytics(options: {
  businessId?: string | null;
  placeId?: string | null;
  /** Optional partial overrides from API (still demo until real tracking) */
  partial?: Partial<{
    timesShownInPlans: number;
    profileViews: number;
    thisWeekInteractions: number;
  }>;
}): BusinessVisibilityAnalytics {
  const base = structuredClone(DEMO_VISIBILITY_ANALYTICS);
  base.businessId = options.businessId ?? null;
  base.placeId = options.placeId ?? null;

  if (options.partial?.timesShownInPlans != null) {
    base.summary.timesShownInPlans.value = options.partial.timesShownInPlans;
  }
  if (options.partial?.profileViews != null) {
    base.summary.profileViews.value = options.partial.profileViews;
  }
  if (options.partial?.thisWeekInteractions != null) {
    base.summary.thisWeek.value = options.partial.thisWeekInteractions;
  }

  return base;
}
