import { NextResponse } from "next/server";

import { Order, OrderProduct, OrderStatus, User } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

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

    const updateUserAggregations = async (order: Order, userId: string) => {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const totalItems = order.cart.reduce((sum, item) => {
        const itemData = item.toObject() as OrderProduct;
        return sum + itemData.quantity;
      }, 0);

      const productCounts = order.cart.reduce(
        (counts: Record<string, number>, item) => {
          const itemData = item.toObject() as OrderProduct;
          counts[itemData.productId] = (counts[itemData.productId] || 0) + 1;
          return counts;
        },
        {}
      );

      const userData = user.toObject();
      const newTotalOrders = (userData.aggregations?.totalOrders || 0) + 1;
      const newTotalSpent = (userData.totalSpentCents || 0) + order.total;
      const newAverageOrderValue = Math.round(newTotalSpent / newTotalOrders);
      const currentOrderStatusCounts =
        userData.aggregations?.orderStatusCounts || {};

      const currentPaidCount = currentOrderStatusCounts[OrderStatus.Paid] || 0;
      const orderStatusCounts = {
        ...currentOrderStatusCounts,
        [OrderStatus.Paid]: currentPaidCount + 1,
      };

      const mergedProductCounts = {
        ...(userData.aggregations?.productOrderCounts || {}),
      };

      Object.entries(productCounts).forEach(([productId, count]) => {
        mergedProductCounts[productId] =
          (mergedProductCounts[productId] || 0) + count;
      });

      const mostOrderedProduct = Object.entries(mergedProductCounts).reduce(
        (max, [id, count]) => (count > max.count ? { id, count } : max),
        { id: "", count: 0 }
      ).id;

      await User.findByIdAndUpdate(userId, {
        $inc: {
          totalSpentCents: order.total,
          totalLoyaltyPoints: order.total,
          unspentLoyaltyPoints: order.total,
        },
        $set: {
          aggregations: {
            lastOrderDate: new Date(),
            averageOrderValue: newAverageOrderValue,
            mostOrderedProduct,
            orderStatusCounts,
            totalOrderItems:
              (userData.aggregations?.totalOrderItems || 0) + totalItems,
            productOrderCounts: mergedProductCounts,
            totalOrders: newTotalOrders,
          },
        },
      });
    };

    // Purposefully not awaiting this to avoid delaying the response
    updateUserAggregations(order, session.user.id)
      .then(() => {
        console.log("User aggregations updated");
      })
      .catch((error) => {
        console.error("Failed to update user aggregations", error);
      });
  }

  return NextResponse.json({ success: true, orderId });
}
