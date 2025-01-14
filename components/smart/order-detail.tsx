"use client";

import { ArtSource, Order, OrderStatus } from "@/database";
import { formatCents } from "@/utils";

import { FreepikImage } from "./freepik-image";
import { OrderChat } from "./order-chat";
import { S3Image } from "./s3-image";

interface OrderDetailProps {
  order: Order<true>;
}

export function OrderDetail({ order }: OrderDetailProps) {
  return (
    <div className="p-6 border rounded-lg space-y-6">
      <h2 className="text-xl font-bold mb-6">Detalles de la Orden</h2>

      <div>
        <h3 className="font-medium mb-2">Estado</h3>
        <span
          className={`px-3 py-1 rounded-full text-sm ${
            order.status === OrderStatus.Paid
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {order.status === OrderStatus.Paid ? "Pagado" : "Pendiente"}
        </span>
      </div>

      <div>
        <h3 className="font-medium mb-2">Productos</h3>
        <div className="space-y-4">
          {order.cart.map((item) => (
            <div key={item.id} className="border rounded-lg p-4">
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
                  <p className="text-sm font-medium mb-2">
                    {item.art.source === "freepik" ? "Plantilla" : "Diseño"}:
                  </p>
                  <div className="relative w-32 h-32">
                    {item.art?.source === ArtSource.Freepik ? (
                      <FreepikImage id={item.art.value} />
                    ) : (
                      <S3Image s3Key={item.art.value} />
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
