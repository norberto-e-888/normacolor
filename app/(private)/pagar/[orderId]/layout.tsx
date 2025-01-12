import { redirect } from "next/navigation";

import { Order, OrderStatus } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { getToastUrlConfig, ToastType } from "@/utils/get-toast-url-config";

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
      `/productos?${getToastUrlConfig(ToastType.InvalidOrderStatus, {
        orderStatus: order.status,
      })}`
    );
  }

  return <>{children}</>;
}
