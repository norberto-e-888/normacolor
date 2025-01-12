"use client";

import { useParams } from "next/navigation";

export default function PaymentPage() {
  const { orderId } = useParams();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Pagar Orden #{orderId}</h1>
      {/* Add payment form/integration here */}
    </div>
  );
}
