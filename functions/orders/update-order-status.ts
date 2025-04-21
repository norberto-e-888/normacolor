"use server";

import { PusherEventName } from "@/constants/pusher";
import {
  Notification,
  NotificationType,
  Order,
  OrderStatus,
  User,
  UserRole,
} from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { createPusherServer } from "@/lib/server/pusher";
import { getPusherChannelName } from "@/utils/pusher";

// Helper function to get status message for notifications
function getStatusMessage(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.InProgress:
      return "Tu orden está siendo procesada";
    case OrderStatus.ReadyToPickUp:
      return "Tu orden está lista para recoger";
    case OrderStatus.EnRoute:
      return "Tu orden está en camino";
    case OrderStatus.Delivered:
      return "Tu orden ha sido entregada";
    default:
      return `El estado de tu orden ha cambiado a: ${status}`;
  }
}

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

    // Format the response
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

    // Send Pusher notification for order update
    const pusherServer = createPusherServer();
    const orderStatusChannel = getPusherChannelName.orderStatus(orderId);
    await pusherServer.trigger(
      orderStatusChannel,
      PusherEventName.OrderUpdated,
      formattedOrder
    );

    // Create notification for the client
    try {
      const notificationData = {
        userId: order.customerId,
        type: NotificationType.OrderStatusChanged,
        title: "Estado de orden actualizado",
        message: getStatusMessage(status),
        deepLink: `/ordenes?selectedId=${orderId}`,
        metadata: {
          orderId,
          status,
          previousStatus: order.status,
        },
      };

      const notification = await Notification.create(notificationData);

      // Send notification to the client via Pusher
      await pusherServer.trigger(
        getPusherChannelName.notifications(order.customerId.toString()),
        PusherEventName.NewNotification,
        {
          ...notificationData,
          id: notification._id.toString(),
          isRead: false,
        }
      );
    } catch (error) {
      console.error("Error creating client notification:", error);
      // Don't fail the entire process if notification creation fails
    }

    return {
      order: formattedOrder,
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

    // Format the response
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

    // Send Pusher notification
    const pusherServer = createPusherServer();
    const orderStatusChannel = getPusherChannelName.orderStatus(orderId);
    await pusherServer.trigger(
      orderStatusChannel,
      PusherEventName.OrderUpdated,
      formattedOrder
    );

    // Notify all admins that design was approved
    try {
      const admins = await User.find({ role: UserRole.Admin });

      if (admins.length > 0) {
        const baseNotificationData = {
          type: NotificationType.ArtApproved,
          title: "Diseño aprobado",
          message: `El cliente ha aprobado el diseño de la orden #${order._id
            .toString()
            .substring(0, 8)}`,
          deepLink: `/admin/ordenes?selectedId=${orderId}`,
          metadata: {
            orderId,
            status,
          },
        };

        const batchPusherEvents = [];

        // Create a notification for each admin
        for (const admin of admins) {
          const notification = await Notification.create({
            userId: admin._id,
            ...baseNotificationData,
          });

          // Add to batch
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
      console.error("Error creating admin notifications:", error);
      // Don't fail the entire process if notification creation fails
    }

    return {
      order: formattedOrder,
    };
  }

  throw new Error("Unauthorized action");
}
