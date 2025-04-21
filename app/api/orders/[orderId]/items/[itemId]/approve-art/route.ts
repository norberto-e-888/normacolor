import { NextResponse } from "next/server";

import { PusherEventName } from "@/constants/pusher";
import {
  Notification,
  NotificationType,
  Order,
  OrderStatus,
  User,
  UserRole,
} from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { DesignerChat } from "@/lib/server/designer-chat";
import { createPusherServer } from "@/lib/server/pusher";
import { getPusherChannelName } from "@/utils/pusher";

export async function POST(
  request: Request,
  { params }: { params: { orderId: string; itemId: string } }
) {
  try {
    const session = (await getServerSession()) as ExtendedSession;
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { imageId } = await request.json();

    if (!imageId) {
      return new NextResponse("Image ID is required", { status: 400 });
    }

    await connectToMongo();
    const order = await Order.findById(params.orderId);

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Only allow the customer to approve art
    if (
      session.user.role !== UserRole.Admin &&
      order.customerId.toString() !== session.user.id
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find the order item
    const orderItemIndex = order.cart.findIndex(
      (item) => item.id === params.itemId
    );

    if (orderItemIndex === -1) {
      return new NextResponse("Order item not found", { status: 404 });
    }

    // Verify the image exists in the chat
    const images = await DesignerChat.getImages(params.itemId);
    const designerImages = images.designerImages || [];

    if (!designerImages.includes(imageId)) {
      return new NextResponse("Image not found", { status: 404 });
    }

    // Update the order item with the approved art ID
    const orderItem = order.cart[orderItemIndex];
    // @ts-expect-error - The schema has been updated with approvedArtId but TypeScript doesn't know it yet
    orderItem.approvedArtId = imageId;

    // If order is in DesignApprovalPending status, also update it to InProgress
    if (order.status === OrderStatus.DesignApprovalPending) {
      order.status = OrderStatus.InProgress;
    }

    await order.save();

    // Format the updated order for the response
    const updatedOrder = {
      ...order.toObject(),
      id: order._id.toString(),
      _id: undefined,
      cart: order.cart.map((item) => ({
        ...item.toObject(),
        id: item._id.toString(),
        _id: undefined,
      })),
    };

    // Send Pusher notifications
    const pusherServer = createPusherServer();
    const orderStatusChannel = getPusherChannelName.orderStatus(params.orderId);

    // Send OrderUpdated event
    await pusherServer.trigger(
      orderStatusChannel,
      PusherEventName.OrderUpdated,
      updatedOrder
    );

    // Send ArtApproved event
    await pusherServer.trigger(
      orderStatusChannel,
      PusherEventName.ArtApproved,
      {
        orderId: params.orderId,
        itemId: params.itemId,
        imageId: imageId,
      }
    );

    // Create notifications for all admin users about the art approval
    try {
      // Get product information for the notification
      const productName = orderItem.toObject().productSnapshot.name;

      // Find all admin users
      const admins = await User.find({ role: UserRole.Admin });

      if (admins.length > 0) {
        const baseNotificationData = {
          type: NotificationType.ArtApproved,
          title: "Diseño aprobado",
          message: `Un cliente ha aprobado el diseño para ${productName}`,
          deepLink: `/admin/ordenes?selectedId=${params.orderId}&selectedItemId=${params.itemId}`,
          metadata: {
            orderId: params.orderId,
            itemId: params.itemId,
            imageId: imageId,
            productName,
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

        // Send all notification events in one batch
        if (batchPusherEvents.length > 0) {
          await pusherServer.triggerBatch(batchPusherEvents);
        }
      }
    } catch (error) {
      console.error("Error creating admin notifications:", error);
      // Don't fail the overall process if notifications fail
    }

    return NextResponse.json({
      success: true,
      updatedOrder,
    });
  } catch (error) {
    console.error("Error approving art:", error);
    return new NextResponse(
      `Failed to approve art: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { status: 500 }
    );
  }
}
