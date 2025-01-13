import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

import { getSignedUploadUrl } from "@/lib/server/s3";

export async function POST(request: Request) {
  try {
    const { contentType } = await request.json();
    if (!contentType) {
      return new NextResponse("Content type is required", { status: 400 });
    }

    const key = `uploads/${uuid()}.psd`;
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
