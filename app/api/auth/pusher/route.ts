import { NextResponse } from "next/server";

import { PusherChannelType } from "@/constants/pusher";
import { Order, UserRole } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { createPusherServer } from "@/lib/server/pusher";

export async function POST(request: Request) {
  console.log("Pusher auth endpoint hit");

  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const formData = await request.formData();
    const socketId = formData.get("socket_id");
    const channelName = formData.get("channel_name");

    if (!socketId || !channelName) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const channelStr = channelName.toString();
    // Handle different channel types
    if (channelStr.startsWith(PusherChannelType.OrderChat)) {
      // Extract orderId and itemId from channel name
      const [orderId, itemId] = channelStr
        .replace(`${PusherChannelType.OrderChat}_`, "")
        .split("-");

      if (!orderId || !itemId) {
        return new NextResponse("Bad Request", { status: 400 });
      }

      // If user is not admin, verify order ownership
      if (session.user.role !== "admin") {
        await connectToMongo();
        const order = await Order.findById(orderId);
        if (!order || order.customerId.toString() !== session.user.id) {
          return new NextResponse("Unauthorized", { status: 401 });
        }
      }
    } else if (channelStr.startsWith(PusherChannelType.Notifications)) {
      // Extract userId from channel name
      const userId = channelStr.replace(
        `${PusherChannelType.Notifications}_`,
        ""
      );

      // Verify the user is only subscribing to their own notifications channel
      if (userId !== session.user.id) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    } else if (channelStr.startsWith(PusherChannelType.AdminStats)) {
      if (session.user.role !== UserRole.Admin) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    } else {
      console.error("Pusher auth: Invalid channel type");
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Create a new Pusher server instance for this request
    const pusherServer = createPusherServer();
    const authResponse = pusherServer.authorizeChannel(
      socketId.toString(),
      channelStr
    );

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
