"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MobileShell } from "@/components/layout/MobileShell";
import { BusinessStatCard } from "@/components/business/BusinessStatCard";
import { AppearancesOverTimeChart } from "@/components/business/AppearancesOverTimeChart";
import type { BusinessVisibilityAnalytics } from "@/lib/business/visibility-analytics";
import { getBusinessVisibilityAnalytics } from "@/lib/business/visibility-analytics";

type StatsResponse = {
  place: { id: string; name: string; city: string; isVerified: boolean } | null;
  visibility?: BusinessVisibilityAnalytics;
};

export default function BusinessDashboardPage() {
  const { data: session } = useSession();

  const { data, isLoading } = useQuery<StatsResponse>({
    queryKey: ["business-stats", session?.user?.id],
    queryFn: async () => {
      const res = await fetch("/api/business/stats");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!session,
    staleTime: 60_000,
  });

  const visibility =
    data?.visibility ??
    getBusinessVisibilityAnalytics({
      businessId: session?.user?.id ?? null,
      placeId: data?.place?.id ?? null,
    });

  if (!session) {
    return (
      <MobileShell>
        <div className="p-6 text-center">
          <Link href="/login" className="btn-primary mt-4 inline-block">
            Sign in
          </Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell title="Your visibility">
      <div className="space-y-4 p-4 pb-8">
        <h1 className="kg-page-title">Your visibility</h1>

        {visibility.isDemoData && (
          <p className="text-xs text-kg-muted">
            Demo metrics — real impression tracking coming soon.
          </p>
        )}

        {isLoading && (
          <p className="text-sm text-kg-muted">Loading analytics…</p>
        )}

        {!isLoading && !data?.place && (
          <div className="kg-card-pad">
            <p className="text-sm text-kg-muted">No listing yet.</p>
            <Link
              href="/business/onboard"
              className="btn-primary mt-4 block text-center"
            >
              Onboard your business
            </Link>
          </div>
        )}

        {!isLoading && (
          <>
            <div className="space-y-3">
              <BusinessStatCard
                icon="📊"
                label="Times shown in plans"
                value={visibility.summary.timesShownInPlans.value}
                changeLabel={visibility.summary.timesShownInPlans.changeLabel}
              />
              <BusinessStatCard
                icon="👁"
                label="Profile views"
                value={visibility.summary.profileViews.value}
                changeLabel={visibility.summary.profileViews.changeLabel}
              />
              <BusinessStatCard
                icon="✨"
                label="This week"
                value={visibility.summary.thisWeek.value}
                subtitle={visibility.summary.thisWeek.subtitle}
              />
            </div>

            <AppearancesOverTimeChart
              weekly={visibility.chart.weekly}
              monthly={visibility.chart.monthly}
            />

            {data?.place && (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href={`/place/${data.place.id}`}
                  className="text-center text-sm font-medium text-kg-primary underline"
                >
                  View public listing →
                </Link>
                <Link
                  href="/business/onboard"
                  className="text-center text-xs text-kg-muted underline"
                >
                  Update listing
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </MobileShell>
  );
}
