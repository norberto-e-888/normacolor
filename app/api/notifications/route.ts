import { NextResponse } from "next/server";

import { Notification } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const type = searchParams.get("type");

  await connectToMongo();

  const query = {
    userId: session.user.id,
    ...(cursor ? { createdAt: { $lt: new Date(cursor) } } : {}),
    ...(type ? { type } : {}),
  };

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(PAGE_SIZE + 1)
    .lean()
    .then((docs) =>
      docs.map((doc) => ({
        ...doc,
        id: doc._id.toString(),
        _id: undefined,
      }))
    );

  const hasMore = notifications.length > PAGE_SIZE;
  if (hasMore) {
    notifications.pop();
  }

  const nextCursor = hasMore
    ? notifications[notifications.length - 1].createdAt.toISOString()
    : null;

  return NextResponse.json({
    notifications,
    nextCursor,
  });
}
