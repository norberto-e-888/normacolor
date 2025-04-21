"use server";

import { Order, OrderStatus } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  await connectToMongo();
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  // Admin can change to any status
  if (session.user.role === "admin") {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).lean();

    if (!updatedOrder) {
      throw new Error("Failed to update order");
    }

    return {
      order: {
        ...updatedOrder,
        id: updatedOrder._id.toString(),
        _id: undefined,
      },
    };
  }

  // Client can only change from DesignApprovalPending to InProgress (approve design)
  if (
    order.customerId.toString() === session.user.id &&
    order.status === OrderStatus.DesignApprovalPending &&
    status === OrderStatus.InProgress
  ) {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).lean();

    if (!updatedOrder) {
      throw new Error("Failed to update order");
    }

    return {
      order: {
        ...updatedOrder,
        id: updatedOrder._id.toString(),
        _id: undefined,
      },
    };
  }

  throw new Error("Unauthorized action");
}
