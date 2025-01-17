import { NextResponse } from "next/server";

import { Notification } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

export async function POST() {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const notificationIds = await Notification.find({
    userId: session.user.id,
    isRead: false,
  });

  if (!Array.isArray(notificationIds)) {
    return new NextResponse("Invalid notification IDs", { status: 400 });
  }

  await connectToMongo();
  await Notification.updateMany(
    {
      _id: { $in: notificationIds },
      userId: session.user.id,
    },
    {
      $set: { isRead: true },
    }
  );

  return NextResponse.json({ success: true });
}
