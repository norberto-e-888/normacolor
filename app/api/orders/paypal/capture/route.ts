// app/api/orders/paypal/capture/route.ts

import { Order, OrderProduct, OrderStatus, User } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { orderId, paypalOrderId } = await request.json();

  await connectToMongo();
  const order = await Order.findById(orderId);

  if (!order) {
    return new NextResponse("Order not found", { status: 404 });
  }

  if (order.customerId.toString() !== session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const response = await fetch(
    `https://api-m.sandbox.paypal.com/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
    }
  );

  const data = await response.json();

  if (data.status === "COMPLETED") {
    await Order.findByIdAndUpdate(orderId, {
      status: OrderStatus.Paid,
    });

    // Update user's loyalty points and aggregations
    const pointsEarned = order.total;
    const cart = order.cart.map((item) => item.toObject() as OrderProduct);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Get current user data for average calculation
    const user = await User.findById(session.user.id);
    if (!user) {
      throw new Error("User not found");
    }

    // Calculate new average order value
    const newTotalOrders = (user.aggregations?.totalOrders || 0) + 1;
    const currentTotalValue =
      (user.aggregations?.averageOrderValue || 0) *
      (user.aggregations?.totalOrders || 0);
    const newAverageOrderValue =
      (currentTotalValue + order.total) / newTotalOrders;

    // Build product order counts update
    const productCounts = { ...(user.aggregations?.productOrderCounts || {}) };
    for (const item of cart) {
      productCounts[item.productId] =
        (productCounts[item.productId] || 0) + item.quantity;
    }

    // Find most ordered product
    const mostOrderedProduct = Object.entries(productCounts).reduce(
      (max, [productId, count]) =>
        count > (max.count || 0) ? { productId, count } : max,
      { productId: "", count: 0 }
    ).productId;

    // Update order status counts
    const orderStatusCounts = {
      ...(user.aggregations?.orderStatusCounts || {}),
    };
    orderStatusCounts[OrderStatus.Paid] =
      (orderStatusCounts[OrderStatus.Paid] || 0) + 1;

    await User.findByIdAndUpdate(session.user.id, {
      $inc: {
        totalSpentCents: order.total,
        totalLoyaltyPoints: pointsEarned,
        unspentLoyaltyPoints: pointsEarned,
      },
      $set: {
        aggregations: {
          lastOrderDate: new Date(),
          averageOrderValue: newAverageOrderValue,
          mostOrderedProduct:
            mostOrderedProduct || user.aggregations?.mostOrderedProduct,
          orderStatusCounts,
          totalOrderItems:
            (user.aggregations?.totalOrderItems || 0) + totalItems,
          productOrderCounts: productCounts,
          totalOrders: newTotalOrders,
        },
      },
    });
  }

  return NextResponse.json({ success: true, orderId });
}
