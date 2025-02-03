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
    const fileType = DesignerChat.normalizeFileType(file.type);
    const imageId = await DesignerChat.addImage(
      orderItem.id,
      isDesigner,
      fileType
    );

    const buffer = Buffer.from(await file.arrayBuffer());

    if (fileType === "psd") {
      await uploadPSDWithPreview(
        new Uint8Array(buffer),
        `chat/${orderItem.id}/${imageId}`
      );
    } else {
      let bufferChain = sharp(buffer).resize(800, 800, {
        fit: "inside",
        withoutEnlargement: true,
      });

      if (fileType === "png") {
        bufferChain = bufferChain.png();
      } else if (fileType === "jpeg" || fileType === "jpg") {
        bufferChain = bufferChain.jpeg();
      }

      const processedBuffer = await bufferChain.toBuffer();
      await Promise.all([
        uploadToS3(
          `chat/${orderItem.id}/${imageId}/original.${fileType}`,
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
