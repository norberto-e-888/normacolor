import { NextResponse } from "next/server";

import { Notification } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectToMongo();

  const count = await Notification.countDocuments({
    userId: session.user.id,
    isRead: false,
  });

  return NextResponse.json({ count });
}
