import { NextResponse } from "next/server";

import { getSignedDownloadUrl } from "@/lib/server/s3";

export async function GET(_: Request, { params }: { params: { key: string } }) {
  try {
    const downloadUrl = await getSignedDownloadUrl(params.key);
    return NextResponse.json({ url: downloadUrl });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return new NextResponse("Failed to generate download URL", { status: 500 });
  }
}