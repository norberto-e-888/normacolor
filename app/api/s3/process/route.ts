import { NextResponse } from "next/server";

import { redis } from "@/lib/server/redis";
import { uploadPDFWithPreview, uploadPSDWithPreview } from "@/lib/server/s3";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderKey = formData.get("folderKey") as string;
    const fileType = (formData.get("fileType") as string) || "pdf"; // Default to PDF

    if (!file || !folderKey) {
      return new NextResponse("File and folderKey are required", {
        status: 400,
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Determine file type based on file extension if not specified in formData
    const fileName = file.name.toLowerCase();
    const detectedFileType =
      fileType ||
      (fileName.endsWith(".pdf")
        ? "pdf"
        : fileName.endsWith(".psd")
        ? "psd"
        : "unknown");

    if (detectedFileType === "unknown") {
      return new NextResponse("Unsupported file type", { status: 400 });
    }

    // Extract imageId from folderKey (uploads/imageId)
    const imageId = folderKey.split("/")[1];

    // Store the file type in Redis
    await redis.set(`image_type:${imageId}`, detectedFileType);

    let result;
    if (detectedFileType === "pdf") {
      result = await uploadPDFWithPreview(new Uint8Array(buffer), folderKey);
      return NextResponse.json({
        pdfKey: result.pdfKey,
        pngKey: result.pngKey,
      });
    } else {
      // PSD file
      result = await uploadPSDWithPreview(new Uint8Array(buffer), folderKey);
      return NextResponse.json({
        psdKey: result.psdKey,
        pngKey: result.pngKey,
      });
    }
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
