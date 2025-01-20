import { NextResponse } from "next/server";

import { Product } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { deleteS3Object } from "@/lib/server/s3";

export async function DELETE(
  _: Request,
  { params }: { params: { productId: string; imageId: string } }
) {
  const session = await getServerSession();
  if (!session || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    await connectToMongo();
    const product = await Product.findById(params.productId);

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    // Find the image URL that matches the imageId
    const imageUrl = product.images.find((url) => url.includes(params.imageId));
    if (!imageUrl) {
      return new NextResponse("Image not found", { status: 404 });
    }

    // Extract S3 key from the URL
    const s3Key = imageUrl.replace(
      `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/`,
      ""
    );

    // Delete from S3
    await deleteS3Object(s3Key);

    // Remove from database
    await Product.findByIdAndUpdate(params.productId, {
      $pull: { images: imageUrl },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return new NextResponse("Error deleting image", { status: 500 });
  }
}
