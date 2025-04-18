import { NextResponse } from "next/server";
import sharp from "sharp";
import { v4 as uuid } from "uuid";

import { Order, UserRole } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { DesignerChat } from "@/lib/server/designer-chat";
import {
  uploadPDFWithPreview,
  uploadPSDWithPreview,
  uploadToS3,
} from "@/lib/server/s3";

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
    const buffer = Buffer.from(await file.arrayBuffer());

    // Check file extension
    const fileName = file.name.toLowerCase();
    let actualFileType = "";

    if (fileName.endsWith(".pdf")) {
      actualFileType = "pdf";
    } else if (fileName.endsWith(".psd")) {
      actualFileType = "psd";
    } else if (fileName.endsWith(".png")) {
      actualFileType = "png";
    } else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
      actualFileType = "jpeg";
    } else {
      return new NextResponse("Unsupported file type", { status: 400 });
    }

    // Create a unique folder for this image
    const imageId = uuid();
    const folderPath = `order-chats/${params.orderId}/${params.itemId}/${imageId}`;

    // Store image metadata in database
    await DesignerChat.addImage(orderItem.id, isDesigner, actualFileType);

    // Process the file based on its type
    if (actualFileType === "psd") {
      await uploadPSDWithPreview(new Uint8Array(buffer), folderPath);
    } else if (actualFileType === "pdf") {
      await uploadPDFWithPreview(new Uint8Array(buffer), folderPath);
    } else {
      // Handle image files (PNG, JPEG, etc.)
      let bufferChain = sharp(buffer);

      if (actualFileType === "png") {
        bufferChain = bufferChain.png();
      } else if (actualFileType === "jpeg" || actualFileType === "jpg") {
        bufferChain = bufferChain.jpeg();
      }

      const processedBuffer = await bufferChain.toBuffer();
      await Promise.all([
        uploadToS3(`${folderPath}/original.${actualFileType}`, processedBuffer),
        // For images, use the same file as both original and preview
        uploadToS3(`${folderPath}/preview.png`, processedBuffer),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing file:", error);
    return new NextResponse(
      `Failed to process file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { status: 500 }
    );
  }
}
