"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Package } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "usehooks-ts";

import { Content } from "@/components/ui";
import { Order, OrderStatus } from "@/database";
import { formatCents } from "@/utils";

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { isIntersecting } = useIntersectionObserver(loadMoreRef as any) ?? {};
  const justPaidOrderId = searchParams.get("justPaidOrderId");
  const selectedId = searchParams.get("selectedId");

  const fetchOrders = async (cursor?: string, selectedId?: string) => {
    try {
      const params = new URLSearchParams();
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

  const handleOrderClick = async (order: Order) => {
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

  return (
    <Content>
      <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-4">
        <div className="w-full md:w-1/2 lg:w-2/5 overflow-hidden flex flex-col">
          <h1 className="text-2xl font-bold mb-4">Mis Órdenes</h1>
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
                    className={`
                      cursor-pointer p-4 rounded-lg border transition-colors
                      ${
                        selectedOrder?.id === order.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }
                      ${
                        justPaidOrderId === order.id
                          ? "border-green-500 bg-green-50"
                          : ""
                      }
                    `}
                    onClick={() => handleOrderClick(order)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            Orden #{order.id.slice(-8)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatCents(order.total)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
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
            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-bold mb-6">Detalles de la Orden</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Estado</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedOrder.status === OrderStatus.Paid
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedOrder.status === OrderStatus.Paid
                      ? "Pagado"
                      : "Pendiente"}
                  </span>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Productos</h3>
                  <div className="space-y-4">
                    {selectedOrder.cart.map((item) => (
                      <div
                        key={item.productId}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">
                            {item.productSnapshot.name}
                          </h4>
                          <span className="text-sm">
                            {formatCents(item.totalPrice)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity}
                        </p>
                        {Object.entries(item.options).map(([key, value]) => (
                          <p
                            key={key}
                            className="text-sm text-muted-foreground"
                          >
                            {key}:{" "}
                            {Array.isArray(value) ? value.join("x") : value}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-lg">
                      {formatCents(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              {orders.length > 0
                ? "Selecciona una orden para ver sus detalles"
                : "No tienes órdenes"}
            </div>
          )}
        </div>
      </div>
    </Content>
  );
}
