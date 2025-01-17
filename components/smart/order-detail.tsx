"use client";

import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArtSource, Order, OrderArt, OrderStatus } from "@/database";
import { downloadArt } from "@/functions/art";
import { formatCents } from "@/utils";

import { FreepikImage } from "./freepik-image";
import { OrderChat } from "./order-chat";
import { S3Image } from "./s3-image";

const statusOptions = [
  { label: "En progreso", value: OrderStatus.InProgress },
  { label: "Listo para recoger", value: OrderStatus.ReadyToPickUp },
  { label: "En ruta", value: OrderStatus.EnRoute },
  { label: "Entregado", value: OrderStatus.Delivered },
];

const getStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.Paid:
      return "Pagado";
    case OrderStatus.InProgress:
      return "En progreso";
    case OrderStatus.ReadyToPickUp:
      return "Listo para recoger";
    case OrderStatus.EnRoute:
      return "En ruta";
    case OrderStatus.Delivered:
      return "Entregado";
    default:
      return status;
  }
};

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.Paid:
      return "bg-yellow-100 text-yellow-800";
    case OrderStatus.InProgress:
      return "bg-blue-100 text-blue-800";
    case OrderStatus.ReadyToPickUp:
      return "bg-purple-100 text-purple-800";
    case OrderStatus.EnRoute:
      return "bg-orange-100 text-orange-800";
    case OrderStatus.Delivered:
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

interface OrderDetailProps {
  order: Order<true>;
  isAdmin?: boolean;
  onStatusChange?: (order: Order<true>, status: OrderStatus) => Promise<void>;
}

export function OrderDetail({
  order,
  isAdmin,
  onStatusChange,
}: OrderDetailProps) {
  const searchParams = useSearchParams();
  const selectedItemId = searchParams.get("selectedItemId");
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const canChangeStatus = isAdmin && order.status !== OrderStatus.Delivered;
  const handleDownloadArt = async (
    orderId: string,
    itemId: string,
    art: OrderArt
  ) => {
    try {
      let url: string;

      if (art.source === ArtSource.Freepik) {
        const response = await downloadArt(parseInt(art.value));
        url = response.url;
      } else {
        const response = await fetch(
          `/api/orders/${orderId}/items/${itemId}/art`
        );
        if (!response.ok) throw new Error("Failed to get download URL");
        const data = await response.json();
        url = data.url;
      }

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = `${
        art.source === ArtSource.Freepik ? "template" : "design"
      }-${itemId}.psd`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Descarga iniciada");
    } catch (error) {
      console.error("Error downloading art:", error);
      toast.error("Error al descargar el arte");
    }
  };

  useEffect(() => {
    if (selectedItemId && itemRefs.current[selectedItemId]) {
      console.log({ selectedItemId, ref: itemRefs.current[selectedItemId] });
      // Scroll to the item
      itemRefs.current[selectedItemId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Add highlight animation
      const element = itemRefs.current[selectedItemId];
      element?.classList.add("highlight-pulse");

      // Remove the animation class after it completes
      const timer = setTimeout(() => {
        element?.classList.remove("highlight-pulse");
      }, 2000); // Match this with the CSS animation duration

      return () => clearTimeout(timer);
    }
  }, [selectedItemId]);

  return (
    <div className="p-6 border rounded-lg space-y-6">
      <div className="flex justify-between items-start">
        <h2 className="text-xl font-bold">Detalles de la Orden</h2>
        {isAdmin && (
          <div className="text-sm text-muted-foreground">
            Cliente: {order.customerId}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-medium">Estado</h3>
        {canChangeStatus ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={`${getStatusColor(order.status)} border-none`}
              >
                {getStatusLabel(order.status)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {statusOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onStatusChange?.(order, option.value)}
                  disabled={option.value === order.status}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span
            className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
              order.status
            )}`}
          >
            {getStatusLabel(order.status)}
          </span>
        )}
      </div>

      <div>
        <h3 className="font-medium mb-2">Productos</h3>
        <div className="space-y-4">
          {order.cart.map((item) => (
            <div
              key={item.id}
              ref={(el) => {
                itemRefs.current[item.id] = el;
              }}
              className={`border rounded-lg p-4 transition-all ${
                selectedItemId === item.id ? "highlight-pulse" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{item.productSnapshot.name}</h4>
                <span className="text-sm">{formatCents(item.totalPrice)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Cantidad: {item.quantity}
              </p>
              {Object.entries(item.options).map(([key, value]) => (
                <p key={key} className="text-sm text-muted-foreground">
                  {key}: {Array.isArray(value) ? value.join("x") : value}
                </p>
              ))}
              {item.art && (
                <div className="mt-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium">
                      {item.art.source === ArtSource.Freepik
                        ? "Plantilla"
                        : "Diseño original"}
                      :
                    </p>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() =>
                          handleDownloadArt(order.id, item.id, item.art!)
                        }
                      >
                        <Download className="w-4 h-4" />
                        Descargar PSD
                      </Button>
                    )}
                  </div>
                  <div className="relative w-32 h-32">
                    {item.art?.source === ArtSource.Freepik ? (
                      <FreepikImage id={item.art.value} />
                    ) : (
                      <S3Image
                        s3Key={`uploads/${item.art.value}/preview.png`}
                      />
                    )}
                  </div>
                </div>
              )}
              <OrderChat orderId={order.id} itemId={item.id} />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total</span>
          <span className="font-bold text-lg">{formatCents(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
