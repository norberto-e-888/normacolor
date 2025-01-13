import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

import { Order, UserRole } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { getSignedUploadUrl } from "@/lib/server/s3";

export async function POST(
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

  if (
    session.user.role === UserRole.Client &&
    order.customerId.toString() !== session.user.id
  ) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const orderItem = order.cart.find((item) => item.id === params.itemId);
  if (!orderItem) {
    return new NextResponse("Order item not found", { status: 404 });
  }

  // Generate a unique key for the PSD file
  const key = `${
    session.user.role === UserRole.Admin ? "designer" : "client"
  }-uploads/${orderItem.id}/${uuid()}.psd`;

  try {
    const uploadUrl = await getSignedUploadUrl(key);

    return NextResponse.json({
      uploadUrl,
      key,
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return new NextResponse("Failed to generate upload URL", { status: 500 });
  }
}
