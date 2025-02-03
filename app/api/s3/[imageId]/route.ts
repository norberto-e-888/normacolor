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
      fileType = "psd";
    }

    const key = `${namespace}/${params.imageId}/${
      fileType === "psd" ? "preview" : "original"
    }.${fileType === "psd" ? "png" : fileType}`;

    const url = await getSignedDownloadUrl(key);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return new NextResponse("Failed to generate download URL", { status: 500 });
  }
}
