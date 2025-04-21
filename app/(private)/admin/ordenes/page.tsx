"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { SortAsc, SortDesc } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";
import { useIntersectionObserver } from "usehooks-ts";

import { OrdersAdminResponse } from "@/app/api/orders/admin/route";
import { OrderDetail } from "@/components/smart/order-detail";
import { OrderListItem } from "@/components/smart/order-list-item";
import { Button } from "@/components/ui/button";
import { Content } from "@/components/ui/content";
import {
  MultiStatusFilter,
  StatusOption,
} from "@/components/ui/multi-status-filter";
import { Order, OrderStatus } from "@/database";
import { updateOrderStatus } from "@/functions/orders/update-order-status";

const statusOptions: StatusOption[] = [
  { label: "Pagado", value: OrderStatus.Paid },
  {
    label: "Pendiente de aprobación",
    value: OrderStatus.DesignApprovalPending,
  },
  { label: "En progreso", value: OrderStatus.InProgress },
  { label: "Listo para recoger", value: OrderStatus.ReadyToPickUp },
  { label: "En ruta", value: OrderStatus.EnRoute },
  { label: "Entregado", value: OrderStatus.Delivered },
];

const sortOptions = [
  { label: "Fecha", value: "createdAt" },
  { label: "Total", value: "total" },
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { isIntersecting } =
    useIntersectionObserver(loadMoreRef as never) ?? {};

  const selectedId = searchParams.get("selectedId");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const cursor = searchParams.get("cursor");
  const selectedStatuses = searchParams.getAll("status");

  // Separate query for orders list
  const { data: ordersData, isFetching: isLoadingOrders } =
    useQuery<OrdersAdminResponse>({
      queryKey: ["admin-orders", selectedStatuses, sortBy, sortOrder, cursor],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        selectedStatuses.forEach((status) => params.append("status", status));
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);

        const response = await fetch(`/api/orders/admin?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch orders");
        return response.json();
      },
    });

  // Separate query for selected order
  const { data: selectedOrderData } = useQuery({
    queryKey: ["admin-order", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const response = await fetch(
        `/api/orders/admin?selectedId=${selectedId}`
      );
      if (!response.ok) throw new Error("Failed to fetch selected order");
      return response.json();
    },
    enabled: !!selectedId,
  });

  const handleOrderClick = async (order: Order<true>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selectedId", order.id);
    router.replace(`/admin/ordenes?${params.toString()}`, { scroll: false });
  };

  const handleStatusChange = async (
    order: Order<true>,
    newStatus: OrderStatus
  ) => {
    try {
      await updateOrderStatus(order.id, newStatus);
      toast.success("Estado actualizado correctamente");
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Error al actualizar el estado");
    }
  };

  const handleFilterChange = (newStatuses: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status"); // Clear existing statuses

    // Add each selected status
    newStatuses.forEach((status) => {
      params.append("status", status);
    });

    params.delete("cursor"); // Reset cursor when changing filters
    router.replace(`/admin/ordenes?${params.toString()}`, { scroll: false });
  };

  const handleSortChange = (field: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSortBy = params.get("sortBy") || "createdAt";
    const currentSortOrder = params.get("sortOrder") || "desc";

    if (currentSortBy === field) {
      params.set("sortOrder", currentSortOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", field);
      params.set("sortOrder", "desc");
    }
    params.delete("cursor"); // Reset cursor when changing sort
    router.replace(`/admin/ordenes?${params.toString()}`, { scroll: false });
  };

  const handleLoadMore = () => {
    if (ordersData?.nextCursor) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("cursor", ordersData.nextCursor);
      router.replace(`/admin/ordenes?${params.toString()}`, { scroll: false });
    }
  };

  if (isLoadingOrders && !ordersData) {
    return (
      <Content>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Content>
    );
  }

  return (
    <Content title="Órdenes" className="pb-0">
      <div className="flex flex-col md:flex-row  gap-4">
        <div className="w-full md:w-1/2 lg:w-2/5 overflow-hidden flex flex-col">
          <div className="flex gap-2 mb-4">
            <MultiStatusFilter
              statusOptions={statusOptions}
              selectedStatuses={selectedStatuses}
              onStatusChange={handleFilterChange}
            />

            {sortOptions.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                className="gap-2"
                onClick={() => handleSortChange(option.value)}
              >
                {option.label}
                {sortBy === option.value &&
                  (sortOrder === "asc" ? (
                    <SortAsc className="w-4 h-4" />
                  ) : (
                    <SortDesc className="w-4 h-4" />
                  ))}
              </Button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {!!ordersData?.orders.length && (
              <div className="space-y-2">
                <AnimatePresence>
                  {ordersData?.orders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <OrderListItem
                        order={order}
                        isSelected={selectedId === order.id}
                        onClick={handleOrderClick}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={loadMoreRef} className="h-4" />
                {isIntersecting && ordersData?.nextCursor && (
                  <div className="flex justify-center p-4">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={isLoadingOrders}
                    >
                      {isLoadingOrders ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                      ) : (
                        "Cargar más"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!ordersData?.orders.length && !isLoadingOrders && (
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] gap-4">
                <p className="text-muted-foreground">
                  No se encontraron órdenes, intenta cambiando los filtros
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-1/2 lg:w-3/5 h-full overflow-y-auto">
          {selectedOrderData?.selectedOrder && (
            <OrderDetail
              order={selectedOrderData.selectedOrder}
              isAdmin
              onStatusChange={handleStatusChange}
            />
          )}

          {!selectedOrderData?.selectedOrder && !!ordersData?.orders.length && (
            <div className="h-full flex items-center justify-center min-h-[calc(100vh-16rem)]">
              <p className="text-muted-foreground">
                Selecciona una orden para ver sus detalles
              </p>
            </div>
          )}
        </div>
      </div>
    </Content>
  );
}
