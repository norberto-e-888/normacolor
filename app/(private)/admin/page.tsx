"use client";

import { useQuery } from "@tanstack/react-query";

import { Content } from "@/components/ui/content";
import { StatCardAdmin } from "@/components/ui/stat-card-admin";
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

  const now = new Date();
  const currentMonth = now.toLocaleString("es", { month: "long" });
  const currentYear = now.getFullYear();
  const monthlyIncomeTitle = `Ingreso ${currentMonth} ${currentYear}`;

  return (
    <Content>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <StatCardAdmin
            title="Usuarios"
            value={stats.totalUsers}
            trend={stats.signUpsTrend}
          />
          <StatCardAdmin
            title={monthlyIncomeTitle}
            value={formatCents(
              stats.income[stats.income.length - 1]?.value || 0
            )}
            trend={stats.incomeTrend}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TimeSeriesChart
            title="Nuevos Registros"
            data={stats.signUps}
            valueFormatter={(value) => value.toString()}
          />
          <TimeSeriesChart
            title="Ingreso"
            data={stats.income}
            valueFormatter={formatCents}
          />
        </div>
      </div>
    </Content>
  );
}
