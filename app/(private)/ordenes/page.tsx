"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "usehooks-ts";

import { OrderDetail } from "@/components/smart/order-detail";
import { OrderListItem } from "@/components/smart/order-list-item";
import { Content } from "@/components/ui/content";
import { Order } from "@/database";
import { OrderGroup } from "@/app/api/orders/route";

export default function OrdersPage() {
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

  const justPaidOrderId = searchParams.get("justPaidOrderId");
  const selectedId = searchParams.get("selectedId");
  const fetchOrders = async (cursor?: string, selectedId?: string) => {
    try {
      const params = new URLSearchParams();
      params.set("group", OrderGroup.Enum.active);
      if (cursor) params.set("cursor", cursor);
      if (selectedId) params.set("selectedId", selectedId);

      const response = await fetch(`/api/orders?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      const data = await fetchOrders(
        undefined,
        selectedId || justPaidOrderId || undefined
      );

      if (data) {
        setOrders(data.orders);
        setNextCursor(data.nextCursor);
        setSelectedOrder(data.selectedOrder);
      }
      setIsLoading(false);
    };

    init();
  }, [justPaidOrderId, selectedId]);

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
  }, [isIntersecting, nextCursor, isFetchingMore]);

  const handleOrderClick = async (order: Order<true>) => {
    setSelectedOrder(order);
    router.replace(`/ordenes?selectedId=${order.id}`, { scroll: false });
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

  if (orders.length === 0) {
    return (
      <Content>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] gap-4">
          <p className="text-lg text-muted-foreground">No tienes órdenes</p>
          <a href="/productos" className="text-primary hover:underline">
            Ver productos
          </a>
        </div>
      </Content>
    );
  }

  return (
    <Content className="pb-0">
      <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-4">
        <div className="w-full md:w-1/2 lg:w-2/5 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2">
              <AnimatePresence>
                {orders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={
                      justPaidOrderId === order.id
                        ? { scale: 0.95, opacity: 0 }
                        : false
                    }
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <OrderListItem
                      order={order}
                      isSelected={selectedOrder?.id === order.id}
                      justPaid={justPaidOrderId === order.id}
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
            <OrderDetail order={selectedOrder} />
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
