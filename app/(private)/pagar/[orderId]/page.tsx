"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { LockIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Order } from "@/database";

export default function PaymentPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch order");
        }
        const data = await response.json();
        setOrder(data.order);
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Error al cargar la orden", {
          closeButton: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return <div>Order not found</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Pagar Orden #{orderId}</h1>
          <div className="flex items-center text-sm text-gray-600">
            <LockIcon className="w-4 h-4 mr-1" />
            Pago seguro
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Resumen de la orden</h2>
          <div className="space-y-2">
            {order.cart.map((item) => (
              <div key={item.productId} className="flex justify-between">
                <span>
                  {item.productSnapshot.name} x {item.quantity}
                </span>
                <span>
                  $
                  {(
                    (item.quantity *
                      item.productSnapshot.pricing.baseUnitPrice) /
                    100
                  ).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 font-bold">
              <div className="flex justify-between">
                <span>Total</span>
                <span>${(order.total / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <PayPalScriptProvider
            options={{
              clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
              vault: true,
              intent: "capture",
              components: "buttons",
              currency: "USD",
            }}
          >
            <PayPalButtons
              style={{
                layout: "vertical",
                shape: "rect",
                label: "pay",
              }}
              disabled={isProcessing}
              createOrder={async () => {
                try {
                  setIsProcessing(true);
                  const response = await fetch("/api/orders/paypal", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      orderId: order.id,
                    }),
                  });

                  if (!response.ok) {
                    throw new Error("Failed to create PayPal order");
                  }

                  const data = await response.json();
                  return data.paypalOrderId;
                } catch (error) {
                  console.error("Error creating PayPal order:", error);
                  toast.error("Error al procesar el pago", {
                    closeButton: true,
                  });
                  throw error;
                }
              }}
              onApprove={async (data) => {
                try {
                  const response = await fetch("/api/orders/paypal/capture", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      orderId: order.id,
                      paypalOrderId: data.orderID,
                    }),
                  });

                  if (!response.ok) {
                    throw new Error("Failed to capture PayPal payment");
                  }

                  router.push("/ordenes?toast=paymentSuccess");
                } catch (error) {
                  console.error("Error capturing PayPal payment:", error);
                  toast.error("Error al finalizar el pago", {
                    closeButton: true,
                  });
                } finally {
                  setIsProcessing(false);
                }
              }}
              onError={() => {
                toast.error("Error al procesar el pago", {
                  closeButton: true,
                });
                setIsProcessing(false);
              }}
              onCancel={() => {
                toast.info("Pago cancelado", {
                  closeButton: true,
                });
                setIsProcessing(false);
              }}
            />
          </PayPalScriptProvider>

          <div className="space-y-2 text-center text-sm text-gray-500">
            <p>
              Al proceder con el pago, aceptas los términos y condiciones de
              PayPal.
            </p>
            <p className="text-xs">
              Puedes optar por guardar tu método de pago de forma segura para
              futuras compras. PayPal protege tus datos financieros con
              encriptación de grado bancario.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
