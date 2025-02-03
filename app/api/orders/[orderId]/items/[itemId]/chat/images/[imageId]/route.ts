import { DeleteObjectCommandOutput } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { Order, UserRole } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { DesignerChat } from "@/lib/server/designer-chat";
import { redis } from "@/lib/server/redis";
import { deleteS3Object, getSignedDownloadUrl } from "@/lib/server/s3";

export async function GET(
  _: Request,
  { params }: { params: { orderId: string; itemId: string; imageId: string } }
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
    session.user.role !== UserRole.Admin &&
    order.customerId.toString() !== session.user.id
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const orderItem = order.cart.find((item) => item.id === params.itemId);
  if (!orderItem) {
    return new NextResponse("Order item not found", { status: 404 });
  }

  const fileType = await redis.get(`image_type:${params.imageId}`);
  if (!fileType) {
    return new NextResponse("Image not found", { status: 404 });
  }

  try {
    const downloadUrl = await getSignedDownloadUrl(
      `chat/${params.itemId}/${params.imageId}/original.${fileType}`
    );

    return NextResponse.json({ url: downloadUrl });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return new NextResponse("Failed to generate download URL", { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { orderId: string; itemId: string; imageId: string } }
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
    session.user.role !== UserRole.Admin &&
    order.customerId.toString() !== session.user.id
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const orderItem = order.cart.find((item) => item.id === params.itemId);
  if (!orderItem) {
    return new NextResponse("Order item not found", { status: 404 });
  }

  const fileType = await redis.get(`image_type:${params.imageId}`);

  if (!fileType) {
    return new NextResponse("Image not found", { status: 404 });
  }

  const promises: Promise<DeleteObjectCommandOutput>[] = [
    deleteS3Object(
      `chat/${params.itemId}/${params.imageId}/original.${fileType}`
    ),
  ];

  if (fileType === "psd") {
    promises.push(
      deleteS3Object(`chat/${params.itemId}/${params.imageId}/preview.png`)
    );
  }

  try {
    await Promise.all(promises);
    await DesignerChat.removeImage(params.itemId, params.imageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return new NextResponse("Failed to delete image", { status: 500 });
  }
}
