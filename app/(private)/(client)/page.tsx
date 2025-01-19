"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowRight, Package, ShoppingBag, TrendingUp } from "lucide-react";
import Link from "next/link";

import { Content } from "@/components/ui/content";
import { StatCardClient } from "@/components/ui/stat-card-client";
import { TimeSeriesChart } from "@/components/ui/time-series-chart";
import { Order, Product, User } from "@/database";
import { formatCents } from "@/utils";

type Stats = {
  user: User;
  spending: { date: string; value: number }[];
  popularProduct: Product | null;
  latestOrder: Order | null;
};

export default function ClientDashboardPage() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ["client-stats"],
    queryFn: async () => {
      const response = await fetch("/api/clients/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
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
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCardClient
            title="Total Spent"
            value={formatCents(stats.user.totalSpentCents)}
            icon={ShoppingBag}
          />
          <StatCardClient
            title="Loyalty Points"
            value={stats.user.unspentLoyaltyPoints}
            icon={TrendingUp}
          />
          <StatCardClient
            title="Total Orders"
            value={stats.user.aggregations.totalOrders}
            icon={Package}
          />
          <StatCardClient
            title="Average Order Value"
            value={formatCents(stats.user.aggregations.averageOrderValue)}
            icon={TrendingUp}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <TimeSeriesChart
            title="Monthly Spending"
            data={stats.spending}
            valueFormatter={formatCents}
          />
          <TimeSeriesChart
            title="Loyalty Points Earned"
            data={stats.spending.map((item) => ({
              date: item.date,
              value: Math.round(item.value / 100), // 1 point per cent spent
            }))}
            valueFormatter={(value) => value.toString()}
          />
        </div>

        {/* Additional Info */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Most Popular Product */}
          {stats.popularProduct && (
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Most Ordered Product
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">
                    {stats.popularProduct.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ordered{" "}
                    {
                      stats.user.aggregations.productOrderCounts[
                        stats.popularProduct.id
                      ]
                    }{" "}
                    times
                  </p>
                </div>
                <Link
                  href={`/productos/${stats.popularProduct.id}`}
                  className="text-primary hover:underline"
                >
                  View Details
                  <ArrowRight className="inline-block ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Latest Viewed Order */}
          {stats.latestOrder && (
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Latest Order
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    Order #{stats.latestOrder.id.slice(-8)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCents(stats.latestOrder.total)} •{" "}
                    {format(
                      new Date(stats.latestOrder.createdAt),
                      "MMM d, yyyy"
                    )}
                  </p>
                </div>
                <Link
                  href={`/ordenes?selectedId=${stats.latestOrder.id}`}
                  className="text-primary hover:underline"
                >
                  View Details
                  <ArrowRight className="inline-block ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Content>
  );
}
