import { NextResponse } from "next/server";

import { Order, UserRole } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { DesignerChat } from "@/lib/server/designer-chat";

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

  const images = await DesignerChat.getDesignerImages(orderItem.id);

  return NextResponse.json({ images });
}

export async function POST(
  request: Request,
  { params }: { params: { orderId: string; productId: string } }
) {
  const session = (await getServerSession()) as ExtendedSession;
  if (!session || session.user.role !== UserRole.Admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectToMongo();
  const order = await Order.findById(params.orderId);

  if (!order) {
    return new NextResponse("Order not found", { status: 404 });
  }

  const orderItem = order.cart.find((item) => item.id === params.productId);
  if (!orderItem) {
    return new NextResponse("Order item not found", { status: 404 });
  }

  const { imageUrl } = await request.json();

  if (!imageUrl || !imageUrl.startsWith("s3://")) {
    return new NextResponse("Invalid image URL", { status: 400 });
  }

  await DesignerChat.addDesignerImage(orderItem.id, imageUrl);

  return NextResponse.json({ success: true });
}
