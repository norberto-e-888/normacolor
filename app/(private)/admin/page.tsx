"use client";

import { useQuery } from "@tanstack/react-query";

import { Content } from "@/components/ui/content";
import { StatCard } from "@/components/ui/stat-card";
import { TimeSeriesChart } from "@/components/ui/time-series-chart";
import { formatCents } from "@/utils";

type Stats = {
  totalUsers: number;
  signUps: { date: string; value: number }[];
  income: { date: string; value: number }[];
  signUpsTrend?: number;
  incomeTrend?: number;
};

export default function AdminDashboardPage() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const response = await fetch("/api/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    refetchInterval: 60_000,
  });

  if (!stats) {
    return (
      <Content>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Content>
    );
  }

  return (
    <Content>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            trend={stats.signUpsTrend}
          />
          <StatCard
            title="Monthly Income"
            value={formatCents(
              stats.income[stats.income.length - 1]?.value || 0
            )}
            trend={stats.incomeTrend}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TimeSeriesChart
            title="User Sign Ups"
            data={stats.signUps}
            valueFormatter={(value) => value.toString()}
          />
          <TimeSeriesChart
            title="Income"
            data={stats.income}
            valueFormatter={formatCents}
          />
        </div>
      </div>
    </Content>
  );
}
