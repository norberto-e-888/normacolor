import { NextResponse } from "next/server";

import { getServerSession } from "@/functions/auth";
import { createPusherServer } from "@/lib/server/pusher";

export async function POST(request: Request) {
  console.log("Pusher auth endpoint hit");

  const session = await getServerSession();
  if (!session) {
    console.log("Pusher auth: Unauthorized - no session");
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const formData = await request.formData();
    const socketId = formData.get("socket_id");
    const channel = formData.get("channel_name");

    console.log("Pusher auth params:", { socketId, channel });

    if (!socketId || !channel) {
      console.log("Pusher auth: Missing required parameters");
      return new NextResponse("Bad Request", { status: 400 });
    }

    const pusherServer = createPusherServer();
    const authResponse = pusherServer.authorizeChannel(
      socketId.toString(),
      channel.toString()
    );

    console.log("Pusher auth response:", authResponse);
    return new NextResponse(JSON.stringify(authResponse), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Pusher auth error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
