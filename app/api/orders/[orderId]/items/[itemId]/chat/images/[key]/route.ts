import { NextResponse } from "next/server";

import { Order, UserRole } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { getSignedDownloadUrl } from "@/lib/server/s3";

export async function GET(
  _: Request,
  { params }: { params: { orderId: string; itemId: string; key: string } }
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

  try {
    const downloadUrl = await getSignedDownloadUrl(params.key);
    return NextResponse.json({ url: downloadUrl });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return new NextResponse("Failed to generate download URL", { status: 500 });
  }
}
