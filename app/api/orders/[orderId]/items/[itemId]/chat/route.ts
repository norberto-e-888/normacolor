import { NextResponse } from "next/server";

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

  const baseNotificationData: Omit<
    Notification,
    "userId" | "isRead" | keyof BaseModel
  > = {
    type: NotificationType.DesignChatMessage,
    title: "Nuevo mensaje de diseño",
    message: `Tienes un nuevo mensaje sobre el diseño de ${orderItemData.productSnapshot.name}`,
    deepLink: {
      path: `/admin/ordenes?selectedId=${order.id}`,
      elementId: orderItem.id,
    },
    metadata: {
      orderId: order.id,
      itemId: orderItem.id,
      productName: orderItemData.productSnapshot.name,
    },
  };

  // Create notification for the recipient
  if (session.user.role === UserRole.Admin) {
    await Notification.create({
      userId: order.customerId.toString(),
      ...baseNotificationData,
    });
  } else {
    const admins = await User.find({ role: UserRole.Admin });
    for (const admin of admins) {
      await Notification.create({
        userId: admin.id,
        ...baseNotificationData,
      });
    }
  }

  const channelName = getPusherChannelName.orderItemChat(
    order.id,
    orderItem.id
  );

  console.log(`Sending message to channel ${channelName}:`, message);
  const pusherServer = createPusherServer();
  await pusherServer.trigger(channelName, PusherEventName.NewMessage, message);
  return NextResponse.json({ message });
}
