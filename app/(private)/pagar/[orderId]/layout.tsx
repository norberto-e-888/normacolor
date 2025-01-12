import { redirect } from "next/navigation";

import { Order, OrderStatus } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

export default async function PaymentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { orderId: string };
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login?callbackUrl=/pagar/" + params.orderId);
  }

  await connectToMongo();
  const order = await Order.findById(params.orderId);

  if (!order) {
    redirect("/productos?toast=orderNotFound");
  }

  if (order.customerId.toString() !== session.user.id) {
    redirect("/productos?toast=unauthorized");
  }

  if (order.status !== OrderStatus.WaitingForPayment) {
    redirect(
      `/productos?toast=invalidOrderStatus&toastData_status=${order.status}`
    );
  }

  return <>{children}</>;
}
