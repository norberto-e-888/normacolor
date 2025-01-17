import { NextResponse } from "next/server";

import { Order, UserRole } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { DesignerChat } from "@/lib/server/designer-chat";
import { createPusherServer } from "@/lib/server/pusher";

export async function GET(
  _: Request,
  { params }: { params: { orderId: string; itemId: string } }
) {
  const session = (await getServerSession()) as ExtendedSession;
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
  const session = (await getServerSession()) as ExtendedSession;
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

  const message = await DesignerChat.addMessage({
    orderItemId: orderItem.id,
    senderId: session.user.id,
    senderRole: session.user.role === UserRole.Admin ? "designer" : "client",
    content: content.trim(),
  });

  const channelName = `private-chat-${orderItem.id}`;
  console.log(`Sending message to channel ${channelName}:`, message);
  const pusherServer = createPusherServer();
  await pusherServer.trigger(channelName, "new-message", message);
  return NextResponse.json({ message });
}
