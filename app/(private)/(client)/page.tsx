"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowRight, Package, ShoppingBag, TrendingUp } from "lucide-react";
import Link from "next/link";

import { Content } from "@/components/ui/content";
import { StatCardClient } from "@/components/ui/stat-card-client";
import { TimeSeriesChart } from "@/components/ui/time-series-chart";
import { Order, Product, User } from "@/database";
import { formatCents, formatNumber } from "@/utils";

type Stats = {
  user: User;
  spending: { date: string; value: number }[];
  lpSpent: { date: string; value: number }[];
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
            title="Compra Total"
            value={formatCents(stats.user.totalSpentCents)}
            icon={ShoppingBag}
          />
          <StatCardClient
            title="Balance de Puntos NC"
            value={formatNumber(stats.user.unspentLoyaltyPoints)}
            icon={TrendingUp}
          />
          <StatCardClient
            title="Órdenes Totales"
            value={stats.user.aggregations.totalOrders}
            icon={Package}
          />
          <StatCardClient
            title="Valor Promedio de Órdenes"
            value={formatCents(stats.user.aggregations.averageOrderValue)}
            icon={TrendingUp}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <TimeSeriesChart
            title="Gasto Mensual"
            data={stats.spending}
            valueFormatter={formatCents}
          />
          <TimeSeriesChart
            title="Uso de Puntos NC"
            data={stats.lpSpent}
            valueFormatter={(value) => value.toString()}
          />
        </div>

        {/* Additional Info */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Most Popular Product */}
          {stats.popularProduct && (
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Mi Producto Favorito
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">
                    {stats.popularProduct.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ordenado{" "}
                    {
                      stats.user.aggregations.productOrderCounts[
                        stats.popularProduct.id
                      ]
                    }{" "}
                    {stats.user.aggregations.productOrderCounts[
                      stats.popularProduct.id
                    ] === 1
                      ? "vez"
                      : "veces"}{" "}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Latest Viewed Order */}
          {stats.latestOrder && (
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Última Orden Realizada
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
                  Ver
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
