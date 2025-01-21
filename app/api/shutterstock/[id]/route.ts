import { NextResponse } from "next/server";

import { SessionUser } from "@/auth";
import { getServerSession } from "@/functions/auth";
import { downloadShutterstockArt } from "@/functions/art/download-shutterstock-art";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if ((session.user as SessionUser)?.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { url } = await downloadShutterstockArt(params.id);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error downloading Shutterstock image:", error);
    return new NextResponse("Failed to download image", { status: 500 });
  }
}
