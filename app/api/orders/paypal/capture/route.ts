import { NextResponse } from "next/server";

import {
  calculateLoyaltyPoints,
  determineUserTier,
  Order,
  OrderProduct,
  OrderStatus,
  TIER_QUALIFICATION_PERIOD_MONTHS,
  User,
} from "@/database";
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

      const userData = user.toObject();
      const orderAmount = order.total;

      // Check if qualification period has expired and reset if needed
      const now = new Date();
      const qualificationEndDate = userData.tierQualificationEndDate || now;

      let tierQualificationSpendCents =
        userData.tierQualificationSpendCents || 0;
      let newQualificationEndDate = qualificationEndDate;

      if (now > qualificationEndDate) {
        // Reset qualification period
        tierQualificationSpendCents = orderAmount;
        newQualificationEndDate = new Date();
        newQualificationEndDate.setMonth(
          now.getMonth() + TIER_QUALIFICATION_PERIOD_MONTHS
        );
      } else {
        // Add to existing qualification spending
        tierQualificationSpendCents += orderAmount;
      }

      // Determine tier based on qualification spend
      const newTier = determineUserTier(tierQualificationSpendCents);

      // Calculate loyalty points based on tier
      const loyaltyPoints = calculateLoyaltyPoints(orderAmount, newTier);

      // Calculate order analytics
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

      const newTotalOrders = (userData.aggregations?.totalOrders || 0) + 1;
      const newTotalSpent = (userData.totalSpentCents || 0) + orderAmount;
      const newAverageOrderValue = Math.round(newTotalSpent / newTotalOrders);
      const orderStatusCounts = {
        ...(userData.aggregations?.orderStatusCounts || {}),
      };

      orderStatusCounts[OrderStatus.Paid] =
        (orderStatusCounts[OrderStatus.Paid] || 0) + 1;

      const productOrderCounts = {
        ...(userData.aggregations?.productOrderCounts || {}),
      };

      Object.entries(productCounts).forEach(([productId, count]) => {
        productOrderCounts[productId] =
          (productOrderCounts[productId] || 0) + count;
      });

      const mostOrderedProduct = Object.entries(productOrderCounts).reduce(
        (max, [id, count]) => (count > max.count ? { id, count } : max),
        { id: "", count: 0 }
      ).id;

      await User.findByIdAndUpdate(userId, {
        $inc: {
          totalSpentCents: orderAmount,
          totalLoyaltyPoints: loyaltyPoints,
          unspentLoyaltyPoints: loyaltyPoints,
        },
        $set: {
          loyaltyTier: newTier,
          tierQualificationEndDate: newQualificationEndDate,
          tierQualificationSpendCents: tierQualificationSpendCents,
          aggregations: {
            lastOrderDate: new Date(),
            averageOrderValue: newAverageOrderValue,
            mostOrderedProduct,
            orderStatusCounts,
            totalOrderItems:
              (userData.aggregations?.totalOrderItems || 0) + totalItems,
            productOrderCounts,
            totalOrders: newTotalOrders,
          },
        },
      });
    };

    // Purposefully not awaiting this to avoid delaying the response
    updateUserAggregations(order, session.user.id)
      .then(() => {
        console.log("User aggregations and loyalty tier updated");
      })
      .catch((error) => {
        console.error(
          "Failed to update user aggregations and loyalty tier",
          error
        );
      });
  }

  return NextResponse.json({ success: true, orderId });
}
