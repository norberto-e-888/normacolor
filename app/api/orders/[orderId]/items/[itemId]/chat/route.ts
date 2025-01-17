import { NextResponse } from "next/server";
import Pusher from "pusher";

import { PusherEventName } from "@/constants/pusher";
import {
  Notification,
  NotificationType,
  Order,
  OrderProduct,
  User,
  UserRole,
} from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { DesignerChat } from "@/lib/server/designer-chat";
import { createPusherServer } from "@/lib/server/pusher";
import { BaseModel, getPusherChannelName } from "@/utils";

export async function GET(
  _: Request,
  { params }: { params: { orderId: string; itemId: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectToMongo();
  const order = await Order.findById(params.orderId);

  if (!order) {
    return new NextResponse("Order not found", { status: 404 });
  }

  // Only allow access to the order owner or designers
  if (
    session.user.role !== UserRole.Admin &&
    order.customerId.toString() !== session.user.id
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const orderItem = order.cart.find((item) => item.id === params.itemId);
  if (!orderItem) {
    return new NextResponse("Order item not found", { status: 404 });
  }

  const messages = await DesignerChat.getMessages(orderItem.id);

  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: { orderId: string; itemId: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectToMongo();
  const order = await Order.findById(params.orderId);

  if (!order) {
    return new NextResponse("Order not found", { status: 404 });
  }

  // Only allow access to the order owner or designers
  if (
    session.user.role !== UserRole.Admin &&
    order.customerId.toString() !== session.user.id
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const orderItem = order.cart.find((item) => item.id === params.itemId);
  if (!orderItem) {
    return new NextResponse("Order item not found", { status: 404 });
  }

  const { content } = await request.json();

  if (!content || typeof content !== "string" || !content.trim()) {
    return new NextResponse("Message must have content", { status: 400 });
  }

  const orderItemData = orderItem.toObject() as OrderProduct;
  const message = await DesignerChat.addMessage({
    orderItemId: orderItemData.id,
    senderId: session.user.id,
    senderRole: session.user.role === UserRole.Admin ? "designer" : "client",
    content: content.trim(),
  });

  const deepLink =
    session.user.role === UserRole.Admin
      ? `/ordenes?selectedId=${order.id}&selectedItemId=${orderItem.id}`
      : `/admin/ordenes?selectedId=${order.id}&selectedItemId=${orderItem.id}`;

  const baseNotificationData: Omit<
    Notification,
    "userId" | "isRead" | keyof BaseModel
  > = {
    type: NotificationType.DesignChatMessage,
    title: "Nuevo mensaje de diseño",
    message: `Tienes un nuevo mensaje sobre el diseño de ${orderItemData.productSnapshot.name}`,
    deepLink,
    metadata: {
      orderId: order.id,
      itemId: orderItem.id,
      productName: orderItemData.productSnapshot.name,
    },
  };

  // Create notification for the recipient
  const pusherServer = createPusherServer();
  if (session.user.role === UserRole.Admin) {
    const userId = order.customerId.toString();
    const notification = await Notification.create({
      userId,
      ...baseNotificationData,
    });

    await pusherServer.triggerBatch([
      {
        channel: getPusherChannelName.orderItemChat(order.id, orderItem.id),
        name: PusherEventName.NewMessage,
        data: message,
      },
      {
        channel: getPusherChannelName.notifications(userId),
        name: PusherEventName.NewNotification,
        data: {
          ...baseNotificationData,
          userId,
          isRead: false,
          id: notification.id,
        },
      },
    ]);
  } else {
    const admins = await User.find({ role: UserRole.Admin });
    const batchPusherEvents: Pusher.BatchEvent[] = [
      {
        channel: getPusherChannelName.orderItemChat(order.id, orderItem.id),
        name: PusherEventName.NewMessage,
        data: message,
      },
    ];

    for (const admin of admins) {
      const notification = await Notification.create({
        userId: admin.id,
        ...baseNotificationData,
      });

      batchPusherEvents.push({
        channel: getPusherChannelName.notifications(admin.id),
        name: PusherEventName.NewNotification,
        data: {
          ...baseNotificationData,
          userId: admin.id,
          isRead: false,
          id: notification.id,
        },
      });
    }

    await pusherServer.triggerBatch(batchPusherEvents);
  }

  return NextResponse.json({ message });
}
