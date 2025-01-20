import { NextResponse } from "next/server";
import sharp from "sharp";

import { Product } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { uploadToS3 } from "@/lib/server/s3";

export async function POST(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const session = await getServerSession();
  if (!session || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const { productId } = params;

    if (!file || !productId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Process image with sharp
    const buffer = Buffer.from(await file.arrayBuffer());
    const processedBuffer = await sharp(buffer)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload to S3
    const s3Key = `products/${productId}/${Date.now()}.jpg`;
    await uploadToS3(s3Key, processedBuffer);

    // Update product in database
    await connectToMongo();
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;

    await Product.findByIdAndUpdate(productId, {
      $push: { images: imageUrl },
    });

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    return new NextResponse("Error uploading image", { status: 500 });
  }
}
