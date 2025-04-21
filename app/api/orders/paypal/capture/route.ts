import { NextResponse } from "next/server";

import { PusherEventName } from "@/constants/pusher";
import {
  calculateLoyaltyPoints,
  determineUserTier,
  Notification,
  NotificationType,
  Order,
  OrderProduct,
  OrderStatus,
  TIER_QUALIFICATION_PERIOD_MONTHS,
  User,
  UserRole,
} from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { createPusherServer } from "@/lib/server/pusher";
import { getPusherChannelName } from "@/utils/pusher";

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

    const updatedOrder = await Order.findById(orderId).lean();

    if (updatedOrder) {
      const formattedOrder = {
        ...updatedOrder,
        id: updatedOrder._id.toString(),
        _id: undefined,
        cart: updatedOrder.cart.map(
          (item: {
            _id: { toString: () => string };
            [key: string]: unknown;
          }) => ({
            ...item,
            id: item._id.toString(),
            _id: undefined,
          })
        ),
      };

      const pusherServer = createPusherServer();
      const orderStatusChannel = getPusherChannelName.orderStatus(orderId);

      // Send OrderUpdated event
      await pusherServer.trigger(
        orderStatusChannel,
        PusherEventName.OrderUpdated,
        formattedOrder
      );

      // Create notifications for all admin users
      try {
        const admins = await User.find({ role: UserRole.Admin });

        if (admins.length > 0) {
          const orderTotal = formattedOrder.total / 100; // Convert cents to currency
          const formatOrderTotal = new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
          }).format(orderTotal);

          const baseNotificationData = {
            type: NotificationType.NewOrder,
            title: "Nueva orden recibida",
            message: `Nueva orden por ${formatOrderTotal} fue pagada y está lista para ser procesada`,
            deepLink: `/admin/ordenes?selectedId=${orderId}`,
            metadata: {
              orderId,
              total: formattedOrder.total,
            },
          };

          const batchPusherEvents = [];

          // Create a notification for each admin
          for (const admin of admins) {
            const notification = await Notification.create({
              userId: admin._id,
              ...baseNotificationData,
            });

            // Add notification event to batch
            batchPusherEvents.push({
              channel: getPusherChannelName.notifications(admin._id.toString()),
              name: PusherEventName.NewNotification,
              data: {
                ...baseNotificationData,
                userId: admin._id.toString(),
                isRead: false,
                id: notification._id.toString(),
              },
            });
          }

          // Send all notifications in one batch
          if (batchPusherEvents.length > 0) {
            await pusherServer.triggerBatch(batchPusherEvents);
          }
        }
      } catch (error) {
        console.error("Error sending admin notifications:", error);
        // Don't fail the overall process if notifications fail
      }
    }

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
