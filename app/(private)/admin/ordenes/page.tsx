"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Filter, SortAsc, SortDesc } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useIntersectionObserver } from "usehooks-ts";

import { OrderDetail } from "@/components/smart/order-detail";
import { OrderListItem } from "@/components/smart/order-list-item";
import { Button } from "@/components/ui/button";
import { Content } from "@/components/ui/content";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Order, OrderStatus } from "@/database";
import { updateOrderStatus } from "@/functions/orders/update-order-status";

const statusOptions = [
  { label: "Todos", value: "" },
  { label: "Pagado", value: OrderStatus.Paid },
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
  const [orders, setOrders] = useState<Order<true>[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order<true> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { isIntersecting } =
    useIntersectionObserver(loadMoreRef as never) ?? {};

  const selectedId = searchParams.get("selectedId");
  const status = searchParams.get("status") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const fetchOrders = useCallback(
    async (cursor?: string) => {
      try {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        if (selectedId) params.set("selectedId", selectedId);
        if (status) params.set("status", status);
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);

        const response = await fetch(`/api/orders/admin?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch orders");

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching orders:", error);
        return null;
      }
    },
    [selectedId, sortBy, sortOrder, status]
  );

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const data = await fetchOrders();

      if (data) {
        setOrders(data.orders);
        setNextCursor(data.nextCursor);
        setSelectedOrder(data.selectedOrder);
      }
      setIsLoading(false);
    };

    init();
  }, [selectedId, status, sortBy, sortOrder, fetchOrders]);

  useEffect(() => {
    if (isIntersecting && nextCursor && !isFetchingMore) {
      const loadMore = async () => {
        setIsFetchingMore(true);
        const data = await fetchOrders(nextCursor);
        if (data) {
          setOrders((prev) => [...prev, ...data.orders]);
          setNextCursor(data.nextCursor);
        }
        setIsFetchingMore(false);
      };

      loadMore();
    }
  }, [isIntersecting, nextCursor, isFetchingMore, fetchOrders]);

  const handleOrderClick = async (order: Order<true>) => {
    setSelectedOrder(order);
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
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === order.id ? { ...o, status: newStatus } : o
        )
      );
      if (selectedOrder?.id === order.id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      toast.success("Estado actualizado correctamente");
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Error al actualizar el estado");
    }
  };

  const handleFilterChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newStatus) {
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }
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

    router.replace(`/admin/ordenes?${params.toString()}`, { scroll: false });
  };

  if (isLoading) {
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
      <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-4">
        <div className="w-full md:w-1/2 lg:w-2/5 overflow-hidden flex flex-col">
          <div className="flex gap-2 mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {statusOptions.find((opt) => opt.value === status)?.label ||
                    "Estado"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {statusOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => handleFilterChange(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

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
            <div className="space-y-2">
              <AnimatePresence>
                {orders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <OrderListItem
                      order={order}
                      isSelected={selectedOrder?.id === order.id}
                      onClick={handleOrderClick}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={loadMoreRef} className="h-4" />
              {isFetchingMore && (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 lg:w-3/5 h-full overflow-y-auto">
          {selectedOrder ? (
            <OrderDetail
              order={selectedOrder}
              isAdmin
              onStatusChange={handleStatusChange}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-lg text-muted-foreground">
                Selecciona una orden para ver sus detalles
              </p>
            </div>
          )}
        </div>
      </div>
    </Content>
  );
}
