import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

import { getSignedUploadUrl } from "@/lib/server/s3";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: Request) {
  try {
    // Get fileType from request body if provided
    let fileType = "pdf"; // Default to PDF for customer uploads

    try {
      const body = await request.json();
      if (body?.fileType) {
        fileType = body.fileType;
      }
    } catch (e: unknown) {
      // If parsing fails, use default fileType
      console.error("Error parsing fileType:", e);
    }

    const imageId = uuid();
    const folderKey = `uploads/${imageId}`;
    const uploadUrl = await getSignedUploadUrl(
      `${folderKey}/original.${fileType}`
    );

    return NextResponse.json({
      uploadUrl,
      folderKey,
      imageId,
      fileType,
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return new NextResponse("Failed to generate upload URL", { status: 500 });
  }
}
