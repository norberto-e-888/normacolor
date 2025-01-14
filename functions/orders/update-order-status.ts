"use server";

import { Order, OrderStatus } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await getServerSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await connectToMongo();
  const order = await Order.findByIdAndUpdate(
    orderId,
    { status },
    { new: true }
  ).lean();

  if (!order) {
    throw new Error("Order not found");
  }

  return {
    order: {
      ...order,
      id: order._id.toString(),
      _id: undefined,
    },
  };
}
