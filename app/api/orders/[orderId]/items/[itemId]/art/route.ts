import { NextResponse } from "next/server";

import { Order, OrderProduct, UserRole } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { getSignedDownloadUrl } from "@/lib/server/s3";

export async function GET(
  _: Request,
  { params }: { params: { orderId: string; itemId: string } }
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

  const orderItem = order.cart
    .map((item) => item.toObject() as OrderProduct)
    .find((item) => item.id === params.itemId);

  if (!orderItem) {
    return new NextResponse("Order item not found", { status: 404 });
  }

  if (!orderItem.art) {
    return new NextResponse("No art found for this item", { status: 404 });
  }

  try {
    const s3Key = `uploads/${orderItem.art.value}/original.psd`;
    const url = await getSignedDownloadUrl(s3Key);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return new NextResponse("Failed to generate download URL", { status: 500 });
  }
}
