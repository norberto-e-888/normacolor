import { NextResponse } from "next/server";

import { redis } from "@/lib/server/redis";
import { getSignedDownloadUrl } from "@/lib/server/s3";

export async function GET(
  request: Request,
  { params }: { params: { imageId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const namespace = searchParams.get("namespace");

    if (!namespace) {
      return new NextResponse("Missing namespace search param", {
        status: 400,
      });
    }

    let fileType = await redis.get(`image_type:${params.imageId}`);

    if (!fileType) {
      fileType = "psd"; // Default to PSD as fallback
    }

    // Get the original file URL
    const originalKey = `${namespace}/${params.imageId}/original.${fileType}`;
    const url = await getSignedDownloadUrl(originalKey);

    let previewUrl = null;

    // For file types that have previews, also return the preview URL
    if (["psd", "pdf", "png", "jpeg", "jpg"].includes(fileType as string)) {
      // The convention is to use a PNG preview for most file types
      const previewKey = `${namespace}/${params.imageId}/preview.png`;
      previewUrl = await getSignedDownloadUrl(previewKey);
    }

    return NextResponse.json({
      url,
      previewUrl,
      fileType,
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return new NextResponse("Failed to generate download URL", { status: 500 });
  }
}
