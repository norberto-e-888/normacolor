import { NextResponse } from "next/server";
import sharp from "sharp";

import { Order, UserRole } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { DesignerChat } from "@/lib/server/designer-chat";
import { uploadPSDWithPreview, uploadToS3 } from "@/lib/server/s3";

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

  const images = await DesignerChat.getImages(orderItem.id);

  return NextResponse.json(images);
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

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return new NextResponse("File is required", { status: 400 });
  }

  try {
    const isDesigner = session.user.role === UserRole.Admin;
    const imageId = await DesignerChat.addImage(orderItem.id, isDesigner);
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = file.type.toLowerCase();

    if (fileType === "image/psd" || file.name.toLowerCase().endsWith(".psd")) {
      await uploadPSDWithPreview(
        new Uint8Array(buffer),
        `chat/${orderItem.id}/${imageId}`
      );
    } else {
      const processedBuffer = await sharp(buffer)
        .resize(800, 800, { fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();

      await Promise.all([
        uploadToS3(
          `chat/${orderItem.id}/${imageId}/original.png`,
          processedBuffer
        ),
        uploadToS3(
          `chat/${orderItem.id}/${imageId}/preview.png`,
          processedBuffer
        ),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing file:", error);
    return new NextResponse("Failed to process file", { status: 500 });
  }
}
