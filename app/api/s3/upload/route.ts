import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

import { getSignedUploadUrl } from "@/lib/server/s3";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_: Request) {
  try {
    const imageId = uuid();
    const folderKey = `uploads/${imageId}`;
    const uploadUrl = await getSignedUploadUrl(`${folderKey}/original.psd`);

    return NextResponse.json({
      uploadUrl,
      folderKey,
      imageId,
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return new NextResponse("Failed to generate upload URL", { status: 500 });
  }
}
