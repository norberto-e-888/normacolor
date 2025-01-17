import { NextResponse } from "next/server";

import { Order } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
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
    const channelName = formData.get("channel_name");

    console.log("Pusher auth params:", { socketId, channelName });

    if (!socketId || !channelName) {
      console.log("Pusher auth: Missing required parameters");
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Only authorize private-order-chat channels
    if (!channelName.toString().startsWith("private-order-chat_")) {
      console.log("Pusher auth: Invalid channel prefix");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Extract orderId and itemId from channel name
    const [orderId, itemId] = channelName
      .toString()
      .replace("private-order-chat_", "")
      .split("-");

    if (!orderId || !itemId) {
      console.log("Pusher auth: Invalid channel format");
      return new NextResponse("Bad Request", { status: 400 });
    }

    // If user is not admin, verify order ownership
    if (session.user.role !== "admin") {
      await connectToMongo();
      const order = await Order.findById(orderId);
      if (!order || order.customerId.toString() !== session.user.id) {
        console.log("Pusher auth: Order ownership verification failed");
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    // Create a new Pusher server instance for this request
    const pusherServer = createPusherServer();
    const authResponse = pusherServer.authorizeChannel(
      socketId.toString(),
      channelName.toString()
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
