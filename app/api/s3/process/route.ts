import { NextResponse } from "next/server";

import { uploadPSDWithPreview } from "@/lib/server/s3";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderKey = formData.get("folderKey") as string;

    if (!file || !folderKey) {
      return new NextResponse("File and folderKey are required", {
        status: 400,
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { psdKey, pngKey } = await uploadPSDWithPreview(
      new Uint8Array(buffer),
      folderKey
    );

    return NextResponse.json({
      psdKey,
      pngKey,
    });
  } catch (error) {
    console.error("Error processing PSD:", error);
    return new NextResponse("Failed to process PSD", { status: 500 });
  }
}
