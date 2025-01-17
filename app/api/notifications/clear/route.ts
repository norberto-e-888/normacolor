import { NextResponse } from "next/server";

import { Notification } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { type } = await request.json();
  await connectToMongo();
  const query = {
    userId: session.user.id,
    ...(type ? { type } : {}),
  };

  await Notification.deleteMany(query);
  return NextResponse.json({ success: true });
}
